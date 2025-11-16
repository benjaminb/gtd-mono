# LLM Integration Guide

This guide explains how to configure and use the AI suggestion features in the GTD task management app.

## Overview

The app includes an intelligent suggestion system that automatically generates task recommendations when you interact with your tasks. Suggestions include:

- **Subtasks**: Actionable steps to complete a parent task
- **Properties**: Relevant metadata like priority, due dates, tags
- **Related Tasks**: Sibling tasks that complement your work

## Architecture

### Provider Pattern

The LLM service uses a flexible provider pattern allowing you to switch between different AI models:

- **OpenAI** (GPT-4, GPT-3.5, etc.)
- **Anthropic** (Claude models)
- **Ollama** (Local open-source models)

All providers implement the same interface, making it easy to swap between them based on your needs (cost, privacy, performance).

### Automatic Suggestion Workflow

1. User focuses on a task (clicks to view details or selects in graph)
2. After 1.5-2 second debounce, the system checks if suggestions needed
3. Backend calls configured LLM with context-aware prompts
4. LLM generates 2-4 suggestions with reasoning and confidence scores
5. Suggestions created in database with `source: 'ai-suggested'`
6. Frontend automatically reloads and displays in suggestions panel
7. User can accept (converts to `ai-accepted`) or reject (deletes)

## Configuration

### Step 1: Choose Your Provider

Edit `/backend/database/.env` and set the provider:

```bash
LLM_PROVIDER=openai  # or 'anthropic' or 'ollama'
```

### Step 2: Configure Provider Settings

#### Option A: OpenAI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...your-api-key...
OPENAI_MODEL=gpt-4o-mini  # or gpt-4, gpt-3.5-turbo, etc.
```

**Cost**: gpt-4o-mini is recommended for balance of quality and cost (~$0.15/million input tokens).

#### Option B: Anthropic

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...your-api-key...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # or claude-3-haiku, etc.
```

**Cost**: Claude Haiku is most economical, Sonnet provides best quality.

#### Option C: Ollama (Local/Private)

```bash
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.1  # or mistral, codellama, etc.
OLLAMA_BASE_URL=http://localhost:11434
```

**Setup**: Install Ollama from https://ollama.ai/ and pull a model:
```bash
ollama pull llama3.1
ollama serve
```

**Benefits**: Free, private, no internet required (after model download).

### Step 3: Start the Server

```bash
cd backend/database
npm run dev
```

The server will log: `LLM Service initialized with provider: openai-gpt-4o-mini`

### Step 4: Verify Configuration

Check the status endpoint:

```bash
curl http://localhost:3000/api/suggestions/status
```

Response:
```json
{
  "configured": true,
  "provider": "openai-gpt-4o-mini"
}
```

## Usage

### Automatic Suggestions

Suggestions are generated automatically - no manual action required!

**In List View:**
1. Click any task to expand its details
2. Wait ~1.5 seconds
3. Subtask suggestions appear in the suggestions panel (top of page)

**In Graph View:**
1. Click any task node
2. Wait ~2 seconds
3. Subtask suggestions appear in the suggestions panel

### Reviewing Suggestions

The suggestions panel shows:
- **Task name**: What the suggestion is about
- **Why**: AI's reasoning for suggesting this
- **Confidence**: How confident the AI is (0-100%)
- **Properties**: Any suggested metadata
- **Actions**: Accept (✓) or Dismiss (×)

### Batch Operations

For multiple suggestions:
- **Accept All**: Converts all suggestions to regular tasks
- **Dismiss All**: Removes all suggestions

### Suggestion Metadata

Every AI-generated task includes:

```javascript
{
  source: 'ai-suggested',
  suggestionMetadata: {
    generatedBy: 'openai-gpt-4o-mini',
    generatedAt: '2024-01-15T10:30:00Z',
    confidence: 0.85,
    reasoning: 'This subtask breaks down the research phase...',
    type: 'subtask'
  }
}
```

## Customization

### Adjusting Debounce Time

Edit the hook calls in `TaskNode.jsx` or `GraphView.jsx`:

```javascript
useAutoSuggestions(
  focusedTask,
  {
    suggestionType: 'subtasks',
    debounceMs: 3000  // Wait 3 seconds instead of 1.5
  }
);
```

### Disabling Auto-Suggestions

Set `enabled: false` in the hook:

```javascript
useAutoSuggestions(
  focusedTask,
  {
    suggestionType: 'subtasks',
    enabled: false  // Disable automatic suggestions
  }
);
```

### Switching Providers at Runtime

```javascript
const llmService = require('./services/llm/LLMService');

// Switch to Anthropic
llmService.switchProvider('anthropic', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-haiku-20240307'
});
```

## Advanced Features

### Custom Prompts

Edit `/backend/database/src/services/llm/prompts.js` to customize how suggestions are generated:

```javascript
function generateSubtaskSuggestionPrompt(task, existingSubtasks, context) {
  return `Your custom prompt here...

  Task: ${task.name}

  Suggest subtasks that are specific to ${context.userPreference}`;
}
```

### Property Suggestions

Currently property suggestions are generated but not automatically displayed. To use them:

```javascript
const suggestions = await api.getSuggestionsProperties(taskId, allPropertyNames);
// suggestions contains array of { propertyName, propertyValue, reasoning, confidence }
```

### Related Task Suggestions

Generate sibling tasks (same level as current task):

```javascript
const suggestions = await api.getSuggestionsRelatedTasks(taskId, userId);
```

## Troubleshooting

### "Provider not configured" Error

- Check `.env` file has correct provider settings
- Verify API keys are valid
- Restart the server after changing `.env`

### Suggestions Not Appearing

- Check browser console for errors
- Verify LLM provider is responding: `curl localhost:3000/api/suggestions/status`
- Check backend logs for API errors
- Ensure you're focusing on user-created tasks (not AI suggestions themselves)

### Ollama Connection Failed

- Verify Ollama is running: `ollama list`
- Check OLLAMA_BASE_URL matches Ollama server
- Ensure model is pulled: `ollama pull llama3.1`

### Rate Limiting

OpenAI/Anthropic may rate limit requests. The system includes:
- Debouncing to reduce requests
- Per-task-per-session caching (won't re-generate for same task)

If you hit rate limits, consider:
- Increasing `debounceMs`
- Using a local Ollama model
- Upgrading API tier

## Best Practices

1. **Start with gpt-4o-mini**: Good balance of quality and cost
2. **Use Ollama for development**: Free, fast, private
3. **Don't spam suggestions**: The debounce is there for a reason
4. **Review confidence scores**: Low confidence (<0.6) may need editing
5. **Customize prompts**: Tailor to your workflow for better results

## Cost Estimation

For **subtask suggestions** (typical usage):

| Provider | Model | Est. Cost per 1000 suggestions |
|----------|-------|-------------------------------|
| OpenAI | gpt-4o-mini | ~$0.20 |
| OpenAI | gpt-4 | ~$3.00 |
| Anthropic | Claude Haiku | ~$0.15 |
| Anthropic | Claude Sonnet | ~$1.50 |
| Ollama | Any local model | $0.00 |

*Costs are estimates based on average prompt sizes and may vary.*

## Privacy Considerations

- **OpenAI/Anthropic**: Your task data is sent to third-party APIs
- **Ollama**: All processing happens locally, no data leaves your machine
- **Enterprise**: Use Ollama or request API providers' enterprise plans with data guarantees

## Future Enhancements

Planned features:
- User preference learning (learn from accepted/rejected suggestions)
- Context from multiple tasks for better suggestions
- Voice notes → task suggestions
- Calendar integration for deadline suggestions
- Team collaboration suggestions
