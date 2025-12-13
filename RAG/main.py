import os
import re
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. CONFIGURATION & SETUP ---
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ CRITICAL ERROR: GOOGLE_API_KEY not found in .env")

# Configure Gemini
genai.configure(api_key=api_key)
# We use 'flash' for low latency. 
# It is fast enough to handle the double-prompt architecture.
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI(title="MoveMate AI API")

# CORS Configuration (Allow Frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. AI QUERY OPTIMIZER (Step 1 of Pipeline) ---
async def generate_optimized_search_terms(user_prompt: str) -> str:
    """
    Uses Gemini to translate vague user questions into technical Move Language keywords.
    This drastically improves search accuracy.
    """
    system_instruction = f"""
    You are a Technical Search Optimizer for the Move programming language (Sui/Aptos).
    
    YOUR TASK:
    Analyze the USER QUESTION and generate a string of 5-8 technical keywords 
    that are most likely to appear in the official documentation chapters relevant to the question.

    RULES:
    1. Ignore filler words (how, to, the, a, in).
    2. Translate general terms to Move-specific terminology:
       - "money" / "token" -> "coin balance store transfer"
       - "smart contract" -> "module package publish object"
       - "wallet" -> "address account"
       - "error" -> "abort assert code"
    3. OUTPUT ONLY the keywords separated by spaces. No explanation.

    USER QUESTION: "{user_prompt}"
    """
    
    try:
        response = model.generate_content(system_instruction)
        optimized_query = response.text.strip()
        print(f"🧠 [AI Optimization] '{user_prompt}' -> '{optimized_query}'")
        return optimized_query
    except Exception as e:
        print(f"⚠️ Optimization failed: {e}")
        return user_prompt # Fallback to original query

# --- 3. RAG ENGINE (The Database Logic) ---
class RAGEngine:
    def __init__(self):
        self.chunks = []
        self.load_documentation()

    def load_documentation(self, file_path="move-book.md"):
        """Loads and splits the Markdown file by Headers (#)."""
        if not os.path.exists(file_path):
            print(f"⚠️ WARNING: '{file_path}' not found. RAG will be empty.")
            return

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Regex to split by Markdown headers (Start of line #)
            parts = re.split(r'(^#+ .*$)', content, flags=re.MULTILINE)
            current_title = "Introduction"
            current_text = ""

            for part in parts:
                if part.strip().startswith('#'):
                    # Save previous chunk
                    if current_text.strip():
                        self._add_chunk(current_title, current_text)
                    # Start new chunk
                    current_title = part.strip()
                    current_text = part + "\n"
                else:
                    current_text += part
            
            # Add the very last chunk
            if current_text.strip():
                self._add_chunk(current_title, current_text)
                
            print(f"✅ MoveMate System Ready: {len(self.chunks)} documentation chapters indexed.")

        except Exception as e:
            print(f"❌ Error loading docs: {e}")

    def _add_chunk(self, title, text):
        lines = text.split('\n')
        # Add line numbers for precise referencing
        numbered_lines = [f"{i+1}: {line}" for i, line in enumerate(lines)]
        
        self.chunks.append({
            "title": title.strip(),
            "content": "\n".join(numbered_lines),
            "raw": text.lower(), # Lowercase for search comparison
            "original_title": title.strip() # Preserved case for display
        })

    def search(self, optimized_query):
        """
        Searches the documentation using the AI-Optimized keywords.
        """
        keywords = [w.lower() for w in optimized_query.split() if len(w) > 2]
        scored_results = []

        for chunk in self.chunks:
            score = 0
            chunk_title_lower = chunk["title"].lower()
            
            for word in keywords:
                # 1. Title Match (High Priority)
                if word in chunk_title_lower:
                    score += 50
                
                # 2. Content Match (Frequency)
                # We limit the count to avoid huge chapters dominating just by size
                count = chunk["raw"].count(word)
                score += min(count, 10) 
            
            if score > 0:
                scored_results.append((score, chunk))
        
        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        # Return Top 3 Chunks
        return [res[1] for res in scored_results[:3]]

# Initialize the Engine
rag = RAGEngine()

# --- 4. API ENDPOINTS ---
class QueryRequest(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_movemate(req: QueryRequest):
    print(f"📩 Incoming Request: {req.prompt}")
    
    # --- PHASE 1: QUERY OPTIMIZATION ---
    # The AI translates "How to make NFT" -> "struct object uid url display"
    search_terms = await generate_optimized_search_terms(req.prompt)
    
    # --- PHASE 2: RETRIEVAL ---
    # We search the docs using the technical terms
    relevant_chunks = rag.search(search_terms)
    
    if relevant_chunks:
        # Combine the top 3 results into a single context block
        context_text = "\n\n--- DOCUMENTATION SEGMENT ---\n".join([c["content"] for c in relevant_chunks])
        source_titles = ", ".join([c["original_title"] for c in relevant_chunks])
    else:
        context_text = "No specific documentation found matching these terms."
        source_titles = "None"

    # --- PHASE 3: ANSWER GENERATION (Strict Persona) ---
    system_prompt = f"""
    You are MoveMate, a Senior Blockchain Architect specializing in the Move Language (Sui/Aptos).
    
    ### YOUR INSTRUCTIONS:
    1. Answer the user's question based PRIMARILY on the provided Context.
    2. If the Context is relevant, explain the concept clearly.
    3. **OPTIONAL:** ONLY provide high-quality, syntactically correct Code Snippet IN relevant CONTEXTS.
    4. **TONE:** Professional, concise, and helpful. Do not be conversational (no "Hello", no "I hope this helps").
    5. **ANTI-HALLUCINATION:** If the Context does not contain the answer, and YOU know the question is TECHNICAL, state: "This specific topic is not covered in my current index," and then provide a general answer based on your training, but explicitly mark it as "General Knowledge".

    ### FORMATTING RULES:
    - Use Markdown.
    - Use `move` syntax highlighting for code.
    - At the very bottom, leave a blank line and write: "**📚 Source References:** [List the Chapter Titles found in Context]"

    ### DATA:
    
    [CONTEXT START]
    {context_text}
    [CONTEXT END]

    [USER QUESTION]
    {req.prompt}
    """
    
    try:
        response = model.generate_content(system_prompt)
        return {"answer": response.text}
    except Exception as e:
        print(f"❌ Generation Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service unavailable.")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8000)