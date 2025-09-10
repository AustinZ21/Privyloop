/**
 * Gemini Client (lazy SDK import)
 *
 * Provides a minimal wrapper for text generation returning raw text.
 * Falls back with a clear error if SDK or API key are unavailable.
 */

export class GeminiClient {
  private apiKey?: string;
  private model: string;

  constructor(apiKey?: string, model = 'gemini-2.5-pro') {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || model;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    // Lazy import to avoid hard dependency when not used
    let GoogleGenerativeAI: any;
    try {
      ({ GoogleGenerativeAI } = await import('@google/generative-ai'));
    } catch (err) {
      throw new Error("@google/generative-ai SDK not installed. Add it to dependencies.");
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

