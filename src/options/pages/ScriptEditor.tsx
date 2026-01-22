import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Save, ChevronLeft } from 'lucide-react';
import { useUserScripts, useDifyApps } from '@/shared/hooks';
import { UserScript, RunAtType, TriggerType } from '@/shared/types';

// Default script template (minimal)
const DEFAULT_SCRIPT_CODE = `// Your Dify Monkey Script
// Available APIs:
//   dify.workflow.run({ inputs })  - Run a Dify workflow
//   dify.storage.get/set(key)      - Persistent storage
//   dify.ui.toast(message, type)   - Show notification

// Your code here:

`;

// Type definitions for Monaco Editor autocomplete (used if Monaco loads successfully)
const DIFY_TYPE_DEFINITIONS = `
/**
 * Dify Monkey Bridge API
 * スクリプト内で利用可能なグローバルオブジェクト
 */
declare const dify: {
  /**
   * Dify ワークフロー実行API
   */
  workflow: {
    /**
     * Difyワークフローを実行し、結果を返します。
     *
     * @param inputs - ワークフローへの入力パラメータ（オブジェクト形式）
     * @param options - オプション設定
     * @returns ワークフロー実行結果を含むPromise
     *
     * @example
     * // 基本的な使用例
     * const result = await dify.workflow.run({
     *   text: document.body.innerText
     * });
     * console.log(result.data.outputs);
     *
     * @example
     * // 別のアプリを指定する場合
     * const result = await dify.workflow.run(
     *   { query: "検索クエリ" },
     *   { appId: "app-xxxxx" }
     * );
     */
    run(inputs: Record<string, any>, options?: {
      /** 使用するDify AppのID（未指定時はリンクされたアプリを使用） */
      appId?: string
    }): Promise<{
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
    }>;
  };

  /**
   * スクリプト固有の永続ストレージAPI（localStorageベース）
   */
  storage: {
    /**
     * 値をストレージに保存します。
     * 値は自動的にJSON形式でシリアライズされます。
     *
     * @param key - ストレージキー
     * @param value - 保存する値（オブジェクト、配列、プリミティブ）
     *
     * @example
     * await dify.storage.set('count', 42);
     * await dify.storage.set('settings', { theme: 'dark' });
     */
    set(key: string, value: any): Promise<void>;

    /**
     * ストレージから値を取得します。
     *
     * @param key - ストレージキー
     * @returns 保存された値、または存在しない場合は undefined
     *
     * @example
     * const count = await dify.storage.get('count');
     * const settings = await dify.storage.get('settings') || { theme: 'light' };
     */
    get(key: string): Promise<any>;
  };

  /**
   * ユーザーインターフェース用API
   */
  ui: {
    /**
     * 画面右下にトースト通知を表示します（3秒後に自動消去）。
     *
     * @param message - 表示するメッセージ
     * @param type - 通知タイプ（デフォルト: 'info'）
     *
     * @example
     * dify.ui.toast('処理が完了しました', 'success');
     * dify.ui.toast('エラーが発生しました', 'error');
     * dify.ui.toast('処理中...');
     */
    toast(message: string, type?: 'success' | 'error' | 'info'): void;

    /**
     * ユーザーに入力を求めるプロンプトダイアログを表示します。
     *
     * @param message - プロンプトメッセージ
     * @returns ユーザーの入力値、またはキャンセル時は null
     *
     * @example
     * const name = await dify.ui.prompt('名前を入力してください');
     * if (name) {
     *   dify.ui.toast(\`こんにちは、\${name}さん！\`, 'success');
     * }
     */
    prompt(message: string): Promise<string | null>;
  };
};
`;

// Simple code editor component (fallback when Monaco fails to load)
const SimpleCodeEditor: React.FC<{
	value: string;
	onChange: (value: string) => void;
}> = ({ value, onChange }) => {
	return (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-full h-[400px] px-3 py-2 border border-border rounded-md bg-gray-900 text-gray-100 font-mono text-sm resize-none"
			placeholder="// Your code here"
			spellCheck={false}
		/>
	);
};

// Monaco Editor global cache to prevent re-initialization issues
let monacoLoadPromise: Promise<any> | null = null;
let cachedMonacoEditor: any = null;
let isMonacoEnvironmentConfigured = false;

