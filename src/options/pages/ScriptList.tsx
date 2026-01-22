import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useUserScripts } from '@/shared/hooks';

export const ScriptList: React.FC = () => {
	const { scripts, loading, saveScript, deleteScript } = useUserScripts();

	const toggleScript = async (id: string, enabled: boolean) => {
		const script = scripts.find((s) => s.id === id);
		if (script) {
			await saveScript({ ...script, enabled: !enabled, updatedAt: Date.now() });
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-muted-foreground">Loading scripts...</p>
			</div>
		);
	}

	return (
		<div className="p-8">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold">My Scripts</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Manage your user scripts
					</p>
				</div>
				<Link
					to="/scripts/new"
					className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
				>
					<Plus size={16} />
					New Script
				</Link>
			</div>

			{scripts.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-border rounded-lg">
					<p className="text-muted-foreground">No scripts yet</p>
					<Link
						to="/scripts/new"
						className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
					>
						<Plus size={16} />
						Create your first script
					</Link>
				</div>
			) : (
				<div className="grid gap-4">
					{scripts.map((script) => (
						<div
							key={script.id}
							className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
						>
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-center gap-3">
										<h3 className="font-semibold">{script.name}</h3>
										{script.enabled ? (
											<span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
												<Power size={12} />
												Enabled
											</span>
										) : (
											<span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
												<PowerOff size={12} />
												Disabled
											</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground mt-1">
										{script.matches.join(', ')}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => toggleScript(script.id, script.enabled)}
										className="p-2 hover:bg-accent rounded"
										title={script.enabled ? 'Disable' : 'Enable'}
									>
										{script.enabled ? <PowerOff size={16} /> : <Power size={16} />}
									</button>
									<Link
										to={`/scripts/${script.id}`}
										className="p-2 hover:bg-accent rounded"
										title="Edit"
									>
										<Edit size={16} />
									</Link>
									<button
										onClick={async () => {
											if (confirm(`Delete "${script.name}"?`)) {
												await deleteScript(script.id);
											}
										}}
										className="p-2 hover:bg-destructive/10 text-destructive rounded"
										title="Delete"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
