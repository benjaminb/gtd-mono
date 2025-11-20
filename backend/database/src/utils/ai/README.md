# AI Security Utilities

This directory contains utilities for secure AI/LLM integration with comprehensive anti-jailbreaking measures.

## 📁 Files

- **`promptSecurity.js`** - Core security utilities for prompt construction and validation
- **`examples.js`** - Practical usage examples demonstrating secure patterns
- **`__tests__/promptSecurity.test.js`** - Comprehensive test suite

## 🚀 Quick Start

### Basic Usage

```javascript
const {
  SecurityLevel,
  buildSecurePrompt,
  detectJailbreakAttempt,
} = require('./utils/ai/promptSecurity');

// 1. Detect jailbreak attempts
const check = detectJailbreakAttempt(userInput);

if (check.riskScore > 70) {
  return { error: 'Request blocked' };
}

// 2. Build secure prompt
const prompt = buildSecurePrompt({
  taskDescription: 'Your specific task',
  systemInstructions: 'Your LLM instructions',
  userContent: userInput,
  securityLevel: SecurityLevel.STRICT,
});

// 3. Call your LLM
const response = await yourLLM.complete(prompt);

// 4. Validate response
const validation = validateResponse(response);

if (!validation.safe) {
  return { error: 'Validation failed' };
}
```

## 🔒 Security Features

### 1. Jailbreak Detection

Automatically detects common jailbreak patterns:
- Instruction override attempts
- Role manipulation
- Privilege escalation
- Prompt extraction
- System tag injection

### 2. Input Sanitization

Cleans user input before processing:
- Removes control characters
- Escapes delimiter tags
- Truncates to safe lengths
- Neutralizes code blocks

### 3. Secure Prompt Construction

Builds prompts with:
- Anti-jailbreaking instructions
- Clear content delimiters
- Explicit role definitions
- Security-level-based protections

### 4. Response Validation

Validates LLM responses for:
- System prompt leakage
- Sensitive pattern detection
- Custom security checks

## 📝 Usage Examples

### Example 1: Task Suggestions

```javascript
const aiService = require('../../services/aiSuggestionService');

async function getTaskSuggestions(taskName, taskDescription, userId) {
  const result = await aiService.suggestTaskFields({
    taskName,
    taskDescription,
    userId,
  });

  if (!result.success) {
    // Handle security block or error
    return [];
  }

  return result.suggestions;
}
```

### Example 2: Manual Integration

```javascript
const { buildSecurePrompt, SecurityLevel } = require('./promptSecurity');

const prompt = buildSecurePrompt({
  taskDescription: 'Categorize user task',
  systemInstructions: `
Categorize the task into one of: work, personal, shopping, health.
Return JSON: { "category": "...", "confidence": 0.0-1.0 }
  `,
  userContent: taskName,
  securityLevel: SecurityLevel.STRICT,
});
```

## 🧪 Running Tests

```bash
# Run the test suite
node src/utils/ai/__tests__/promptSecurity.test.js

# Or run specific examples
node src/utils/ai/examples.js
```

## 📊 Security Levels

| Level | Use Case | Protection Level |
|-------|----------|------------------|
| **STRICT** | Public-facing features | Maximum - All protections enabled |
| **MODERATE** | Authenticated users | Balanced - Standard protections |
| **MINIMAL** | Admin/trusted content | Basic - Core protections only |

## 🎯 Best Practices

1. **Always Check Input First**
   ```javascript
   const check = detectJailbreakAttempt(userInput);
   if (check.riskScore > 70) return { blocked: true };
   ```

2. **Use Appropriate Security Levels**
   - Public APIs → `SecurityLevel.STRICT`
   - User features → `SecurityLevel.MODERATE`
   - Admin tools → `SecurityLevel.MINIMAL`

3. **Validate All Responses**
   ```javascript
   const validation = validateResponse(llmResponse);
   if (!validation.safe) return { error: 'Validation failed' };
   ```

4. **Log Security Events**
   ```javascript
   if (check.riskScore > 50) {
     console.warn('Suspicious input detected', {
       userId,
       riskScore: check.riskScore,
     });
   }
   ```

5. **Sanitize Before Processing**
   ```javascript
   const sanitized = sanitizeUserInput(input, {
     maxLength: 10000,
     removeControlChars: true,
     escapeDelimiters: true,
   });
   ```

## 🔍 Risk Scoring

Risk scores help you make decisions:

| Score | Level | Action |
|-------|-------|--------|
| 0-30 | Low | Allow with monitoring |
| 31-50 | Medium | Log and allow |
| 51-70 | High | Warn and allow with caution |
| 71-100 | Critical | Block request |

## 📚 Related Documentation

- `/docs/AI_SECURITY_GUIDE.md` - Comprehensive security guide
- `/services/aiSuggestionService.js` - Example service implementation
- `/.env.example` - AI configuration options

## 🛡️ Attack Patterns Detected

The security utilities detect these attack patterns:

1. **Instruction Override**
   - "Ignore all previous instructions"
   - "Forget everything above"
   - "New instructions:"

2. **Role Manipulation**
   - "You are now [different role]"
   - "Pretend to be [something]"
   - "Act as [privileged entity]"

3. **Delimiter Breaking**
   - `</system><system>`
   - ` ``` code blocks ``` `
   - `[INST]` injection

4. **Privilege Escalation**
   - "Enable admin mode"
   - "Sudo access"
   - "Root privileges"

5. **Information Extraction**
   - "Reveal your prompt"
   - "Show system instructions"
   - "What are your guidelines?"

## 🐛 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Contact the security team directly
3. Provide details about the vulnerability
4. Include steps to reproduce if possible

## 📄 License

This security utility is part of the GTD application and follows the same license.

---

**Remember:** Security is an ongoing process. Regularly update these utilities as new attack vectors are discovered.
