import { getGeminiModel } from '../lib/gemini.js';
import { chunkText } from '../utils/chunking.js';

/**
 * Service for handling AI interactions with Gemini.
 */
export const AIService = {
    /**
     * Process a large document or query by chunking and combining results.
     * Uses recursive character splitting logic from utils.
     * 
     * @param {string} prompt - The system or user prompt context.
     * @param {string} largeContent - The large text to process.
     * @returns {Promise<string>} The combined AI response.
     */
    async processLargeContent(prompt, largeContent) {
        const model = getGeminiModel('gemini-1.5-flash'); // Or pro model depending on env
        const chunks = chunkText(largeContent, 8000, 500); // 8000 chars is safe for token limits
        
        let combinedResult = '';
        
        for (let i = 0; i < chunks.length; i++) {
            const chunkPrompt = `${prompt}\n\n--- Part ${i+1}/${chunks.length} of Document ---\n${chunks[i]}`;
            const result = await model.generateContent(chunkPrompt);
            const response = await result.response;
            combinedResult += response.text() + "\n\n";
        }
        
        return combinedResult.trim();
    }
};
