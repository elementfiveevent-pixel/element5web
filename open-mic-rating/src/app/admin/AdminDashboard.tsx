'use client';

import { useState } from 'react';
import { EventControlView } from './EventControlView';
import { PerformerManagementView } from './PerformerManagementView';
import { LeaderboardView } from './LeaderboardView';

export function AdminDashboard() {
    const [tab, setTab] = useState<'control' | 'performers' | 'leaderboard'>('control');

    return (
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">

            {/* Tabs Navigation */}
            <div className="flex bg-card p-1 rounded-2xl border border-border shadow-sm w-fit">
                {[
                    { id: 'control', label: 'Event Control' },
                    { id: 'performers', label: 'Manage Performers' },
                    { id: 'leaderboard', label: 'Leaderboard' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all ${tab === t.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {tab === 'control' && <EventControlView />}
                {tab === 'performers' && <PerformerManagementView />}
                {tab === 'leaderboard' && <LeaderboardView />}
            </div>
        </div>
    );
}
