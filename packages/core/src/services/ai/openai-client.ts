/**
 * OpenAI Client (lazy SDK import)
 *
 * Provides a minimal wrapper for text generation returning raw text.
 * Falls back with a clear error if SDK or API key are unavailable.
 */

export class OpenAIClient {
  private apiKey?: string;
  private model: string;

  constructor(apiKey?: string, model = 'gpt-5-mini') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || model;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Lazy import to avoid hard dependency when not used
    let OpenAI: any;
    try {
      ({ default: OpenAI } = await import('openai'));
    } catch (err) {
      throw new Error("openai SDK not installed. Add 'openai' to dependencies.");
    }

    const client = new OpenAI({ apiKey: this.apiKey });
    const completion = await client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs only valid JSON when asked.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty content');
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) return content.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('\n');
    return String(content);
  }
}

