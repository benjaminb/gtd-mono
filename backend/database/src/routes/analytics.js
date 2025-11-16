const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const driver = require('../utils/database');
const { filterTasksByExpression } = require('../utils/expressionParser');

/**
 * Get task completion analytics
 * Query params:
 * - userId: required
 * - startDate: optional ISO date string
 * - endDate: optional ISO date string
 * - groupBy: 'parent' | 'property' | 'none'
 * - propertyName: required if groupBy=property
 * - filter: optional boolean expression to filter tasks
 */
router.get('/completion', async (req, res) => {
  try {
    const { userId, startDate, endDate, groupBy, propertyName, filter } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get all user tasks
    let tasks = await Task.findByUserId(userId);

    // Apply time filtering
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      tasks = tasks.filter(t => {
        const taskTime = new Date(t.createdAt).getTime();
        return taskTime >= startDateTime;
      });
    }
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      tasks = tasks.filter(t => {
        const taskTime = new Date(t.createdAt).getTime();
        return taskTime <= endDateTime;
      });
    }

    // Apply expression filter if provided
    if (filter && filter.trim()) {
      try {
        tasks = filterTasksByExpression(tasks, filter);
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid filter expression',
          details: err.message
        });
      }
    }

    // Now aggregate based on groupBy
    let data = [];

    if (groupBy === 'parent') {
      // Group by parent task - need to fetch parent relationships
      const groupMap = new Map();

      for (const task of tasks) {
        const parents = await Task.getParents(task.id);
        const parentKey = parents.length > 0 ? parents[0].id : 'none';
        const parentName = parents.length > 0 ? parents[0].name : 'No Parent';

        if (!groupMap.has(parentKey)) {
          groupMap.set(parentKey, {
            parentName,
            parentId: parentKey,
            totalTasks: 0,
            completedTasks: 0
          });
        }

        const group = groupMap.get(parentKey);
        group.totalTasks++;
        if (task.done) {
          group.completedTasks++;
        }
      }

      data = Array.from(groupMap.values()).map(group => ({
        ...group,
        completionRate: group.totalTasks > 0 ? group.completedTasks / group.totalTasks : 0
      }));

      data.sort((a, b) => b.totalTasks - a.totalTasks);

    } else if (groupBy === 'property' && propertyName) {
      // Group by custom property value
      const groupMap = new Map();

      for (const task of tasks) {
        let propValue = 'Not Set';

        if (task.customProperties) {
          const props = typeof task.customProperties === 'string'
            ? JSON.parse(task.customProperties)
            : task.customProperties;

          if (props[propertyName] !== undefined) {
            propValue = String(props[propertyName]);
          }
        }

        if (!groupMap.has(propValue)) {
          groupMap.set(propValue, {
            groupName: propValue,
            totalTasks: 0,
            completedTasks: 0
          });
        }

        const group = groupMap.get(propValue);
        group.totalTasks++;
        if (task.done) {
          group.completedTasks++;
        }
      }

      data = Array.from(groupMap.values()).map(group => ({
        ...group,
        completionRate: group.totalTasks > 0 ? group.completedTasks / group.totalTasks : 0
      }));

      data.sort((a, b) => b.totalTasks - a.totalTasks);

    } else {
      // No grouping - overall stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.done).length;

      data = [{
        groupName: 'All Tasks',
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? completedTasks / totalTasks : 0
      }];
    }

    res.json({
      data,
      groupBy: groupBy || 'none',
      filtered: !!filter,
      totalTasksBeforeFilter: filter ? (await Task.findByUserId(userId)).length : tasks.length
    });
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
 * - filter: optional boolean expression to filter projects
 */
