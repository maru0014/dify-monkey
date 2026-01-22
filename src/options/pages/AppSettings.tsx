import React, { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { useDifySettings } from '@/shared/hooks';
import { SecurityMode, type AppSettings as AppSettingsType } from '@/shared/types';
import { SecurityModeSelector, MasterPasswordDialog } from '@/shared/components';
import { cryptoHelper } from '@/shared/lib/crypto-helper';
import { storage } from '@/shared/lib/storage';

export const AppSettings: React.FC = () => {
	const { settings, loading, updateSettings } = useDifySettings();
	const [formData, setFormData] = useState<AppSettingsType>({
		difyBaseUrl: '',
		theme: 'system' as 'system' | 'light' | 'dark',
		securityMode: SecurityMode.DEVICE_KEY,
		sessionTimeout: 30
	});
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [pendingSecurityMode, setPendingSecurityMode] = useState<SecurityMode | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (settings) {
			setFormData(settings);
		}
	}, [settings]);

	const handleSecurityModeChange = (newMode: SecurityMode) => {
		if (newMode === SecurityMode.MASTER_PASSWORD) {
			// Need to set a master password
			setPendingSecurityMode(newMode);
			setShowPasswordDialog(true);
		} else {
			setFormData({ ...formData, securityMode: newMode });
		}
	};

	const handlePasswordSubmit = async (password: string) => {
		if (pendingSecurityMode === SecurityMode.MASTER_PASSWORD) {
			// Re-encrypt all existing API keys with the new master password
			try {
				const apps = await storage.get('difyApps');
				if (apps) {
					for (const appId of Object.keys(apps)) {
						const app = apps[appId];
						// Get plaintext API key (might be encrypted with old method or plaintext)
						let plaintextKey: string;
						if (typeof app.apiKey === 'string') {
							plaintextKey = app.apiKey;
						} else {
							// Need to decrypt first - this should ideally ask for the old password
							// For now, skip already encrypted keys
							console.warn(`App ${appId} already has encrypted API key, skipping`);
							continue;
						}

						// Encrypt with new master password
						const encryptedKey = await cryptoHelper.encryptWithPassword(plaintextKey, password);
						apps[appId] = { ...app, apiKey: encryptedKey };
					}
					await storage.set('difyApps', apps);
				}

				// Generate verify hash
				const salt = cryptoHelper.generatePasswordSalt();
				const hash = await cryptoHelper.createPasswordHash(password, salt);

				setFormData({
					...formData,
					securityMode: SecurityMode.MASTER_PASSWORD,
					masterPasswordHash: hash,
					masterPasswordSalt: salt
				});
				setShowPasswordDialog(false);
				setPendingSecurityMode(null);
			} catch (error) {
				console.error('Failed to encrypt API keys:', error);
				alert('APIキーの暗号化に失敗しました。');
			}
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// If switching to DEVICE_KEY mode, re-encrypt API keys
			if (formData.securityMode === SecurityMode.DEVICE_KEY &&
				settings?.securityMode !== SecurityMode.DEVICE_KEY) {
				const apps = await storage.get('difyApps');
				if (apps) {
					for (const appId of Object.keys(apps)) {
						const app = apps[appId];
						if (typeof app.apiKey === 'string') {
							// Encrypt plaintext key with device key
							const encryptedKey = await cryptoHelper.encryptWithDeviceKey(app.apiKey);
							apps[appId] = { ...app, apiKey: encryptedKey };
						}
					}
					await storage.set('difyApps', apps);
				}
			}

			await updateSettings(formData);
			alert('設定を保存しました！');
		} catch (error) {
			console.error('Failed to save settings:', error);
			alert('設定の保存に失敗しました。');
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading settings...</p>
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold">設定</h2>
					<p className="text-sm text-muted-foreground mt-1">
						拡張機能の設定を構成します
					</p>
				</div>
				<button
					onClick={handleSave}
					disabled={isSaving}
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
				>
					<Save size={16} />
					{isSaving ? '保存中...' : '保存'}
				</button>
			</div>

			<div className="max-w-2xl space-y-8">
				{/* Security Section */}
				<div className="space-y-4">
					<div className="flex items-center gap-2 pb-2 border-b border-border">
						<Shield className="text-primary" size={20} />
						<h3 className="font-semibold text-lg">セキュリティ</h3>
					</div>

					<SecurityModeSelector
						value={formData.securityMode}
						onChange={handleSecurityModeChange}
					/>

					{formData.securityMode === SecurityMode.MASTER_PASSWORD && (
						<div>
							<label className="block text-sm font-medium mb-2">
								セッションタイムアウト（分）
							</label>
							<select
								value={formData.sessionTimeout || 30}
								onChange={(e) => setFormData({
									...formData,
									sessionTimeout: parseInt(e.target.value)
								})}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
							>
								<option value={5}>5分</option>
								<option value={15}>15分</option>
								<option value={30}>30分</option>
								<option value={60}>60分</option>
								<option value={120}>2時間</option>
							</select>
							<p className="text-xs text-muted-foreground mt-1">
								この時間が経過すると、マスターパスワードの再入力が必要になります。
							</p>
						</div>
					)}
				</div>

				{/* Connection Section */}
				<div className="space-y-4">
					<div className="pb-2 border-b border-border">
						<h3 className="font-semibold text-lg">接続設定</h3>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Dify Base URL</label>
						<input
							type="url"
							value={formData.difyBaseUrl}
							onChange={(e) => setFormData({ ...formData, difyBaseUrl: e.target.value })}
							className="w-full px-3 py-2 border border-border rounded-md bg-background"
							placeholder="https://api.dify.ai/v1"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							デフォルト: https://api.dify.ai/v1（セルフホストの場合は、インスタンスのURLを使用）
						</p>
					</div>
				</div>

				{/* Appearance Section */}
				<div className="space-y-4">
					<div className="pb-2 border-b border-border">
						<h3 className="font-semibold text-lg">外観</h3>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">テーマ</label>
						<select
							value={formData.theme}
							onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
							className="w-full px-3 py-2 border border-border rounded-md bg-background"
						>
							<option value="system">システム設定に従う</option>
							<option value="light">ライト</option>
							<option value="dark">ダーク</option>
						</select>
					</div>
				</div>

				{/* Developer Section */}
				<div className="space-y-4">
					<div className="pb-2 border-b border-border">
						<h3 className="font-semibold text-lg">開発者向け</h3>
					</div>

					<div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
						<div>
							<label className="font-medium">開発者モード</label>
							<p className="text-sm text-muted-foreground mt-1">
								詳細なエラーログとデバッグ情報をコンソールに出力します
							</p>
						</div>
						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={formData.devMode ?? false}
								onChange={(e) => setFormData({ ...formData, devMode: e.target.checked })}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
						</label>
					</div>

					{formData.devMode && (
						<div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
							<p className="text-sm text-yellow-800 dark:text-yellow-200">
								⚠️ 開発者モードが有効です。詳細なエラー情報がコンソールに出力されます。
								本番環境では無効にすることをお勧めします。
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Master Password Dialog */}
			<MasterPasswordDialog
				isOpen={showPasswordDialog}
				onClose={() => {
					setShowPasswordDialog(false);
					setPendingSecurityMode(null);
				}}
				onSubmit={handlePasswordSubmit}
				mode="set"
			/>
		</div>
	);
};
