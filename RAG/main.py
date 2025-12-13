import os
import re
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai


from dotenv import load_dotenv
import uvicorn
from generate_docs import get_all_docs

# --- 1. CONFIGURARE ---
BASE_URL = "https://move-book.com/"
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

        if not os.path.isdir("./docs"):
            os.makedirs("./docs")
            get_all_docs()
  
        try:
            for file in os.listdir("./docs"):
                with open(file, "r", encoding="utf-8") as f:
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

        except FileNotFoundError:
            print(f"⚠️ ATENȚIE: Nu găsesc doc0. RAG nu va funcționa.")
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
        context_text = "TECHNICAL INFORMATION: ".join(relevant_chunks)
    else:
        context_text = "No technical information"

    # 2. Prompt-ul "MoveMate" (Tuned for Speed & Persona)
    system_prompt = f"""
    
    SYSTEM:
    You are MoveMate, a strict Move/Sui code reviewer. You must:
    - Only claim facts supported by provided context (documents, code, or on-chain data).
    - For each vulnerability or recommendation, provide:
        1) A short title (severity: High/Medium/Low), 
        2) A one-line summary, 
        3) Code excerpt (lines) showing the issue, 
        4) A short fix (diff or code snippet), 
        5) Citations to exact documents or transaction IDs if on-chain evidence used.
        - If you cannot support a claim with evidence, say "Insufficient evidence" and list what data would be needed.
        - Use a deterministic, instruction-following style. Keep hallucination rate to zero.
    END SYSTEM
    CONTEXT TEHNIC DISPONIBIL:
    
    USER PROMPT: 
    {req.prompt}
    TECHNICAL CONTEXT AVAILABLE:
    {context_text}
    
    ANSWER RULES: 
    1. **Be Direct:** Don't use introductions like "Hello", "As an expert...". Answer the question directly. 
    2. Be concise:** Give the explanation short and to the point. 
    3. **Single Example:** Provides ONLY ONE block of relevant code (Code Snippet), complete and functional. 
    4. **No Meta Comments:** Don't say "According to the documentation" or "I found it in the text". You KNOW the information. 
    REQUIRED FORMAT: 
        - Clear explanation (Markdown). 
        - "** References**" followed by the list of sources used (Chapter Title, X-Y Lines).

    """
        # - Code Block (Move). - At the end, leave 2 lines free and write     
    try:
        response = model.generate_content(system_prompt)
        return {"answer": response.text}
    except Exception as e:
        print(f"❌ Generation Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service unavailable.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
