import React from 'react';
import { Shield, Key, AlertTriangle } from 'lucide-react';
import { SecurityMode } from '@/shared/types';

interface SecurityModeSelectorProps {
	value: SecurityMode;
	onChange: (mode: SecurityMode) => void;
	disabled?: boolean;
}

const modeOptions = [
	{
		mode: SecurityMode.DEVICE_KEY,
		icon: Shield,
		title: '自動暗号化 (推奨)',
		description: 'デバイス固有のキーで自動的に暗号化。パスワード入力不要。',
		color: 'text-green-600 dark:text-green-400',
		bgColor: 'bg-green-50 dark:bg-green-900/20',
		borderColor: 'border-green-500',
	},
	{
		mode: SecurityMode.MASTER_PASSWORD,
		icon: Key,
		title: 'マスターパスワード',
		description: '最高のセキュリティ。ブラウザ起動時にパスワード入力が必要。',
		color: 'text-blue-600 dark:text-blue-400',
		bgColor: 'bg-blue-50 dark:bg-blue-900/20',
		borderColor: 'border-blue-500',
	},
	{
		mode: SecurityMode.PLAINTEXT,
		icon: AlertTriangle,
		title: '暗号化なし',
		description: '非推奨。APIキーが平文で保存されます。',
		color: 'text-yellow-600 dark:text-yellow-400',
		bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
		borderColor: 'border-yellow-500',
		warning: true,
	},
];

export const SecurityModeSelector: React.FC<SecurityModeSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium mb-2">
				APIキーの保護方式
			</label>

			<div className="space-y-2">
				{modeOptions.map((option) => {
					const isSelected = value === option.mode;
					const Icon = option.icon;

					return (
						<button
							key={option.mode}
							type="button"
							onClick={() => !disabled && onChange(option.mode)}
							disabled={disabled}
							className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${isSelected
									? `${option.borderColor} ${option.bgColor}`
									: 'border-border hover:border-muted-foreground/50'
								}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
						>
							<div className="flex items-start gap-3">
								<div className={`mt-0.5 ${option.color}`}>
									<Icon size={20} />
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{option.title}</span>
										{isSelected && (
											<span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
												選択中
											</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground mt-1">
										{option.description}
									</p>
									{option.warning && isSelected && (
										<div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded text-xs text-yellow-800 dark:text-yellow-200">
											⚠️ この設定は推奨されません。APIキーが他のブラウザプロファイルや拡張機能からアクセス可能になります。
										</div>
									)}
								</div>
								<div className="flex items-center">
									<div
										className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected
												? `${option.borderColor} ${option.bgColor}`
												: 'border-muted-foreground/30'
											}
                    `}
									>
										{isSelected && (
											<div className={`w-2.5 h-2.5 rounded-full ${option.color.replace('text-', 'bg-')}`} />
										)}
									</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};
