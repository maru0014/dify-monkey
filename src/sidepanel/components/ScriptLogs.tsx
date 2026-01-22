import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { ScriptLog } from '@/shared/types';

interface ScriptLogsProps {
	logs: ScriptLog[];
}

export const ScriptLogs: React.FC<ScriptLogsProps> = ({ logs }) => {
	const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

	if (logs.length === 0) {
		return (
			<div className="text-center text-muted-foreground text-sm py-4">
				No logs yet. Use <code className="bg-accent px-1 rounded">dify.log()</code> in your scripts.
			</div>
		);
	}

	const toggleExpand = (logId: string) => {
		setExpandedLogs((prev) => {
			const next = new Set(prev);
			if (next.has(logId)) {
				next.delete(logId);
			} else {
				next.add(logId);
			}
			return next;
		});
	};

	return (
		<div className="space-y-2">
			{logs.map((log) => {
				const hasData = log.data !== undefined;
				const isExpanded = expandedLogs.has(log.id);

				return (
					<div
						key={log.id}
						className="border border-border rounded-lg p-3 bg-accent/20"
					>
						<div className="flex items-start gap-2">
							{hasData && (
								<button
									onClick={() => toggleExpand(log.id)}
									className="p-0.5 hover:bg-accent rounded mt-0.5"
								>
									{isExpanded ? (
										<ChevronDown size={14} />
									) : (
										<ChevronRight size={14} />
									)}
								</button>
							)}
							<div className="flex-1 min-w-0">
								<p className="text-sm break-words">{log.message}</p>
								<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
									<span className="flex items-center gap-1">
										<Clock size={10} />
										{new Date(log.timestamp).toLocaleTimeString()}
									</span>
								</div>
							</div>
						</div>

						{hasData && isExpanded && (
							<div className="mt-2 p-2 bg-background rounded border border-border overflow-x-auto">
								<pre className="text-xs whitespace-pre-wrap break-words">
									{JSON.stringify(log.data, null, 2)}
								</pre>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
