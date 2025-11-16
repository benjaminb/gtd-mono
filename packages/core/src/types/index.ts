export interface Task {
  id: string;
  name: string;
  done: boolean;
  emoji: string | null;
  source: 'user' | 'ai-suggested' | 'ai-accepted';
  customProperties: Record<string, any>;
  timeTracking: TimeTracking;
  suggestionMetadata?: SuggestionMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTracking {
  totalSeconds: number;
  sessions: TimeSession[];
  currentSessionStart: string | null;
}

export interface TimeSession {
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export interface SuggestionMetadata {
  generatedBy: string;
  generatedAt: string;
  confidence: number;
  reasoning: string;
  type: string;
  acceptedAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface PropertySchema {
  id: string;
  propertyName: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'select';
  constraints: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  userId: string;
  name: string;
  done?: boolean;
  emoji?: string;
  source?: string;
  customProperties?: Record<string, any>;
}

export interface UpdateTaskInput {
  name?: string;
  done?: boolean;
  emoji?: string;
  customProperties?: Record<string, any>;
  timeTracking?: TimeTracking;
}
