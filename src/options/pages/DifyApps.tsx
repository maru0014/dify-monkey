import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Globe, Save } from 'lucide-react';
import { useDifyApps, useDifySettings } from '@/shared/hooks';
import { DifyApp, type EncryptedApiKey, SecurityMode, type AppSettings } from '@/shared/types';
import { cryptoHelper } from '@/shared/lib/crypto-helper';
import { storage } from '@/shared/lib/storage';
import { MasterPasswordDialog } from '@/shared/components';

// Check if API key is encrypted
const isEncryptedApiKey = (apiKey: EncryptedApiKey | string): apiKey is EncryptedApiKey => {
	return typeof apiKey === 'object' && 'encrypted' in apiKey && 'mode' in apiKey;
};

// APIキーを部分的にマスクして表示する（先頭4文字 + ••••••• + 末尾4文字）
// For encrypted keys, show a placeholder
const maskApiKey = (apiKey: EncryptedApiKey | string): string => {
	if (isEncryptedApiKey(apiKey)) {
		// For encrypted keys, show mode indicator
		return `🔐 Encrypted (${apiKey.mode})`;
	}
	// Plaintext key
	if (apiKey.length <= 12) {
		return '•'.repeat(apiKey.length);
	}
	return `${apiKey.slice(0, 4)}${'•'.repeat(7)}${apiKey.slice(-4)}`;
};

