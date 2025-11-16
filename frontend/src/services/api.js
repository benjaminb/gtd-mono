const API_BASE = '/api';

class ApiService {
  // User endpoints
  async createUser(userData) {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  }

  async getUser(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  async getUserTasks(userId) {
    const response = await fetch(`${API_BASE}/users/${userId}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  // Task endpoints
  async createTask(taskData) {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  async getTask(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`);
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  }

  async updateTask(taskId, updates) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  async deleteTask(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  async addSubtask(parentId, childId) {
    const response = await fetch(`${API_BASE}/tasks/${parentId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId })
    });
    if (!response.ok) throw new Error('Failed to add subtask');
    return response.json();
  }

  async removeSubtask(parentId, childId) {
    const response = await fetch(`${API_BASE}/tasks/${parentId}/subtasks/${childId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove subtask');
  }

  async getSubtasks(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/subtasks`);
    if (!response.ok) throw new Error('Failed to fetch subtasks');
    return response.json();
  }

  async getParents(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/parents`);
    if (!response.ok) throw new Error('Failed to fetch parents');
    return response.json();
  }

  async getTaskHierarchy(taskId, maxDepth = 10) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/hierarchy?maxDepth=${maxDepth}`);
    if (!response.ok) throw new Error('Failed to fetch hierarchy');
    return response.json();
  }

  async acceptSuggestion(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/accept-suggestion`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to accept suggestion');
    return response.json();
  }

  async rejectSuggestion(taskId) {
    const response = await fetch(`${API_BASE}/tasks/${taskId}/reject-suggestion`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to reject suggestion');
  }

  // Suggestion endpoints
  async getSuggestionsSubtasks(taskId, userId) {
    const response = await fetch(`${API_BASE}/suggestions/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, userId })
    });
    if (!response.ok) throw new Error('Failed to get subtask suggestions');
    return response.json();
  }

  async getSuggestionsProperties(taskId, allPropertyNames = []) {
    const response = await fetch(`${API_BASE}/suggestions/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, allPropertyNames })
    });
    if (!response.ok) throw new Error('Failed to get property suggestions');
    return response.json();
  }

  async getSuggestionsRelatedTasks(taskId, userId) {
    const response = await fetch(`${API_BASE}/suggestions/related-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, userId })
    });
    if (!response.ok) throw new Error('Failed to get related task suggestions');
    return response.json();
  }

  async getSuggestionsStatus() {
    const response = await fetch(`${API_BASE}/suggestions/status`);
    if (!response.ok) throw new Error('Failed to check suggestions status');
    return response.json();
  }

  // Property Schema endpoints
  async createPropertySchema(data) {
    const response = await fetch(`${API_BASE}/property-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create property schema');
    }
    return response.json();
  }

  async getPropertySchema(id) {
    const response = await fetch(`${API_BASE}/property-schemas/${id}`);
    if (!response.ok) throw new Error('Failed to fetch property schema');
    return response.json();
  }

  async getUserPropertySchemas(userId) {
    const response = await fetch(`${API_BASE}/property-schemas/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch property schemas');
    return response.json();
  }

  async updatePropertySchema(id, updates) {
    const response = await fetch(`${API_BASE}/property-schemas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update property schema');
    return response.json();
  }

  async deletePropertySchema(id) {
    const response = await fetch(`${API_BASE}/property-schemas/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete property schema');
  }

  async validatePropertyValue(userId, propertyName, value) {
    const response = await fetch(`${API_BASE}/property-schemas/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, propertyName, value })
    });
    if (!response.ok) throw new Error('Failed to validate property value');
    return response.json();
  }

  // Analytics endpoints
  async getCompletionAnalytics(userId, options = {}) {
    const { startDate, endDate, groupBy, propertyName } = options;
    const params = new URLSearchParams({ userId });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (groupBy) params.append('groupBy', groupBy);
    if (propertyName) params.append('propertyName', propertyName);

    const response = await fetch(`${API_BASE}/analytics/completion?${params}`);
    if (!response.ok) throw new Error('Failed to fetch completion analytics');
    return response.json();
  }

  async getInactiveProjects(userId, options = {}) {
    const { daysSinceUpdate = 30, minSubtasks = 2 } = options;
    const params = new URLSearchParams({
      userId,
      daysSinceUpdate: daysSinceUpdate.toString(),
      minSubtasks: minSubtasks.toString()
    });

    const response = await fetch(`${API_BASE}/analytics/inactive-projects?${params}`);
    if (!response.ok) throw new Error('Failed to fetch inactive projects');
    return response.json();
  }

  async getTimelineAnalytics(userId, options = {}) {
    const { startDate, endDate } = options;
    const params = new URLSearchParams({ userId });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${API_BASE}/analytics/timeline?${params}`);
    if (!response.ok) throw new Error('Failed to fetch timeline analytics');
    return response.json();
  }

  async getPropertyDistribution(userId, propertyName) {
    const params = new URLSearchParams({ userId, propertyName });

    const response = await fetch(`${API_BASE}/analytics/property-distribution?${params}`);
    if (!response.ok) throw new Error('Failed to fetch property distribution');
    return response.json();
  }
}

export default new ApiService();
