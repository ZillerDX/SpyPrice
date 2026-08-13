/**
 * Gemini 1.5 Flash AI Parsing Service
 * Communicates with Google AI Studio API to extract price and title from web page content.
 */

export const GeminiService = {
  /**
   * Extract product details (Title, Price, Currency) from raw page text/HTML snippet.
   * @param {string} pageText - Cleaned text content from web page
   * @param {string} apiKey - Gemini API Key
   * @returns {Promise<{title: string, price: number, currency: string}>}
   */
  extractPriceInfo: async (pageText, apiKey) => {
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Truncate text to avoid token limits (keep first 10,000 characters which usually contain title & price)
    const truncatedText = pageText.substring(0, 10000);

    const prompt = `
Extract the main e-commerce product title, current numeric price, and currency symbol/code from the following web page content.
Return STRICTLY a JSON object with NO markdown formatting, NO backticks, and NO additional text.

JSON Schema:
{
  "title": "Exact Product Name",
  "price": 1290.00,
  "currency": "THB" or "USD" or "EUR"
}

Web Page Content:
${truncatedText}
`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for deterministic JSON extraction
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('EMPTY_AI_RESPONSE');
      }

      // Parse JSON safely
      const parsed = JSON.parse(rawText.trim());
      return {
        title: parsed.title || 'Unknown Product',
        price: parseFloat(parsed.price) || 0,
        currency: parsed.currency || 'THB'
      };

    } catch (err) {
      console.error('Gemini Service Error:', err);
      throw err;
    }
  }
};
