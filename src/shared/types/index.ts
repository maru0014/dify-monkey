// Security modes for API key protection
export enum SecurityMode {
  DEVICE_KEY = 'device_key',          // Default: Encrypted with device key (no password needed)
  MASTER_PASSWORD = 'master_password', // Encrypted with master password (requires password input)
  PLAINTEXT = 'plaintext'             // Legacy: No encryption (not recommended)
}

// Encrypted API key structure
export interface EncryptedApiKey {
  mode: SecurityMode;
  encrypted: string;  // Base64 encoded encrypted data
  salt?: string;      // Base64 encoded salt (for master password mode only)
  iv: string;         // Base64 encoded IV
  version: 1;         // Encryption version
}

export interface DifyApp {
  id: string;
  name: string;
  apiKey: EncryptedApiKey | string;  // Encrypted or plaintext (backward compatibility)
  appType: 'workflow' | 'chatflow';
  createdAt: number;
}

export type TriggerType = 'auto' | 'context_menu';
export type RunAtType = 'document_start' | 'document_end' | 'document_idle';

export interface UserScript {
  id: string;
  name: string;
  code: string;
  matches: string[];
  trigger: TriggerType;
  runAt: RunAtType;
  linkedAppId?: string;
  enabled: boolean;
  updatedAt: number;
}

export interface AppSettings {
  difyBaseUrl: string;
  theme: 'system' | 'light' | 'dark';
  securityMode: SecurityMode;      // Current security mode
  sessionTimeout?: number;         // Session timeout in minutes (master password mode only)
  welcomeShown?: boolean;          // Whether welcome dialog has been shown
  devMode?: boolean;               // Enable developer mode for detailed logging
  masterPasswordHash?: string;
  masterPasswordSalt?: string;
}

export interface StorageSchema {
  settings: AppSettings;
  difyApps: Record<string, DifyApp>;
  scripts: Record<string, UserScript>;
  sidepanelLastTab?: 'chat' | 'scripts';
}

export interface WorkflowResult {
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: Record<string, any>;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export interface ChatMessage {
  event: 'message' | 'message_end' | 'agent_message' | 'agent_thought' | 'error' | 'ping';
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: any;
  created_at: number;
}

// Script execution state for sidepanel UI
export type ScriptExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ScriptExecution {
  id: string;              // Unique per execution
  scriptId: string;        // Target script ID
  scriptName: string;      // For display
  status: ScriptExecutionStatus;
  progress: number;        // 0-100
  currentStep?: string;    // Current step description
  startedAt: number;
  finishedAt?: number;
  result?: WorkflowResult;
  error?: string;
}

// Script log entry for sidepanel logs display
export interface ScriptLog {
  id: string;
  scriptId: string;
  scriptName: string;
  message: string;
  data?: any;
  timestamp: number;
}

export interface DifyInterface {
  workflow: {
    run: (inputs: Record<string, any>, options?: { appId?: string }) => Promise<WorkflowResult>;
  };
  // Note: chat.send is not implemented in User Script Bridge
  // Chat functionality is available only through the Side Panel UI
  storage: {
    set: (key: string, value: any) => Promise<void>;
    get: (key: string) => Promise<any>;
  };
  ui: {
    toast: (message: string, type?: 'success' | 'error' | 'info') => void;
    prompt: (message: string) => Promise<string | null>;
  };
  page: {
    readContent: () => Promise<{ title: string; content: string; length: number }>;
    getUrl: () => string;
    getTitle: () => string;
    getSelection: () => string;
  };
  file: {
    upload: (data: Blob | File | string, filename: string, mimeType?: string) => Promise<UploadedFile>;
  };
  log: (message: string, data?: any) => void;
  // Lifecycle APIs
  start: () => void;
  done: (result?: { success: boolean; error?: string }) => void;
  onAbort: (callback: () => void) => void;
  isAborted: () => boolean;
  _aborted: boolean;
}
