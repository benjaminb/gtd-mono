# Property Schema Guide

This guide explains the property schema system that allows users to define custom task properties with specific datatypes and validation rules.

## Overview

The property schema system enables you to create structured, type-safe custom properties for your tasks. Instead of all properties being simple text, you can define:

- **Numbers** with min/max ranges (e.g., priority 1-5, estimated hours)
- **Dates** for deadlines and milestones
- **Boolean** flags (e.g., urgent: yes/no)
- **Dropdown selections** from predefined options (e.g., status: todo/in-progress/done)
- **Text** with optional maximum length

## Benefits

1. **Data Integrity**: Values are validated before saving
2. **Better UX**: Appropriate input types (date pickers, number spinners, dropdowns)
3. **Consistency**: Same property has same type across all tasks
4. **Future Features**: Enables numeric/date-based filtering, sorting, and reporting

## Creating a Property Schema

### Via Task Editor (Recommended)

The easiest way to create a property schema is while editing a task:

1. **Open Task Editor**: Click any task to edit it
2. **Add Property**: Click "+ Add Property" button
3. **Enter Name**: Type the property name (e.g., "estimated_difficulty")
4. **Select Type**: Choose from the datatype dropdown:
   - Text
   - Number
   - Date
   - True/False
   - Dropdown
5. **Configure Constraints** (type-specific):
   - For **Number**: Set min, max, and check "Integers only" if needed
   - For **Dropdown**: Enter comma-separated options
6. **Set Initial Value**: Enter the value for this task
7. **Click Add**: Schema is created and value is saved

### Example: Creating "Priority" Property

```
Property Name: priority
Type: Number
Min: 1
Max: 5
Integers only: ✓
Initial Value: 3
```

This creates a priority property that only accepts integers 1-5.

## Supported Data Types

### Text

- **Description**: Free-form text
- **Constraints**:
  - `maxLength`: Maximum number of characters (optional)
- **Example Use Cases**: Notes, descriptions, tags
- **Input**: Text field

```javascript
{
  propertyName: "notes",
  dataType: "text",
  constraints: {
    maxLength: 500
  }
}
```

### Number

- **Description**: Numeric values (integers or decimals)
- **Constraints**:
  - `min`: Minimum value (optional)
  - `max`: Maximum value (optional)
  - `integer`: If true, only whole numbers allowed (optional)
- **Example Use Cases**: Priority (1-5), estimated hours, difficulty level
- **Input**: Number spinner with min/max

```javascript
{
  propertyName: "estimatedHours",
  dataType: "number",
  constraints: {
    min: 0,
    max: 100,
    integer: false
  }
}
```

### Date

- **Description**: Date values (YYYY-MM-DD format)
- **Constraints**:
  - `minDate`: Earliest allowed date (optional)
  - `maxDate`: Latest allowed date (optional)
- **Example Use Cases**: Due date, start date, deadline
- **Input**: Date picker

```javascript
{
  propertyName: "dueDate",
  dataType: "date",
  constraints: {
    minDate: "2024-01-01",
    maxDate: "2025-12-31"
  }
}
```

### Boolean

- **Description**: True/false values
- **Constraints**: None
- **Example Use Cases**: Urgent flag, requires approval, is blocker
- **Input**: True/False dropdown

```javascript
{
  propertyName: "urgent",
  dataType: "boolean",
  constraints: {}
}
```

### Select (Dropdown)

- **Description**: One value from a predefined list
- **Constraints**:
  - `options`: Array of allowed values (required)
- **Example Use Cases**: Status, category, assignee
- **Input**: Dropdown menu

```javascript
{
  propertyName: "status",
  dataType: "select",
  constraints: {
    options: ["todo", "in-progress", "review", "done"]
  }
}
```

## Using Properties

### Adding Property to a Task

Once a schema exists, you can add the property to any task:

1. Edit the task
2. The property appears in the property editor
3. Enter a value using the type-appropriate input
4. Save the task

### Type-Aware Inputs

The UI automatically shows the right input type:

- **Text**: Standard text field
- **Number**: Number input with up/down arrows, respects min/max
- **Date**: Date picker calendar
- **Boolean**: Dropdown with True/False options
- **Select**: Dropdown with your defined options

### Validation

Values are validated on save:

- **Number**: Must be within min/max, must be integer if specified
- **Date**: Must be valid date, within min/max range if specified
- **Boolean**: Must be true or false
- **Select**: Must be one of the defined options
- **Text**: Must not exceed maxLength if specified

If validation fails, you'll see a clear error message.

## Managing Schemas

### Viewing All Schemas

All your property schemas are loaded automatically when you log in. They're stored in the `PropertySchemaContext`.

### Updating a Schema

Currently, schemas can be updated via the API:

```javascript
await api.updatePropertySchema(schemaId, {
  dataType: 'number',
  constraints: { min: 1, max: 10 }
});
```

> **Note**: Changing a schema affects all future uses but doesn't modify existing property values on tasks.

### Deleting a Schema

Delete via API:

```javascript
await api.deletePropertySchema(schemaId);
```

