import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface PageContent {
	title: string;
	content: string;
	length: number;
}

interface ContentEditModalProps {
	content: PageContent;
	onSave: (content: PageContent) => void;
	onClose: () => void;
}

export const ContentEditModal: React.FC<ContentEditModalProps> = ({
	content,
	onSave,
	onClose,
}) => {
	const [editedTitle, setEditedTitle] = useState(content.title);
	const [editedContent, setEditedContent] = useState(content.content);

	// ESCキーで閉じる
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	const handleSave = () => {
		onSave({
			title: editedTitle,
			content: editedContent,
			length: editedContent.length,
		});
	};

	const formatLength = (length: number): string => {
		if (length >= 1000) {
			return `${(length / 1000).toFixed(1)}k`;
		}
		return `${length}`;
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-border">
					<h2 className="font-bold text-lg">ページコンテンツの編集</h2>
					<button
						onClick={onClose}
						className="p-1 hover:bg-accent rounded-full"
						title="閉じる"
					>
						<X size={20} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4 space-y-4">
					{/* Title */}
					<div>
						<label className="block text-sm font-medium mb-1">タイトル</label>
						<input
							type="text"
							value={editedTitle}
							onChange={(e) => setEditedTitle(e.target.value)}
							className="w-full px-3 py-2 border border-border rounded-md bg-background"
						/>
					</div>

					{/* Content */}
					<div className="flex-1">
						<div className="flex items-center justify-between mb-1">
							<label className="text-sm font-medium">コンテンツ</label>
							<span className="text-xs text-muted-foreground">
								{formatLength(editedContent.length)} 文字
							</span>
						</div>
						<textarea
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							className="w-full h-64 px-3 py-2 border border-border rounded-md bg-background resize-none font-mono text-sm"
							placeholder="ページコンテンツ..."
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 p-4 border-t border-border">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent"
					>
						キャンセル
					</button>
					<button
						onClick={handleSave}
						className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						<Save size={16} />
						保存
					</button>
				</div>
			</div>
		</div>
	);
};
