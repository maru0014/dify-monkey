import React from 'react';
import { Link } from 'react-router-dom';
import {
	Rocket,
	FileCode,
	Layers,
	MessageSquare,
	Settings,
	Play,
	ArrowRight,
	Zap,
	BookOpen
} from 'lucide-react';

export const QuickStart: React.FC = () => {
	const steps = [
		{
			number: 1,
			icon: Layers,
			title: 'Difyアプリを登録',
			description: 'Dify管理画面からAPI Keyを取得し、拡張機能に登録します。',
			link: '/apps',
			linkText: 'Dify Appsを開く',
		},
		{
			number: 2,
			icon: Settings,
			title: '接続設定',
			description: 'Dify Base URLを設定します（デフォルトはapi.dify.ai）。',
			link: '/settings',
			linkText: '設定を開く',
		},
		{
			number: 3,
			icon: FileCode,
			title: 'スクリプトを作成',
			description: 'JavaScriptでDify Workflowを呼び出すスクリプトを作成します。',
			link: '/scripts/new',
			linkText: '新規スクリプト',
		},
		{
			number: 4,
			icon: Play,
			title: '実行！',
			description: 'サイドパネルまたはコンテキストメニューからスクリプトを実行します。',
			link: null,
			linkText: null,
		},
	];

	const features = [
		{
			icon: Zap,
			title: 'ワークフロー実行',
			description: 'dify.workflow.run()でDifyワークフローを呼び出し',
		},
		{
			icon: MessageSquare,
			title: 'UI表示',
			description: 'dify.ui.toast()やdify.ui.prompt()でユーザーと対話',
		},
		{
			icon: BookOpen,
			title: 'ページ取得',
			description: 'dify.page.readContent()でページ内容を取得',
		},
	];

	return (
		<div className="p-8 max-w-4xl mx-auto">
			{/* Header */}
			<div className="text-center mb-12">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
					<Rocket className="text-primary" size={32} />
				</div>
				<h1 className="text-3xl font-bold mb-2">クイックスタートガイド</h1>
				<p className="text-muted-foreground">
					Dify Monkeyを使い始めるための4ステップ
				</p>
			</div>

			{/* Steps */}
			<div className="space-y-6 mb-12">
				{steps.map((step) => {
					const Icon = step.icon;
					return (
						<div
							key={step.number}
							className="flex gap-4 p-6 bg-accent/30 rounded-xl border border-border"
						>
							<div className="flex-shrink-0">
								<div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
									{step.number}
								</div>
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-2">
									<Icon size={20} className="text-primary" />
									<h3 className="font-semibold text-lg">{step.title}</h3>
								</div>
								<p className="text-muted-foreground mb-3">{step.description}</p>
								{step.link && (
									<Link
										to={step.link}
										className="inline-flex items-center gap-1 text-primary hover:underline"
									>
										{step.linkText}
										<ArrowRight size={16} />
									</Link>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Features */}
			<div className="mb-12">
				<h2 className="text-xl font-semibold mb-4">主要なAPI</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className="p-4 bg-accent/20 rounded-lg border border-border"
							>
								<Icon size={24} className="text-primary mb-2" />
								<h3 className="font-medium mb-1">{feature.title}</h3>
								<p className="text-sm text-muted-foreground">{feature.description}</p>
							</div>
						);
					})}
				</div>
			</div>

			{/* Sample Code */}
			<div className="mb-12">
				<h2 className="text-xl font-semibold mb-4">サンプルコード</h2>
				<div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
					<pre className="text-sm text-zinc-100">
						{`// ページの内容を要約するスクリプト
const content = await dify.page.readContent();

const result = await dify.workflow.run({
  inputs: {
    text: content.content
  }
});

dify.ui.toast('要約が完了しました！', 'success');
dify.log(result.data.outputs);`}
					</pre>
				</div>
			</div>

			{/* Next Steps */}
			<div className="text-center p-6 bg-primary/5 rounded-xl border border-primary/20">
				<h2 className="font-semibold mb-2">準備ができましたか？</h2>
				<p className="text-muted-foreground mb-4">
					テンプレートを使って最初のスクリプトを作成しましょう！
				</p>
				<div className="flex justify-center gap-4">
					<Link
						to="/templates"
						className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						テンプレート一覧
						<ArrowRight size={16} />
					</Link>
					<Link
						to="/reference"
						className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent"
					>
						APIリファレンス
					</Link>
				</div>
			</div>
		</div>
	);
};
