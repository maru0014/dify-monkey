import React from 'react';
import { MessageSquare, Play } from 'lucide-react';

export type SidepanelTab = 'chat' | 'scripts';

interface TabNavProps {
	activeTab: SidepanelTab;
	onTabChange: (tab: SidepanelTab) => void;
	runningCount?: number;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange, runningCount = 0 }) => {
	return (
		<div className="flex border-b border-border">
			<button
				onClick={() => onTabChange('chat')}
				title="Dify Chatflowとチャット"
				className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'chat'
					? 'text-primary border-b-2 border-primary'
					: 'text-muted-foreground hover:text-foreground'
					}`}
			>
				<MessageSquare size={16} />
				Chat
			</button>
			<button
				onClick={() => onTabChange('scripts')}
				title="スクリプト実行管理・ログ確認"
				className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'scripts'
					? 'text-primary border-b-2 border-primary'
					: 'text-muted-foreground hover:text-foreground'
					}`}
			>
				<Play size={16} />
				Scripts
				{runningCount > 0 && (
					<span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full animate-pulse">
						{runningCount}
					</span>
				)}
			</button>
		</div>
	);
};
