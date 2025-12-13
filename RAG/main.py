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

    def _add_chunk(self, title, text):
        lines = text.split('\n')
        numbered_lines = [f"{i+1}: {line}" for i, line in enumerate(lines)]
        
        # Pre-procesăm textul în seturi de cuvinte pentru viteză și acuratețe
        raw_text = text.lower()
        # Eliminăm caractere non-alfanumerice simple pentru matching mai bun
        clean_words = set(re.findall(r'\b\w+\b', raw_text))
        
        self.chunks.append({
            "title": title.strip(),
            "content": "\n".join(numbered_lines),
            "original_title": title.strip(),
            # Salvăm setul de cuvinte pentru a face intersecția rapid
            "word_set": clean_words, 
            "title_words": set(re.findall(r'\b\w+\b', title.lower()))
        })

    def load_documentation(self):
        # ... (păstrează logica ta de load existentă) ...
        # Doar asigură-te că apelezi self._add_chunk exact ca înainte
        try:
            docs_dir = os.listdir("./docs")
            for file_name in docs_dir:
                with open(f"./docs/{file_name}", "r", encoding="utf-8") as f:
                    content = f.read()
                parts = re.split(r'(^#+ .*$)', content, flags=re.MULTILINE)
                current_title = "Introduction"
                current_text = ""

                for part in parts:
                    if part.strip().startswith('#'):
                        if current_text.strip():
                            self._add_chunk(current_title, current_text)
                        current_title = part.strip()
                        current_text = part + "\n"
                    else:
                        current_text += part
                if current_text.strip():
                    self._add_chunk(current_title, current_text)
            print(f"✅ MoveMate System Ready: {len(self.chunks)} chapters indexed.")
        except Exception as e:
            print(f"❌ Error loading docs: {e}")

    def search(self, optimized_query, min_score_threshold=25):
        """
        Căutare strictă bazată pe seturi de cuvinte.
        Args:
            min_score_threshold: Scorul minim pentru a considera un chunk relevant.
        """
        # Curățăm query-ul și îl facem set (cuvinte unice)
        query_words = set(re.findall(r'\b\w+\b', optimized_query.lower()))
        # Eliminăm cuvinte prea scurte (de, la, etc care au scăpat de AI)
        query_words = {w for w in query_words if len(w) > 2}

        scored_results = []

        for chunk in self.chunks:
            score = 0
            
            # 1. Title Match (Critic: Titlul definește subiectul)
            # Verificăm câte cuvinte din query apar în titlu
            title_matches = chunk["title_words"].intersection(query_words)
            score += len(title_matches) * 20  # Punctaj mare pentru titlu
            
            # 2. Content Match (Strict)
            # Verificăm câte cuvinte din query apar în conținut
            content_matches = chunk["word_set"].intersection(query_words)
            score += len(content_matches) * 5 # Punctaj mediu pentru conținut

            # Penalizare ușoară pentru chunk-uri uriașe (diluarea informației)
            # (Opțional, dar ajută la precizie)
            
            if score > 0:
                scored_results.append((score, chunk))
        
        # Sortăm descrescător după scor
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        # FILTRU STRICT: Returnăm doar rezultatele care trec de prag
        # Pragul 25 înseamnă de ex: 1 cuvânt în titlu (20) + 1 în text (5)
        # Sau 5 cuvinte unice găsite în text.
        final_results = [res[1] for res in scored_results if res[0] >= min_score_threshold]
        
        # Returnăm maxim 3, dar doar dacă sunt relevante
        return final_results[:3]

# Initialize the Engine
rag = RAGEngine()

# --- 4. API ENDPOINTS ---
class QueryRequest(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_movemate(req: QueryRequest):
    print(f"📩 Incoming Request: {req.prompt}")
    
    # 1. Optimizare Query
    search_terms = await generate_optimized_search_terms(req.prompt)
    
    # 2. Căutare Strictă
    relevant_chunks = rag.search(search_terms)
    
    technical_context = ""
    system_instruction_mode = ""

    if relevant_chunks:
        # --- CAZUL 1: AM GĂSIT DOCUMENTAȚIE RELEVANTĂ ---
        formatted_parts = []
        for chunk in relevant_chunks:
            part = f"CHAPTER: {chunk['title']}\nCONTENT (Lines):\n{chunk['content']}"
            formatted_parts.append(part)
        
        technical_context = "\n\n---\n\n".join(formatted_parts)
        
        # Prompt pentru când avem date
        system_instruction_mode = """
        You have specific documentation context provided below.
        - Answer based ONLY on the provided context.
        - Include references (Chapter Title).
        """
    else:
        print("⚠️ No relevant docs found. Switching to fallback mode.")
        technical_context = "NO RELEVANT DOCUMENTATION FOUND IN DATABASE."
        
        # Prompt defensiv
        system_instruction_mode = """
        WARNING: The retrieval system could not find any relevant documentation for this specific query in the MoveMate database.
        
        YOUR TASK:
        1. Inform the user that the specific technical details are not found in the loaded documentation.
        2. Do NOT try to invent code or specific implementation details if you are not 100% sure from your general training.
        3. If you provide general Move knowledge, clearly state: "This is based on general Move principles, not the specific project documentation."
        """

    # 3. Construim Prompt-ul Final
    final_system_prompt = f"""
    SYSTEM: You are MoveMate, a strict Move/Sui code reviewer.
    
    {system_instruction_mode}
    
    USER PROMPT: 
    {req.prompt}
    
    TECHNICAL CONTEXT AVAILABLE:
    {technical_context}
    
    ANSWER RULES:
    1. Be concise and direct.
    2. If context is missing, admit it. Do not hallucinate functions or modules that aren't in the context.
    """

    try:
        response = model.generate_content(final_system_prompt)
        return {"answer": response.text}
    except Exception as e:
        print(f"❌ Generation Error: {e}")
        raise HTTPException(status_code=500, detail="AI Service unavailable.")
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
