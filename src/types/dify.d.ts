/**
 * Dify Monkey Type Definitions
 *
 * This file provides type definitions for the `dify` global object
 * available in user scripts. Used by Monaco Editor for autocomplete.
 */

declare global {
  /**
   * Dify Monkey API - Available in all user scripts
   */
  const dify: DifyMonkeyAPI;

  interface DifyMonkeyAPI {
    /**
     * Workflow execution API
     */
    workflow: {
      /**
       * Run a Dify workflow and return the result.
       *
       * @example
       * ```javascript
       * const result = await dify.workflow.run({ text: "Hello" });
       * console.log(result.data.outputs);
       * ```
       *
       * @param inputs - Input parameters for the workflow
       * @param options - Optional settings
       * @returns Promise resolving to workflow result
       */
      run(
        inputs: Record<string, any>,
        options?: {
          /** Specify a different Dify app ID to use */
          appId?: string;
        }
      ): Promise<WorkflowResult>;
    };

    /**
     * Script-specific storage API
     */
    storage: {
      /**
       * Store a value in script-specific storage.
       * Each script has its own isolated storage namespace.
       *
       * @example
       * ```javascript
       * await dify.storage.set("count", 42);
       * ```
       *
       * @param key - Storage key
       * @param value - Value to store (will be JSON serialized)
       */
      set(key: string, value: any): Promise<void>;

      /**
       * Retrieve a value from script-specific storage.
       *
       * @example
       * ```javascript
       * const count = await dify.storage.get("count");
       * ```
       *
       * @param key - Storage key
       * @returns Stored value or undefined if not found
       */
      get(key: string): Promise<any>;
    };

    /**
     * UI utilities API
     */
    ui: {
      /**
       * Show a toast notification at the bottom-right of the page.
       *
       * @example
       * ```javascript
       * dify.ui.toast("Operation completed!", "success");
       * dify.ui.toast("Something went wrong", "error");
       * dify.ui.toast("Processing...", "info");
       * ```
       *
       * @param message - Message to display
       * @param type - Toast type: 'success', 'error', or 'info' (default: 'info')
       */
      toast(message: string, type?: 'success' | 'error' | 'info'): void;

      /**
       * Show a prompt dialog to get user input.
       *
       * @example
       * ```javascript
       * const name = await dify.ui.prompt("Enter your name:");
       * if (name) {
       *   console.log("Hello, " + name);
       * }
       * ```
       *
       * @param message - Prompt message
       * @returns User input string, or null if cancelled
       */
      prompt(message: string): Promise<string | null>;
    };

    /**
     * Page content API
     */
    page: {
      /**
       * Read the main content of the current page using Readability.
       * Returns the extracted title, content text, and character count.
       *
       * @example
       * ```javascript
       * const page = await dify.page.readContent();
       * console.log(page.title);
       * console.log(page.content);
       * ```
       *
       * @returns Page content with title, content text, and length
       */
      readContent(): Promise<{ title: string; content: string; length: number }>;

      /**
       * Get the current page URL.
       *
       * @example
       * ```javascript
       * const url = dify.page.getUrl();
       * ```
       *
       * @returns Current page URL
       */
      getUrl(): string;

      /**
       * Get the current page title.
       *
       * @example
       * ```javascript
       * const title = dify.page.getTitle();
       * ```
       *
       * @returns Page title
       */
      getTitle(): string;

      /**
       * Get the currently selected text on the page.
       *
       * @example
       * ```javascript
       * const selection = dify.page.getSelection();
       * if (selection) {
       *   // Process selected text
       * }
       * ```
       *
       * @returns Selected text, or empty string if nothing is selected
       */
      getSelection(): string;
    };

    file: {
      /**
       * Upload a file to Dify.
       * Supports Blob, File objects, or base64 strings.
       *
       * @example
       * ```javascript
       * // Upload from URL
       * const response = await fetch('https://example.com/image.png');
       * const blob = await response.blob();
       * const file = await dify.file.upload(blob, 'image.png');
       *
       * // Use in workflow
       * await dify.workflow.run({
       *   image: {
       *     type: 'file',
       *     transfer_method: 'local_file',
       *     upload_file_id: file.id
       *   }
       * });
       * ```
       *
       * @param data - File to upload (Blob, File, or base64 string)
       * @param filename - Filename with extension (e.g., 'image.png')
       * @param mimeType - Optional MIME type (e.g., 'image/png')
       * @returns Uploaded file information
       */
      upload(data: Blob | File | string, filename: string, mimeType?: string): Promise<UploadedFile>;
    };

    /**
     * Log a message to the sidepanel history.
     * Use this to output workflow results or debug information.
     *
     * @example
     * ```javascript
     * dify.log("Workflow completed", { result: outputs });
     * dify.log("Processing started");
     * ```
     *
     * @param message - Log message to display
     * @param data - Optional data object (will be JSON displayed)
     */
    log(message: string, data?: any): void;
  }

  /**
   * File uploaded to Dify
   */
  interface UploadedFile {
    id: string;
    name: string;
    size: number;
    extension: string;
    mime_type: string;
    created_by: string;
    created_at: number;
  }

  /**
   * Result returned from workflow execution
   */
  interface WorkflowResult {
    task_id: string;
    workflow_run_id: string;
    data: {
      id: string;
      workflow_id: string;
      status: 'running' | 'succeeded' | 'failed' | 'stopped';
      outputs: Record<string, any>;
      error?: string;
      elapsed_time: number;
      total_tokens: number;
      total_steps: number;
      created_at: number;
      finished_at: number;
    };
  }
}

export {};