// Monaco Editor with fallback
const CodeEditor: React.FC<{
	value: string;
	onChange: (value: string) => void;
}> = ({ value, onChange }) => {
	// Initialize state from cache if available
	const [MonacoEditor, setMonacoEditor] = useState<any>(cachedMonacoEditor);
	const [loadError, setLoadError] = useState(false);
	const [loading, setLoading] = useState(!cachedMonacoEditor);

	// Use ref to track loading state for timeout callback (avoids closure issues)
	const loadingRef = useRef(!cachedMonacoEditor);

	// Keep ref in sync with loading state
	useEffect(() => {
		loadingRef.current = loading;
	}, [loading]);

	useEffect(() => {
		// If already cached, no need to load again
		if (cachedMonacoEditor) {
			return;
		}

		let isMounted = true;

		// Dynamically import Monaco Editor with global caching
		const loadMonaco = async () => {
			try {
				// Use cached promise if already loading to prevent duplicate initialization
				if (!monacoLoadPromise) {
					monacoLoadPromise = (async () => {
						// Import Monaco Editor workers
						const editorWorker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
						const jsonWorker = await import('monaco-editor/esm/vs/language/json/json.worker?worker');
						const tsWorker = await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker');

						// Configure MonacoEnvironment only once
						if (!isMonacoEnvironmentConfigured) {
							(self as any).MonacoEnvironment = {
								getWorker: function (_moduleId: string, label: string) {
									if (label === 'json') {
										return new jsonWorker.default();
									}
									if (label === 'typescript' || label === 'javascript') {
										return new tsWorker.default();
									}
									return new editorWorker.default();
								}
							};
							isMonacoEnvironmentConfigured = true;
						}

						// Import Monaco Editor React component
						const monacoReact = await import('@monaco-editor/react');

						// Import Monaco Editor directly to use bundled version
						const monaco = await import('monaco-editor');

						// Configure loader to use the bundled Monaco instead of CDN
						monacoReact.loader.config({ monaco });

						return monacoReact.default;
					})();
				}

				const editor = await monacoLoadPromise;
				cachedMonacoEditor = editor;

				if (isMounted) {
					setMonacoEditor(editor);
					setLoading(false);
				}
			} catch (err) {
				console.error('Failed to load Monaco Editor:', err);
				// Reset promise on error to allow retry
				monacoLoadPromise = null;
				if (isMounted) {
					setLoadError(true);
					setLoading(false);
				}
			}
		};

		loadMonaco();

		// Set a timeout to fallback if Monaco takes too long
		// Use ref instead of state to avoid closure issues
		const timeout = setTimeout(() => {
			if (isMounted && loadingRef.current) {
				console.warn('Monaco Editor load timeout, using fallback');
				setLoadError(true);
				setLoading(false);
			}
		}, 10000);

		return () => {
			isMounted = false;
			clearTimeout(timeout);
		};
	}, []);

	// Handle Monaco initialization errors
	const handleEditorDidMount = (_editor: any, monaco: any) => {
		try {
			// Add Dify type definitions for autocomplete
			monaco.languages.typescript.javascriptDefaults.addExtraLib(
				DIFY_TYPE_DEFINITIONS,
				'file:///dify.d.ts'
			);

			// Configure JavaScript defaults
			monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
				target: monaco.languages.typescript.ScriptTarget.ES2020,
				allowNonTsExtensions: true,
				moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
				module: monaco.languages.typescript.ModuleKind.CommonJS,
				noEmit: true,
				lib: ['es2020', 'dom'],
			});
		} catch (err) {
			console.error('Monaco configuration error:', err);
		}
	};

	if (loading) {
		return (
			<div className="w-full h-[400px] border border-border rounded-md bg-gray-900 flex flex-col items-center justify-center gap-4">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
					<span className="text-gray-400">エディタを読み込み中...</span>
				</div>
				<p className="text-xs text-gray-500">
					読み込みに時間がかかる場合は、シンプルエディタに自動切り替えされます
				</p>
			</div>
		);
	}

	if (loadError || !MonacoEditor) {
		return <SimpleCodeEditor value={value} onChange={onChange} />;
	}

	return (
		<MonacoEditor
			height="400px"
			defaultLanguage="javascript"
			value={value}
			onChange={(val: string | undefined) => onChange(val || '')}
			onMount={handleEditorDidMount}
			theme="vs-dark"
			options={{
				minimap: { enabled: false },
				fontSize: 14,
				lineNumbers: 'on',
				scrollBeyondLastLine: false,
				automaticLayout: true,
				tabSize: 2,
				wordWrap: 'on',
				suggestOnTriggerCharacters: true,
				quickSuggestions: true,
			}}
			loading={
				<div className="w-full h-[400px] border border-border rounded-md bg-gray-900 flex items-center justify-center">
					<span className="text-gray-400">Loading editor...</span>
				</div>
			}
		/>
	);
};

