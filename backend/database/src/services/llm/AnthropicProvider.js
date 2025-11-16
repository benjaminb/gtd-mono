const LLMProvider = require('./LLMProvider');

/**
 * Anthropic Provider Implementation
 * Supports Claude models
 */
class AnthropicProvider extends LLMProvider {
  constructor(config = {}) {
    super();
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.baseURL = config.baseURL || 'https://api.anthropic.com/v1';

    if (!this.apiKey) {
      console.warn('Anthropic API key not configured');
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
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          system: systemPrompt,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Anthropic completion error:', error);
      throw error;
    }
  }

  async completeJSON(options) {
    const {
      prompt,
      schema,
      temperature = 0.7,
      systemPrompt = 'You are a helpful assistant. Always respond with valid JSON and nothing else.'
    } = options;

    try {
      const jsonPrompt = `${prompt}\n\nRespond with valid JSON only. Do not include any markdown formatting or explanation.`;

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: jsonPrompt }
          ],
          system: systemPrompt,
          temperature,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Try to extract JSON if wrapped in markdown
      let jsonText = content.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Anthropic JSON completion error:', error);
      throw error;
    }
  }

  getName() {
    return `anthropic-${this.model}`;
  }
}

module.exports = AnthropicProvider;
