import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Send, Settings as SettingsIcon, FileText, X, Loader2, Pencil } from 'lucide-react';
import { useDifyApps, useScriptExecution, useTheme } from '@/shared/hooks';
import { ScriptLog } from '@/shared/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TabNav, SidepanelTab } from './components/TabNav';
import { ScriptsTab } from './components/ScriptsTab';
import { ContentEditModal } from './components/ContentEditModal';

interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	hasPageContent?: boolean;
}

interface PageContent {
	title: string;
	content: string;
	length: number;
}

const ChatTab: React.FC<{
	selectedApp: string;
	setSelectedApp: (id: string) => void;
	chatflowApps: any[];
}> = ({ selectedApp, setSelectedApp, chatflowApps }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [attachedContent, setAttachedContent] = useState<PageContent | null>(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const portRef = useRef<chrome.runtime.Port | null>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleExtractPageContent = async () => {
		if (isExtracting) return;
		setIsExtracting(true);

		try {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (!tab?.id) {
				throw new Error('No active tab found');
			}

			const response = await chrome.tabs.sendMessage(tab.id, { type: 'extract-page-content' });

			if (response?.success) {
				setAttachedContent({
					title: response.title,
					content: response.content,
					length: response.length,
				});
			} else {
				console.error('Failed to extract page content:', response?.error);
			}
		} catch (error) {
			console.error('Error extracting page content:', error);
		} finally {
			setIsExtracting(false);
		}
	};

	const formatLength = (length: number): string => {
		if (length >= 1000) {
			return `${(length / 1000).toFixed(1)}k`;
		}
		return `${length}`;
	};

	const handleSend = async () => {
		if (!input.trim() || !selectedApp || isStreaming) return;

		// Build query with attached content
		let query = input;
		const hasPageContent = !!attachedContent;
		if (attachedContent) {
			query = `[ページコンテンツ]\nタイトル: ${attachedContent.title}\n\n${attachedContent.content}\n\n[質問]\n${input}`;
		}

		const userMessage: Message = {
			role: 'user',
			content: input,
			timestamp: Date.now(),
			hasPageContent,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setAttachedContent(null); // Clear attachment after sending
		setIsStreaming(true);

		const assistantMessage: Message = {
			role: 'assistant',
			content: '',
			timestamp: Date.now(),
		};
		setMessages((prev) => [...prev, assistantMessage]);

		// Connect to background
		const port = chrome.runtime.connect({ name: 'dify-chat-stream' });
		portRef.current = port;

		port.onMessage.addListener((msg) => {
			if (msg.type === 'chunk') {
				setMessages((prev) => {
					const updated = [...prev];
					const lastMsg = updated[updated.length - 1];
					if (lastMsg && lastMsg.role === 'assistant') {
						lastMsg.content += msg.data.answer || '';
					}
					return updated;
				});
			} else if (msg.type === 'done') {
				setIsStreaming(false);
				port.disconnect();
			} else if (msg.type === 'error') {
				setMessages((prev) => {
					const updated = [...prev];
					const lastMsg = updated[updated.length - 1];
					if (lastMsg && lastMsg.role === 'assistant') {
						lastMsg.content = `Error: ${msg.error}`;
					}
					return updated;
				});
				setIsStreaming(false);
				port.disconnect();
			}
		});

		port.postMessage({
			type: 'chat-send',
			payload: {
				query,
				appId: selectedApp,
			},
		});
	};

	return (
		<div className="flex flex-col h-full">
			{/* App selector */}
			<div className="p-3 border-b border-border">
				<select
					value={selectedApp}
					onChange={(e) => setSelectedApp(e.target.value)}
					className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
				>
					{chatflowApps.map((app) => (
						<option key={app.id} value={app.id}>
							{app.name}
						</option>
					))}
				</select>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-auto p-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center text-muted-foreground py-12">
						<p>Start a conversation with Dify</p>
					</div>
				)}
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
					>
						<div
							className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
								? 'bg-primary text-primary-foreground'
								: 'bg-secondary text-secondary-foreground'
								}`}
						>
							{msg.role === 'user' && msg.hasPageContent && (
								<div className="flex items-center gap-1 text-xs opacity-80 mb-1">
									<FileText size={12} />
									<span>ページコンテンツ添付</span>
								</div>
							)}
							{msg.role === 'assistant' ? (
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
							) : (
								<p className="whitespace-pre-wrap">{msg.content}</p>
							)}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Input with toolbar */}
			<div className="border-t border-border p-4">
				{/* Attachment toolbar */}
				<div className="flex items-center gap-2 mb-2">
					<button
						onClick={handleExtractPageContent}
						disabled={isExtracting || isStreaming}
						className="flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md disabled:opacity-50 transition-colors"
						title="ページコンテンツを読み込む"
					>
						{isExtracting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<FileText size={16} />
						)}
						<span>ページを読み込む</span>
					</button>
				</div>

				{/* Attached content chip */}
				{attachedContent && (
					<div className="flex items-center gap-2 mb-2 p-2 bg-accent/50 rounded-md">
						<FileText size={14} className="text-primary shrink-0" />
						<button
							onClick={() => setIsEditModalOpen(true)}
							className="text-sm truncate flex-1 text-left hover:underline"
							title="クリックして編集"
						>
							{attachedContent.title}
						</button>
						<span className="text-xs text-muted-foreground shrink-0">
							{formatLength(attachedContent.length)} 文字
						</span>
						<button
							onClick={() => setIsEditModalOpen(true)}
							className="p-1 hover:bg-accent rounded-full"
							title="編集"
						>
							<Pencil size={14} />
						</button>
						<button
							onClick={() => setAttachedContent(null)}
							className="p-1 hover:bg-accent rounded-full"
							title="添付を解除"
						>
							<X size={14} />
						</button>
					</div>
				)}

				{/* Content Edit Modal */}
				{isEditModalOpen && attachedContent && (
					<ContentEditModal
						content={attachedContent}
						onSave={(updated) => {
							setAttachedContent(updated);
							setIsEditModalOpen(false);
						}}
						onClose={() => setIsEditModalOpen(false)}
					/>
				)}

				{/* Input field */}
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
						placeholder="メッセージを入力..."
						disabled={isStreaming}
						className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
					/>
					<button
						onClick={handleSend}
						disabled={!input.trim() || isStreaming}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
					>
						<Send size={16} />
					</button>
				</div>
			</div>
		</div>
	);
};

const App: React.FC = () => {
	// テーマを適用
	useTheme();

	const { apps, loading } = useDifyApps();
	const [activeTab, setActiveTab] = useState<SidepanelTab>('chat');
	const [tabLoaded, setTabLoaded] = useState(false);
	const [selectedApp, setSelectedApp] = useState<string>('');

	// 前回開いていたタブをストレージから読み込む
	useEffect(() => {
		chrome.storage.local.get('sidepanelLastTab', (result) => {
			if (result.sidepanelLastTab === 'chat' || result.sidepanelLastTab === 'scripts') {
				setActiveTab(result.sidepanelLastTab);
			}
			setTabLoaded(true);
		});
	}, []);

	// タブ変更時にストレージに保存
	const handleTabChange = (tab: SidepanelTab) => {
		setActiveTab(tab);
		chrome.storage.local.set({ sidepanelLastTab: tab });
	};

	// Script execution state
	const { executions, history, execute, cancel, clearHistory } = useScriptExecution();

	// Script logs state
	const [scriptLogs, setScriptLogs] = useState<ScriptLog[]>([]);
	const logPortRef = useRef<chrome.runtime.Port | null>(null);

	// Connect to background for receiving logs
	useEffect(() => {
		const port = chrome.runtime.connect({ name: 'sidepanel-logs' });
		logPortRef.current = port;

		port.onMessage.addListener((msg) => {
			if (msg.type === 'script-log') {
				setScriptLogs((prev) => [msg.log, ...prev].slice(0, 50)); // Keep last 50 logs
			}
		});

		return () => {
			port.disconnect();
		};
	}, []);

	const clearLogs = useCallback(() => {
		setScriptLogs([]);
	}, []);

	// Filter to show only chatflow apps
	const chatflowApps = useMemo(() =>
		apps.filter(app => !app.appType || app.appType === 'chatflow'),
		[apps]
	);

	useEffect(() => {
		if (chatflowApps.length > 0 && !selectedApp) {
			setSelectedApp(chatflowApps[0].id);
		}
	}, [chatflowApps, selectedApp]);

	// Count running executions for badge
	const runningCount = executions.filter(e => e.status === 'running').length;

	if (loading || !tabLoaded) {
		return (
			<div className="h-screen flex items-center justify-center bg-background text-foreground">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const showNoAppsMessage = chatflowApps.length === 0 && activeTab === 'chat';

	if (showNoAppsMessage) {
		return (
			<div className="h-screen flex flex-col bg-background text-foreground">
				<header className="border-b border-border p-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
					<h1 className="font-bold">Dify Monkey</h1>
					<button
						onClick={() => chrome.runtime.openOptionsPage()}
						className="p-2 hover:bg-accent rounded-md transition-colors"
						title="設定を開く"
					>
						<SettingsIcon size={18} />
					</button>
				</header>
				<TabNav
					activeTab={activeTab}
					onTabChange={handleTabChange}
					runningCount={runningCount}
				/>
				<div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
					<div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse-slow">
						<SettingsIcon size={48} className="text-primary" />
					</div>
					<h2 className="text-2xl font-bold mb-3">Difyと連携しましょう</h2>
					<p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
						設定画面でDifyのAPIキーを登録すると、チャット機能やスクリプト実行が可能になります。
					</p>
					<button
						onClick={() => chrome.runtime.openOptionsPage()}
						className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-md transition-all hover:scale-105"
					>
						設定を始める
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex flex-col bg-background text-foreground">
			{/* Header */}
			<header className="border-b border-border p-4 flex items-center justify-between">
				<h1 className="font-bold">Dify Monkey</h1>
				<button
					onClick={() => chrome.runtime.openOptionsPage()}
					className="p-2 hover:bg-accent rounded-md"
					title="Open Settings"
				>
					<SettingsIcon size={18} />
				</button>
			</header>

			{/* Tab navigation */}
			<TabNav
				activeTab={activeTab}
				onTabChange={handleTabChange}
				runningCount={runningCount}
			/>

			{/* Tab content */}
			<div className="flex-1 overflow-hidden">
				{activeTab === 'chat' ? (
					<ChatTab
						selectedApp={selectedApp}
						setSelectedApp={setSelectedApp}
						chatflowApps={chatflowApps}
					/>
				) : (
					<ScriptsTab
						executions={executions}
						history={history}
						logs={scriptLogs}
						onExecute={execute}
						onCancel={cancel}
						onClearHistory={clearHistory}
						onClearLogs={clearLogs}
					/>
				)}
			</div>
		</div>
	);
};

export default App;
