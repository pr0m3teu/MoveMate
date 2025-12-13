import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. CONFIGURARE ---
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ EROARE CRITICĂ: Nu am găsit GOOGLE_API_KEY în .env")

genai.configure(api_key=api_key)
# Folosim Flash pentru viteză.
model = genai.GenerativeModel('gemini-2.5-flash')

app = FastAPI()

# Configurare CORS (Ca să meargă Frontend-ul)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. MOTORUL RAG (Optimizat cu Sinonime) ---
class RAGEngine:
    def __init__(self):
        self.chunks = []
        self.load_documentation()

    def load_documentation(self):
        file_path = "move-book.md"
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            parts = re.split(r'(^#+ .*$)', content, flags=re.MULTILINE)
            current_title = "Intro"
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
                
            print(f"✅ MoveMate Backend Ready: {len(self.chunks)} capitole încărcate.")

        except FileNotFoundError:
            print(f"⚠️ ATENȚIE: Nu găsesc '{file_path}'. RAG nu va funcționa.")

    def _add_chunk(self, title, text):
        lines = text.split('\n')
        numbered_lines = [f"{i+1}: {line}" for i, line in enumerate(lines)]
        self.chunks.append({
            "title": title.strip(),
            "content": "\n".join(numbered_lines),
            "raw": text.lower(),
        })

    def search(self, query):
        # --- LOGICA DE SINONIME (Advanced Search) ---
        synonyms = {
            "smart contract": "module package",
            "contract": "module",
            "token": "coin balance",
            "wallet": "address",
            "struct": "struct resource object"
        }
        
        query_lower = query.lower()
        processed_query = query_lower
        
        # Expandăm query-ul cu termeni tehnici Move
        for key, value in synonyms.items():
            if key in query_lower:
                processed_query += f" {value}"
        
        keywords = [w for w in processed_query.split() if len(w) > 2]
        results = []

        for chunk in self.chunks:
            score = 0
            chunk_title = chunk["title"].lower()
            
            for word in keywords:
                # Titlul are greutate mare (50 puncte)
                if word in chunk_title:
                    score += 50
                # Conținutul are greutate normală
                score += chunk["raw"].count(word)
            
            if score > 0:
                results.append((score, chunk))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1]["content"] for r in results[:3]]

# Inițializăm motorul
rag = RAGEngine()

# --- 3. API ENDPOINT ---
class QueryRequest(BaseModel):
    prompt: str

@app.post("/ask")
async def ask_ai(req: QueryRequest):
    print(f"📩 Întrebare Frontend: {req.prompt}")
    
    # 1. Căutare Context
    relevant_chunks = rag.search(req.prompt)
    if relevant_chunks:
        context_text = "\n\n--- INFORMAȚIE TEHNICĂ ---\n".join(relevant_chunks)
    else:
        context_text = "Nu s-a găsit context specific în documentație."

    # 2. Prompt-ul "MoveMate" (Tuned for Speed & Persona)
    prompt_final = f"""
    # Acționează ca MoveMate, un expert AI de elită specializat în dezvoltarea blockchain pe Sui folosind limbajul Move.
    Obiectivul tău este să oferi asistență tehnică precisă pentru scrierea, depanarea și optimizarea contractelor inteligente (smart contracts).
    Instrucțiuni de operare:
        - Expertiză Tehnică: Utilizează cele mai recente standarde Sui Framework și explică clar conceptele de 'object-centric model' și 'ownership'.
        - Calitatea Codului: Generează cod sigur, modular și eficient din punct de vedere al costurilor (gas optimization).
        - Securitate: Identifică potențiale vulnerabilități și sugerează cele mai bune practici de securitate specifice Move.
        - Ton: Profesionist, educativ și orientat spre soluții.
    
    CONTEXT TEHNIC DISPONIBIL:
    {context_text}
    
    ÎNTREBAREA UTILIZATORULUI: {req.prompt}
    
    # Adoptă un Protocol de Răspuns Strict (Zero-Chat) pentru eficiență maximă.
    Formatul Obligatoriu al Răspunsului:
       - Sinteză: O explicație tehnică ultra-concisă (maxim 2 fraze).
       - Execuție: Exact UN singur bloc de cod (snippet) complet, funcțional și gata de copiat.
       - Restricții Hard (NU FACE ASTA):
       - Zero Politețuri: Fără 'Salut', 'Iată', 'Ca model AI', 'Sper că ajută'. Începe direct cu informația.
       - Zero Meta-Date: Nu menționa documentația, sursele sau procesul tău de gândire. Asumă-ți expertiza implicit.
       - Zero Redundanță: Fără text de încheiere după blocul de cod.
    
    # Protocol de Structurare a Răspunsului:
    Te rog să organizezi fiecare răspuns urmând strict această arhitectură vizuală:
        Analiză Conceptuală: Oferă o explicație clară, tehnică, utilizând formatare Markdown (bold, liste) pentru lizibilitate.
        Implementare (Condițional):
            IF (relevant): Include un bloc de cod move complet.
            ELSE: Omite complet această secțiune.
    Subsol Obligatoriu:
        [Lasă 2 rânduri goale]
        Afișează titlul: **Referințe**
        Listează sursele utilizate strict în formatul: - [Titlu Capitol], Liniile X-Y (Extrage aceste date exclusiv din contextul furnizat)."
    """
    
    try:
        response = model.generate_content(prompt_final)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)