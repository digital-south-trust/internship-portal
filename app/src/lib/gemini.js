import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy-key");

/**
 * Get a Gemini model instance.
 * @param {string} modelName - The name of the model (e.g., 'gemini-1.5-pro', 'gemini-1.5-flash')
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export const getGeminiModel = (modelName = "gemini-2.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

export default genAI;
