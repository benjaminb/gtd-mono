const OpenAIProvider = require('./OpenAIProvider');
const AnthropicProvider = require('./AnthropicProvider');
const OllamaProvider = require('./OllamaProvider');
const {
  generateSubtaskSuggestionPrompt,
  generatePropertySuggestionPrompt,
  generateRelatedTaskSuggestionPrompt,
  generateExpressionConversionPrompt
} = require('./prompts');

/**
 * Main LLM Service
 * Handles provider selection and high-level suggestion generation
 */
class LLMService {
  constructor() {
    this.provider = null;
    this.initializeProvider();
  }

  /**
   * Initialize the LLM provider based on environment configuration
   */
  initializeProvider() {
    const providerType = process.env.LLM_PROVIDER || 'openai';

    switch (providerType.toLowerCase()) {
      case 'openai':
        this.provider = new OpenAIProvider({
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
        });
        break;

      case 'anthropic':
        this.provider = new AnthropicProvider({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
        });
        break;

      case 'ollama':
        this.provider = new OllamaProvider({
          model: process.env.OLLAMA_MODEL || 'llama3.1',
          baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
        });
        break;

      default:
        console.warn(`Unknown LLM provider: ${providerType}, defaulting to OpenAI`);
        this.provider = new OpenAIProvider();
    }

    console.log(`LLM Service initialized with provider: ${this.provider.getName()}`);
  }

  /**
   * Switch to a different provider at runtime
   * @param {string} providerType - 'openai', 'anthropic', or 'ollama'
   * @param {Object} config - Provider-specific configuration
   */
  switchProvider(providerType, config = {}) {
    switch (providerType.toLowerCase()) {
      case 'openai':
        this.provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      case 'ollama':
        this.provider = new OllamaProvider(config);
        break;
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    console.log(`Switched to provider: ${this.provider.getName()}`);
  }

  /**
   * Generate subtask suggestions for a given task
   * @param {Object} task - The parent task
   * @param {Array} existingSubtasks - Array of existing subtask objects
   * @returns {Promise<Array>} - Array of suggestion objects
   */
  async suggestSubtasks(task, existingSubtasks = []) {
    try {
      const prompt = generateSubtaskSuggestionPrompt(task, existingSubtasks);

      const response = await this.provider.completeJSON({
        prompt,
        temperature: 0.7,
        systemPrompt: 'You are a helpful task management assistant. Always respond with valid JSON.'
      });

      // Validate and enrich suggestions
      const suggestions = (response.suggestions || []).map(suggestion => ({
        name: suggestion.name,
        reasoning: suggestion.reasoning || '',
        confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        customProperties: suggestion.customProperties || {},
        source: 'ai-suggested',
        suggestionMetadata: {
          generatedBy: this.provider.getName(),
          generatedAt: new Date().toISOString(),
          confidence: suggestion.confidence || 0.5,
          reasoning: suggestion.reasoning || '',
          type: 'subtask'
        }
      }));

      return suggestions;
    } catch (error) {
      console.error('Error generating subtask suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate property suggestions for a given task
   * @param {Object} task - The task to suggest properties for
   * @param {Array} allPropertyNames - All property names used in the system
   * @returns {Promise<Array>} - Array of property suggestion objects
   */
  async suggestProperties(task, allPropertyNames = []) {
    try {
      const prompt = generatePropertySuggestionPrompt(task, allPropertyNames);

      const response = await this.provider.completeJSON({
        prompt,
        temperature: 0.6,
        systemPrompt: 'You are a helpful task management assistant. Always respond with valid JSON.'
      });

      // Validate and format suggestions
      const suggestions = (response.suggestions || []).map(suggestion => ({
        propertyName: suggestion.propertyName,
        propertyValue: suggestion.propertyValue,
        reasoning: suggestion.reasoning || '',
        confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        suggestionMetadata: {
          generatedBy: this.provider.getName(),
          generatedAt: new Date().toISOString(),
          confidence: suggestion.confidence || 0.5,
          reasoning: suggestion.reasoning || '',
          type: 'property'
        }
      }));

      return suggestions;
    } catch (error) {
      console.error('Error generating property suggestions:', error);
      throw error;
    }
  }

  /**
   * Generate related task suggestions (sibling tasks)
   * @param {Object} task - The current task
   * @param {Array} siblingTasks - Sibling tasks at the same level
   * @returns {Promise<Array>} - Array of suggestion objects
   */
  async suggestRelatedTasks(task, siblingTasks = []) {
    try {
      const prompt = generateRelatedTaskSuggestionPrompt(task, siblingTasks);

      const response = await this.provider.completeJSON({
        prompt,
        temperature: 0.7,
        systemPrompt: 'You are a helpful task management assistant. Always respond with valid JSON.'
      });

      const suggestions = (response.suggestions || []).map(suggestion => ({
        name: suggestion.name,
        reasoning: suggestion.reasoning || '',
        confidence: Math.min(Math.max(suggestion.confidence || 0.5, 0), 1),
        source: 'ai-suggested',
        suggestionMetadata: {
          generatedBy: this.provider.getName(),
          generatedAt: new Date().toISOString(),
          confidence: suggestion.confidence || 0.5,
          reasoning: suggestion.reasoning || '',
          type: 'related-task'
        }
      }));

      return suggestions;
    } catch (error) {
      console.error('Error generating related task suggestions:', error);
      throw error;
    }
  }

  /**
   * Convert natural language query to boolean expression
   * @param {string} naturalLanguage - User's natural language query
   * @param {Array} availableProperties - Available custom property names
   * @returns {Promise<Object>} Object with expression, explanation, and confidence
   */
  async convertToExpression(naturalLanguage, availableProperties = []) {
    if (!this.provider) {
      throw new Error('LLM provider not configured');
    }

    try {
      const prompt = generateExpressionConversionPrompt(naturalLanguage, availableProperties);

      const response = await this.provider.completeJSON({
        prompt,
        temperature: 0.3 // Lower temperature for more deterministic output
      });

      return {
        expression: response.expression,
        explanation: response.explanation || '',
        confidence: Math.min(Math.max(response.confidence || 0.5, 0), 1),
        originalQuery: naturalLanguage
      };
    } catch (error) {
      console.error('Error converting natural language to expression:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.provider !== null;
  }

  /**
   * Get the current provider name
   * @returns {string}
   */
  getProviderName() {
    return this.provider ? this.provider.getName() : 'none';
  }
}

// Export singleton instance
module.exports = new LLMService();
