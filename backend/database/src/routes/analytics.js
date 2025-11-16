const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const driver = require('../utils/database');

/**
 * Get task completion analytics
 * Query params:
 * - userId: required
 * - startDate: optional ISO date string
 * - endDate: optional ISO date string
 * - groupBy: 'parent' | 'property' | 'none'
 * - propertyName: required if groupBy=property
 */
router.get('/completion', async (req, res) => {
  try {
    const { userId, startDate, endDate, groupBy, propertyName } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = driver.session();

    try {
      let query;
      let params = { userId };

      // Build time filter
      let timeFilter = '';
      if (startDate) {
        timeFilter += ' AND t.createdAt >= $startDate';
        params.startDate = startDate;
      }
      if (endDate) {
        timeFilter += ' AND t.createdAt <= $endDate';
        params.endDate = endDate;
      }

      if (groupBy === 'parent') {
        // Group by parent task
        query = `
          MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
          WHERE 1=1 ${timeFilter}
          OPTIONAL MATCH (parent:Task)-[:HAS_SUBTASK]->(t)
          WITH
            COALESCE(parent.name, 'No Parent') as parentName,
            COALESCE(parent.id, 'none') as parentId,
            COUNT(t) as totalTasks,
            SUM(CASE WHEN t.done = true THEN 1 ELSE 0 END) as completedTasks
          RETURN
            parentName,
            parentId,
            totalTasks,
            completedTasks,
            toFloat(completedTasks) / totalTasks as completionRate
          ORDER BY totalTasks DESC
        `;
      } else if (groupBy === 'property' && propertyName) {
        // Group by custom property value
        params.propertyName = propertyName;
        query = `
          MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
          WHERE 1=1 ${timeFilter}
          AND t.customProperties IS NOT NULL
          WITH t,
            CASE
              WHEN t.customProperties CONTAINS $propertyName
              THEN apoc.convert.fromJsonMap(t.customProperties)[$propertyName]
              ELSE 'Not Set'
            END as propValue
          WITH
            toString(propValue) as groupName,
            COUNT(t) as totalTasks,
            SUM(CASE WHEN t.done = true THEN 1 ELSE 0 END) as completedTasks
          RETURN
            groupName,
            totalTasks,
            completedTasks,
            toFloat(completedTasks) / totalTasks as completionRate
          ORDER BY totalTasks DESC
        `;
      } else {
        // No grouping - overall stats
        query = `
          MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
          WHERE 1=1 ${timeFilter}
          RETURN
            'All Tasks' as groupName,
            COUNT(t) as totalTasks,
            SUM(CASE WHEN t.done = true THEN 1 ELSE 0 END) as completedTasks,
            toFloat(SUM(CASE WHEN t.done = true THEN 1 ELSE 0 END)) / COUNT(t) as completionRate
        `;
      }

      const result = await session.run(query, params);

      const data = result.records.map(record => {
        const obj = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });

      res.json({ data, groupBy: groupBy || 'none' });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error getting completion analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * Get inactive projects (tasks with no recent activity)
 * Query params:
 * - userId: required
 * - daysSinceUpdate: number of days (default 30)
 * - minSubtasks: minimum number of subtasks to be considered a project (default 2)
 */
router.get('/inactive-projects', async (req, res) => {
  try {
    const { userId, daysSinceUpdate = 30, minSubtasks = 2 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = driver.session();

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysSinceUpdate));
      const cutoffISO = cutoffDate.toISOString();

      const query = `
        MATCH (u:User {id: $userId})-[:OWNS]->(project:Task)
        WHERE (project)-[:HAS_SUBTASK]->(:Task)
        WITH project,
          SIZE((project)-[:HAS_SUBTASK]->(:Task)) as subtaskCount
        WHERE subtaskCount >= $minSubtasks

        OPTIONAL MATCH (project)-[:HAS_SUBTASK*]->(descendant:Task)
        WITH project, subtaskCount,
          MAX(COALESCE(descendant.updatedAt, descendant.createdAt)) as lastActivity

        WHERE lastActivity < $cutoffDate OR lastActivity IS NULL

        RETURN
          project.id as projectId,
          project.name as projectName,
          subtaskCount,
          lastActivity,
          duration.between(
            datetime(lastActivity),
            datetime()
          ).days as daysSinceActivity
        ORDER BY daysSinceActivity DESC
      `;

      const result = await session.run(query, {
        userId,
        minSubtasks: parseInt(minSubtasks),
        cutoffDate: cutoffISO
      });

      const data = result.records.map(record => ({
        projectId: record.get('projectId'),
        projectName: record.get('projectName'),
        subtaskCount: record.get('subtaskCount').toNumber(),
        lastActivity: record.get('lastActivity'),
        daysSinceActivity: record.get('daysSinceActivity')
          ? record.get('daysSinceActivity').toNumber()
          : null
      }));

      res.json({
        data,
        cutoffDays: parseInt(daysSinceUpdate),
        minSubtasks: parseInt(minSubtasks)
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error getting inactive projects:', error);
    res.status(500).json({ error: 'Failed to get inactive projects' });
  }
});

/**
 * Get task activity timeline
 * Returns count of tasks created/completed per day
 * Query params:
 * - userId: required
 * - startDate: optional ISO date string
 * - endDate: optional ISO date string
 */
router.get('/timeline', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const session = driver.session();

    try {
      let params = { userId };
      let timeFilter = '';

      if (startDate) {
        timeFilter += ' AND t.createdAt >= $startDate';
        params.startDate = startDate;
      }
      if (endDate) {
        timeFilter += ' AND t.createdAt <= $endDate';
        params.endDate = endDate;
      }

      const query = `
        MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
        WHERE 1=1 ${timeFilter}
        WITH
          date(datetime(t.createdAt)) as day,
          t.done as done
        RETURN
          toString(day) as date,
          COUNT(CASE WHEN done = false THEN 1 END) as tasksCreated,
          COUNT(CASE WHEN done = true THEN 1 END) as tasksCompleted
        ORDER BY day ASC
      `;

      const result = await session.run(query, params);

      const data = result.records.map(record => ({
        date: record.get('date'),
        tasksCreated: record.get('tasksCreated').toNumber(),
        tasksCompleted: record.get('tasksCompleted').toNumber()
      }));

      res.json({ data });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error getting timeline analytics:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

/**
 * Get property value distribution
 * Query params:
 * - userId: required
 * - propertyName: required
 */
router.get('/property-distribution', async (req, res) => {
  try {
    const { userId, propertyName } = req.query;

    if (!userId || !propertyName) {
      return res.status(400).json({ error: 'userId and propertyName are required' });
    }

    const session = driver.session();

    try {
      const query = `
        MATCH (u:User {id: $userId})-[:OWNS]->(t:Task)
        WHERE t.customProperties IS NOT NULL
        AND t.customProperties CONTAINS $propertyName
        WITH t,
          apoc.convert.fromJsonMap(t.customProperties)[$propertyName] as propValue
        RETURN
          toString(propValue) as value,
          COUNT(t) as count,
          SUM(CASE WHEN t.done = true THEN 1 ELSE 0 END) as completedCount
        ORDER BY count DESC
      `;

      const result = await session.run(query, { userId, propertyName });

      const data = result.records.map(record => ({
        value: record.get('value'),
        count: record.get('count').toNumber(),
        completedCount: record.get('completedCount').toNumber()
      }));

      res.json({
        data,
        propertyName
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error getting property distribution:', error);
    res.status(500).json({ error: 'Failed to get property distribution' });
  }
});

module.exports = router;
