import { WorkflowResult, ChatMessage, UploadedFile } from '../types';

export class DifyClient {
  constructor(private baseUrl: string, private apiKey: string) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Run a workflow in blocking mode
   */
  async runWorkflow(inputs: Record<string, any>, userId: string = 'user-script'): Promise<WorkflowResult> {
    // Ensure trailing slash is handled or not duplicated
    const url = `${this.baseUrl.replace(/\/$/, '')}/workflows/run`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        inputs,
        response_mode: 'blocking',
        user: userId,
      }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Dify API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload a file to Dify
   * Currently supports images: png, jpg, jpeg, webp, gif
   */
  async uploadFile(file: Blob, filename: string, userId: string = 'user-script'): Promise<UploadedFile> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/files/upload`;

    const formData = new FormData();
    formData.append('file', file, filename);
    formData.append('user', userId);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        // Note: Do NOT set Content-Type header - browser will set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Dify File Upload Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a chat message and yield SSE events
   */
  async *sendChatMessage(
    query: string,
    inputs: Record<string, any>,
    conversationId: string | null,
    userId: string = 'user-script'
  ): AsyncGenerator<ChatMessage, void, unknown> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/chat-messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        inputs,
        query,
        response_mode: 'streaming',
        conversation_id: conversationId,
        user: userId,
      }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Dify API Error: ${response.statusText}`);
    }

    if (!response.body) throw new Error('No response body for streaming request');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;

              const jsonStr = trimmed.slice(6);
              if (jsonStr === '[DONE]') continue; // End of stream marker in some implementations

              try {
                  const data = JSON.parse(jsonStr) as ChatMessage;
                  yield data;
              } catch (e) {
                  console.warn('Failed to parse SSE line:', line);
              }
          }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
