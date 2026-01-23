import React from 'react';
import { Settings as SettingsIcon, ExternalLink, Trash2 } from 'lucide-react';
import { useUserScripts } from '@/shared/hooks';
import { matchesAny } from '@/shared/lib/url-matcher';
import { ScriptExecution, ScriptLog, UserScript } from '@/shared/types';
import { ScriptCard } from './ScriptCard';
import { ExecutionProgress } from './ExecutionProgress';
import { ExecutionHistory } from './ExecutionHistory';
import { ScriptLogs } from './ScriptLogs';

interface ScriptsTabProps {
	executions: ScriptExecution[];
	history: ScriptExecution[];
	logs: ScriptLog[];
	onExecute: (script: UserScript) => void;
	onCancel: (executionId: string) => void;
	onClearHistory: () => void;
	onClearLogs: () => void;
	currentUrl: string | null;
}

export const ScriptsTab: React.FC<ScriptsTabProps> = ({
	executions,
	history,
	logs,
	onExecute,
	onCancel,
	onClearHistory,
	onClearLogs,
	currentUrl,
}) => {
	const { scripts, loading } = useUserScripts();

	// Filter scripts that match the current URL
	const visibleScripts = scripts.filter((s) => {
		if (!currentUrl) return true;
		return matchesAny(currentUrl, s.matches);
	});

	// Filter visible scripts that are enabled (for count)
	const enabledVisibleScripts = visibleScripts.filter((s) => s.enabled);

	const runningExecutions = executions.filter((e) => e.status === 'running');
	const completedHistory = history.filter((e) => e.status !== 'running');

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading scripts...</p>
			</div>
		);
	}

	if (scripts.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-8 text-center bg-background">
				<div className="bg-primary/10 p-4 rounded-full mb-4">
					<SettingsIcon size={32} className="text-primary" />
				</div>
				<h3 className="text-xl font-bold mb-2">スクリプトがありません</h3>
				<p className="text-sm text-muted-foreground mb-6 max-w-xs">
					オプションページでスクリプトを作成して、このページでの作業を自動化しましょう。
				</p>
				<button
					onClick={() => chrome.runtime.openOptionsPage()}
					className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
				>
					<ExternalLink size={18} />
					スクリプトを作成する
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Running executions */}
			{runningExecutions.length > 0 && (
				<div className="p-3 border-b border-border">
					<h3 className="text-sm font-medium mb-2 flex items-center gap-2">
						<span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
						Running ({runningExecutions.length})
					</h3>
					<div className="space-y-2">
						{runningExecutions.map((exec) => (
							<ExecutionProgress
								key={exec.id}
								execution={exec}
								onCancel={onCancel}
							/>
						))}
					</div>
				</div>
			)}

			{/* Script list */}
			<div className="flex-1 overflow-auto p-3">
				<h3 className="text-sm font-medium text-muted-foreground mb-2">
					Scripts ({enabledVisibleScripts.length}/{visibleScripts.length})
				</h3>
				{visibleScripts.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p className="text-sm">このページで実行可能なスクリプトはありません</p>
					</div>
				) : (
					<div className="space-y-2">
						{visibleScripts.map((script) => {
							const execution = executions.find((e) => e.scriptId === script.id);
							// Since we filtered by match, isMatch is always true (unless currentUrl is null)
							const isMatch = true;

							return (
								<ScriptCard
									key={script.id}
									script={script}
									execution={execution}
									isCurrentPageMatch={isMatch}
									onExecute={() => onExecute(script)}
									onCancel={onCancel}
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Logs */}
			<div className="border-t border-border">
				<div className="p-3">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-medium text-muted-foreground">
							Logs ({logs.length})
						</h3>
						{logs.length > 0 && (
							<button
								onClick={onClearLogs}
								className="p-1 hover:bg-accent rounded transition-colors"
								title="Clear logs"
							>
								<Trash2 size={14} className="text-muted-foreground" />
							</button>
						)}
					</div>
					<div className="max-h-[300px] overflow-auto">
						<ScriptLogs logs={logs} />
					</div>
				</div>
			</div>

			{/* History */}
			{completedHistory.length > 0 && (
				<div className="border-t border-border">
					<div className="p-3">
						<div className="flex items-center justify-between mb-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								History
							</h3>
							<button
								onClick={onClearHistory}
								className="p-1 hover:bg-accent rounded transition-colors"
								title="Clear history"
							>
								<Trash2 size={14} className="text-muted-foreground" />
							</button>
						</div>
						<div className="max-h-[200px] overflow-auto">
							<ExecutionHistory
								executions={completedHistory}
								onRerun={(scriptId) => {
									const script = scripts.find((s) => s.id === scriptId);
									if (script) onExecute(script);
								}}
								onCopyResult={(result) => {
									navigator.clipboard.writeText(JSON.stringify(result, null, 2));
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
