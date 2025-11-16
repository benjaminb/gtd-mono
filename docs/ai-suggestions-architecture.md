# AI Suggestions Architecture Design

## Current Issues

1. **No distinction between user-created and AI-suggested content**
   - Tasks don't have a `source` or `status` field
   - Custom properties stored as JSON blob - no way to mark individual properties as suggested

2. **No metadata for suggestions**
   - No tracking of when/how suggestions were generated
   - No confidence scores or reasoning
   - No ability to accept/reject suggestions

3. **Simplified schema vs original design**
   - Original docs had `HAS_SUGG_FIELD` relationship for suggested fields
   - Current implementation stores everything as JSON `customProperties`

## Recommended Architecture

### Backend Changes

#### 1. Task Node Enhancement

Add fields to Task nodes:
```javascript
{
  id: UUID,
  name: string,
  done: boolean,
  source: enum('user', 'ai-suggested', 'ai-accepted'),  // NEW
  suggestionMetadata: {                                  // NEW
    generatedBy: string,      // AI model/version
    generatedAt: datetime,
    confidence: float,         // 0.0 - 1.0
    reasoning: string,         // Why suggested
    acceptedAt: datetime,      // When user accepted
  },
  createdAt: datetime,
  updatedAt: datetime,
  customProperties: JSON
}
```

#### 2. Property-Level Suggestions

Option A: Enhance customProperties structure
```javascript
customProperties: {
  priority: {
    value: "high",
    source: "user",           // 'user', 'ai-suggested', 'ai-accepted'
    suggestionMetadata: {...} // Only if AI-suggested
  },
  dueDate: {
    value: "2024-12-31",
    source: "ai-suggested",
    suggestionMetadata: {
      confidence: 0.85,
      reasoning: "Based on project timeline"
    }
  }
}
```

Option B: Separate SuggestedProperty nodes (like original design)
```cypher
(:Task)-[:HAS_USER_FIELD]->(:TaskField {name, value})
(:Task)-[:HAS_SUGG_FIELD]->(:TaskField {name, value, confidence, reasoning})
```

**Recommendation: Use Option A for simplicity** - keeps all properties in one place but adds metadata structure.

#### 3. Dedicated Suggestion Node (Optional)

For more complex suggestion workflows:
```cypher
(:Suggestion {
  id: UUID,
  type: enum('task', 'property', 'relationship'),
  status: enum('pending', 'accepted', 'rejected'),
  targetTaskId: UUID,  // If property suggestion
  data: JSON,          // The suggested content
  metadata: {
    confidence: float,
    reasoning: string,
    generatedAt: datetime
  }
})

(:User)-[:HAS_SUGGESTION]->(:Suggestion)
(:Suggestion)-[:SUGGESTS_FOR]->(:Task)
```

### Frontend Changes

#### 1. Visual Distinction

**Suggested Tasks:**
- Lighter opacity or different background color
- Dashed border or special icon (🤖, ✨, 💡)
- "AI Suggested" badge
- Accept/Reject buttons always visible

**Suggested Properties:**
- Italic or lighter text
- Special color (e.g., light blue)
- Small AI icon next to property name
- Inline accept/reject controls

#### 2. Suggestion Management UI

**Suggestions Panel:**
- Separate view or section for pending suggestions
- Filter to show only suggested items
- Bulk accept/reject
- Show confidence scores and reasoning

**Inline Actions:**
- ✓ Accept - converts to user-created
- ✗ Reject - removes suggestion
- ✎ Edit & Accept - modify before accepting

#### 3. Graph View Considerations

**Suggested tasks in graph:**
- Different node style (dashed border, lighter color)
- Different arrow style for suggested relationships
- Tooltip showing suggestion metadata

## Implementation Priority

### Phase 1: Foundation (Do Now)
1. Add `source` field to Task model
2. Enhance customProperties to support metadata per property
3. Add database migration for new fields
4. Update API to handle suggestion metadata

### Phase 2: UI/UX
1. Add visual styling for suggested items
2. Implement accept/reject actions
3. Add suggestion badges and indicators
4. Create suggestions filter view

### Phase 3: AI Integration
1. Add LLM integration endpoints
2. Implement suggestion generation logic
3. Add confidence scoring
4. Build reasoning/explanation system

## Example Data Structures

### Suggested Task
```json
{
  "id": "abc-123",
  "name": "Review Q4 budget",
  "done": false,
  "source": "ai-suggested",
  "suggestionMetadata": {
    "generatedBy": "gpt-4",
    "generatedAt": "2024-11-16T10:00:00Z",
    "confidence": 0.92,
    "reasoning": "Based on your project timeline and past tasks, this review is typically done in mid-November"
  },
  "customProperties": {
    "priority": {
      "value": "high",
      "source": "ai-suggested",
      "suggestionMetadata": {
        "confidence": 0.88,
        "reasoning": "Budget reviews are typically high priority"
      }
    }
  }
}
```

### User-Created Task
```json
{
  "id": "def-456",
  "name": "Buy groceries",
  "done": false,
  "source": "user",
  "customProperties": {
    "priority": {
      "value": "medium",
      "source": "user"
    }
  }
}
```

## Migration Strategy

1. Add new fields with defaults for existing tasks
2. All existing tasks: `source: "user"`
3. All existing properties: wrap in `{value: ..., source: "user"}`
4. Gradual rollout: AI suggestions start appearing as new content
5. Backward compatibility: frontend handles both old and new property formats

## Benefits

- ✅ Clear separation of user vs AI content
- ✅ Easy to filter/hide suggestions
- ✅ Tracks provenance and confidence
- ✅ Supports accept/reject workflow
- ✅ Extensible for future AI features
- ✅ Minimal breaking changes to existing code
