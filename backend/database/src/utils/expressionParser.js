/**
 * Boolean Expression Parser and Evaluator
 * Supports expressions like:
 * - "priority = 1"
 * - "due date = today AND priority > 0"
 * - "(location != home OR status = pending) AND done = false"
 */

class ExpressionParser {
  constructor(expression) {
    this.expression = expression;
    this.tokens = [];
    this.position = 0;
  }

  /**
   * Tokenize the expression
   */
  tokenize() {
    const tokenPatterns = [
      { type: 'LPAREN', pattern: /^\(/ },
      { type: 'RPAREN', pattern: /^\)/ },
      { type: 'AND', pattern: /^(AND|and|&&)/i },
      { type: 'OR', pattern: /^(OR|or|\|\|)/i },
      { type: 'NOT', pattern: /^(NOT|not|!)/i },
      { type: 'OPERATOR', pattern: /^(<=|>=|!=|<>|=|<|>|contains|not contains)/i },
      { type: 'STRING', pattern: /^"([^"]*)"/ },
      { type: 'STRING', pattern: /^'([^']*)'/ },
      { type: 'NUMBER', pattern: /^-?\d+(\.\d+)?/ },
      { type: 'BOOLEAN', pattern: /^(true|false)/i },
      { type: 'TODAY', pattern: /^today/i },
      { type: 'YESTERDAY', pattern: /^yesterday/i },
      { type: 'TOMORROW', pattern: /^tomorrow/i },
      { type: 'NULL', pattern: /^(null|empty|none)/i },
      { type: 'IDENTIFIER', pattern: /^[a-zA-Z_][a-zA-Z0-9_\s]*/ },
      { type: 'WHITESPACE', pattern: /^\s+/ }
    ];

    let remaining = this.expression.trim();

    while (remaining.length > 0) {
      let matched = false;

      for (const { type, pattern } of tokenPatterns) {
        const match = remaining.match(pattern);
        if (match) {
          if (type !== 'WHITESPACE') {
            let value = match[1] !== undefined ? match[1] : match[0];

            // Clean up identifier values (trim trailing spaces)
            if (type === 'IDENTIFIER') {
              value = value.trim();
            }

            this.tokens.push({ type, value });
          }
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }

      if (!matched) {
        throw new Error(`Invalid token at: ${remaining.substring(0, 20)}`);
      }
    }

    return this.tokens;
  }

  /**
   * Parse the tokens into an AST
   */
  parse() {
    this.tokenize();
    this.position = 0;
    return this.parseOr();
  }

  /**
   * Parse OR expressions (lowest precedence)
   */
  parseOr() {
    let left = this.parseAnd();

    while (this.match('OR')) {
      this.advance();
      const right = this.parseAnd();
      left = { type: 'OR', left, right };
    }

    return left;
  }

  /**
   * Parse AND expressions
   */
  parseAnd() {
    let left = this.parseNot();

    while (this.match('AND')) {
      this.advance();
      const right = this.parseNot();
      left = { type: 'AND', left, right };
    }

    return left;
  }

  /**
   * Parse NOT expressions
   */
  parseNot() {
    if (this.match('NOT')) {
      this.advance();
      return { type: 'NOT', operand: this.parseNot() };
    }

    return this.parsePrimary();
  }

  /**
   * Parse primary expressions (comparisons and parentheses)
   */
  parsePrimary() {
    // Handle parentheses
    if (this.match('LPAREN')) {
      this.advance();
      const expr = this.parseOr();
      if (!this.match('RPAREN')) {
        throw new Error('Expected closing parenthesis');
      }
      this.advance();
      return expr;
    }

    // Parse comparison: identifier operator value
    const left = this.parseValue();

    if (!this.match('OPERATOR')) {
      throw new Error('Expected operator');
    }

    const operator = this.current().value.toLowerCase();
    this.advance();

    const right = this.parseValue();

    return {
      type: 'COMPARISON',
      operator,
      left,
      right
    };
  }

  /**
   * Parse a value (identifier, string, number, boolean, etc.)
   */
  parseValue() {
    const token = this.current();

    if (!token) {
      throw new Error('Unexpected end of expression');
    }

    this.advance();

    switch (token.type) {
      case 'IDENTIFIER':
        return { type: 'IDENTIFIER', value: token.value };
      case 'STRING':
        return { type: 'STRING', value: token.value };
      case 'NUMBER':
        return { type: 'NUMBER', value: parseFloat(token.value) };
      case 'BOOLEAN':
        return { type: 'BOOLEAN', value: token.value.toLowerCase() === 'true' };
      case 'TODAY':
        return { type: 'DATE', value: 'today' };
      case 'YESTERDAY':
        return { type: 'DATE', value: 'yesterday' };
      case 'TOMORROW':
        return { type: 'DATE', value: 'tomorrow' };
      case 'NULL':
        return { type: 'NULL', value: null };
      default:
        throw new Error(`Unexpected token type: ${token.type}`);
    }
  }

  /**
   * Check if current token matches type
   */
  match(type) {
    const token = this.current();
    return token && token.type === type;
  }

  /**
   * Get current token
   */
  current() {
    return this.tokens[this.position];
  }

  /**
   * Move to next token
   */
  advance() {
    this.position++;
  }
}

/**
 * Evaluate an AST against a task object
 */
class ExpressionEvaluator {
  constructor(task) {
    this.task = task;
  }

