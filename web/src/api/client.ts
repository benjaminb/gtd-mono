import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  MakeSubtaskRequest,
  TaskFieldSuggestion,
  SubtaskSuggestion,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mock user ID for development (TODO: implement real authentication)
const MOCK_USER_ID = 'dev-user-123';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Request failed',
      }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Tasks
  async getTasks(): Promise<{ tasks: Task[] }> {
    return this.request('/api/tasks', {
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request(`/api/tasks/${taskId}`, {
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  async createTask(data: CreateTaskRequest): Promise<{ success: boolean; task: Task }> {
    return this.request('/api/tasks', {
      method: 'POST',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
      body: JSON.stringify(data),
    });
  }

  async updateTask(
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<{ success: boolean; task: Task }> {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  // Subtasks
  async makeSubtask(
    childId: string,
    data: MakeSubtaskRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/tasks/${childId}/make-subtask`, {
      method: 'POST',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
      body: JSON.stringify(data),
    });
  }

  async removeSubtaskRelationship(
    taskId: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/tasks/${taskId}/subtask-relationship`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  async getParentTask(
    taskId: string
  ): Promise<{ success: boolean; parent: Task | null }> {
    return this.request(`/api/tasks/${taskId}/parent`, {
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  // AI Features
  async suggestFields(
    taskId: string
  ): Promise<{ success: boolean; suggestions: TaskFieldSuggestion[] }> {
    return this.request(`/api/tasks/${taskId}/suggest-fields`, {
      method: 'POST',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  async suggestSubtasks(
    taskId: string
  ): Promise<{ success: boolean; subtasks: SubtaskSuggestion[] }> {
    return this.request(`/api/tasks/${taskId}/suggest-subtasks`, {
      method: 'POST',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }

  async getInsights(): Promise<{
    success: boolean;
    insights: any[];
    summary: any;
  }> {
    return this.request('/api/tasks/insights', {
      method: 'POST',
      headers: {
        'X-User-ID': MOCK_USER_ID,
      },
    });
  }
}

export const apiClient = new ApiClient();
