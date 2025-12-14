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
    print("❌ CRITICAL ERROR: Couldn't find GOOGLE_API_KEY in .env")

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
                
            print(f"✅ MoveMate Backend Ready: {len(self.chunks)} chunks loaded.")

        except FileNotFoundError:
            print(f"⚠️ ATENTION: Cannot find '{file_path}'. RAG won't work.")

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
    relevant_chunks = rag.search(req.prompt)
    if relevant_chunks:
        context_text = "".join(relevant_chunks)
    else:
        context_text = "I haven't found the required context in the Documentation."

    prompt_final = f"""
    # Act as MoveMate, an elite AI expert specialized in blockchain development on Sui using the Move language.
    Your objective is to provide precise technical assistance for writing, debugging, and optimizing smart contracts.

    Operating instructions:
        - Technical Expertise: Use the latest Sui Framework standards and clearly explain the concepts of the object-centric model and ownership.
        - Code Quality: Generate secure, modular, and cost-efficient code (gas optimization).
        - Security: Identify potential vulnerabilities and suggest Move-specific security best practices.
        - Tone: Professional, educational, and solution-oriented.
    
    AVAILABLE CONTEXT:
    {context_text}
    
    USERS PROMPT: {req.prompt}
    
    **Adopt a Strict Response Protocol (Zero-Chat) for maximum efficiency.**
    **Mandatory Response Format:**

        * **Summary:** An ultra-concise technical explanation (maximum 2 sentences).
        * **Execution:** Exactly ONE single code block (snippet), complete, functional, and ready to copy.
        * **Hard Restrictions (DO NOT DO THIS):**
        * **Zero Politeness:** No “Hello,” “Here is,” “As an AI model,” “Hope this helps.” Start directly with the information.
        * **Zero Meta-Data:** Do not mention documentation, sources, or your reasoning process. Assume implicit expertise.
        * **Zero Redundancy:** No closing text after the code block.

    **Response Structuring Protocol:**
    Please organize each response strictly according to the following visual architecture:

        * **Conceptual Analysis:** Provide a clear, technical explanation using Markdown formatting (bold, lists) for readability.
        * **Implementation (Conditional):**

        * **IF (relevant):** Include a complete Move code block.
        * **ELSE:** Omit this section entirely.

    **Mandatory Footer:**
        [Leave 2 blank lines]
        Display the title: **References**
        List the sources used strictly in the format:

    * [Chapter Title], Lines X–Y (Extract this data exclusively from the provided context).
    """
    
    try:
        response = model.generate_content(prompt_final)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
