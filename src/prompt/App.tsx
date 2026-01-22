import React, { useState, useEffect } from 'react';

const App: React.FC = () => {
	const [message, setMessage] = useState('');
	const [requestId, setRequestId] = useState('');
	const [inputText, setInputText] = useState('');

	useEffect(() => {
		// Parse query parameters
		const params = new URLSearchParams(window.location.search);
		const msg = params.get('message');
		const reqId = params.get('requestId');

		if (msg) setMessage(msg);
		if (reqId) setRequestId(reqId);

		// Focus input on mount
		const input = document.querySelector('input');
		if (input) input.focus();
	}, []);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		sendResponse(inputText);
	};

	const handleCancel = () => {
		sendResponse(null);
	};

	const sendResponse = (value: string | null) => {
		if (!requestId) return;

		chrome.runtime.sendMessage({
			type: 'dify-ui-prompt-response',
			payload: {
				requestId,
				value
			}
		});

		// Close the window
		window.close();
	};

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				handleCancel();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [requestId]);

	return (
		<div className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
			<div className="flex-1 flex flex-col justify-center">
				<h3 className="text-lg font-medium mb-4 text-center break-words">{message}</h3>

				<form onSubmit={handleSubmit} className="w-full">
					<input
						type="text"
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
						placeholder="Enter value..."
						autoFocus
					/>

					<div className="flex justify-end gap-3 mt-6">
						<button
							type="button"
							onClick={handleCancel}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							OK
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default App;
