import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ScriptList } from './pages/ScriptList';
import { ScriptEditor } from './pages/ScriptEditor';
import { ScriptTemplates } from './pages/ScriptTemplates';
import { ApiReference } from './pages/ApiReference';
import { AppSettings } from './pages/AppSettings';
import { DifyApps } from './pages/DifyApps';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { QuickStart } from './pages/QuickStart';
import { useTheme, useDifySettings } from '@/shared/hooks';
import { WelcomeDialog } from '@/shared/components';

const App: React.FC = () => {
	// テーマを適用
	useTheme();

	const { settings, loading } = useDifySettings();
	const [showWelcome, setShowWelcome] = useState(false);

	// Check if welcome dialog should be shown
	useEffect(() => {
		if (!loading && settings && !settings.welcomeShown) {
			setShowWelcome(true);
		}
	}, [loading, settings]);

	return (
		<Router>
			<div className="flex h-screen bg-background text-foreground">
				<Sidebar />
				<main className="flex-1 overflow-auto">
					<Routes>
						<Route path="/" element={<Navigate to="/scripts" replace />} />
						<Route path="/scripts" element={<ScriptList />} />
						<Route path="/scripts/new" element={<ScriptEditor />} />
						<Route path="/scripts/:id" element={<ScriptEditor />} />
						<Route path="/templates" element={<ScriptTemplates />} />
						<Route path="/reference" element={<ApiReference />} />
						<Route path="/apps" element={<DifyApps />} />
						<Route path="/settings" element={<AppSettings />} />
						<Route path="/privacy" element={<PrivacyPolicy />} />
						<Route path="/quickstart" element={<QuickStart />} />
					</Routes>
				</main>
			</div>

			{/* Welcome dialog for first-time users */}
			{showWelcome && (
				<WelcomeDialog onClose={() => setShowWelcome(false)} />
			)}
		</Router>
	);
};

export default App;
