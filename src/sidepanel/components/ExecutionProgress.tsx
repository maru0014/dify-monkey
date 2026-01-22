import React, { useState, useEffect } from 'react';
import { Loader2, Square } from 'lucide-react';
import { ScriptExecution } from '@/shared/types';

interface ExecutionProgressProps {
	execution: ScriptExecution;
	onCancel?: (executionId: string) => void;
}

export const ExecutionProgress: React.FC<ExecutionProgressProps> = ({
	execution,
	onCancel,
}) => {
	const [elapsed, setElapsed] = useState(0);

	// Update elapsed time every second
	useEffect(() => {
		if (execution.finishedAt) {
			// Already finished, no need to update
			setElapsed((execution.finishedAt - execution.startedAt) / 1000);
			return;
		}

		// Initial value
		setElapsed((Date.now() - execution.startedAt) / 1000);

		// Update every second
		const interval = setInterval(() => {
			setElapsed((Date.now() - execution.startedAt) / 1000);
		}, 1000);

		return () => clearInterval(interval);
	}, [execution.startedAt, execution.finishedAt]);

	return (
		<div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-3">
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<Loader2 size={16} className="animate-spin text-blue-500" />
					<span className="font-medium text-sm">{execution.scriptName}</span>
				</div>
				{onCancel && (
					<button
						onClick={() => onCancel(execution.id)}
						className="p-1.5 hover:bg-red-500/10 text-red-500 rounded transition-colors"
						title="Stop execution"
					>
						<Square size={14} />
					</button>
				)}
			</div>

			{/* Progress bar */}
			<div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
				<div
					className="h-full bg-blue-500 transition-all duration-300"
					style={{ width: `${execution.progress}%` }}
				/>
			</div>

			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{execution.currentStep || 'Processing...'}</span>
				<span>{elapsed.toFixed(1)}s</span>
			</div>
		</div>
	);
};
