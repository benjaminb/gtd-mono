const LLMProvider = require('./LLMProvider');

/**
 * Ollama Provider Implementation
 * Supports locally hosted models via Ollama
 */
class OllamaProvider extends LLMProvider {
  constructor(config = {}) {
    super();
    this.model = config.model || 'llama3.1';
    this.baseURL = config.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async complete(options) {
    const {
      prompt,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    try {
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          temperature,
          stream: false,
          options: {
            num_predict: maxTokens
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Ollama completion error:', error);
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
      const jsonPrompt = `${systemPrompt}\n\n${prompt}\n\nRespond with valid JSON only. Do not include any markdown formatting or explanation.`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: jsonPrompt,
          temperature,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error}`);
      }

      const data = await response.json();
      const content = data.response.trim();

      // Try to extract JSON if wrapped in markdown
      let jsonText = content;
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Ollama JSON completion error:', error);
      throw error;
    }
  }

  getName() {
    return `ollama-${this.model}`;
  }
}

module.exports = OllamaProvider;
