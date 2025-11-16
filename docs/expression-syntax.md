# Boolean Expression Syntax Reference

Complete reference for the boolean expression language used in GTD Task Manager for searching and filtering tasks.

## Overview

The expression parser supports a powerful query language that allows you to:
- Find tasks matching specific criteria
- Filter analytics reports
- Combine multiple conditions with boolean logic
- Compare values with type-aware operators

## Basic Syntax

### Simple Equality

```
done = true
priority = high
status = in-progress
```

### Inequality

```
priority != low
location <> home
status not contains blocked
```

### Numeric Comparisons

```
estimatedHours > 5
priority >= 2
daysRemaining < 7
progress <= 50
```

### Text Search

```
name contains meeting
description contains "project alpha"
tags not contains urgent
```

## Operators

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equal to | `priority = high` |
| `!=` | Not equal to | `status != done` |
| `<>` | Not equal to (alternative syntax) | `location <> home` |
| `<` | Less than | `priority < 3` |
| `>` | Greater than | `estimatedHours > 10` |
| `<=` | Less than or equal to | `daysRemaining <= 7` |
| `>=` | Greater than or equal to | `progress >= 50` |
| `contains` | Text contains (case-insensitive) | `name contains meeting` |
| `not contains` | Text does not contain | `tags not contains archived` |

### Boolean Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `AND` | Both conditions must be true | `done = false AND priority = high` |
| `OR` | At least one condition must be true | `priority = 1 OR priority = 2` |
| `NOT` | Negates a condition | `NOT done = true` |
| `&&` | Synonym for AND | `done = false && priority = high` |
| `\|\|` | Synonym for OR | `priority = 1 \|\| priority = 2` |

### Grouping

Use parentheses to control evaluation order:

```
(priority = high OR priority = urgent) AND done = false
done = false AND (location = office OR location = home)
NOT (status = blocked OR status = cancelled)
```

## Data Types

### Strings

String comparisons are case-insensitive:

```
priority = "high"     # Quotes optional for single words
priority = high       # Same as above
location = "New York" # Quotes required for multi-word values
```

### Numbers

Numeric values are automatically detected and compared numerically:

```
priority = 1
estimatedHours > 5
progress >= 75.5
```

Numbers can be:
- Integers: `1`, `42`, `-10`
- Decimals: `3.14`, `0.5`, `-2.75`

### Booleans

Boolean values can be expressed as:

```
done = true
done = false
completed = true
archived = false
```

### Dates

Special date keywords:

```
dueDate = today
createdAt = yesterday
deadline = tomorrow
```

You can also compare dates:

```
dueDate < tomorrow
createdAt >= yesterday
```

### Null Values

Check for missing/empty properties:

```
priority = null
assignee = empty
location = none
```

## Built-in Properties

These properties are available on all tasks:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `name` | string | Task name/description | `name contains meeting` |
| `title` | string | Synonym for name | `title = "Review PR"` |
| `done` | boolean | Completion status | `done = false` |
| `completed` | boolean | Synonym for done | `completed = true` |
| `source` | string | Task origin | `source = ai-suggested` |

### Source Values

The `source` property can be:
- `user` - Created by user
- `ai-suggested` - AI-generated suggestion (not yet accepted)
- `ai-accepted` - AI suggestion that was accepted

```
source = user
source = ai-suggested
source != ai-accepted
```

## Custom Properties

Any properties defined in your Property Schemas can be queried:

```
priority = high
status = in-progress
estimatedHours > 8
dueDate = today
location = office
tags contains urgent
assignee = "Alice"
```

Property names are case-insensitive:
- `Priority = high` is the same as `priority = high`
- `DueDate = today` is the same as `duedate = today`

## Complex Examples

### Find High Priority Incomplete Tasks

```
priority = high AND done = false
```

### Tasks for Specific Locations

```
done = false AND (location = office OR location = home)
```

### Overdue High Priority Tasks

```
priority >= 3 AND dueDate < today AND done = false
```

### Find AI Suggestions

```
source = ai-suggested AND name contains analysis
```

### Unblocked In-Progress Tasks

```
status = in-progress AND NOT status contains blocked
```

### Tasks by Multiple Criteria

