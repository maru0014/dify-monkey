import { useState, useCallback, useRef, useEffect } from 'react';
import { ScriptExecution, UserScript } from '@/shared/types';

interface UseScriptExecutionReturn {
	executions: ScriptExecution[];
	history: ScriptExecution[];
	execute: (script: UserScript) => Promise<void>;
	cancel: (executionId: string) => void;
	clearHistory: () => void;
}

export function useScriptExecution(): UseScriptExecutionReturn {
	const [executions, setExecutions] = useState<ScriptExecution[]>([]);
	const [history, setHistory] = useState<ScriptExecution[]>([]);
	const portsRef = useRef<Map<string, chrome.runtime.Port>>(new Map());

	// Cleanup ports on unmount
	useEffect(() => {
		return () => {
			portsRef.current.forEach((port) => {
				try {
					port.disconnect();
				} catch (e) {
					// Ignore disconnect errors
				}
			});
		};
	}, []);

	const execute = useCallback(async (script: UserScript) => {
		const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

		const execution: ScriptExecution = {
			id: executionId,
			scriptId: script.id,
			scriptName: script.name,
			status: 'running',
			progress: 0,
			currentStep: 'Initializing...',
			startedAt: Date.now(),
		};

		setExecutions((prev) => [...prev, execution]);

		// Connect to background for script execution
		const port = chrome.runtime.connect({ name: 'script-execution' });
		portsRef.current.set(executionId, port);

		port.onMessage.addListener((msg) => {
			if (msg.executionId !== executionId) return;

			if (msg.type === 'progress') {
				setExecutions((prev) =>
					prev.map((e) =>
						e.id === executionId
							? { ...e, progress: msg.progress, currentStep: msg.step }
							: e
					)
				);
			} else if (msg.type === 'started') {
				// Script has started running (received dify.start())
				setExecutions((prev) =>
					prev.map((e) =>
						e.id === executionId
							? { ...e, currentStep: msg.step || 'Running...' }
							: e
					)
				);
			} else if (msg.type === 'complete') {
				const completedExecution: ScriptExecution = {
					...execution,
					status: 'success',
					progress: 100,
					finishedAt: Date.now(),
					result: msg.result,
				};

				setExecutions((prev) => prev.filter((e) => e.id !== executionId));
				setHistory((prev) => [completedExecution, ...prev].slice(0, 10)); // Keep last 10

				port.disconnect();
				portsRef.current.delete(executionId);
			} else if (msg.type === 'error') {
				const failedExecution: ScriptExecution = {
					...execution,
					status: 'error',
					finishedAt: Date.now(),
					error: msg.error,
				};

				setExecutions((prev) => prev.filter((e) => e.id !== executionId));
				setHistory((prev) => [failedExecution, ...prev].slice(0, 10));

				port.disconnect();
				portsRef.current.delete(executionId);
			}
		});

		// Start execution
		port.postMessage({
			type: 'execute-script',
			payload: {
				executionId,
				scriptId: script.id,
				scriptCode: script.code,
				linkedAppId: script.linkedAppId,
			},
		});
	}, []);

	const cancel = useCallback((executionId: string) => {
		// Find the execution to get the scriptId
		const exec = executions.find((e) => e.id === executionId);
		const port = portsRef.current.get(executionId);

		if (port && exec) {
			port.postMessage({ type: 'cancel', executionId, scriptId: exec.scriptId });
			port.disconnect();
			portsRef.current.delete(executionId);
		}

		setExecutions((prev) => {
			const found = prev.find((e) => e.id === executionId);
			if (found) {
				const cancelledExecution: ScriptExecution = {
					...found,
					status: 'error',
					finishedAt: Date.now(),
					error: 'Cancelled by user',
				};
				setHistory((h) => [cancelledExecution, ...h].slice(0, 10));
			}
			return prev.filter((e) => e.id !== executionId);
		});
	}, [executions]);

	const clearHistory = useCallback(() => {
		setHistory([]);
	}, []);

	return {
		executions,
		history,
		execute,
		cancel,
		clearHistory,
	};
}
