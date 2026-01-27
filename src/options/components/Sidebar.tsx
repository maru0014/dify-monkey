import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileCode, Settings, Layers, BookTemplate, Book, Shield, Rocket } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const navItems = [
	{ path: '/quickstart', label: 'Quick Start', icon: Rocket },
	{ path: '/scripts', label: 'My Scripts', icon: FileCode },
	{ path: '/templates', label: 'Templates', icon: BookTemplate },
	{ path: '/reference', label: 'API Reference', icon: Book },
	{ path: '/apps', label: 'Dify Apps', icon: Layers },
	{ path: '/settings', label: 'Settings', icon: Settings },
	{ path: '/privacy', label: 'Privacy', icon: Shield },
];

export const Sidebar: React.FC = () => {
	const location = useLocation();

	return (
		<aside className="w-64 bg-secondary border-r border-border flex flex-col">
			<div className="p-6 border-b border-border">
				<h1 className="text-xl font-bold">Dify Monkey</h1>
				<p className="text-sm text-muted-foreground mt-1">UserScript Manager</p>
			</div>
			<nav className="flex-1 p-4">
				<ul className="space-y-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = location.pathname.startsWith(item.path);
						return (
							<li key={item.path}>
								<Link
									to={item.path}
									className={cn(
										'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-accent hover:text-accent-foreground'
									)}
								>
									<Icon size={20} />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
			<div className="p-4 border-t border-border text-xs text-muted-foreground">
				v{chrome.runtime.getManifest().version}
			</div>
		</aside>
	);
};
