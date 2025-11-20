export interface Task {
  taskId: string;
  name: string;
  done: boolean;
  fields?: TaskField[];
  subtasks?: Task[];
  subtaskCount?: number;
}

export interface TaskField {
  type: 'HAS_BASE_FIELD' | 'HAS_USER_FIELD' | 'HAS_SUGG_FIELD';
  field: {
    properties: {
      name: string;
      value: string;
    };
  };
}

export interface TaskFieldSuggestion {
  name: string;
  type: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SubtaskSuggestion {
  name: string;
  description: string;
  estimatedTime: string;
  order: number;
}

export interface SearchResult {
  type: 'task' | 'property' | 'view' | 'create';
  id?: string;
  title: string;
  subtitle?: string;
  data?: any;
  score?: number;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  done?: boolean;
}

export interface UpdateTaskRequest {
  name?: string;
  done?: boolean;
}

export interface MakeSubtaskRequest {
  parentId: string;
}