export const DifyApps: React.FC = () => {
	const { apps, loading, addApp, removeApp, updateApp } = useDifyApps();
	const { settings } = useDifySettings();
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState({ name: '', apiKey: '', appType: 'chatflow' as 'workflow' | 'chatflow' });
	const [editingApp, setEditingApp] = useState<DifyApp | null>(null);
	const [editFormData, setEditFormData] = useState({ name: '', apiKey: '', appType: 'chatflow' as 'workflow' | 'chatflow' });
	const [isEncrypting, setIsEncrypting] = useState(false);

	// Master password dialog state
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [pendingAction, setPendingAction] = useState<'add' | 'update' | null>(null);

	// Base URL state
	const [baseUrl, setBaseUrl] = useState('');
	const [isSavingBaseUrl, setIsSavingBaseUrl] = useState(false);

	useEffect(() => {
		if (settings?.difyBaseUrl) {
			setBaseUrl(settings.difyBaseUrl);
		}
	}, [settings]);

	const handleSaveBaseUrl = async () => {
		if (!baseUrl) return;
		setIsSavingBaseUrl(true);
		try {
			// Update settings using current settings as base
			const currentSettings = await storage.get('settings');
			const defaults: AppSettings = {
				difyBaseUrl: '',
				theme: 'system',
				securityMode: SecurityMode.DEVICE_KEY
			};
			// Use separate assignment to avoid "duplicate identifier" TS error in object literal
			const newSettings = { ...defaults, ...(currentSettings || {}) };
			newSettings.difyBaseUrl = baseUrl;

			await storage.set('settings', newSettings);
			// Optionally show toast/indicator
		} catch (error) {
			console.error('Failed to update base URL:', error);
			alert('Base URLの更新に失敗しました。');
		} finally {
			setIsSavingBaseUrl(false);
		}
	};

	const handleAdd = async (masterPassword?: string) => {
		if (!formData.name || !formData.apiKey) return;

		const securityMode = settings?.securityMode ?? SecurityMode.DEVICE_KEY;

		// If master password mode and no password provided, show dialog
		if (securityMode === SecurityMode.MASTER_PASSWORD && !masterPassword) {
			setPendingAction('add');
			setShowPasswordDialog(true);
			return;
		}

		setIsEncrypting(true);
		try {
			// Encrypt API key based on current security mode
			let apiKey: string | EncryptedApiKey = formData.apiKey;

			if (securityMode === SecurityMode.DEVICE_KEY) {
				apiKey = await cryptoHelper.encryptWithDeviceKey(formData.apiKey);
			} else if (securityMode === SecurityMode.MASTER_PASSWORD && masterPassword) {
				// Verify password if hash is available
				if (settings?.masterPasswordHash && settings?.masterPasswordSalt) {
					const hash = await cryptoHelper.createPasswordHash(masterPassword, settings.masterPasswordSalt);
					if (hash !== settings.masterPasswordHash) {
						alert('マスターパスワードが間違っています。');
						setIsEncrypting(false);
						return;
					}
				}
				apiKey = await cryptoHelper.encryptWithPassword(formData.apiKey, masterPassword);
			}
			// PLAINTEXT mode: keep as is

			await addApp({
				id: `app-${Date.now()}`,
				name: formData.name,
				apiKey,
				appType: formData.appType,
			});
			setFormData({ name: '', apiKey: '', appType: 'chatflow' });
			setShowForm(false);
		} catch (error) {
			console.error('Failed to encrypt API key:', error);
			alert('APIキーの暗号化に失敗しました。');
		} finally {
			setIsEncrypting(false);
		}
	};

	const handleEdit = (app: DifyApp) => {
		setEditingApp(app);
		// For security, user must re-enter API key when editing
		// Encrypted keys cannot be decrypted without proper context
		setEditFormData({ name: app.name, apiKey: '', appType: app.appType });
	};

	const handleUpdate = async (masterPassword?: string) => {
		if (!editingApp || !editFormData.name) return;

		const securityMode = settings?.securityMode ?? SecurityMode.DEVICE_KEY;

		// Only check for password if updating API key
		if (editFormData.apiKey && securityMode === SecurityMode.MASTER_PASSWORD && !masterPassword) {
			setPendingAction('update');
			setShowPasswordDialog(true);
			return;
		}

		setIsEncrypting(true);
		try {
			// If API key is empty, keep the existing one
			const updates: Partial<DifyApp> = {
				name: editFormData.name,
				appType: editFormData.appType,
			};

			// Only update API key if a new one is provided
			if (editFormData.apiKey) {
				if (securityMode === SecurityMode.DEVICE_KEY) {
					updates.apiKey = await cryptoHelper.encryptWithDeviceKey(editFormData.apiKey);
				} else if (securityMode === SecurityMode.MASTER_PASSWORD && masterPassword) {
					// Verify password if hash is available
					if (settings?.masterPasswordHash && settings?.masterPasswordSalt) {
						const hash = await cryptoHelper.createPasswordHash(masterPassword, settings.masterPasswordSalt);
						if (hash !== settings.masterPasswordHash) {
							alert('マスターパスワードが間違っています。');
							setIsEncrypting(false);
							return;
						}
					}
					updates.apiKey = await cryptoHelper.encryptWithPassword(editFormData.apiKey, masterPassword);
				} else {
					updates.apiKey = editFormData.apiKey;
				}
			}

			await updateApp(editingApp.id, updates);
			setEditingApp(null);
			setEditFormData({ name: '', apiKey: '', appType: 'chatflow' });
		} catch (error) {
			console.error('Failed to update app:', error);
			alert('アプリの更新に失敗しました。');
		} finally {
			setIsEncrypting(false);
		}
	};

	// Handle master password dialog submission
	const handlePasswordSubmit = (password: string) => {
		setShowPasswordDialog(false);
		if (pendingAction === 'add') {
			handleAdd(password);
		} else if (pendingAction === 'update') {
			handleUpdate(password);
		}
		setPendingAction(null);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading apps...</p>
			</div>
		);
	}

	return (
		<div className="p-8">
			{/* Connection Settings */}
			<div className="mb-8 border rounded-lg p-6 bg-card">
				<h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<Globe className="w-5 h-5 text-blue-500" />
					API接続設定
				</h2>
				<div className="flex gap-2 items-center">
					<div className="flex-1">
						<input
							type="text"
							value={baseUrl}
							onChange={(e) => setBaseUrl(e.target.value)}
							placeholder="https://api.dify.ai/v1"
							className="w-full px-3 py-2 border border-border rounded-md bg-background"
						/>
					</div>
					<button
						onClick={handleSaveBaseUrl}
						disabled={isSavingBaseUrl || !baseUrl || baseUrl === settings?.difyBaseUrl}
						className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 disabled:opacity-50"
					>
						<Save className="w-4 h-4" />
						{isSavingBaseUrl ? '保存中...' : '保存'}
					</button>
				</div>
				<p className="text-sm text-muted-foreground mt-2">
					Dify APIのBase URLを入力してください。開発環境と本番環境の切り替えはここで行えます。
				</p>
			</div>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold">Dify Apps</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Manage your Dify application connections
					</p>
				</div>
				<button
					onClick={() => setShowForm(!showForm)}
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					<Plus size={16} />
					Add App
				</button>
			</div>

			{showForm && (
				<div className="mb-6 p-4 border border-border rounded-lg bg-accent/50">
					<h3 className="font-semibold mb-4">New Dify App</h3>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-2">App Name</label>
							<input
								type="text"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
								placeholder="Translator"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">API Key</label>
							<input
								type="password"
								value={formData.apiKey}
								onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
								placeholder="app-..."
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">App Type</label>
							<select
								value={formData.appType}
								onChange={(e) => setFormData({ ...formData, appType: e.target.value as 'workflow' | 'chatflow' })}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
							>
								<option value="chatflow">Chatflow</option>
								<option value="workflow">Workflow</option>
							</select>
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => handleAdd()}
								disabled={isEncrypting}
								className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
							>
								{isEncrypting ? '暗号化中...' : 'Add'}
							</button>
							<button
								onClick={() => {
									setShowForm(false);
									setFormData({ name: '', apiKey: '', appType: 'chatflow' });
								}}
								className="px-4 py-2 border border-border rounded-md hover:bg-accent"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}

			{apps.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-border rounded-lg">
					<p className="text-muted-foreground">No Dify apps configured</p>
					<button
						onClick={() => setShowForm(true)}
						className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
					>
						<Plus size={16} />
						Add your first app
					</button>
				</div>
			) : (
				<div className="grid gap-4">
					{apps.map((app) => (
						<div
							key={app.id}
							className="border border-border rounded-lg p-4"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h3 className="font-semibold">{app.name}</h3>
										<span className={`text-xs px-2 py-0.5 rounded ${app.appType === 'chatflow'
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
											: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
											}`}>
											{app.appType === 'chatflow' ? 'Chatflow' : 'Workflow'}
										</span>
									</div>
									<div className="flex items-center gap-2 mt-2">
										<code className="text-xs bg-muted px-2 py-1 rounded font-mono">
											{maskApiKey(app.apiKey)}
										</code>
									</div>
								</div>
								<div className="flex items-center gap-1">
									<button
										onClick={() => handleEdit(app)}
										className="p-2 hover:bg-accent rounded"
										title="Edit"
									>
										<Pencil size={16} />
									</button>
									<button
										onClick={async () => {
											if (confirm(`Delete "${app.name}"?`)) {
												await removeApp(app.id);
											}
										}}
										className="p-2 hover:bg-destructive/10 text-destructive rounded"
										title="Delete"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* 編集モーダル */}
			{editingApp && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
						<h3 className="font-semibold mb-4">Edit Dify App</h3>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">App Name</label>
								<input
									type="text"
									value={editFormData.name}
									onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
									className="w-full px-3 py-2 border border-border rounded-md bg-background"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">API Key</label>
								<input
									type="text"
									value={editFormData.apiKey}
									onChange={(e) => setEditFormData({ ...editFormData, apiKey: e.target.value })}
									className="w-full px-3 py-2 border border-border rounded-md bg-background font-mono text-sm"
									placeholder="••••••••••••（変更する場合のみ入力）"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									空欄のままにすると、現在のAPIキーが保持されます。
								</p>
							</div>
							<div>
								<label className="block text-sm font-medium mb-2">App Type</label>
								<select
									value={editFormData.appType}
									onChange={(e) => setEditFormData({ ...editFormData, appType: e.target.value as 'workflow' | 'chatflow' })}
									className="w-full px-3 py-2 border border-border rounded-md bg-background"
								>
									<option value="chatflow">Chatflow</option>
									<option value="workflow">Workflow</option>
								</select>
							</div>
							<div className="flex gap-2 pt-2">
								<button
									onClick={() => handleUpdate()}
									disabled={isEncrypting}
									className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
								>
									{isEncrypting ? '暗号化中...' : 'Save'}
								</button>
								<button
									onClick={() => {
										setEditingApp(null);
										setEditFormData({ name: '', apiKey: '', appType: 'chatflow' });
									}}
									className="px-4 py-2 border border-border rounded-md hover:bg-accent"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Master Password Dialog */}
			<MasterPasswordDialog
				isOpen={showPasswordDialog}
				onClose={() => {
					setShowPasswordDialog(false);
					setPendingAction(null);
				}}
				onSubmit={handlePasswordSubmit}
				mode="enter"
				title="マスターパスワードを入力"
			/>
		</div>
	);
};
