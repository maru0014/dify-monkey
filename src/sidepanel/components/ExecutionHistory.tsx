import React from 'react';
import { CheckCircle, XCircle, Clock, Copy, RotateCcw } from 'lucide-react';
import { ScriptExecution } from '@/shared/types';

interface ExecutionHistoryProps {
	executions: ScriptExecution[];
	onRerun?: (scriptId: string) => void;
	onCopyResult?: (result: any) => void;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({
	executions,
	onRerun,
	onCopyResult,
}) => {
	if (executions.length === 0) {
		return (
			<div className="text-center text-muted-foreground text-sm py-4">
				No execution history
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{executions.map((exec) => {
				const isSuccess = exec.status === 'success';
				const duration = exec.finishedAt
					? ((exec.finishedAt - exec.startedAt) / 1000).toFixed(1)
					: '-';

				return (
					<div
						key={exec.id}
						className={`border rounded-lg p-3 ${isSuccess ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
							}`}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{isSuccess ? (
									<CheckCircle size={16} className="text-green-500" />
								) : (
									<XCircle size={16} className="text-red-500" />
								)}
								<span className="font-medium text-sm">{exec.scriptName}</span>
							</div>
							<div className="flex items-center gap-1">
								{isSuccess && exec.result && onCopyResult && (
									<button
										onClick={() => onCopyResult(exec.result)}
										className="p-1.5 hover:bg-accent rounded transition-colors"
										title="Copy result"
									>
										<Copy size={14} />
									</button>
								)}
								{onRerun && (
									<button
										onClick={() => onRerun(exec.scriptId)}
										className="p-1.5 hover:bg-accent rounded transition-colors"
										title="Run again"
									>
										<RotateCcw size={14} />
									</button>
								)}
							</div>
						</div>

						<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
							<span className="flex items-center gap-1">
								<Clock size={12} />
								{duration}s
							</span>
							<span>
								{new Date(exec.startedAt).toLocaleTimeString()}
							</span>
						</div>

						{!isSuccess && exec.error && (
							<div className="mt-2 text-xs text-red-500 line-clamp-2">
								{exec.error}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