```
(priority = high OR priority = urgent) AND
done = false AND
estimatedHours > 4 AND
(assignee = "Alice" OR assignee = "Bob")
```

### Find Tasks Missing Properties

```
priority = null OR dueDate = null
```

## Common Use Cases

### Project Management

```
# Sprint planning
priority >= 2 AND estimatedHours <= 8 AND done = false

# Overdue items
dueDate < today AND done = false

# Blocked work
status contains blocked OR status contains waiting

# Ready to start
done = false AND NOT status contains blocked AND dependencies = null
```

### Personal Tasks

```
# Today's work
dueDate = today AND done = false

# Quick wins
estimatedHours <= 2 AND done = false

# Home tasks for weekend
location = home AND priority >= 3

# Meeting prep
name contains meeting AND dueDate <= tomorrow
```

### Analytics Filtering

```
# Report on user-created tasks only
source = user

# High priority completion rate
priority = high

# Office vs remote productivity
location = office OR location = remote
```

## Type Conversion

The parser automatically handles type conversion:

### Number Comparison

```
priority > "2"      # String "2" converted to number 2
estimatedHours = 5   # Compared as number
```

### Boolean Conversion

```
done = "true"       # String "true" converted to boolean
archived = 1        # Truthy values treated as true
```

### Date Comparison

```
dueDate = "2024-12-31"  # ISO date string
dueDate = today         # Special keyword
```

## Error Handling

### Invalid Syntax

```
# Missing operator
priority high                    # ERROR

# Unmatched parentheses
(priority = high AND done = false # ERROR

# Invalid operator
priority == high                 # ERROR (use = not ==)
```

### Property Not Found

If a property doesn't exist on a task, it's treated as `null`:

```
unknownProperty = 5  # Returns false if property doesn't exist
unknownProperty = null  # Returns true if property doesn't exist
```

## Best Practices

### 1. Use Parentheses for Clarity

```
# Good
(priority = high OR priority = urgent) AND done = false

# Unclear (works but harder to read)
priority = high OR priority = urgent AND done = false
```

### 2. Be Specific with Text Search

```
# Good - specific
name contains "weekly meeting"

# Less precise
name contains meeting
```

### 3. Combine with Property Schemas

Define dropdown properties in schemas, then query them:

```
# First create schema: priority with options ["low", "medium", "high"]
# Then query:
priority = high AND done = false
```

### 4. Test Complex Expressions

Use the Search view to test expressions before using them in reports.

### 5. Use Natural Language First

When unsure, type in natural language in the Search view and let the AI convert it to an expression. You can then refine the generated expression.

## Limitations

### JSON Querying

Custom properties are stored as JSON. While you can query individual properties, you cannot:
- Query nested objects
- Use array operations
- Perform joins across properties

### No Aggregation

Expressions filter tasks but don't aggregate:

```
# NOT supported
COUNT(priority = high)   # Use analytics endpoints instead
SUM(estimatedHours)       # Use analytics endpoints instead
```

For aggregation, use the Analytics API endpoints with a filter expression.

### No Functions

The parser doesn't support functions:

```
# NOT supported
UPPER(name) = "MEETING"    # String comparison is case-insensitive by default
LENGTH(name) > 50          # Not available
```

## Integration with Analytics

All analytics endpoints accept a `filter` parameter:

```
GET /api/analytics/completion?
  groupBy=parent&
  filter=priority%20%3D%20high%20AND%20done%20%3D%20false
```

This filters tasks before running the aggregation, enabling powerful targeted reports.

## Integration with Search

The Search view supports two modes:

1. **Natural Language** - Type plain English, AI converts to expression
   - "show me incomplete high priority tasks"
   - Converted to: `priority = high AND done = false`

2. **Expression** - Type expressions directly
   - Real-time validation
   - Syntax error feedback

## Reference Implementation

See `/backend/database/src/utils/expressionParser.js` for the complete implementation of:
- Tokenizer - Breaks expression into tokens
- Parser - Builds Abstract Syntax Tree (AST)
- Evaluator - Executes AST against task objects

## Getting Help

- Check syntax in Search view (real-time validation)
- Use natural language mode for complex queries
- Review example expressions in this document
- Check PropertySchema definitions for available properties
