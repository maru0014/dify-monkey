import React from 'react';
import { Book, Code2, Database, Bell, FileText, Image } from 'lucide-react';

interface ApiMethod {
	name: string;
	signature: string;
	description: string;
	params?: { name: string; type: string; description: string }[];
	returns?: { type: string; description: string };
	example: string;
}

interface ApiSection {
	name: string;
	icon: React.ReactNode;
	description: string;
	methods: ApiMethod[];
}

const apiSections: ApiSection[] = [
	{
		name: 'dify.workflow',
		icon: <Code2 className="text-blue-500" size={24} />,
		description: 'Dify ワークフローを実行するためのAPI',
		methods: [
			{
				name: 'run',
				signature: 'dify.workflow.run(inputs, options?)',
				description: 'Difyワークフローを実行し、結果を返します。スクリプトにリンクされたDify Appが使用されます。',
				params: [
					{
						name: 'inputs',
						type: 'Record<string, any>',
						description: 'ワークフローへの入力パラメータ（オブジェクト形式）'
					},
					{
						name: 'options',
						type: '{ appId?: string }',
						description: '(オプション) 特定のアプリIDを指定する場合に使用'
					}
				],
				returns: {
					type: 'Promise<WorkflowResult>',
					description: 'ワークフロー実行結果を含むPromise'
				},
				example: `// 基本的な使用例
const result = await dify.workflow.run({
  text: "分析対象のテキスト",
  mode: "summary"
});

console.log(result.data.outputs);

// 別のアプリを指定する場合
const result2 = await dify.workflow.run(
  { query: "検索クエリ" },
  { appId: "app-xxxxx" }
);`
			}
		]
	},
	{
		name: 'dify.file',
		icon: <Image className="text-pink-500" size={24} />,
		description: 'DifyへファイルをアップロードするためのAPI',
		methods: [
			{
				name: 'upload',
				signature: 'dify.file.upload(data, filename, mimeType?)',
				description: 'ファイル（Blob, File, Base64）をDifyにアップロードします。アップロードしたファイルはワークフローの入力として使用できます。',
				params: [
					{ name: 'data', type: 'Blob | File | string', description: 'アップロードするデータ（Base64文字列も可）' },
					{ name: 'filename', type: 'string', description: 'ファイル名（拡張子付き）' },
					{ name: 'mimeType', type: 'string', description: '(オプション) MIMEタイプ（Blob/Fileの場合は自動判定）' }
				],
				returns: {
					type: 'Promise<UploadedFile>',
					description: 'アップロードされたファイル情報'
				},
				example: `// 画像URLから取得してアップロード
const response = await fetch('https://example.com/image.png');
const blob = await response.blob();
const file = await dify.file.upload(blob, 'image.png');

// ワークフローの入力として使用
await dify.workflow.run({
  image: {
    type: 'file',
    transfer_method: 'local_file',
    upload_file_id: file.id
  }
});`
			}
		]
	},
	{
		name: 'dify.storage',
		icon: <Database className="text-green-500" size={24} />,
		description: 'スクリプト固有の永続ストレージAPI（localStorageベース）',
		methods: [
			{
				name: 'set',
				signature: 'dify.storage.set(key, value)',
				description: 'キーと値のペアをスクリプト固有のストレージに保存します。値は自動的にJSON形式でシリアライズされます。',
				params: [
					{ name: 'key', type: 'string', description: 'ストレージキー' },
					{ name: 'value', type: 'any', description: '保存する値（オブジェクト、配列、プリミティブ）' }
				],
				example: `// 単純な値を保存
await dify.storage.set('count', 42);

// オブジェクトを保存
await dify.storage.set('settings', {
  theme: 'dark',
  notifications: true
});

// 配列を保存
await dify.storage.set('history', [
  { timestamp: Date.now(), action: 'click' }
]);`
			},
			{
				name: 'get',
				signature: 'dify.storage.get(key)',
				description: 'ストレージから値を取得します。キーが存在しない場合は undefined を返します。',
				params: [
					{ name: 'key', type: 'string', description: 'ストレージキー' }
				],
				returns: {
					type: 'Promise<any>',
					description: '保存された値、または存在しない場合は undefined'
				},
				example: `// 値を取得
const count = await dify.storage.get('count');
console.log(count); // 42

// デフォルト値のパターン
const settings = await dify.storage.get('settings') || {
  theme: 'light',
  notifications: false
};`
			}
		]
	},
	{
		name: 'dify.ui',
		icon: <Bell className="text-purple-500" size={24} />,
		description: 'ユーザーインターフェース用のAPI（通知・ダイアログ）',
		methods: [
			{
				name: 'toast',
				signature: "dify.ui.toast(message, type?)",
				description: '画面右下にトースト通知を表示します。3秒後に自動的に消えます。',
				params: [
					{ name: 'message', type: 'string', description: '表示するメッセージ' },
					{ name: 'type', type: "'success' | 'error' | 'info'", description: "(オプション) 通知タイプ。デフォルトは 'info'" }
				],
				example: `// 成功通知
dify.ui.toast('処理が完了しました', 'success');

// エラー通知
dify.ui.toast('エラーが発生しました', 'error');

// 情報通知（デフォルト）
dify.ui.toast('処理中...');`
			},
			{
				name: 'prompt',
				signature: 'dify.ui.prompt(message)',
				description: 'ユーザーに入力を求めるプロンプトダイアログを表示します。',
				params: [
					{ name: 'message', type: 'string', description: 'プロンプトメッセージ' }
				],
				returns: {
					type: 'Promise<string | null>',
					description: 'ユーザーの入力値、またはキャンセル時は null'
				},
				example: `// ユーザー入力を取得
const name = await dify.ui.prompt('名前を入力してください');

if (name) {
  dify.ui.toast(\`こんにちは、\${name}さん！\`, 'success');
} else {
  dify.ui.toast('キャンセルされました', 'info');
}`
			}
		]
	},
	{
		name: 'dify.page',
		icon: <FileText className="text-orange-500" size={24} />,
		description: 'ページコンテンツを取得するためのAPI（Readabilityベース）',
		methods: [
			{
				name: 'readContent',
				signature: 'dify.page.readContent()',
				description: 'Readabilityを使用してページのメインコンテンツを抽出します。広告やナビゲーションを除去した本文テキストを取得できます。',
				returns: {
					type: 'Promise<{title: string, content: string, length: number}>',
					description: 'ページタイトル、本文テキスト、文字数を含むオブジェクト'
				},
				example: `// ページコンテンツを取得してワークフローに渡す
const page = await dify.page.readContent();
console.log('タイトル:', page.title);
console.log('文字数:', page.length);

const result = await dify.workflow.run({
  text: page.content
});
dify.ui.toast('要約: ' + result.data.outputs.summary, 'success');`
			},
			{
				name: 'getUrl',
				signature: 'dify.page.getUrl()',
				description: '現在のページのURLを取得します。',
				returns: {
					type: 'string',
					description: '現在のページのURL'
				},
				example: `const url = dify.page.getUrl();
console.log('現在のURL:', url);`
			},
			{
				name: 'getTitle',
				signature: 'dify.page.getTitle()',
				description: '現在のページのタイトルを取得します。',
				returns: {
					type: 'string',
					description: 'ページタイトル'
				},
				example: `const title = dify.page.getTitle();
dify.ui.toast('ページ: ' + title, 'info');`
			},
			{
				name: 'getSelection',
				signature: 'dify.page.getSelection()',
				description: 'ユーザーが選択中のテキストを取得します。選択がない場合は空文字を返します。',
				returns: {
					type: 'string',
					description: '選択中のテキスト、または空文字'
				},
				example: `// 選択テキストをワークフローで処理
const selection = dify.page.getSelection();
if (selection) {
  const result = await dify.workflow.run({ text: selection });
  dify.ui.toast('処理完了', 'success');
} else {
  dify.ui.toast('テキストを選択してください', 'error');
}`
			}
		]
	},
	{
		name: 'dify.log',
		icon: <Book className="text-cyan-500" size={24} />,
		description: 'サイドパネルのLogsにメッセージを出力するAPI',
		methods: [
			{
				name: 'log',
				signature: 'dify.log(message, data?)',
				description: 'サイドパネルのLogsセクションにメッセージを出力します。ワークフローの結果やデバッグ情報の確認に便利です。',
				params: [
					{ name: 'message', type: 'string', description: '出力するメッセージ' },
					{ name: 'data', type: 'any', description: '(オプション) 追加データ（JSON形式で表示）' }
				],
				example: `// シンプルなログ
dify.log('処理を開始しました');

// データ付きログ
const result = await dify.workflow.run({ text: 'test' });
dify.log('ワークフロー完了', result.data.outputs);

// エラーログ
try {
  // 処理
} catch (e) {
  dify.log('エラー発生', { error: e.message });
}`
			}
		]
	},
	{
		name: 'Lifecycle APIs',
		icon: <Code2 className="text-red-500" size={24} />,
		description: 'スクリプト実行のライフサイクル制御API（サイドパネル実行時は自動的に呼ばれます）',
		methods: [
			{
				name: 'start',
				signature: 'dify.start()',
				description: 'スクリプト実行開始を通知します。サイドパネルから実行した場合は自動的に呼ばれるため、通常は呼び出す必要はありません。',
				example: `// 手動で開始通知を送る場合（通常は自動）
dify.start();`
			},
			{
				name: 'done',
				signature: 'dify.done(result?)',
				description: 'スクリプト実行完了を通知します。サイドパネルから実行した場合は自動的に呼ばれるため、通常は呼び出す必要はありません。',
				params: [
					{ name: 'result', type: 'object', description: '(オプション) 実行結果オブジェクト（{ success: boolean, error?: string }）' }
				],
				example: `// 手動で完了通知を送る場合（通常は自動）
dify.done({ success: true });

// エラー終了の場合
dify.done({ success: false, error: 'Something went wrong' });`
			},
			{
				name: 'onAbort',
				signature: 'dify.onAbort(callback)',
				description: 'ユーザーが停止ボタンを押した時に呼ばれるコールバックを登録します。長時間実行するスクリプトでリソースのクリーンアップに使用します。',
				params: [
					{ name: 'callback', type: 'Function', description: '中断時に呼ばれる関数' }
				],
				example: `// 中断時のクリーンアップを登録
let intervalId = setInterval(() => {
  console.log('Working...');
}, 1000);

dify.onAbort(() => {
  clearInterval(intervalId);
  console.log('Cleaned up!');
});`
			},
			{
				name: 'isAborted',
				signature: 'dify.isAborted()',
				description: 'スクリプトが中断されたかどうかを確認します。ループ内で定期的にチェックして処理を中断するのに使用します。',
				returns: {
					type: 'boolean',
					description: '中断された場合は true'
				},
				example: `// ループ内で中断をチェック
const items = [1, 2, 3, 4, 5];
for (const item of items) {
  if (dify.isAborted()) {
    console.log('処理が中断されました');
    break;
  }
  await dify.workflow.run({ item });
}`
			}
		]
	}
];

