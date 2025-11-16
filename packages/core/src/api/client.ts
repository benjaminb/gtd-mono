import type { Task, User, PropertySchema, CreateTaskInput, UpdateTaskInput } from '../types';

export class ApiClient {
  constructor(private baseURL: string) {}

  // ============================================
  // Task endpoints
  // ============================================

  async createTask(data: CreateTaskInput): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  async getTask(taskId: string): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`);
    if (!response.ok) throw new Error('Failed to fetch task');
    return response.json();
  }

  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/users/${userId}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}/subtasks`);
    if (!response.ok) throw new Error('Failed to fetch subtasks');
    return response.json();
  }

  async getParents(taskId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/tasks/${taskId}/parents`);
    if (!response.ok) throw new Error('Failed to fetch parents');
    return response.json();
  }

  async addSubtask(parentId: string, childId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/tasks/${parentId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId }),
    });
    if (!response.ok) throw new Error('Failed to add subtask');
  }

  async removeSubtask(parentId: string, childId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/tasks/${parentId}/subtasks/${childId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to remove subtask');
  }

  // ============================================
  // Time tracking endpoints
  // ============================================

  async startTimeTracking(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/start`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to start time tracking');
    return response.json();
  }

  async stopTimeTracking(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/stop`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to stop time tracking');
    return response.json();
  }

  async getTimeTrackingSummary(taskId: string): Promise<any> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/time-tracking/summary`
    );
    if (!response.ok) throw new Error('Failed to get time tracking summary');
    return response.json();
  }

  // ============================================
  // AI Suggestion endpoints
  // ============================================

  async acceptSuggestion(taskId: string): Promise<Task> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/accept-suggestion`,
      { method: 'POST' }
    );
    if (!response.ok) throw new Error('Failed to accept suggestion');
    return response.json();
  }

  async rejectSuggestion(taskId: string): Promise<void> {
    const response = await fetch(
      `${this.baseURL}/tasks/${taskId}/reject-suggestion`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to reject suggestion');
  }

  async getSuggestionsSubtasks(taskId: string, userId: string): Promise<Task[]> {
    const response = await fetch(`${this.baseURL}/suggestions/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, userId }),
    });
    if (!response.ok) throw new Error('Failed to get subtask suggestions');
    return response.json();
  }

  async getSuggestionsProperties(
    taskId: string,
    allPropertyNames: string[] = []
  ): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/suggestions/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, allPropertyNames }),
    });
    if (!response.ok) throw new Error('Failed to get property suggestions');
    return response.json();
  }

  async convertNaturalLanguageToExpression(
    query: string,
    userId: string
  ): Promise<{ expression: string; explanation: string; confidence: number }> {
    const response = await fetch(`${this.baseURL}/suggestions/convert-to-expression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ naturalLanguage: query, userId }),
    });
    if (!response.ok) throw new Error('Failed to convert expression');
    return response.json();
  }

  // ============================================
  // Property Schema endpoints
  // ============================================

  async getPropertySchemas(userId: string): Promise<PropertySchema[]> {
    const response = await fetch(`${this.baseURL}/property-schemas/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch schemas');
    return response.json();
  }

  async createPropertySchema(data: Partial<PropertySchema>): Promise<PropertySchema> {
    const response = await fetch(`${this.baseURL}/property-schemas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create schema');
    return response.json();
  }

  // ============================================
  // User endpoints
  // ============================================

  async login(email: string, password: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  }

  async getUser(userId: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }

  // ============================================
  // Search endpoints
  // ============================================

  async searchTasks(
    userId: string,
    expression: string
  ): Promise<{ totalTasks: number; matchingTasks: number; tasks: Task[] }> {
    const response = await fetch(`${this.baseURL}/tasks/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, expression }),
    });
    if (!response.ok) throw new Error('Failed to search tasks');
    return response.json();
  }

  // ============================================
  // Analytics endpoints
  // ============================================

  async getCompletionAnalytics(
    userId: string,
    options: {
      startDate?: string;
      endDate?: string;
      groupBy?: string;
      propertyName?: string;
      filter?: string;
    } = {}
  ): Promise<{ data: any[]; filtered: boolean }> {
    const { startDate, endDate, groupBy, propertyName, filter } = options;
    const params = new URLSearchParams({ userId });

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (groupBy) params.append('groupBy', groupBy);
    if (propertyName) params.append('propertyName', propertyName);
    if (filter) params.append('filter', filter);

    const response = await fetch(`${this.baseURL}/analytics/completion?${params}`);
    if (!response.ok) throw new Error('Failed to fetch completion analytics');
    return response.json();
  }
}
