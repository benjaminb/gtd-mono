/**
 * Task Service
 *
 * This service provides task management functionality including:
 * - CRUD operations for tasks
 * - Subtask management with cycle detection
 * - One-to-one parent relationship enforcement
 */

const neo4jDriver = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

class TaskService {
  constructor() {
    this.driver = neo4jDriver;
  }

  /**
   * Create a new task
   * @param {Object} params - Task parameters
   * @returns {Promise<Object>} Created task
   */
  async createTask(params) {
    const { userId, name, description = '', done = false } = params;
    const session = this.driver.session();

    try {
      const taskId = uuidv4();
      const now = new Date().toISOString();

      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})
        CREATE (t:Task {
          taskId: $taskId,
          name: $name,
          done: $done
        })
        CREATE (u)-[:HAS_TASK]->(t)

        // Create base fields
        CREATE (notes:TaskField {name: 'notes', value: $description})
        CREATE (createdAt:TaskField {name: 'Created At', value: $now})
        CREATE (lastModified:TaskField {name: 'Last Modified', value: $now})
        CREATE (tags:TaskField {name: 'tags', value: '[]'})

        CREATE (t)-[:HAS_BASE_FIELD]->(notes)
        CREATE (t)-[:HAS_BASE_FIELD]->(createdAt)
        CREATE (t)-[:HAS_BASE_FIELD]->(lastModified)
        CREATE (t)-[:HAS_BASE_FIELD]->(tags)