// 戻り値の型定義
const workflowResultType = `interface WorkflowResult {
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
}`;

export const ApiReference: React.FC = () => {
	return (
		<div className="flex flex-col h-full">
			<div className="border-b border-border p-4">
				<div className="flex items-center gap-3">
					<Book className="text-primary" size={24} />
					<div>
						<h2 className="text-xl font-bold">API Reference</h2>
						<p className="text-sm text-muted-foreground">
							スクリプトで使用できる <code className="bg-muted px-1 rounded">dify</code> APIのリファレンス
						</p>
					</div>
				</div>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-4xl space-y-8">
					{/* Quick Start */}
					<section className="bg-secondary/50 border border-border rounded-lg p-4">
						<h3 className="font-semibold mb-2">📝 クイックスタート</h3>
						<p className="text-sm text-muted-foreground mb-3">
							スクリプト内でグローバル変数 <code className="bg-muted px-1 rounded">dify</code> を使用してAPIにアクセスできます。
							Monaco Editorで <code className="bg-muted px-1 rounded">dify.</code> と入力すると、自動補完が表示されます。
						</p>
						<pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
							<code>{`// 例: ワークフローを実行して結果を通知
const result = await dify.workflow.run({ text: document.body.innerText });
dify.ui.toast('完了: ' + result.data.outputs.summary, 'success');`}</code>
						</pre>
					</section>

					{/* API Sections */}
					{apiSections.map((section) => (
						<section key={section.name} className="border border-border rounded-lg overflow-hidden">
							<div className="bg-secondary/50 p-4 border-b border-border">
								<div className="flex items-center gap-3">
									{section.icon}
									<div>
										<h3 className="font-bold text-lg">
											<code>{section.name}</code>
										</h3>
										<p className="text-sm text-muted-foreground">{section.description}</p>
									</div>
								</div>
							</div>

							<div className="divide-y divide-border">
								{section.methods.map((method) => (
									<div key={method.name} className="p-4 space-y-3">
										<div>
											<h4 className="font-mono font-semibold text-primary">
												{method.signature}
											</h4>
											<p className="text-sm text-muted-foreground mt-1">
												{method.description}
											</p>
										</div>

										{method.params && method.params.length > 0 && (
											<div>
												<h5 className="text-sm font-semibold mb-2">Parameters</h5>
												<div className="space-y-1">
													{method.params.map((param) => (
														<div key={param.name} className="text-sm flex gap-2">
															<code className="bg-muted px-1 rounded text-blue-400">{param.name}</code>
															<span className="text-gray-500">:</span>
															<code className="text-green-400">{param.type}</code>
															<span className="text-muted-foreground">- {param.description}</span>
														</div>
													))}
												</div>
											</div>
										)}

										{method.returns && (
											<div>
												<h5 className="text-sm font-semibold mb-1">Returns</h5>
												<div className="text-sm flex gap-2">
													<code className="text-green-400">{method.returns.type}</code>
													<span className="text-muted-foreground">- {method.returns.description}</span>
												</div>
											</div>
										)}

										<div>
											<h5 className="text-sm font-semibold mb-2">Example</h5>
											<pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
												<code>{method.example}</code>
											</pre>
										</div>
									</div>
								))}
							</div>
						</section>
					))}

					{/* Type Definitions */}
					<section className="border border-border rounded-lg overflow-hidden">
						<div className="bg-secondary/50 p-4 border-b border-border">
							<h3 className="font-bold text-lg">📋 Type Definitions</h3>
							<p className="text-sm text-muted-foreground">API戻り値の型定義</p>
						</div>
						<div className="p-4">
							<h4 className="font-mono font-semibold mb-2">WorkflowResult</h4>
							<pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
								<code>{workflowResultType}</code>
							</pre>

							<h4 className="font-mono font-semibold mb-2 mt-4">UploadedFile</h4>
							<pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
								<code>{`interface UploadedFile {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}`}</code>
							</pre>
						</div>
					</section>

					{/* Notes */}
					<section className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
						<h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">⚠️ 注意事項</h3>
						<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
							<li>すべての非同期関数（<code className="bg-muted px-1 rounded">workflow.run</code>, <code className="bg-muted px-1 rounded">storage.get/set</code>, <code className="bg-muted px-1 rounded">ui.prompt</code>）はPromiseを返すため、<code className="bg-muted px-1 rounded">await</code>を使用してください。</li>
							<li><code className="bg-muted px-1 rounded">workflow.run</code>を使用するには、スクリプトにDify Appをリンクする必要があります。</li>
							<li>ストレージはスクリプトごとに分離されています（異なるスクリプト間でデータは共有されません）。</li>
						</ul>
					</section>
				</div>
			</div>
		</div>
	);
};
