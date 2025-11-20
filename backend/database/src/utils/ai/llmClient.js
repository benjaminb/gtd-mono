/**
 * LLM Client Factory
 *
 * Supports multiple LLM providers:
 * - OpenAI
 * - Anthropic (Claude)
 * - Ollama (self-hosted)
 *
 * Configure via environment variables.
 */

class LLMClient {
  constructor() {
    this.provider = process.env.AI_PROVIDER?.toLowerCase() || 'disabled';
    this.client = null;

    if (this.provider !== 'disabled') {
      this.initializeClient();
    }
  }

  initializeClient() {
    switch (this.provider) {
      case 'openai':
        this.initializeOpenAI();
        break;
      case 'anthropic':
        this.initializeAnthropic();
        break;
      case 'ollama':
        this.initializeOllama();
        break;
      default:
        console.warn(`Unknown AI provider: ${this.provider}. AI features disabled.`);
        this.provider = 'disabled';
    }
  }

  initializeOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not set. OpenAI features disabled.');
      this.provider = 'disabled';
      return;
    }

    try {
      // Lazy load OpenAI SDK
      const { OpenAI } = require('openai');
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('✓ OpenAI client initialized');
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error.message);
      console.log('Run: npm install openai');
      this.provider = 'disabled';
    }
  }

  initializeAnthropic() {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set. Anthropic features disabled.');
      this.provider = 'disabled';
      return;
    }

    try {
      // Lazy load Anthropic SDK
      const { Anthropic } = require('@anthropic-ai/sdk');
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      console.log('✓ Anthropic client initialized');
    } catch (error) {
      console.error('Failed to initialize Anthropic:', error.message);
      console.log('Run: npm install @anthropic-ai/sdk');
      this.provider = 'disabled';
    }
  }

  initializeOllama() {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    try {
      // Ollama uses OpenAI-compatible API
      const { OpenAI } = require('openai');
      this.client = new OpenAI({
        baseURL: `${baseURL}/v1`,
        apiKey: 'ollama', // Ollama doesn't need a real API key
      });
      console.log(`✓ Ollama client initialized (${baseURL})`);
    } catch (error) {
      console.error('Failed to initialize Ollama:', error.message);
      console.log('Run: npm install openai');
      this.provider = 'disabled';
    }
  }

  isAvailable() {
    return this.provider !== 'disabled' && this.client !== null;
  }

  async complete(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('LLM client not available. Check your AI_PROVIDER configuration.');
    }

    switch (this.provider) {
      case 'openai':
        return await this.completeOpenAI(prompt, options);
      case 'anthropic':
        return await this.completeAnthropic(prompt, options);
      case 'ollama':
        return await this.completeOllama(prompt, options);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  async completeOpenAI(prompt, options = {}) {
    const {
      model = process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
      temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    } = options;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI completion error:', error);
      throw error;
    }
  }

  async completeAnthropic(prompt, options = {}) {
    const {
      model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens = parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 500,
      temperature = parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
    } = options;

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic completion error:', error);
      throw error;
    }
  }

  async completeOllama(prompt, options = {}) {
    const {
      model = process.env.OLLAMA_MODEL || 'llama2',
      maxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS) || 500,
      temperature = parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7,
    } = options;

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Ollama completion error:', error);
      throw error;
    }
  }

  /**
   * Test the LLM connection
   */
  async test() {
    if (!this.isAvailable()) {
      return {
        success: false,
        provider: this.provider,
        error: 'LLM client not initialized',
      };
    }

    try {
      const testPrompt = 'Respond with only the word "OK" if you can read this.';
      const response = await this.complete(testPrompt, { maxTokens: 10 });

      return {
        success: true,
        provider: this.provider,
        response: response.trim(),
      };
    } catch (error) {
      return {
        success: false,
        provider: this.provider,
        error: error.message,
      };
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      provider: this.provider,
      available: this.isAvailable(),
      config: this.getConfig(),
    };
  }

  getConfig() {
    switch (this.provider) {
      case 'openai':
        return {
          model: process.env.OPENAI_MODEL || 'gpt-4',
          maxTokens: process.env.OPENAI_MAX_TOKENS || 500,
          temperature: process.env.OPENAI_TEMPERATURE || 0.7,
        };
      case 'anthropic':
        return {
          model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
          maxTokens: process.env.ANTHROPIC_MAX_TOKENS || 500,
          temperature: process.env.ANTHROPIC_TEMPERATURE || 0.7,
        };
      case 'ollama':
        return {
          baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: process.env.OLLAMA_MODEL || 'llama2',
          maxTokens: process.env.OLLAMA_MAX_TOKENS || 500,
          temperature: process.env.OLLAMA_TEMPERATURE || 0.7,
        };
      default:
        return null;
    }
  }
}

// Export singleton instance
module.exports = new LLMClient();
