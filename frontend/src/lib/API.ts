// frontend/src/lib/moveMateApi.ts

export const askMoveMate = async (question: string): Promise<string> => {
  try {
    // Ne conectăm la backend-ul Python local
    const response = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: question }),
    });

    if (!response.ok) {
      throw new Error("Eroare server");
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("MoveMate API Error:", error);
    return "⚠️ Eroare: Nu pot contacta MoveMate. Verifică dacă serverul Python (backend) este pornit.";
  }
};