> **Warning**: Deleting a schema doesn't delete the property from tasks that already have it. Those values become untyped text.

## Backend Validation

The backend validates all property values before saving:

```javascript
// Creating a task with properties
await api.createTask({
  userId: user.id,
  name: "Complete project",
  customProperties: {
    priority: 5,        // Must be number 1-5
    dueDate: "2024-12-31",  // Must be valid date
    urgent: true        // Must be boolean
  }
});
```

If any property fails validation, the entire save fails with a descriptive error.

## API Reference

### Create Property Schema

```http
POST /api/property-schemas
Content-Type: application/json

{
  "userId": "user-uuid",
  "propertyName": "priority",
  "dataType": "number",
  "constraints": {
    "min": 1,
    "max": 5,
    "integer": true
  }
}
```

**Response**: Created schema object

### Get User's Schemas

```http
GET /api/property-schemas/user/:userId
```

**Response**: Array of schema objects

### Update Schema

```http
PUT /api/property-schemas/:schemaId
Content-Type: application/json

{
  "dataType": "number",
  "constraints": {
    "min": 0,
    "max": 10
  }
}
```

**Response**: Updated schema object

### Validate Property Value

```http
POST /api/property-schemas/validate
Content-Type: application/json

{
  "userId": "user-uuid",
  "propertyName": "priority",
  "value": 3
}
```

**Response**:
```json
{
  "valid": true,
  "value": 3
}
```

Or if invalid:
```json
{
  "valid": false,
  "error": "Value must be at least 1"
}
```

## Best Practices

### Naming Conventions

- Use camelCase: `dueDate`, `estimatedHours`, `isUrgent`
- Be descriptive: `estimatedDifficulty` not just `difficulty`
- Avoid spaces: Use `due_date` or `dueDate`, not `due date`

### Choosing Types

- **Number vs Text**: If you'll do math or comparisons, use Number
- **Date vs Text**: Always use Date for dates (enables date-based features)
- **Select vs Text**: If there are <10 options, use Select for consistency
- **Boolean vs Select**: Use Boolean for yes/no, Select for multiple options

### Constraints

- **Be Reasonable**: Don't set `min: 1, max: 1` - that's not useful
- **Think Ahead**: Set ranges that allow for growth
- **Document Options**: For Select, use clear, consistent option names

### Migration Strategy

If you have existing tasks with text properties you want to convert:

1. Create new schema with desired type
2. Manually update task values to match new type
3. Old text values remain until updated

## Troubleshooting

### "Invalid custom properties" Error

**Cause**: Property value doesn't match schema validation

**Solution**: Check the error message for which property failed and why. Common issues:
- Number out of range
- Invalid date format
- Wrong data type
- Option not in select list

### Property Shows as Text Input

**Cause**: Schema wasn't created for that property

**Solution**: Edit the task, remove the property, then add it again with proper type selection

### Can't Change Property Type

**Cause**: Schema already exists for that property name

**Solution**:
- Option 1: Use a different property name
- Option 2: Delete the schema via API and recreate
- Option 3: Update the schema via API

### Values Not Validating

**Cause**: Schema might not be loaded or there's a client-side caching issue

**Solution**: Reload the page to refresh schemas from server

## Examples

### Sprint Planning Properties

```javascript
// Effort estimation (1-8 story points)
{
  propertyName: "storyPoints",
  dataType: "number",
  constraints: { min: 1, max: 8, integer: true }
}

// Sprint assignment
{
  propertyName: "sprint",
  dataType: "select",
  constraints: { options: ["Sprint 1", "Sprint 2", "Sprint 3", "Backlog"] }
}

// Due date
{
  propertyName: "dueDate",
  dataType: "date",
  constraints: {}
}
```

### Bug Tracking Properties

```javascript
// Severity
{
  propertyName: "severity",
  dataType: "select",
  constraints: { options: ["critical", "high", "medium", "low"] }
}

// Estimated fix time (hours)
{
  propertyName: "estimatedHours",
  dataType: "number",
  constraints: { min: 0.5, max: 40, integer: false }
}

// Requires QA
{
  propertyName: "requiresQA",
  dataType: "boolean",
  constraints: {}
}
```

### Personal Task Properties

```javascript
// Energy level required
{
  propertyName: "energyLevel",
  dataType: "select",
  constraints: { options: ["high", "medium", "low"] }
}

// Time of day preference
{
  propertyName: "preferredTime",
  dataType: "select",
  constraints: { options: ["morning", "afternoon", "evening", "anytime"] }
}

// Estimated duration (minutes)
{
  propertyName: "duration",
  dataType: "number",
  constraints: { min: 5, max: 480, integer: true }
}
```

## Future Enhancements

Planned features that will leverage property schemas:

- **Advanced Filtering**: Filter by numeric ranges, date ranges
- **Sorting**: Sort tasks by any property
- **Reports**: Aggregate numeric properties, group by select values
- **Visualizations**: Charts based on numeric/select properties
- **Bulk Edit**: Change property values across multiple tasks
- **Templates**: Task templates with pre-defined property schemas
- **Property Groups**: Organize related properties together
