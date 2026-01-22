import React from 'react';
import { Shield, Eye, Lock, Server, AlertTriangle, ExternalLink } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
	return (
		<div className="p-8 max-w-3xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">プライバシーポリシー</h1>
				<p className="text-muted-foreground">
					最終更新日: 2024年1月
				</p>
			</div>

			<div className="space-y-8">
				{/* Introduction */}
				<section>
					<p className="text-muted-foreground">
						Dify Monkey（以下「本拡張機能」）は、ユーザーのプライバシーを尊重し、
						個人情報の保護に努めています。本ポリシーでは、本拡張機能が収集、
						使用、保護する情報について説明します。
					</p>
				</section>

				{/* Data Collection */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Eye className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">収集する情報</h2>
					</div>

					<div className="space-y-4">
						<div className="p-4 bg-accent/30 rounded-lg">
							<h3 className="font-medium mb-2">ローカルに保存される情報</h3>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• Dify APIキー（暗号化して保存）</li>
								<li>• ユーザースクリプト</li>
								<li>• 拡張機能の設定（テーマ、セキュリティモードなど）</li>
								<li>• チャット履歴（ブラウザセッション中のみ）</li>
							</ul>
						</div>

						<div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
							<h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
								✓ 収集しない情報
							</h3>
							<ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
								<li>• 個人を特定できる情報</li>
								<li>• 閲覧履歴やブラウジングデータ</li>
								<li>• 分析データやテレメトリ</li>
								<li>• 外部サーバーへのデータ送信はありません</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Data Usage */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Server className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">情報の使用方法</h2>
					</div>

					<div className="space-y-3 text-muted-foreground">
						<p>本拡張機能は以下の目的で情報を使用します：</p>
						<ul className="space-y-2">
							<li className="flex gap-2">
								<span className="text-primary">1.</span>
								<span>Dify APIへのリクエスト送信（APIキーを使用）</span>
							</li>
							<li className="flex gap-2">
								<span className="text-primary">2.</span>
								<span>ユーザースクリプトの実行と管理</span>
							</li>
							<li className="flex gap-2">
								<span className="text-primary">3.</span>
								<span>設定の保存と復元</span>
							</li>
						</ul>
					</div>
				</section>

				{/* Data Security */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Lock className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">データセキュリティ</h2>
					</div>

					<div className="space-y-4">
						<p className="text-muted-foreground">
							本拡張機能は以下のセキュリティ対策を実施しています：
						</p>

						<div className="grid gap-3">
							<div className="p-3 bg-accent/30 rounded-lg">
								<h4 className="font-medium text-sm">🔐 APIキー暗号化</h4>
								<p className="text-xs text-muted-foreground mt-1">
									AES-GCM暗号化を使用してAPIキーを保護
								</p>
							</div>
							<div className="p-3 bg-accent/30 rounded-lg">
								<h4 className="font-medium text-sm">🔑 デバイスキー管理</h4>
								<p className="text-xs text-muted-foreground mt-1">
									IndexedDBを使用してデバイス固有のキーを安全に保存
								</p>
							</div>
							<div className="p-3 bg-accent/30 rounded-lg">
								<h4 className="font-medium text-sm">🛡️ ローカルストレージ</h4>
								<p className="text-xs text-muted-foreground mt-1">
									すべてのデータはブラウザ内にローカル保存
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Third Party */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<ExternalLink className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">第三者サービス</h2>
					</div>

					<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
						<p className="text-sm text-yellow-800 dark:text-yellow-200">
							本拡張機能はDify APIに接続します。Difyに送信されるデータについては、
							Difyのプライバシーポリシーをご確認ください。
						</p>
						<a
							href="https://dify.ai/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 mt-2 text-sm text-yellow-700 dark:text-yellow-300 hover:underline"
						>
							<ExternalLink size={14} />
							Difyプライバシーポリシー
						</a>
					</div>
				</section>

				{/* User Rights */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Shield className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">ユーザーの権利</h2>
					</div>

					<div className="space-y-3 text-muted-foreground">
						<p>ユーザーは以下の権利を有します：</p>
						<ul className="space-y-2">
							<li>• すべてのデータはローカルに保存されており、いつでも削除可能</li>
							<li>• 拡張機能をアンインストールするとすべてのデータが削除されます</li>
							<li>• セキュリティモードをいつでも変更できます</li>
						</ul>
					</div>
				</section>

				{/* Contact */}
				<section>
					<div className="flex items-center gap-2 mb-4">
						<AlertTriangle className="text-primary" size={24} />
						<h2 className="text-xl font-semibold">お問い合わせ</h2>
					</div>

					<p className="text-muted-foreground">
						プライバシーに関するご質問やご懸念がある場合は、
						GitHubリポジトリのIssueでお知らせください。
					</p>
				</section>
			</div>
		</div>
	);
};
