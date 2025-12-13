import os
import re
import glob
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
    # Fallback pentru testare rapidă, dar recomandat e .env
    print("⚠️ WARNING: GOOGLE_API_KEY not found in .env.")

# Configure Gemini
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI(title="MoveMate AI API - MultiDocs")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. AI QUERY OPTIMIZER ---
async def generate_optimized_search_terms(user_prompt: str) -> str:
    """
    Traduce întrebarea userului în keyword-uri tehnice Move.
    """
    system_instruction = f"""
    You are a Technical Search Optimizer for the Move programming language.
    Analyze the USER QUESTION and generate 5-8 technical keywords used in documentation.
    
    RULES:
    1. Ignore filler words.
    2. Map concepts: "money" -> "coin balance", "error" -> "abort assert".
    3. OUTPUT ONLY the keywords separated by spaces.

    USER QUESTION: "{user_prompt}"
    """
    try:
        response = model.generate_content(system_instruction)
        optimized_query = response.text.strip()
        print(f"🧠 [AI Optimization] '{user_prompt}' -> '{optimized_query}'")
        return optimized_query
    except Exception:
        return user_prompt 

# --- 3. RAG ENGINE (MODIFICAT PENTRU FOLDER) ---
class RAGEngine:
    def __init__(self, docs_dir):
        self.chunks = []
        self.docs_dir = docs_dir
        self.load_all_documents()

    def load_all_documents(self):
        """
        Citește toate fișierele .md dintr-un folder.
        """
        if not os.path.exists(self.docs_dir):
            print(f"⚠️ CRITICAL: Folderul '{self.docs_dir}' nu există!")
            return

        # Caută toate fișierele .md (poți adăuga și .txt dacă ai nevoie)
        # Folosim glob pentru a lista fișierele
        file_pattern = os.path.join(self.docs_dir, "*.md")
        files = glob.glob(file_pattern)

        if not files:
            print(f"⚠️ Nu s-au găsit fișiere .md în '{self.docs_dir}'.")
            return

        print(f"📂 Încep indexarea a {len(files)} fișiere din '{self.docs_dir}'...")

        for file_path in files:
            self._process_single_file(file_path)
            
        print(f"✅ Sistem Gata: {len(self.chunks)} segmente indexate din {len(files)} fișiere.")

    def _process_single_file(self, file_path):
        try:
            filename = os.path.basename(file_path)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Logică de split (păstrată, dar adaptată per fișier)
            # Dacă fișierul e mic, îl luăm ca un singur chunk. 
            # Dacă are headere (#), îl spargem.
            
            parts = re.split(r'(^#+ .*$)', content, flags=re.MULTILINE)
            current_title = f"File: {filename}" # Default title
            current_text = ""

            for part in parts:
                if part.strip().startswith('#'):
                    if current_text.strip():
                        self._add_chunk(current_title, current_text, filename)
                    current_title = part.strip() # Update title with Header
                    current_text = part + "\n"
                else:
                    current_text += part
            
            if current_text.strip():
                self._add_chunk(current_title, current_text, filename)

        except Exception as e:
            print(f"❌ Eroare la citirea fișierului {file_path}: {e}")

    def _add_chunk(self, title, text, filename):
        self.chunks.append({
            "title": title.strip(),
            "filename": filename,
            "content": text,
            "raw": text.lower(),
            "display_source": f"{filename} > {title.strip()}"
        })

    def search(self, optimized_query):
        keywords = [w.lower() for w in optimized_query.split() if len(w) > 2]
        scored_results = []

        for chunk in self.chunks:
            score = 0
            # Căutăm în titlu și conținut
            text_to_search = chunk["title"].lower() + " " + chunk["raw"]
            
            for word in keywords:
                if word in chunk["title"].lower():
                    score += 50 # Bonus mare pentru titlu
                
                count = chunk["raw"].count(word)
                score += min(count, 10) 
            
            if score > 0:
                scored_results.append((score, chunk))
        
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [res[1] for res in scored_results[:3]] # Return top 3

# --- INITIALIZARE ---
# IMPORTANT: Schimbă 'meu.docs' cu numele real al folderului tău dacă e diferit
# Asigură-te că folderul este în același loc cu scriptul python
rag = RAGEngine(docs_dir="./docs") 

# --- 4. API ENDPOINTS ---
class QueryRequest(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_movemate(req: QueryRequest):
    print(f"📩 Cerere nouă: {req.prompt}")
    
    # Pas 1: Optimizare
    search_terms = await generate_optimized_search_terms(req.prompt)
    
    # Pas 2: Căutare în cele 134 docs
    relevant_chunks = rag.search(search_terms)
    
    if relevant_chunks:
        context_text = "\n\n--- NEXT SEGMENT ---\n".join([c["content"] for c in relevant_chunks])
        source_refs = ", ".join([c["display_source"] for c in relevant_chunks])
    else:
        context_text = "No specific documentation found matching these terms."
        source_refs = "None"

    # Pas 3: Generare Răspuns
    system_prompt = f"""
    You are MoveMate, an expert on Move Language.
    
    CONTEXT FROM FILES:
    {context_text}
    
    USER QUESTION:
    {req.prompt}
    
    
    
    INSTRUCTIONS:
    1. Answer based ONLY on the Context if possible. If not, mention briefly that you are  not using any documentation information and DON'T INCLUDE the sources below.
    2. Provide code examples IF and ONLY  if RELEVANT (you may find them in the chunks provided).
    3. At the end, list the sources provided below. (Mention the chapters and the position  they take in the chunks, in a  list)
    
    Sources: {source_refs}
    """
    
    try:
        response = model.generate_content(system_prompt)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)