        RETURN t, notes, createdAt
        `,
        { userId, taskId, name, description, done, now }
      );

      const task = result.records[0].get('t').properties;
      return { success: true, task };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Get a task by ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Task with fields
   */
  async getTask(taskId, userId) {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task {taskId: $taskId})
        OPTIONAL MATCH (t)-[r:HAS_BASE_FIELD|HAS_USER_FIELD|HAS_SUGG_FIELD]->(f:TaskField)
        OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
        RETURN t,
               collect(DISTINCT {type: type(r), field: f}) as fields,
               collect(DISTINCT st) as subtasks
        `,
        { taskId, userId }
      );

      if (result.records.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const record = result.records[0];
      const task = record.get('t').properties;
      const fields = record.get('fields').filter(f => f.field !== null);
      const subtasks = record.get('subtasks').filter(st => st !== null).map(st => st.properties);

      return { success: true, task, fields, subtasks };
    } catch (error) {
      console.error('Error getting task:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Get all tasks for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of tasks
   */
  async getUserTasks(userId) {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task)
        OPTIONAL MATCH (t)-[:HAS_BASE_FIELD|HAS_USER_FIELD]->(f:TaskField)
        OPTIONAL MATCH (t)-[:HAS_SUBTASK]->(st:Task)
        RETURN t,
               collect(DISTINCT f) as fields,
               count(DISTINCT st) as subtaskCount
        ORDER BY t.name
        `,
        { userId }
      );

      const tasks = result.records.map(record => ({
        ...record.get('t').properties,
        fields: record.get('fields').map(f => f.properties),
        subtaskCount: record.get('subtaskCount').toNumber(),
      }));

      return { success: true, tasks };
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Update a task
   * @param {Object} params - Update parameters
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(params) {
    const { taskId, userId, name, done } = params;
    const session = this.driver.session();

    try {
      const now = new Date().toISOString();

      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task {taskId: $taskId})
        SET t.name = COALESCE($name, t.name),
            t.done = COALESCE($done, t.done)

        WITH t
        MATCH (t)-[:HAS_BASE_FIELD]->(lm:TaskField {name: 'Last Modified'})
        SET lm.value = $now

        RETURN t
        `,
        { taskId, userId, name, done, now }
      );

      if (result.records.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const task = result.records[0].get('t').properties;
      return { success: true, task };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Delete a task
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Result
   */
  async deleteTask(taskId, userId) {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(t:Task {taskId: $taskId})
        OPTIONAL MATCH (t)-[r]-()
        DELETE r, t
        RETURN count(t) as deleted
        `,
        { taskId, userId }
      );

      const deleted = result.records[0].get('deleted').toNumber();
      if (deleted === 0) {
        return { success: false, error: 'Task not found' };
      }

      return { success: true, message: 'Task deleted successfully' };
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Check if creating a subtask relationship would create a cycle
   * @param {string} parentId - Parent task ID
   * @param {string} childId - Child task ID
   * @returns {Promise<boolean>} True if cycle would be created
   */
  async wouldCreateCycle(parentId, childId) {
    const session = this.driver.session();

    try {
      // Check if childId is an ancestor of parentId
      // If it is, adding parentId->childId would create a cycle
      const result = await session.run(
        `
        MATCH (parent:Task {taskId: $parentId})
        MATCH (child:Task {taskId: $childId})

        // Check if child is already an ancestor of parent
        OPTIONAL MATCH path = (child)-[:HAS_SUBTASK*]->(parent)

        // Also prevent self-reference
        RETURN
          CASE
            WHEN $parentId = $childId THEN true
            WHEN path IS NOT NULL THEN true
            ELSE false
          END as wouldCycle
        `,
        { parentId, childId }
      );

      if (result.records.length === 0) {
        return false;
      }

      return result.records[0].get('wouldCycle');
    } catch (error) {
      console.error('Error checking for cycles:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Make an existing task a subtask of another task
   * Enforces one-to-one parent relationship and prevents cycles
   * @param {Object} params - Parameters
   * @returns {Promise<Object>} Result
   */
  async makeSubtask(params) {
    const { parentId, childId, userId } = params;
    const session = this.driver.session();

    try {
      // First, verify both tasks belong to the user
      const verifyResult = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(parent:Task {taskId: $parentId})
        MATCH (u)-[:HAS_TASK]->(child:Task {taskId: $childId})
        RETURN count(*) as verified
        `,
        { userId, parentId, childId }
      );

      if (verifyResult.records[0].get('verified').toNumber() !== 2) {
        return {
          success: false,
          error: 'One or both tasks not found or do not belong to user'
        };
      }

      // Check for cycles
      const wouldCycle = await this.wouldCreateCycle(parentId, childId);
      if (wouldCycle) {
        return {
          success: false,
          error: 'Cannot create subtask relationship: would create a cycle',
          details: 'The child task is already a parent or ancestor of the target parent task',
        };
      }

      // Remove any existing parent relationship (one-to-one enforcement)
      // and create new relationship
      const result = await session.run(
        `
        MATCH (parent:Task {taskId: $parentId})
        MATCH (child:Task {taskId: $childId})

        // Remove existing parent relationship if any
        OPTIONAL MATCH (oldParent:Task)-[oldRel:HAS_SUBTASK]->(child)
        DELETE oldRel

        // Create new parent relationship
        CREATE (parent)-[r:HAS_SUBTASK]->(child)

        RETURN parent, child, oldParent
        `,
        { parentId, childId }
      );

      const record = result.records[0];
      const oldParent = record.get('oldParent');

      return {
        success: true,
        message: 'Subtask relationship created successfully',
        hadPreviousParent: oldParent !== null,
        parent: record.get('parent').properties,
        child: record.get('child').properties,
      };
    } catch (error) {
      console.error('Error making subtask:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Remove subtask relationship (make task independent)
   * @param {Object} params - Parameters
   * @returns {Promise<Object>} Result
   */
  async removeSubtaskRelationship(params) {
    const { childId, userId } = params;
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(child:Task {taskId: $childId})
        OPTIONAL MATCH (parent:Task)-[r:HAS_SUBTASK]->(child)
        DELETE r
        RETURN count(r) as removed, parent
        `,
        { userId, childId }
      );

      const removed = result.records[0].get('removed').toNumber();

      if (removed === 0) {
        return {
          success: true,
          message: 'Task was already independent (no parent relationship)'
        };
      }

      return {
        success: true,
        message: 'Subtask relationship removed successfully',
        removedFrom: result.records[0].get('parent')?.properties,
      };
    } catch (error) {
      console.error('Error removing subtask relationship:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }

  /**
   * Get parent task of a subtask
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Parent task or null
   */
  async getParentTask(taskId, userId) {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (u:User {userId: $userId})-[:HAS_TASK]->(child:Task {taskId: $taskId})
        OPTIONAL MATCH (parent:Task)-[:HAS_SUBTASK]->(child)
        RETURN parent
        `,
        { taskId, userId }
      );

      if (result.records.length === 0) {
        return { success: false, error: 'Task not found' };
      }

      const parent = result.records[0].get('parent');

      return {
        success: true,
        parent: parent ? parent.properties : null,
      };
    } catch (error) {
      console.error('Error getting parent task:', error);
      return { success: false, error: error.message };
    } finally {
      await session.close();
    }
  }
}

module.exports = new TaskService();
