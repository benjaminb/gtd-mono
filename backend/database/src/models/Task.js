const { v4: uuidv4 } = require('uuid');
const driver = require('../utils/database');

class Task {
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.userId - Owner user ID
   * @param {string} taskData.name - Task name
   * @param {boolean} [taskData.done=false] - Task completion status
   * @param {Object} [taskData.customProperties={}] - Custom user-defined properties
   * @returns {Promise<Object>} Created task
   */
  static async create({ userId, name, done = false, customProperties = {} }) {
    const session = driver.session();
    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const updatedAt = createdAt;

      const result = await session.run(
        `MATCH (u:User {id: $userId})
         CREATE (t:Task {
           id: $id,
           name: $name,
           done: $done,
           createdAt: $createdAt,
           updatedAt: $updatedAt,
           customProperties: $customProperties
         })
         CREATE (u)-[:OWNS]->(t)
         RETURN t`,
        { userId, id, name, done, createdAt, updatedAt, customProperties: JSON.stringify(customProperties) }
      );

      const task = result.records[0].get('t').properties;
      task.customProperties = JSON.parse(task.customProperties || '{}');
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
    const session = driver.session();
    try {
      const allowedFields = ['name', 'done', 'customProperties'];
      const setClause = ['t.updatedAt = $updatedAt'];
      const params = {
        id,
        updatedAt: new Date().toISOString()
      };

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          setClause.push(`t.${key} = $${key}`);
          if (key === 'customProperties') {
            params[key] = JSON.stringify(updates[key]);
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

      const subtasks = result.records[0].get('subtasks').map(node => {
        const t = node.properties;
        t.customProperties = JSON.parse(t.customProperties || '{}');
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
}

module.exports = Task;
