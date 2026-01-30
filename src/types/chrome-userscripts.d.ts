/// <reference types="chrome" />

/**
 * Type augmentation for chrome.userScripts.execute() method
 * This method was added in Chrome 120 but is not yet in @types/chrome
 */
declare namespace chrome.userScripts {
  /**
   * Details of the target for script injection
   */
  interface InjectionTarget {
    /** The ID of the tab to inject into */
    tabId: number;
    /** Whether to inject into all frames, defaults to false */
    allFrames?: boolean;
    /** Specific frame IDs to inject into */
    frameIds?: number[];
    /** Inject into frames with this origin */
    documentIds?: string[];
  }

  /**
   * Result of a script injection
   */
  interface InjectionResult {
    /** The result of the script execution */
    result?: unknown;
    /** The frame ID where the script was injected */
    frameId: number;
    /** The document ID where the script was injected */
    documentId: string;
  }

  /**
   * Details for script injection via execute()
   */
  interface UserScriptInjection {
    /** Details specifying the target into which to inject the script */
    target: InjectionTarget;
    /** The list of ScriptSource objects defining sources of scripts to be injected */
    js: ScriptSource[];
    /** Whether the injection should be triggered as soon as possible */
    injectImmediately?: boolean;
    /** The JavaScript world to run the script in. Defaults to USER_SCRIPT */
    world?: ExecutionWorld;
    /** Specifies the user script world ID to execute in */
    worldId?: string;
  }

  /**
   * Injects a script into a target context.
   * By default, the script will be run at document_idle, or immediately if the page has already loaded.
   * @since Chrome 120
   */
  function execute(injection: UserScriptInjection): Promise<InjectionResult[]>;
}
