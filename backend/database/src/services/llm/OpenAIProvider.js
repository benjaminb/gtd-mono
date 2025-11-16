const LLMProvider = require('./LLMProvider');

/**
 * OpenAI Provider Implementation
 * Supports GPT-4, GPT-3.5, etc.
 */
class OpenAIProvider extends LLMProvider {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'gpt-4o-mini';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';

    if (!this.apiKey) {
      console.warn('OpenAI API key not configured');
    }
  }

  async complete(options) {
    const {
      prompt,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI completion error:', error);
      throw error;
    }
  }

  async completeJSON(options) {
    const {
      prompt,
      schema,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant. Always respond with valid JSON.'
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI JSON completion error:', error);
      throw error;
    }
  }

  getName() {
    return `openai-${this.model}`;
  }
}

module.exports = OpenAIProvider;
