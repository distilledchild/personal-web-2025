import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

let aiClient: GoogleGenAI | null = null;

export const getAiClient = (): GoogleGenAI => {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const generateChatResponse = async (history: { role: string, text: string }[], message: string): Promise<string> => {
  try {
    if (!API_KEY) return "Please configure the API_KEY to chat with the AI researcher assistant.";

    const client = getAiClient();
    const model = 'gemini-2.5-flash'; // Optimized for text chat
    
    const chat = client.chats.create({
      model,
      config: {
        systemInstruction: "You are the digital assistant for a Computational Biology PhD student at UTHSC. You are knowledgeable about chromatin architecture, Hi-C, and GWAS. Answer questions about the researcher's background and technical skills simply and scientifically.",
      }
    });

    // Replay history simplified (in a real app we would pass full history object)
    // For this simplified stateless call, we just send the new message
    const response = await chat.sendMessage({ message });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm currently offline (API Error).";
  }
};