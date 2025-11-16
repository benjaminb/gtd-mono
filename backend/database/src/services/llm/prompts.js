/**
 * Prompt templates for AI suggestions
 */

/**
 * Generate prompt for suggesting subtasks
 * @param {Object} task - The parent task
 * @param {Array} existingSubtasks - Existing subtasks
 * @param {Object} context - Additional context (user's other tasks, etc.)
 * @returns {string}
 */
function generateSubtaskSuggestionPrompt(task, existingSubtasks = [], context = {}) {
  const existingSubtasksList = existingSubtasks.length > 0
    ? `\nExisting subtasks:\n${existingSubtasks.map(st => `- ${st.name}`).join('\n')}`
    : '\nNo existing subtasks yet.';

  const customPropsInfo = Object.keys(task.customProperties || {}).length > 0
    ? `\n\nTask properties:\n${JSON.stringify(task.customProperties, null, 2)}`
    : '';

  return `You are a task management assistant helping users break down their work into manageable subtasks.

Given this task:
"${task.name}"${customPropsInfo}${existingSubtasksList}

Suggest 2-4 helpful subtasks that would help accomplish this task. Consider:
1. Logical breakdown of work
2. Reasonable scope for each subtask
3. Avoiding duplicates with existing subtasks
4. Practical, actionable steps

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "name": "Subtask name",
      "reasoning": "Brief explanation of why this subtask is useful",
      "confidence": 0.85,
      "customProperties": {
        "priority": "medium"
      }
    }
  ]
}

Keep subtask names concise and actionable. Confidence should be 0.0 to 1.0.`;
}

/**
 * Generate prompt for suggesting properties
 * @param {Object} task - The task to suggest properties for
 * @param {Array} allPropertyNames - All property names used in the system
 * @returns {string}
 */
function generatePropertySuggestionPrompt(task, allPropertyNames = []) {
  const existingProps = Object.keys(task.customProperties || {});
  const existingPropsInfo = existingProps.length > 0
    ? `\n\nExisting properties on this task:\n${JSON.stringify(task.customProperties, null, 2)}`
    : '\n\nThis task has no custom properties yet.';

  const availablePropsInfo = allPropertyNames.length > 0
    ? `\n\nProperties used elsewhere in the system:\n${allPropertyNames.join(', ')}`
    : '';

  return `You are a task management assistant helping users organize their tasks with useful properties.

Given this task:
"${task.name}"${existingPropsInfo}${availablePropsInfo}

Suggest 1-3 useful properties and values for this task. Consider:
1. What information would help prioritize or categorize this task
2. Common task management properties (priority, dueDate, tags, status, etc.)
3. Context-specific properties based on the task name
4. Avoid duplicating existing properties

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "propertyName": "priority",
      "propertyValue": "high",
      "reasoning": "This appears to be time-sensitive work",
      "confidence": 0.8
    },
    {
      "propertyName": "dueDate",
      "propertyValue": "2024-12-31",
      "reasoning": "Adding a deadline helps with planning",
      "confidence": 0.7
    }
  ]
}

Use standard date format (YYYY-MM-DD) for dates. Confidence should be 0.0 to 1.0.`;
}

/**
 * Generate prompt for suggesting related tasks (siblings, not subtasks)
 * @param {Object} task - The current task
 * @param {Array} siblingTasks - Sibling tasks at the same level
 * @returns {string}
 */
function generateRelatedTaskSuggestionPrompt(task, siblingTasks = []) {
  const siblingsInfo = siblingTasks.length > 0
    ? `\n\nRelated tasks at the same level:\n${siblingTasks.map(t => `- ${t.name}`).join('\n')}`
    : '';

  return `You are a task management assistant helping users identify related work.

Given this task:
"${task.name}"${siblingsInfo}

Suggest 1-2 related tasks that the user might want to track alongside this one. Consider:
1. Complementary work that supports the same goal
2. Tasks that naturally go together
3. Avoiding duplicates with existing tasks
4. Staying relevant to the original task's scope

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "name": "Related task name",
      "reasoning": "Brief explanation of how this relates",
      "confidence": 0.75
    }
  ]
}

Keep task names concise and actionable. Confidence should be 0.0 to 1.0.`;
}

module.exports = {
  generateSubtaskSuggestionPrompt,
  generatePropertySuggestionPrompt,
  generateRelatedTaskSuggestionPrompt
};