export const ScriptEditor: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { scripts, saveScript } = useUserScripts();
	const { apps } = useDifyApps();

	// Get template from location state if navigating from templates page
	const templateState = location.state as { templateCode?: string; templateName?: string } | null;

	const [formData, setFormData] = useState<Partial<UserScript>>({
		name: templateState?.templateName || '',
		code: templateState?.templateCode || DEFAULT_SCRIPT_CODE,
		matches: ['https://*/*'],
		trigger: 'context_menu',
		runAt: 'document_idle',
		linkedAppId: undefined,
		enabled: true,
	});

	useEffect(() => {
		if (id) {
			const script = scripts.find((s) => s.id === id);
			if (script) {
				setFormData(script);
			}
		}
	}, [id, scripts]);

	const handleSave = async () => {
		const script: UserScript = {
			id: id || `script-${Date.now()}`,
			name: formData.name || 'Untitled Script',
			code: formData.code || '',
			matches: formData.matches || ['https://*/*'],
			trigger: formData.trigger || 'auto',
			runAt: formData.runAt || 'document_idle',
			linkedAppId: formData.linkedAppId,
			enabled: formData.enabled ?? true,
			updatedAt: Date.now(),
		};
		await saveScript(script);
		navigate('/scripts');
	};

	return (
		<div className="flex flex-col h-full">
			<div className="border-b border-border p-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link to="/scripts" className="hover:bg-accent p-2 rounded">
						<ChevronLeft size={20} />
					</Link>
					<h2 className="text-xl font-bold">{id ? 'Edit Script' : 'New Script'}</h2>
				</div>
				<button
					onClick={handleSave}
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					<Save size={16} />
					Save
				</button>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-4xl space-y-6">
					{/* Name */}
					<div>
						<label className="block text-sm font-medium mb-2">Script Name</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className="w-full px-3 py-2 border border-border rounded-md bg-background"
							placeholder="My Script"
						/>
					</div>

					{/* URL Patterns */}
					<div>
						<label className="block text-sm font-medium mb-2">URL Patterns</label>
						<textarea
							value={formData.matches?.join('\n')}
							onChange={(e) => setFormData({ ...formData, matches: e.target.value.split('\n').filter(Boolean) })}
							className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
							rows={3}
							placeholder="https://*/*"
						/>
						<p className="text-xs text-muted-foreground mt-1">One pattern per line</p>
					</div>

					{/* Settings Row */}
					<div className="grid grid-cols-3 gap-4">
						{/* Linked App */}
						<div>
							<label className="block text-sm font-medium mb-2">Linked Dify App</label>
							<select
								value={formData.linkedAppId || ''}
								onChange={(e) => setFormData({ ...formData, linkedAppId: e.target.value || undefined })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
							>
								<option value="">None (use default)</option>
								{apps.filter((app) => app.appType === 'workflow').map((app) => (
									<option key={app.id} value={app.id}>
										{app.name}
									</option>
								))}
							</select>
						</div>

						{/* Run At */}
						<div>
							<label className="block text-sm font-medium mb-2">Run At</label>
							<select
								value={formData.runAt || 'document_idle'}
								onChange={(e) => setFormData({ ...formData, runAt: e.target.value as RunAtType })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
							>
								<option value="document_start">Document Start</option>
								<option value="document_end">Document End</option>
								<option value="document_idle">Document Idle (default)</option>
							</select>
						</div>

						{/* Trigger */}
						<div>
							<label className="block text-sm font-medium mb-2">Trigger</label>
							<select
								value={formData.trigger || 'auto'}
								onChange={(e) => setFormData({ ...formData, trigger: e.target.value as TriggerType })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
							>
								<option value="auto">Auto (on page load)</option>
								<option value="context_menu">Context Menu</option>
							</select>
						</div>
					</div>

					{/* Code Editor */}
					<div>
						<label className="block text-sm font-medium mb-2">Code</label>
						<div className="border border-border rounded-md overflow-hidden">
							<CodeEditor
								value={formData.code || ''}
								onChange={(value) => setFormData({ ...formData, code: value })}
							/>
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							Type <code className="bg-muted px-1 rounded">dify.</code> to see available APIs (if Monaco loads)
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
