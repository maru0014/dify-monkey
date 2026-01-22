import React, { useState } from 'react';
import { Shield, Key, Code, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { storage } from '@/shared/lib/storage';

interface WelcomeDialogProps {
	onClose: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ onClose }) => {
	const [currentStep, setCurrentStep] = useState(0);

	const steps = [
		{
			icon: Shield,
			title: 'Dify Monkeyへようこそ',
			content: (
				<div className="space-y-4">
					<p>
						Dify MonkeyはDify AIワークフローをウェブページから直接実行できるChrome拡張機能です。
					</p>
					<div className="bg-accent/50 p-4 rounded-lg">
						<h4 className="font-medium mb-2">主な機能</h4>
						<ul className="text-sm space-y-1 text-muted-foreground">
							<li>• ユーザースクリプトでDifyワークフローを自動実行</li>
							<li>• サイドパネルからDifyチャットボットにアクセス</li>
							<li>• ページコンテンツをAIに送信して処理</li>
						</ul>
					</div>
				</div>
			),
		},
		{
			icon: Key,
			title: '必要な権限について',
			content: (
				<div className="space-y-4">
					<p className="text-sm text-muted-foreground">
						この拡張機能は以下の権限を使用します：
					</p>
					<div className="space-y-3">
						<div className="flex gap-3 p-3 bg-accent/30 rounded-lg">
							<Code size={20} className="text-primary mt-0.5" />
							<div>
								<h4 className="font-medium text-sm">ユーザースクリプト実行</h4>
								<p className="text-xs text-muted-foreground">
									指定したウェブサイトでカスタムスクリプトを実行します
								</p>
							</div>
						</div>
						<div className="flex gap-3 p-3 bg-accent/30 rounded-lg">
							<Shield size={20} className="text-primary mt-0.5" />
							<div>
								<h4 className="font-medium text-sm">ストレージ</h4>
								<p className="text-xs text-muted-foreground">
									設定、スクリプト、APIキーを安全に保存します
								</p>
							</div>
						</div>
					</div>
				</div>
			),
		},
		{
			icon: AlertTriangle,
			title: 'セキュリティについて',
			content: (
				<div className="space-y-4">
					<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
						<h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
							⚠️ 重要なセキュリティ情報
						</h4>
						<ul className="text-sm space-y-2 text-yellow-700 dark:text-yellow-300">
							<li>• APIキーは暗号化して保存されます（デフォルト設定）</li>
							<li>• 信頼できるスクリプトのみを使用してください</li>
							<li>• APIキーは外部と共有しないでください</li>
						</ul>
					</div>
					<p className="text-sm text-muted-foreground">
						詳細は設定画面の「セキュリティ」セクションで確認できます。
					</p>
				</div>
			),
		},
	];

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleComplete();
		}
	};

	const handleComplete = async () => {
		// Mark welcome as shown
		const settings = await storage.get('settings');
		if (settings) {
			await storage.set('settings', { ...settings, welcomeShown: true });
		}
		onClose();
	};

	const currentStepData = steps[currentStep];
	const Icon = currentStepData.icon;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-background border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Icon className="text-primary" size={24} />
						</div>
						<h2 className="text-xl font-bold">{currentStepData.title}</h2>
					</div>
					<button
						onClick={handleComplete}
						className="p-1 hover:bg-accent rounded"
						title="スキップ"
					>
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="mb-6">
					{currentStepData.content}
				</div>

				{/* Progress dots */}
				<div className="flex justify-center gap-2 mb-6">
					{steps.map((_, index) => (
						<div
							key={index}
							className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
								? 'bg-primary'
								: index < currentStep
									? 'bg-primary/50'
									: 'bg-muted'
								}`}
						/>
					))}
				</div>

				{/* Actions */}
				<div className="flex justify-between">
					<button
						onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
						className={`px-4 py-2 border border-border rounded-md hover:bg-accent ${currentStep === 0 ? 'invisible' : ''
							}`}
					>
						戻る
					</button>
					<button
						onClick={handleNext}
						className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						{currentStep === steps.length - 1 ? '始める' : '次へ'}
					</button>
				</div>

				{/* Footer link */}
				<div className="mt-4 text-center">
					<a
						href="https://github.com/your-repo/dify-monkey/blob/main/PRIVACY.md"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
					>
						<ExternalLink size={12} />
						プライバシーポリシー
					</a>
				</div>
			</div>
		</div>
	);
};
