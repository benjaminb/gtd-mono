/**
 * Base LLM Provider Interface
 * All LLM providers must implement this interface
 */
class LLMProvider {
  /**
   * Generate a completion from the LLM
   * @param {Object} options
   * @param {string} options.prompt - The prompt to send to the LLM
   * @param {number} options.temperature - Temperature for generation (0-1)
   * @param {number} options.maxTokens - Maximum tokens to generate
   * @param {string} options.systemPrompt - System prompt (optional)
   * @returns {Promise<string>} - The generated text
   */
  async complete(options) {
    throw new Error('complete() must be implemented by subclass');
  }

  /**
   * Generate a JSON completion from the LLM
   * @param {Object} options
   * @param {string} options.prompt - The prompt to send to the LLM
   * @param {Object} options.schema - JSON schema for validation (optional)
   * @param {number} options.temperature - Temperature for generation (0-1)
   * @param {string} options.systemPrompt - System prompt (optional)
   * @returns {Promise<Object>} - The parsed JSON response
   */
  async completeJSON(options) {
    throw new Error('completeJSON() must be implemented by subclass');
  }

  /**
   * Get the name of this provider
   * @returns {string}
   */
  getName() {
    throw new Error('getName() must be implemented by subclass');
  }
}

module.exports = LLMProvider;
