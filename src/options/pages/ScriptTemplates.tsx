import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowRight } from 'lucide-react';

interface Template {
	id: string;
	name: string;
	description: string;
	code: string;
}

const templates: Template[] = [
	{
		id: 'hello-world',
		name: 'Hello World',
		description: '基本的なトースト通知を表示するシンプルな例。動作確認に最適です。',
		code: `// 👋 Dify Monkey へようこそ！
// このスクリプトはページ読み込み時に実行されます

dify.ui.toast("Hello from Dify Monkey!", "success");

// ヒント: dify. と入力すると利用可能なAPIが表示されます
`,
	},
	{
		id: 'workflow-basic',
		name: 'Workflow Basic',
		description: 'ページタイトルをDifyワークフローに送信する基本パターン。',
		code: `// ページタイトルをDifyワークフローに送信する例

(async () => {
  const title = document.title;

  dify.ui.toast("Analyzing: " + title, "info");

  try {
    const result = await dify.workflow.run({
      text: title
    });

    console.log("Workflow result:", result);
    dify.ui.toast("Done!", "success");
  } catch (error) {
    dify.ui.toast("Error: " + error.message, "error");
  }
})();
`,
	},
	{
		id: 'selection-handler',
		name: 'Selection Handler',
		description: '選択したテキストをDifyワークフローで処理する実用的な例。',
		code: `// 選択したテキストをDifyワークフローで処理する例
// dify.page.getSelection() で選択テキストを取得

document.addEventListener('mouseup', async () => {
  const selectedText = dify.page.getSelection();

  if (selectedText.length > 0 && selectedText.length < 500) {
    dify.ui.toast("Processing selected text...", "info");

    try {
      const result = await dify.workflow.run({
        text: selectedText
      });

      console.log("Result:", result.data?.outputs);
      dify.ui.toast("Processed!", "success");
    } catch (error) {
      console.error(error);
    }
  }
});
`,
	},
	{
		id: 'page-analyzer',
		name: 'Page Content Analyzer',
		description: 'Readabilityでページ本文を抽出し、Difyワークフローで分析する実践的な例。',
		code: `// ページ本文をDifyワークフローで分析する例
// dify.page.readContent() でReadabilityによる本文抽出

(async () => {
  dify.ui.toast("ページを読み込み中...", "info");

  try {
    // ページコンテンツを抽出
    const page = await dify.page.readContent();
    dify.log("ページ情報", { title: page.title, length: page.length });

    // Difyワークフローで分析
    const result = await dify.workflow.run({
      title: page.title,
      content: page.content
    });

    dify.log("分析結果", result.data?.outputs);
    dify.ui.toast("分析完了!", "success");
  } catch (error) {
    dify.ui.toast("Error: " + error.message, "error");
  }
})();
`,
	},
	{
		id: 'image-analysis',
		name: 'Image Analysis',
		description: 'ページ内の画像をDifyにアップロードして分析する例。マルチモーダルモデル（GPT-4oなど）のワークフローで利用します。',
		code: `// ページ内の画像をDifyにアップロードして分析する例
// 要件:
// 1. Dify App側で「image」という入力変数が「File」タイプで定義されていること
// 2. ワークフローが画像入力を受け付けるLLMモデルを使用していること

(async () => {
  // ページ内の最初の画像を取得
  const img = document.querySelector('img');
  if (!img) {
    dify.ui.toast("画像が見つかりませんでした", "error");
    return;
  }

  try {
    const imageUrl = img.src;
    dify.ui.toast("画像をアップロード中...\\n" + imageUrl.substring(0, 30) + "...", "info");

    // 画像URLからBlobを取得
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 適切な拡張子を判定（簡易版）
    let ext = 'png';
    if (blob.type === 'image/jpeg') ext = 'jpg';
    else if (blob.type === 'image/webp') ext = 'webp';

    // Difyにアップロード
    const filename = \`image.\${ext}\`;
    const file = await dify.file.upload(blob, filename);

    dify.ui.toast("アップロード完了: " + file.name, "success");

    // ワークフローを実行
    // 入力変数 'image' にアップロードしたファイル情報を渡す
    const result = await dify.workflow.run({
      image: {
        type: 'file',
        transfer_method: 'local_file',
        upload_file_id: file.id
      },
      // テキスト入力が必要な場合
      // query: "この画像について説明してください"
    });

    console.log("分析結果:", result.data?.outputs);
    dify.ui.toast("ワークフロー完了！Logsを確認してください", "success");
    dify.log("分析結果", result.data?.outputs);

  } catch (err) {
    dify.ui.toast("エラー: " + err.message, "error");
    console.error(err);
  }
})();
`,
	},
	{
		id: 'storage-example',
		name: 'Storage Example',
		description: 'ストレージAPIを使ってデータを永続化する例。全APIの使い方を網羅。',
		code: `// Dify Monkey 入門サンプル
// このスクリプトは利用可能なAPIの使い方を示します

(async () => {
  // 1. トースト通知
  dify.ui.toast("Script started!", "info");

  // 2. ストレージへの読み書き
  let visitCount = await dify.storage.get("visitCount") || 0;
  visitCount++;
  await dify.storage.set("visitCount", visitCount);
  console.log("Visit count:", visitCount);

  // 3. ワークフロー実行（コメントを外して使用）
  /*
  try {
    const result = await dify.workflow.run({
      text: "Hello, Dify!"
    });
    console.log("Workflow result:", result);
    dify.ui.toast("Workflow completed!", "success");
  } catch (error) {
    dify.ui.toast("Workflow error: " + error.message, "error");
  }
  */

  dify.ui.toast(\`Page visit #\${visitCount}\`, "success");
})();
`,
	},
	{
		id: 'minimal',
		name: 'Minimal Template',
		description: '最小限のテンプレート。経験者向けの白紙に近いスタート地点。',
		code: `// Your Dify Monkey Script
// Available APIs:
//   dify.workflow.run({ inputs })    - Run a Dify workflow
//   dify.storage.get/set(key)        - Persistent storage
//   dify.ui.toast(message, type)     - Show notification
//   dify.ui.prompt(message)          - Get user input
//   dify.page.readContent()          - Extract page content
//   dify.page.getSelection()         - Get selected text
//   dify.page.getUrl()               - Get current URL
//   dify.page.getTitle()             - Get page title
//   dify.log(message, data?)         - Output to sidepanel logs
//   dify.onAbort(callback)           - Register abort handler
//   dify.isAborted()                 - Check if script was stopped

// Your code here:

`,
	},
];

