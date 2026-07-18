'use client';

import { useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useEventStore } from '@/store/eventStore';
import { db } from '@/firebase/clientApp';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export function LeaderboardView() {
    const { performers } = useAdminStore();
    const { adminUpdateState, revealLeaderboard } = useEventStore();
    const [hideScores, setHideScores] = useState(false);

    const toggleRevealStage = () => {
        adminUpdateState({ revealLeaderboard: !revealLeaderboard });
        toast.success(revealLeaderboard ? "Leaderboard hidden from stage" : "Leaderboard displayed on stage");
    };

    // Filter out skipped performers from the leaderboard
    const activePerformers = performers.filter(p => !p.isSkipped);

    const sorted = [...activePerformers].sort((a, b) => {
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        return b.totalVotes - a.totalVotes; // tie breaker
    });

    const exportCSV = () => {
        let csv = "Rank,Name,AverageScore,TotalVotes,TotalPoints\n";
        sorted.forEach((p, i) => {
            csv += `${i + 1},"${p.name}",${p.averageScore.toFixed(2)},${p.totalVotes},${p.totalPoints}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openmic-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetEventData = async () => {
        const confirmation = prompt("DANGER: Type 'RESET' to completely erase all scores and votes from all performers.");
        if (confirmation === 'RESET') {
            try {
                const batch = writeBatch(db);

                // reset performers
                performers.forEach(p => {
                    batch.update(doc(db, 'performers', p.id), {
                        averageScore: 0,
                        totalVotes: 0,
                        totalPoints: 0
                    });
                });

                // delete all votes
                const votesSnap = await getDocs(collection(db, 'votes'));
                votesSnap.forEach(v => {
                    batch.delete(v.ref);
                });

                await batch.commit();

                adminUpdateState({
                    currentPerformerId: null,
                    votingOpen: false,
                    performanceLive: false,
                    performanceEndsAt: null,
                    votingEndsAt: null,
                    roundID: "default",
                    liveVoteCount: 0,
                    revealLeaderboard: false,
                    actCompleted: false
                });

                toast.success("Event fully reset!");
            } catch (err) {
                toast.error("Failed to reset event.");
            }
        }
    };

    return (
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-xl font-bold">Event Leaderboard</h2>
                    <p className="text-sm text-muted-foreground">Rankings updated in real-time</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={toggleRevealStage}
                        className={`text-foreground px-4 py-2 rounded-xl text-sm font-bold border transition-all ${revealLeaderboard ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-border hover:bg-muted/80'}`}
                    >
                        {revealLeaderboard ? '✅ On Stage' : 'Reveal on Stage'}
                    </button>
                    <button
                        onClick={() => setHideScores(!hideScores)}
                        className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80 flex items-center gap-2"
                    >
                        {hideScores ? <EyeOff size={16} /> : <Eye size={16} />}
                        {hideScores ? 'Reveal Scores' : 'Hide Scores'}
                    </button>
                    <button onClick={exportCSV} className="bg-muted text-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-muted/80">
                        Export CSV
                    </button>
                    <button onClick={handleResetEventData} className="bg-destructive/10 text-destructive px-4 py-2 rounded-xl text-sm font-medium hover:bg-destructive hover:text-white transition-colors">
                        End & Reset Event
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {sorted.map((p, idx) => {
                    const isTop3 = idx < 3;
                    return (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            layout
                            className={`flex items-center justify-between p-4 rounded-2xl border ${isTop3 ? 'bg-primary/5 border-primary/20' : 'bg-muted/20 border-border'}`}
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-10 text-center font-bold text-xl ${idx === 0 ? 'text-yellow-500 text-3xl' : idx === 1 ? 'text-gray-400 text-2xl' : idx === 2 ? 'text-amber-600 text-xl' : 'text-muted-foreground'}`}>
                                    #{idx + 1}
                                </div>
                                <div className="w-14 h-14 bg-muted rounded-2xl overflow-hidden shadow-sm flex items-center justify-center font-bold text-muted-foreground">
                                    {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" alt="" /> : p.name[0]}
                                </div>
                                <h3 className="font-semibold text-lg">{p.name}</h3>
                            </div>

                            <div className={`flex items-end gap-8 text-right pr-4 transition-all duration-300 ${hideScores ? 'blur-md opacity-40 select-none grayscale' : ''}`}>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Votes</div>
                                    <div className="text-xl font-bold tabular-nums text-foreground">{p.totalVotes}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Score</div>
                                    <div className="text-2xl font-bold tabular-nums text-primary">{p.averageScore.toFixed(2)}</div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
                {sorted.length === 0 && <div className="text-center py-12 text-muted-foreground">No performers.</div>}
            </div>
        </div>
    );
}
