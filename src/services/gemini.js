/**
 * Gemini 1.5 Flash AI Parsing Service
 * Communicates with Google AI Studio API to extract price and title from web page content.
 */

export const GeminiService = {
  /**
   * Fetch available models for the user's API key that support generateContent.
   * @param {string} apiKey
   * @returns {Promise<string[]>} List of model resource names (e.g., ['models/gemini-2.0-flash', ...])
   */
  getAvailableModels: async (apiKey) => {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) {
        return [];
      }
      return data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name);
    } catch (err) {
      console.warn('Failed to auto-discover models:', err);
      return [];
    }
  },

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

    // 1. Try to auto-discover available models for this specific API key
    let candidateModels = await GeminiService.getAvailableModels(apiKey);

    // Filter/prioritize Flash models first
    if (candidateModels.length > 0) {
      const flashModels = candidateModels.filter(m => m.toLowerCase().includes('flash'));
      const otherModels = candidateModels.filter(m => !m.toLowerCase().includes('flash'));
      candidateModels = [...flashModels, ...otherModels];
    } else {
      // Hardcoded fallback list if model listing API call fails
      candidateModels = [
        'models/gemini-2.0-flash',
        'models/gemini-1.5-flash',
        'models/gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];
    }

    let lastError = null;

    for (let modelName of candidateModels) {
      // Normalize modelName so it has "models/" prefix if needed
      const formattedModel = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/${formattedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

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

        if (response.ok) {
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
        } else {
          const errData = await response.json();
          const cleanMsg = sanitizeError(errData.error?.message || `HTTP Error ${response.status}`);
          lastError = new Error(cleanMsg);
        }
      } catch (err) {
        lastError = new Error(sanitizeError(err.message));
      }
    }

    throw lastError || new Error('ALL_GEMINI_MODELS_FAILED');
  }
};

/**
 * Helper to mask API keys from error messages, preventing leaks in logs or UI
 */
function sanitizeError(msg) {
  if (!msg) return 'API_REQUEST_FAILED';
  return String(msg).replace(/key=[^&"\s']+/g, 'key=HIDDEN_API_KEY');
}
