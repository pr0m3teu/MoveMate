import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

# --- CONFIGURARE ---
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ EROARE: Nu am găsit cheia API în .env")
    exit()

genai.configure(api_key=api_key)
# Putem ramane pe Flash, dar ii dam instructiuni mai bune
model = genai.GenerativeModel('gemini-2.5-flash')

DEBUG_MODE = True 

class RAGEngine:
    def __init__(self):
        self.chunks = []
        self.load_documentation()

    def load_documentation(self):
        file_path = "move-book.md"
        if not os.path.exists(file_path):
            print(f"❌ EROARE: Nu găsesc fișierul '{file_path}'.")
            return

        print("📖 Citesc documentația...")
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
            
        print(f"✅ Documentație pregătită! ({len(self.chunks)} secțiuni indexate)")

    def _add_chunk(self, title, text):
        lines = text.split('\n')
        numbered_lines = [f"{i+1}: {line}" for i, line in enumerate(lines)]
        self.chunks.append({
            "title": title.strip(),
            "content": "\n".join(numbered_lines),
            "raw": text.lower(),
            "lines_count": len(lines)
        })

    def search(self, query):
        # TRUC: MAPPING DE SINONIME
        # Dacă userul zice "smart contract", noi căutăm "module" în spate
        # pentru că așa se numesc în Move.
        synonyms = {
            "smart contract": "module package",
            "contract": "module",
            "token": "coin balance",
            "wallet": "address"
        }
        
        query_lower = query.lower()
        processed_query = query_lower
        
        # Înlocuim termenii generici cu termeni specifici Move
        for key, value in synonyms.items():
            if key in query_lower:
                processed_query += f" {value}"
        
        keywords = [w for w in processed_query.split() if len(w) > 2]
        
        results = []
        for chunk in self.chunks:
            score = 0
            chunk_title = chunk["title"].lower()
            chunk_content = chunk["raw"]
            
            for word in keywords:
                # Titlul e rege
                if word in chunk_title:
                    score += 50
                # Conținutul e regină
                score += chunk_content.count(word)
            
            if score > 0:
                results.append((score, chunk))
        
        results.sort(key=lambda x: x[0], reverse=True)
        return results[:3]

def chat_loop():
    rag = RAGEngine()
    
    print("\n" + "="*50)
    print("🤖 MOVE MASTER (EXPERT MODE)")
    print("Scrie 'exit' pentru a ieși.")
    print("="*50 + "\n")

    while True:
        user_input = input("\nTu: ")
        if user_input.lower() in ['exit', 'quit']:
            break
        
        # A. Căutare RAG
        results = rag.search(user_input)
        
        context_text = ""
        # DEBUG
        if DEBUG_MODE and results:
            print(f"\n🔍 DEBUG: Am găsit context în secțiunile: {[r[1]['title'] for r in results]}")

        if results:
            context_text = "\n\n--- CONTEXT TEHNIC INTERN ---\n".join([r[1]['content'] for r in results])
        else:
            context_text = "Nu s-a găsit context specific."

        # B. NOUL PROMPT (Aici e magia)
        prompt = f"""
        Ești un SENIOR BLOCKCHAIN ENGINEER specializat în limbajul Move (Sui/Aptos).
        Ești mentorul utilizatorului.
        
        OBIECTIV:
        Răspunde la întrebarea utilizatorului explicând conceptele clar, detaliat și oferind exemple de cod complete.

        REGULI CRITICE DE TON:
        1. NU spune niciodată "Conform documentației" sau "În textul furnizat".
        2. Vorbește ca un expert care știe informația pe de rost. Fii încrezător.
        3. Dacă informația lipsește, spune ce știi tu general despre Move, dar avertizează că e din cunoștințele tale generale.
        
        REGULI DE FORMATARE:
        1. Începe cu o explicație conceptuală clară.
        2. Oferă un bloc de cod (`Code Snippet`) relevant și explicat.
        3. Folosește Markdown pentru titluri și bold.
        
        REGULI DE CITARE (OBLIGATORIU):
        1. Răspunsul principal NU trebuie să conțină citări în paranteză.
        2. La finalul absolut al răspunsului, lasă 2 rânduri libere și scrie exact: "**📚 Referințe Documentație**"
        3. Dedesubt, listează DOAR fișierul și liniile folosite pentru a construi răspunsul.
           Format: `- [Titlu Capitol] (Liniile X-Y)`
        
        --- INFORMAȚII TEHNICE (CONTEXT) ---
        {context_text}
        
        --- ÎNTREBARE UTILIZATOR ---
        {user_input}
        """

        try:
            print("⏳ Scriu codul și explicațiile...")
            response = model.generate_content(prompt)
            print("\n" + response.text)
        except Exception as e:
            print(f"❌ Eroare API: {e}")

if __name__ == "__main__":
    chat_loop()