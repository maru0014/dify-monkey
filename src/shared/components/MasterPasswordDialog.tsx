import React, { useState } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { cryptoHelper } from '@/shared/lib/crypto-helper';

interface MasterPasswordDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (password: string) => void;
	mode: 'set' | 'enter' | 'change';
	title?: string;
}

export const MasterPasswordDialog: React.FC<MasterPasswordDialogProps> = ({
	isOpen,
	onClose,
	onSubmit,
	mode,
	title,
}) => {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState('');

	if (!isOpen) return null;

	const getTitle = () => {
		if (title) return title;
		switch (mode) {
			case 'set':
				return 'マスターパスワードを設定';
			case 'enter':
				return 'マスターパスワードを入力';
			case 'change':
				return 'マスターパスワードを変更';
		}
	};

	const getPasswordStrength = () => {
		const score = cryptoHelper.getPasswordStrengthScore(password);
		if (score < 30) return { label: '弱い', color: 'bg-red-500', width: '25%' };
		if (score < 60) return { label: '普通', color: 'bg-yellow-500', width: '50%' };
		if (score < 80) return { label: '強い', color: 'bg-green-500', width: '75%' };
		return { label: 'とても強い', color: 'bg-green-600', width: '100%' };
	};

	const handleSubmit = () => {
		setError('');

		if (mode === 'enter') {
			if (!password) {
				setError('パスワードを入力してください');
				return;
			}
			onSubmit(password);
			setPassword('');
			return;
		}

		// For 'set' and 'change' modes
		const validation = cryptoHelper.validatePasswordStrength(password);
		if (!validation.valid) {
			setError(validation.message);
			return;
		}

		if (password !== confirmPassword) {
			setError('パスワードが一致しません');
			return;
		}

		onSubmit(password);
		setPassword('');
		setConfirmPassword('');
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	};

	const strength = getPasswordStrength();
	const needsConfirmation = mode === 'set' || mode === 'change';

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Lock className="text-primary" size={20} />
						<h3 className="font-semibold text-lg">{getTitle()}</h3>
					</div>
					<button
						onClick={onClose}
						className="p-1 hover:bg-accent rounded"
					>
						<X size={20} />
					</button>
				</div>

				<div className="space-y-4">
					{/* Password input */}
					<div>
						<label className="block text-sm font-medium mb-2">
							{mode === 'enter' ? 'パスワード' : '新しいパスワード'}
						</label>
						<div className="relative">
							<input
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background"
								placeholder="パスワードを入力"
								autoFocus
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
							>
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
					</div>

					{/* Password strength indicator (for set/change modes) */}
					{needsConfirmation && password && (
						<div className="space-y-1">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">パスワード強度</span>
								<span className={strength.color.replace('bg-', 'text-')}>{strength.label}</span>
							</div>
							<div className="h-1.5 bg-muted rounded-full overflow-hidden">
								<div
									className={`h-full ${strength.color} transition-all duration-300`}
									style={{ width: strength.width }}
								/>
							</div>
						</div>
					)}

					{/* Confirm password (for set/change modes) */}
					{needsConfirmation && (
						<div>
							<label className="block text-sm font-medium mb-2">
								パスワードを確認
							</label>
							<input
								type={showPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full px-3 py-2 border border-border rounded-md bg-background"
								placeholder="パスワードを再入力"
							/>
						</div>
					)}

					{/* Error message */}
					{error && (
						<div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
							{error}
						</div>
					)}

					{/* Buttons */}
					<div className="flex gap-2 pt-2">
						<button
							onClick={handleSubmit}
							className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						>
							{mode === 'enter' ? 'ロック解除' : '設定'}
						</button>
						<button
							onClick={onClose}
							className="px-4 py-2 border border-border rounded-md hover:bg-accent"
						>
							キャンセル
						</button>
					</div>

					{/* Hint */}
					{needsConfirmation && (
						<p className="text-xs text-muted-foreground">
							💡 パスワードは8文字以上で、大文字、小文字、数字、記号を含めることをお勧めします。
						</p>
					)}
				</div>
			</div>
		</div>
	);
};