export const ScriptTemplates: React.FC = () => {
	const navigate = useNavigate();
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopy = async (template: Template) => {
		await navigator.clipboard.writeText(template.code);
		setCopiedId(template.id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	const handleUseTemplate = (template: Template) => {
		navigate('/scripts/new', { state: { templateCode: template.code, templateName: template.name } });
	};

	return (
		<div className="flex flex-col h-full">
			<div className="border-b border-border p-4">
				<h2 className="text-xl font-bold">Script Templates</h2>
				<p className="text-sm text-muted-foreground mt-1">
					コピペで使えるテンプレート集。「Use Template」で新規スクリプトを作成できます。
				</p>
			</div>

			<div className="flex-1 overflow-auto p-6">
				<div className="grid gap-6 max-w-4xl">
					{templates.map((template) => (
						<div
							key={template.id}
							className="border border-border rounded-lg overflow-hidden bg-card"
						>
							<div className="p-4 border-b border-border">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-semibold text-lg">{template.name}</h3>
										<p className="text-sm text-muted-foreground mt-1">
											{template.description}
										</p>
									</div>
									<div className="flex gap-2">
										<button
											onClick={() => handleCopy(template)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
											title="Copy to clipboard"
										>
											{copiedId === template.id ? (
												<>
													<Check size={14} className="text-green-500" />
													Copied!
												</>
											) : (
												<>
													<Copy size={14} />
													Copy
												</>
											)}
										</button>
										<button
											onClick={() => handleUseTemplate(template)}
											className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
										>
											Use Template
											<ArrowRight size={14} />
										</button>
									</div>
								</div>
							</div>
							<pre className="p-4 bg-gray-900 text-gray-100 text-sm font-mono overflow-x-auto max-h-64 overflow-y-auto">
								<code>{template.code}</code>
							</pre>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
