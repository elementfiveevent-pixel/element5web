'use client';

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAdminStore } from '@/store/adminStore';
import toast from 'react-hot-toast';
import { socket } from '@/lib/socket';

export function EventControlView() {
    const { currentPerformerId, votingOpen, performanceLive, liveVoteCount, adminUpdateState } = useEventStore();
    const syncEvent = useEventStore(state => state.syncWithSocket);

    const { performers } = useAdminStore();
    const syncPerformers = useAdminStore(state => state.syncPerformersWithFirestore);

    const [perfDurationStr, setPerfDurationStr] = useState('5');
    const [voteDurationStr, setVoteDurationStr] = useState('2');

    useEffect(() => {
        const u1 = syncEvent();
        const u2 = syncPerformers();
        return () => { u1(); u2(); };
    }, [syncEvent, syncPerformers]);

    const livePerformer = performers.find(p => p.id === currentPerformerId);

    const updateState = async (updates: any) => {
        try {
            adminUpdateState(updates);
            toast.success('Event state updated via Socket ⚡');
        } catch (err) {
            toast.error('Failed to update socket state');
        }
    };

    const setPerformer = (id: string) => {
        // Reset server-side vote counter for the new performer
        socket.emit('admin_reset_votes');

        // changing performer resets state
        updateState({
            currentPerformerId: id,
            votingOpen: false,
            performanceLive: false,
            performanceEndsAt: null,
            votingEndsAt: null,
            actCompleted: false,
            roundID: `${id}_${Date.now()}` // new round ID prevents past votes
        });
    };

    const startPerformance = () => {
        if (!currentPerformerId) return toast.error('Select a performer first');
        const endsAt = Date.now() + parseFloat(perfDurationStr) * 60 * 1000;
        updateState({ performanceLive: true, performanceEndsAt: endsAt });
    };

    const stopPerformance = () => {
        updateState({ performanceLive: false, performanceEndsAt: null });
    };

    const openVoting = () => {
        if (!currentPerformerId) return toast.error('Select a performer first');
        const endsAt = Date.now() + parseFloat(voteDurationStr) * 60 * 1000;
        updateState({ votingOpen: true, votingEndsAt: endsAt });
    };

    const closeVoting = () => {
        updateState({ votingOpen: false, votingEndsAt: null });
    };

    const startBoth = () => {
        if (!currentPerformerId) return toast.error('Select a performer first');
        const pEndsAt = Date.now() + parseFloat(perfDurationStr) * 60 * 1000;
        const vEndsAt = Date.now() + parseFloat(voteDurationStr) * 60 * 1000;
        updateState({
            performanceLive: true, performanceEndsAt: pEndsAt,
            votingOpen: true, votingEndsAt: vEndsAt
        });
    }

    const resetRound = () => {
        updateState({
            votingOpen: false,
            performanceLive: false,
            performanceEndsAt: null,
            votingEndsAt: null,
            actCompleted: false
        });
    };

    const endAct = () => {
        updateState({
            votingOpen: false,
            performanceLive: false,
            performanceEndsAt: null,
            votingEndsAt: null,
            actCompleted: true
        });
        toast("Act concluded. Waiting screen pushed to audience.", { icon: '🏁' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col gap-6">
                <div>
                    <h2 className="text-lg font-bold mb-1">Live Controller</h2>
                    <p className="text-sm text-muted-foreground">Select performer and manage times.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Current Performer</label>
                        <select
                            value={currentPerformerId || ''}
                            onChange={e => setPerformer(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                        >
                            <option value="" disabled>--- Select Performer ---</option>
                            {performers.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} {p.isSkipped ? '(Skipped)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Performance (Mins)</label>
                            <input type="number"
                                value={perfDurationStr} onChange={e => setPerfDurationStr(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Voting (Mins)</label>
                            <input type="number"
                                value={voteDurationStr} onChange={e => setVoteDurationStr(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                            />
                        </div>
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={startBoth}
                    disabled={!currentPerformerId}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                    Start Performance & Voting Together
                </button>

                <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                    <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider"><span className="bg-card px-2 text-muted-foreground">Or Control Individually</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {!performanceLive ? (
                        <button onClick={startPerformance} className="bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors border border-transparent">Start Performance</button>
                    ) : (
                        <button onClick={stopPerformance} className="bg-destructive/10 text-destructive py-3 rounded-xl font-medium hover:bg-destructive hover:text-white transition-colors border border-destructive/20">Stop Performance</button>
                    )}

                    {!votingOpen ? (
                        <button onClick={openVoting} className="bg-muted text-foreground py-3 rounded-xl font-medium hover:bg-muted/80 transition-colors border border-transparent">Open Voting</button>
                    ) : (
                        <button onClick={closeVoting} className="bg-destructive/10 text-destructive py-3 rounded-xl font-medium hover:bg-destructive hover:text-white transition-colors border border-destructive/20">Close Voting</button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                    <button onClick={resetRound} className="text-sm border flex items-center justify-center p-3 rounded-xl hover:bg-muted font-medium w-full text-muted-foreground">
                        Reset Timers
                    </button>
                    <button onClick={endAct} className="text-sm bg-foreground flex items-center justify-center p-3 rounded-xl hover:bg-foreground/90 font-bold w-full text-background shadow-md shadow-foreground/20">
                        🏁 End complete Act
                    </button>
                </div>
            </div>

            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col justify-between">
                <div>
                    <h2 className="text-lg font-bold mb-1">Live Status</h2>
                    <p className="text-sm text-muted-foreground">What the audience sees.</p>
                </div>

                {livePerformer ? (
                    <div className="flex flex-col items-center mt-6 relative">
                        {/* LIVE VOTE COUNTER */}
                        {votingOpen && (
                            <div className="absolute right-0 top-0 bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-2xl flex flex-col items-center animate-in fade-in">
                                <span className="text-xs font-bold uppercase tracking-wider mb-1">Live Votes</span>
                                <span className="text-3xl font-black tabular-nums">{liveVoteCount}</span>
                            </div>
                        )}

                        <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden mb-4 shadow-sm">
                            {livePerformer.photoURL ? (
                                <img src={livePerformer.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-muted-foreground">{livePerformer.name[0]}</div>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold">{livePerformer.name}</h3>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${performanceLive || votingOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${performanceLive || votingOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                {performanceLive ? 'Performance Live' : votingOpen ? 'Voting Open' : 'Waiting'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-10 w-full px-4">
                            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-2xl border border-border">
                                <span className="text-sm font-medium text-muted-foreground mb-1">Total Previous Votes</span>
                                <span className="text-4xl font-bold tabular-nums text-foreground">{livePerformer.totalVotes || 0}</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <span className="text-sm font-medium text-primary mb-1">Cumulative Avg</span>
                                <span className="text-4xl font-bold tabular-nums text-primary">{(livePerformer.averageScore || 0).toFixed(1)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-medium">
                        No performer active
                    </div>
                )}
            </div>
        </div>
    );
}
