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
}

export default new ApiService();