  /**
   * Evaluate the AST
   */
  evaluate(ast) {
    switch (ast.type) {
      case 'AND':
        return this.evaluate(ast.left) && this.evaluate(ast.right);
      case 'OR':
        return this.evaluate(ast.left) || this.evaluate(ast.right);
      case 'NOT':
        return !this.evaluate(ast.operand);
      case 'COMPARISON':
        return this.evaluateComparison(ast);
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  /**
   * Evaluate a comparison node
   */
  evaluateComparison(node) {
    const leftValue = this.resolveValue(node.left);
    const rightValue = this.resolveValue(node.right);
    const operator = node.operator;

    // Handle null/undefined checks
    if (leftValue === null || leftValue === undefined) {
      if (operator === '=' || operator === '==') {
        return rightValue === null || rightValue === undefined;
      }
      if (operator === '!=' || operator === '<>') {
        return rightValue !== null && rightValue !== undefined;
      }
      return false;
    }

    switch (operator) {
      case '=':
      case '==':
        return this.compareEquals(leftValue, rightValue);
      case '!=':
      case '<>':
        return !this.compareEquals(leftValue, rightValue);
      case '<':
        return this.compareNumeric(leftValue, rightValue) < 0;
      case '>':
        return this.compareNumeric(leftValue, rightValue) > 0;
      case '<=':
        return this.compareNumeric(leftValue, rightValue) <= 0;
      case '>=':
        return this.compareNumeric(leftValue, rightValue) >= 0;
      case 'contains':
        return String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
      case 'not contains':
        return !String(leftValue).toLowerCase().includes(String(rightValue).toLowerCase());
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Resolve a value node to actual value
   */
  resolveValue(node) {
    switch (node.type) {
      case 'IDENTIFIER':
        return this.getTaskProperty(node.value);
      case 'STRING':
        return node.value;
      case 'NUMBER':
        return node.value;
      case 'BOOLEAN':
        return node.value;
      case 'NULL':
        return null;
      case 'DATE':
        return this.resolveDate(node.value);
      default:
        throw new Error(`Unknown value type: ${node.type}`);
    }
  }

  /**
   * Get property value from task
   */
  getTaskProperty(propertyName) {
    const lowerProp = propertyName.toLowerCase();

    // Built-in properties
    if (lowerProp === 'name' || lowerProp === 'title') {
      return this.task.name;
    }
    if (lowerProp === 'done' || lowerProp === 'completed') {
      return this.task.done;
    }
    if (lowerProp === 'source') {
      return this.task.source || 'user';
    }

    // Custom properties
    if (this.task.customProperties) {
      const customProps = typeof this.task.customProperties === 'string'
        ? JSON.parse(this.task.customProperties)
        : this.task.customProperties;

      // Try exact match first
      if (customProps[propertyName] !== undefined) {
        return customProps[propertyName];
      }

      // Try case-insensitive match
      for (const [key, value] of Object.entries(customProps)) {
        if (key.toLowerCase() === lowerProp) {
          return value;
        }
      }
    }

    return null;
  }

  /**
   * Resolve date keywords to actual dates
   */
  resolveDate(keyword) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (keyword) {
      case 'today':
        return now.toISOString().split('T')[0];
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      case 'tomorrow': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      default:
        return keyword;
    }
  }

  /**
   * Compare values for equality (handles different types)
   */
  compareEquals(left, right) {
    // Handle date strings
    if (this.isDateString(left) && this.isDateString(right)) {
      return left === right;
    }

    // Handle numbers
    if (typeof left === 'number' || typeof right === 'number') {
      return parseFloat(left) === parseFloat(right);
    }

    // Handle booleans
    if (typeof left === 'boolean' || typeof right === 'boolean') {
      return Boolean(left) === Boolean(right);
    }

    // Handle strings (case-insensitive)
    return String(left).toLowerCase() === String(right).toLowerCase();
  }

  /**
   * Compare values numerically or by date
   */
  compareNumeric(left, right) {
    // Try date comparison first
    if (this.isDateString(left) && this.isDateString(right)) {
      return left.localeCompare(right);
    }

    // Numeric comparison
    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);

    if (isNaN(leftNum) || isNaN(rightNum)) {
      throw new Error(`Cannot compare non-numeric values: ${left} and ${right}`);
    }

    return leftNum - rightNum;
  }

  /**
   * Check if string is a date
   */
  isDateString(str) {
    return /^\d{4}-\d{2}-\d{2}/.test(String(str));
  }
}

/**
 * Main function to filter tasks by expression
 */
function filterTasksByExpression(tasks, expression) {
  if (!expression || expression.trim() === '') {
    return tasks;
  }

  try {
    const parser = new ExpressionParser(expression);
    const ast = parser.parse();

    return tasks.filter(task => {
      try {
        const evaluator = new ExpressionEvaluator(task);
        return evaluator.evaluate(ast);
      } catch (err) {
        console.error(`Error evaluating task ${task.id}:`, err);
        return false;
      }
    });
  } catch (err) {
    throw new Error(`Expression parsing error: ${err.message}`);
  }
}

/**
 * Validate an expression without executing it
 */
function validateExpression(expression) {
  try {
    const parser = new ExpressionParser(expression);
    const ast = parser.parse();
    return { valid: true, ast };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  ExpressionParser,
  ExpressionEvaluator,
  filterTasksByExpression,
  validateExpression
};
