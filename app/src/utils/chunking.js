/**
 * Utility to split large text into smaller chunks for AI processing.
 * Prevents token limits when dealing with large documents.
 * 
 * @param {string} text - The input text to chunk.
 * @param {number} chunkSize - Maximum characters per chunk.
 * @param {number} overlap - Number of overlapping characters to preserve context across chunks.
 * @returns {Array<string>} An array of text chunks.
 */
export function chunkText(text, chunkSize = 4000, overlap = 200) {
    if (!text || typeof text !== 'string') return [];
    
    const chunks = [];
    let i = 0;
    
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    
    return chunks;
}
