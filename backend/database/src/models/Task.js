const { v4: uuidv4 } = require('uuid');
const driver = require('../utils/database');
const PropertySchema = require('./PropertySchema');

class Task {
  /**
   * Validate custom properties against user's property schemas
   * @param {string} userId - User ID
   * @param {Object} customProperties - Custom properties to validate
   * @returns {Promise<Object>} { valid: boolean, errors: Object, normalized: Object }
   */
  static async validateCustomProperties(userId, customProperties) {
    const errors = {};
    const normalized = {};

    if (!customProperties || Object.keys(customProperties).length === 0) {
      return { valid: true, errors: {}, normalized: {} };
    }

    // Get all property schemas for this user
    const schemas = await PropertySchema.getUserSchemas(userId);
    const schemaMap = {};
    schemas.forEach(schema => {
      schemaMap[schema.propertyName] = schema;
    });

    // Validate each property
    for (const [propName, propValue] of Object.entries(customProperties)) {
      const schema = schemaMap[propName];

      if (!schema) {
        // No schema defined - default to text, allow any value
        normalized[propName] = propValue;
        continue;
      }

      const validation = PropertySchema.validateValue(schema, propValue);
      if (!validation.valid) {
        errors[propName] = validation.error;
      } else {
        // Use normalized value if provided, otherwise use original
        normalized[propName] = validation.value !== undefined ? validation.value : propValue;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      normalized
    };
  }
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.userId - Owner user ID
   * @param {string} taskData.name - Task name
   * @param {boolean} [taskData.done=false] - Task completion status
   * @param {string} [taskData.emoji=null] - Task emoji icon
   * @param {string} [taskData.source='user'] - Source: 'user', 'ai-suggested', 'ai-accepted'
   * @param {Object} [taskData.suggestionMetadata] - Metadata for AI suggestions
   * @param {Object} [taskData.customProperties={}] - Custom user-defined properties
   * @param {Object} [taskData.timeTracking] - Time tracking data
   * @returns {Promise<Object>} Created task
   */
  static async create({ userId, name, done = false, emoji = null, source = 'user', suggestionMetadata = null, customProperties = {}, timeTracking = null }) {
    // Validate custom properties against schemas
    const validation = await Task.validateCustomProperties(userId, customProperties);
    if (!validation.valid) {
      throw new Error(`Invalid custom properties: ${JSON.stringify(validation.errors)}`);
    }

    const session = driver.session();
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;

      // Initialize default time tracking structure if not provided
      const defaultTimeTracking = {
        totalSeconds: 0,
        sessions: [],
        currentSessionStart: null
      };

      const result = await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (t:Task {
           id: $id,
           name: $name,
           done: $done,
           emoji: $emoji,
           source: $source,
           suggestionMetadata: $suggestionMetadata,
           timeTracking: $timeTracking,
           createdAt: $createdAt,
           updatedAt: $updatedAt,
           customProperties: $customProperties
         })
         CREATE (u)-[:OWNS]->(t)
         RETURN t`,
        {
          userId,
          id,
          name,
          done,
          emoji,
          source,
          suggestionMetadata: suggestionMetadata ? JSON.stringify(suggestionMetadata) : null,
          timeTracking: JSON.stringify(timeTracking || defaultTimeTracking),
          createdAt,
          updatedAt,
          customProperties: JSON.stringify(validation.normalized)
        }
      );

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
      task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
      task.timeTracking = JSON.parse(task.timeTracking || JSON.stringify(defaultTimeTracking));
      return task;
    } finally {
      await session.close();
    }
  }

  /**
   * Find task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Task object or null
   */
  static async findById(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (t:Task {id: $id}) RETURN t',
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
      task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
      task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
      // Ensure source field exists (for backward compatibility)
      task.source = task.source || 'user';
      return task;
    } finally {
      await session.close();
    }
  }

  /**
   * Update task
   * @param {string} id - Task ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated task or null
   */
  static async update(id, updates) {
    // Validate custom properties if being updated
    if (updates.customProperties) {
      // Get task to find userId
      const existingTask = await Task.findById(id);
      if (!existingTask) {
        return null;
      }

      // Get owner
      const owner = await Task.getOwner(id);
      if (!owner) {
        throw new Error('Task owner not found');
      }

      const validation = await Task.validateCustomProperties(owner.id, updates.customProperties);
      if (!validation.valid) {
        throw new Error(`Invalid custom properties: ${JSON.stringify(validation.errors)}`);
      }

      // Use normalized values
      updates.customProperties = validation.normalized;
    }

    const session = driver.session();
    try {
      const allowedFields = ['name', 'done', 'emoji', 'source', 'suggestionMetadata', 'customProperties', 'timeTracking'];
      const setClause = ['t.updatedAt = $updatedAt'];
      const params = {
        id,
        updatedAt: new Date().toISOString()
      };

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          setClause.push(`t.${key} = $${key}`);
          if (key === 'customProperties' || key === 'suggestionMetadata' || key === 'timeTracking') {
            params[key] = updates[key] ? JSON.stringify(updates[key]) : null;
          } else {
            params[key] = updates[key];
          }
        }
      });

      const result = await session.run(
        `MATCH (t:Task {id: $id})
         SET ${setClause.join(', ')}
         RETURN t`,
        params
      );

      if (result.records.length === 0) {
        return null;
      }

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
      task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
      task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
      task.source = task.source || 'user';
      return task;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const session = driver.session();
    try {
      await session.run(
        'MATCH (t:Task {id: $id}) DETACH DELETE t',
        { id }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Add a subtask relationship
   * @param {string} parentId - Parent task ID
   * @param {string} childId - Child task ID
   * @returns {Promise<Object>} Object with parent and child tasks
   */
  static async addSubtask(parentId, childId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (parent:Task {id: $parentId})
         MATCH (child:Task {id: $childId})
         MERGE (parent)-[r:HAS_SUBTASK]->(child)
         RETURN parent, child`,
        { parentId, childId }
      );

      if (result.records.length === 0) {
        return null;
      }

      const parent = result.records[0].get('parent').properties;
      const child = result.records[0].get('child').properties;
      parent.customProperties = JSON.parse(parent.customProperties || '{}');
      child.customProperties = JSON.parse(child.customProperties || '{}');

      return { parent, child };
    } finally {
      await session.close();
    }
  }

  /**
   * Remove a subtask relationship
   * @param {string} parentId - Parent task ID
   * @param {string} childId - Child task ID
   * @returns {Promise<boolean>} True if removed
   */
  static async removeSubtask(parentId, childId) {
    const session = driver.session();
    try {
      await session.run(
        `MATCH (parent:Task {id: $parentId})-[r:HAS_SUBTASK]->(child:Task {id: $childId})
         DELETE r`,
        { parentId, childId }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all subtasks of a task
   * @param {string} id - Task ID
   * @returns {Promise<Array>} Array of subtasks
   */
  static async getSubtasks(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (t:Task {id: $id})-[:HAS_SUBTASK]->(subtask:Task)
         RETURN subtask
         ORDER BY subtask.createdAt DESC`,
        { id }
      );

      return result.records.map(record => {
        const task = record.get('subtask').properties;
        task.customProperties = JSON.parse(task.customProperties || '{}');
        task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
        task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
        task.source = task.source || 'user';
        return task;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get all parent tasks of a task
   * @param {string} id - Task ID
   * @returns {Promise<Array>} Array of parent tasks
   */
  static async getParents(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (parent:Task)-[:HAS_SUBTASK]->(t:Task {id: $id})
         RETURN parent
         ORDER BY parent.createdAt DESC`,
        { id }
      );

      return result.records.map(record => {
        const task = record.get('parent').properties;
        task.customProperties = JSON.parse(task.customProperties || '{}');
        task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
        task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
        task.source = task.source || 'user';
        return task;
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Get the task hierarchy (subtasks recursively)
   * @param {string} id - Task ID
   * @param {number} [maxDepth=10] - Maximum depth to traverse
   * @returns {Promise<Object>} Task with nested subtasks
   */
  static async getHierarchy(id, maxDepth = 10) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH path = (t:Task {id: $id})-[:HAS_SUBTASK*0..${maxDepth}]->(subtask:Task)
         WITH t, subtask, relationships(path) as rels
         RETURN t, collect(DISTINCT subtask) as subtasks, collect(DISTINCT rels) as relationships`,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
      task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
      task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
      task.source = task.source || 'user';

      const subtasks = result.records[0].get('subtasks').map(node => {
        const t = node.properties;
        t.customProperties = JSON.parse(t.customProperties || '{}');
        t.suggestionMetadata = t.suggestionMetadata ? JSON.parse(t.suggestionMetadata) : null;
        t.timeTracking = t.timeTracking ? JSON.parse(t.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
        t.source = t.source || 'user';
        return t;
      });

      // Build hierarchy structure
      task.subtasks = subtasks.filter(st => st.id !== task.id);

      return task;
    } finally {
      await session.close();
    }
  }

  /**
   * Get the owner of a task
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async getOwner(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User)-[:OWNS]->(t:Task {id: $id})
         RETURN u`,
        { id }
      );

      if (result.records.length === 0) {
        return null;
      }

      const user = result.records[0].get('u').properties;
      delete user.passwordHash;
      return user;
    } finally {
      await session.close();
    }
  }

  /**
   * Check if task belongs to user
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user owns the task
   */
  static async belongsToUser(taskId, userId) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (u:User {id: $userId})-[:OWNS]->(t:Task {id: $taskId})
         RETURN t`,
        { taskId, userId }
      );

      return result.records.length > 0;
    } finally {
      await session.close();
    }
  }

  /**
   * Accept an AI suggestion - converts from 'ai-suggested' to 'ai-accepted'
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Updated task or null
   */
  static async acceptSuggestion(id) {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (t:Task {id: $id})
         WHERE t.source = 'ai-suggested'
         SET t.source = 'ai-accepted',
             t.updatedAt = $updatedAt,
             t.suggestionMetadata = $suggestionMetadata
         RETURN t`,
        {
          id,
          updatedAt: new Date().toISOString(),
          suggestionMetadata: JSON.stringify({
            ...JSON.parse(result.records[0]?.get('t')?.properties?.suggestionMetadata || '{}'),
            acceptedAt: new Date().toISOString()
          })
        }
      );

      if (result.records.length === 0) {
        return null;
      }

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
      task.suggestionMetadata = task.suggestionMetadata ? JSON.parse(task.suggestionMetadata) : null;
      task.timeTracking = task.timeTracking ? JSON.parse(task.timeTracking) : { totalSeconds: 0, sessions: [], currentSessionStart: null };
      task.source = task.source || 'user';
      return task;
    } finally {
      await session.close();
    }
  }

  /**
   * Reject an AI suggestion - deletes the suggested task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async rejectSuggestion(id) {
    const session = driver.session();
    try {
      await session.run(
        `MATCH (t:Task {id: $id})
         WHERE t.source = 'ai-suggested'
         DETACH DELETE t`,
        { id }
      );
      return true;
    } finally {
      await session.close();
    }
  }

  /**
   * Start time tracking for a task
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Updated task or null
   */
  static async startTimeTracking(id) {
    const task = await Task.findById(id);
    if (!task) {
      return null;
    }

    const timeTracking = task.timeTracking || { totalSeconds: 0, sessions: [], currentSessionStart: null };

    // If already tracking, don't start again
    if (timeTracking.currentSessionStart) {
      return task;
    }

    // Start new session
    timeTracking.currentSessionStart = new Date().toISOString();

    return await Task.update(id, { timeTracking });
  }

  /**
   * Stop time tracking for a task
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Updated task or null
   */
  static async stopTimeTracking(id) {
    const task = await Task.findById(id);
    if (!task) {
      return null;
    }

    const timeTracking = task.timeTracking || { totalSeconds: 0, sessions: [], currentSessionStart: null };

    // If not currently tracking, nothing to stop
    if (!timeTracking.currentSessionStart) {
      return task;
    }

    // Calculate session duration
    const startTime = new Date(timeTracking.currentSessionStart);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime - startTime) / 1000);

    // Add completed session
    timeTracking.sessions.push({
      startTime: timeTracking.currentSessionStart,
      endTime: endTime.toISOString(),
      durationSeconds: durationSeconds
    });

    // Update total
    timeTracking.totalSeconds += durationSeconds;

    // Clear current session
    timeTracking.currentSessionStart = null;

    return await Task.update(id, { timeTracking });
  }

  /**
   * Get time tracking summary for a task
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Time tracking summary or null
   */
  static async getTimeTrackingSummary(id) {
    const task = await Task.findById(id);
    if (!task) {
      return null;
    }

    const timeTracking = task.timeTracking || { totalSeconds: 0, sessions: [], currentSessionStart: null };

    let currentSessionSeconds = 0;
    if (timeTracking.currentSessionStart) {
      const startTime = new Date(timeTracking.currentSessionStart);
      const now = new Date();
      currentSessionSeconds = Math.floor((now - startTime) / 1000);
    }

    return {
      totalSeconds: timeTracking.totalSeconds + currentSessionSeconds,
      sessionsCount: timeTracking.sessions.length,
      isTracking: !!timeTracking.currentSessionStart,
      currentSessionSeconds: currentSessionSeconds,
      sessions: timeTracking.sessions
    };
  }
}

module.exports = Task;
