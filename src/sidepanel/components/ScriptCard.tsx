import React from 'react';
import { Play, Power, PowerOff, Loader2 } from 'lucide-react';
import { UserScript, ScriptExecution } from '@/shared/types';

interface ScriptCardProps {
	script: UserScript;
	execution?: ScriptExecution;
	isCurrentPageMatch?: boolean;
	onExecute: (scriptId: string) => void;
	onCancel?: (executionId: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({
	script,
	execution,
	isCurrentPageMatch = false,
	onExecute,
}) => {
	const isRunning = execution?.status === 'running';

	return (
		<div
			className={`border rounded-lg p-3 transition-all border-border hover:border-border/80 ${isRunning ? 'opacity-60' : ''
				}`}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						{isRunning ? (
							<Loader2 size={14} className="animate-spin text-blue-500 flex-shrink-0" />
						) : script.enabled ? (
							<Power size={14} className="text-green-500 flex-shrink-0" />
						) : (
							<PowerOff size={14} className="text-muted-foreground flex-shrink-0" />
						)}
						<h3 className="font-medium text-sm truncate">{script.name}</h3>
						{isRunning && (
							<span className="text-xs text-blue-500 flex-shrink-0">Running...</span>
						)}
					</div>
					<p className="text-xs text-muted-foreground mt-1 truncate">
						{script.matches.join(', ')}
					</p>
				</div>

				<button
					onClick={() => onExecute(script.id)}
					disabled={!script.enabled || isRunning || !isCurrentPageMatch}
					className="flex-shrink-0 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					title={
						isRunning
							? 'Running...'
							: !script.enabled
								? 'Script disabled'
								: !isCurrentPageMatch
									? 'Not available on this page'
									: 'Run'
					}
				>
					<Play size={16} />
				</button>
			</div>
		</div>
	);
};