router.get('/inactive-projects', async (req, res) => {
  try {
    const { userId, daysSinceUpdate = 30, minSubtasks = 2, filter } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get all user tasks
    let allTasks = await Task.findByUserId(userId);

    // Apply expression filter if provided
    if (filter && filter.trim()) {
      try {
        allTasks = filterTasksByExpression(allTasks, filter);
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid filter expression',
          details: err.message
        });
      }
    }

    // Find tasks that are projects (have subtasks)
    const data = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysSinceUpdate));
    const cutoffTime = cutoffDate.getTime();

    for (const task of allTasks) {
      const subtasks = await Task.getSubtasks(task.id);

      if (subtasks.length < parseInt(minSubtasks)) {
        continue; // Not a project
      }

      // Get all descendants to find last activity
      const hierarchy = await Task.getHierarchy(task.id, 10);
      let lastActivity = null;

      const checkActivity = (node) => {
        const nodeTime = new Date(node.updatedAt || node.createdAt).getTime();
        if (!lastActivity || nodeTime > lastActivity) {
          lastActivity = nodeTime;
        }
        if (node.subtasks) {
          node.subtasks.forEach(checkActivity);
        }
      };

      checkActivity(hierarchy);

      // Check if inactive
      if (!lastActivity || lastActivity < cutoffTime) {
        const daysSinceActivity = lastActivity
          ? Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24))
          : null;

        data.push({
          projectId: task.id,
          projectName: task.name,
          subtaskCount: subtasks.length,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
          daysSinceActivity
        });
      }
    }

    // Sort by days since activity
    data.sort((a, b) => {
      if (a.daysSinceActivity === null) return -1;
      if (b.daysSinceActivity === null) return 1;
      return b.daysSinceActivity - a.daysSinceActivity;
    });

    res.json({
      data,
      cutoffDays: parseInt(daysSinceUpdate),
      minSubtasks: parseInt(minSubtasks),
      filtered: !!filter
    });
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
 * - filter: optional boolean expression to filter tasks
 */
router.get('/timeline', async (req, res) => {
  try {
    const { userId, startDate, endDate, filter } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get all user tasks
    let tasks = await Task.findByUserId(userId);

    // Apply time filtering
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      tasks = tasks.filter(t => {
        const taskTime = new Date(t.createdAt).getTime();
        return taskTime >= startDateTime;
      });
    }
    if (endDate) {
      const endDateTime = new Date(endDate).getTime();
      tasks = tasks.filter(t => {
        const taskTime = new Date(t.createdAt).getTime();
        return taskTime <= endDateTime;
      });
    }

    // Apply expression filter if provided
    if (filter && filter.trim()) {
      try {
        tasks = filterTasksByExpression(tasks, filter);
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid filter expression',
          details: err.message
        });
      }
    }

    // Group by day
    const dayMap = new Map();

    tasks.forEach(task => {
      const date = new Date(task.createdAt).toISOString().split('T')[0];

      if (!dayMap.has(date)) {
        dayMap.set(date, {
          date,
          tasksCreated: 0,
          tasksCompleted: 0
        });
      }

      const dayData = dayMap.get(date);
      if (task.done) {
        dayData.tasksCompleted++;
      } else {
        dayData.tasksCreated++;
      }
    });

    const data = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ data, filtered: !!filter });
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
 * - filter: optional boolean expression to filter tasks
 */
router.get('/property-distribution', async (req, res) => {
  try {
    const { userId, propertyName, filter } = req.query;

    if (!userId || !propertyName) {
      return res.status(400).json({ error: 'userId and propertyName are required' });
    }

    // Get all user tasks
    let tasks = await Task.findByUserId(userId);

    // Apply expression filter if provided
    if (filter && filter.trim()) {
      try {
        tasks = filterTasksByExpression(tasks, filter);
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid filter expression',
          details: err.message
        });
      }
    }

    // Group by property value
    const valueMap = new Map();

    tasks.forEach(task => {
      let propValue = 'Not Set';

      if (task.customProperties) {
        const props = typeof task.customProperties === 'string'
          ? JSON.parse(task.customProperties)
          : task.customProperties;

        if (props[propertyName] !== undefined) {
          propValue = String(props[propertyName]);
        }
      }

      if (!valueMap.has(propValue)) {
        valueMap.set(propValue, {
          value: propValue,
          count: 0,
          completedCount: 0
        });
      }

      const valueData = valueMap.get(propValue);
      valueData.count++;
      if (task.done) {
        valueData.completedCount++;
      }
    });

    const data = Array.from(valueMap.values()).sort((a, b) => b.count - a.count);

    res.json({
      data,
      propertyName,
      filtered: !!filter
    });
  } catch (error) {
    console.error('Error getting property distribution:', error);
    res.status(500).json({ error: 'Failed to get property distribution' });
  }
});

module.exports = router;
