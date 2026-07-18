'use client';

import { useEffect, useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAdminStore } from '@/store/adminStore';
import { CountdownTimer } from '@/components/CountdownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '@/lib/socket';

export default function StageScreen() {
    const { currentPerformerId, votingOpen, performanceLive, performanceEndsAt, votingEndsAt, revealLeaderboard } = useEventStore();
    const syncEvent = useEventStore(state => state.syncWithSocket);

    const { performers } = useAdminStore();
    const syncPerformers = useAdminStore(state => state.syncPerformersWithFirestore);

    const [hasInteracted, setHasInteracted] = useState(false);
    const [reactions, setReactions] = useState<{ id: string, emoji: string, x: number }[]>([]);
    const [hypeLevel, setHypeLevel] = useState(0);

    // Hype Decay Loop
    useEffect(() => {
        if (!performanceLive && !votingOpen) {
            setHypeLevel(0);
            return;
        }
        const interval = setInterval(() => {
            setHypeLevel(prev => Math.max(0, prev - 1.5));
        }, 150); // Fast, smooth decay
        return () => clearInterval(interval);
    }, [performanceLive, votingOpen]);

    // Audio chime synthesis
    const playChime = (type: 'warning' | 'end') => {
        if (!hasInteracted) return;
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();

            if (type === 'warning') {
                const osc1 = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(440, ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc1.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc1.start(ctx.currentTime);
                osc1.stop(ctx.currentTime + 0.5);

                setTimeout(() => {
                    const osc2 = ctx.createOscillator();
                    const gainNode2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(440, ctx.currentTime);
                    gainNode2.gain.setValueAtTime(0, ctx.currentTime);
                    gainNode2.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
                    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                    osc2.connect(gainNode2);
                    gainNode2.connect(ctx.destination);
                    osc2.start(ctx.currentTime);
                    osc2.stop(ctx.currentTime + 0.5);
                }, 300);
            } else if (type === 'end') {
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(330, ctx.currentTime);
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 1.5);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const unsubEvent = syncEvent();
        const unsubPerfs = syncPerformers();

        const handleReaction = (data: { emoji: string, id: string }) => {
            const xPos = Math.random() * 80 + 10; // 10% to 90% vw width
            setReactions(prev => [...prev.slice(-20), { id: data.id, emoji: data.emoji, x: xPos }]); // Limit to 20 on screen to prevent lag
            setHypeLevel(prev => Math.min(100, prev + 8)); // Jump hype by 8% per emoji

            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== data.id));
            }, 3000);
        };
        socket.on('stage_reaction', handleReaction);

        return () => {
            unsubEvent();
            unsubPerfs();
            socket.off('stage_reaction', handleReaction);
        }
    }, [syncEvent, syncPerformers]);

    const currentPerformer = performers.find(p => p.id === currentPerformerId);

    // Find the NEXT active performer in the sorted array
    const currentIndex = performers.findIndex(p => p.id === currentPerformerId);
    let nextPerformer = null;
    if (currentIndex !== -1) {
        for (let i = currentIndex + 1; i < performers.length; i++) {
            if (!performers[i].isSkipped) {
                nextPerformer = performers[i];
                break;
            }
        }
    }

    const getStatusText = () => {
        if (performanceLive) return "Performance Live";
        if (votingOpen) return "Voting Open";
        return "Waiting for next performer";
    };

    const getActiveTimer = () => {
        if (performanceLive) return performanceEndsAt;
        if (votingOpen) return votingEndsAt;
        return null;
    };

    const activeTimer = getActiveTimer();
    const isTimesUp = activeTimer && activeTimer - Date.now() <= 0;

    if (revealLeaderboard) {
        // Sort and filter top performers
        const sorted = [...performers]
            .filter(p => !p.isSkipped && p.totalVotes > 0) // only show people who actually competed
            .sort((a, b) => b.averageScore !== a.averageScore ? b.averageScore - a.averageScore : b.totalVotes - a.totalVotes);

        const topPerformers = sorted.slice(0, Math.max(3, sorted.length)); // Show Top 3 at least, maybe all

        return (
            <main
                onClick={() => setHasInteracted(true)}
                className="flex flex-col min-h-screen w-full bg-background items-center p-12 overflow-hidden relative"
            >
                {/* Ambient glow */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    <div className="w-[80vw] h-[80vw] bg-yellow-500/10 rounded-full blur-[120px] opacity-70 mix-blend-multiply" />
                </div>

                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="z-10 text-center mb-16 mt-8"
                >
                    <h1 className="text-6xl font-black uppercase tracking-[0.2em] text-foreground mb-4">Final Results</h1>
                    <p className="text-2xl text-muted-foreground font-medium">Thank you to all our amazing performers!</p>
                </motion.div>

                <div className="z-10 w-full max-w-6xl flex flex-col gap-6 mt-8">
                    {topPerformers.map((p, idx) => {
                        const isWinner = idx === 0;
                        const delay = idx * 0.4;
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay, duration: 0.8, type: "spring" }}
                                className={`flex items-center justify-between p-8 rounded-3xl backdrop-blur-md border ${isWinner ? 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'bg-card/50 border-border/50'}`}
                            >
                                <div className="flex items-center gap-8">
                                    <div className={`text-6xl font-black tabular-nums w-24 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                        #{idx + 1}
                                    </div>
                                    <div className={`w-32 h-32 rounded-full overflow-hidden border-4 bg-muted flex items-center justify-center font-bold text-5xl text-muted-foreground shrink-0 ${isWinner ? 'border-yellow-500 scale-110' : 'border-background'}`}>
                                        {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover" /> : p.name[0]}
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h2 className={`font-bold truncate max-w-[30vw] ${isWinner ? 'text-6xl text-foreground' : 'text-4xl text-foreground/80'}`}>{p.name}</h2>
                                        {p.metadata && <span className="text-2xl font-medium text-primary/80 mt-2 truncate">{p.metadata}</span>}
                                    </div>
                                </div>
                                <div className="text-right flex items-end gap-12 pr-6">
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">Votes</span>
                                        <span className="text-4xl font-bold tabular-nums text-foreground/80">{p.totalVotes}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-bold uppercase tracking-widest text-primary mb-2">Score</span>
                                        <span className={`tabular-nums font-black ${isWinner ? 'text-7xl text-yellow-500' : 'text-5xl text-primary'}`}>{p.averageScore.toFixed(2)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* EMOJI REACTIONS (still allow reactions during reveal!) */}
                <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                    <AnimatePresence>
                        {reactions.map(r => (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: '100vh', left: `${r.x}vw`, scale: 0.5 }}
                                animate={{ opacity: [0, 1, 1, 0], y: '-20vh', left: `${r.x + (Math.random() * 10 - 5)}vw`, scale: [0.5, 1.5, 2, 1.5] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 3, ease: "easeOut" }}
                                className="absolute bottom-0 text-7xl drop-shadow-xl"
                            >
                                {r.emoji}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        );
    }

    if (!currentPerformerId || !currentPerformer) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <h1 className="text-6xl font-bold tracking-tighter text-muted-foreground animate-pulse">
                    Open Mic Night
                </h1>
            </div>
        );
    }

    return (
        <main
            onClick={() => setHasInteracted(true)}
            className="flex flex-col h-screen w-full bg-background items-center justify-center p-12 overflow-hidden text-center relative"
        >
            {/* Audio Unlock Overlay */}
            <AnimatePresence>
                {!hasInteracted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm cursor-pointer"
                    >
                        <div className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-xl shadow-2xl animate-bounce">
                            🎙️ Click Anywhere to Start Stage Display & Audio
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPerformer.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto z-10 space-y-16"
                >
                    <div className="flex flex-col items-center space-y-8 text-center">
                        <motion.h2
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-3xl font-semibold uppercase tracking-[0.3em] text-muted-foreground/80"
                        >
                            {getStatusText()}
                        </motion.h2>

                        <div className="flex items-center gap-12 bg-card/50 backdrop-blur-3xl p-8 pr-16 rounded-[4rem] border border-border shadow-2xl">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.4, type: "spring", bounce: 0.4 }}
                                className="w-48 h-48 rounded-full overflow-hidden border-4 border-background shadow-lg shrink-0"
                            >
                                {currentPerformer.photoURL ? (
                                    <img src={currentPerformer.photoURL} alt={currentPerformer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground font-bold text-5xl">
                                        {currentPerformer.name[0]}
                                    </div>
                                )}
                            </motion.div>

                            <div className="flex flex-col justify-center max-w-[50vw]">
                                <motion.h1
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="text-[6rem] leading-none font-bold tracking-tight text-foreground truncate text-left"
                                >
                                    {currentPerformer.name}
                                </motion.h1>
                                {currentPerformer.metadata && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                        className="text-3xl font-medium text-primary mt-2 tracking-wide truncate text-left"
                                    >
                                        {currentPerformer.metadata}
                                    </motion.p>
                                )}
                                {currentPerformer.instagram && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="mt-6 flex justify-start"
                                    >
                                        <div className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-tr from-pink-500 to-orange-400 text-transparent bg-clip-text px-6 py-3 rounded-full border border-pink-500/30 bg-pink-500/5 shadow-[0_0_20px_rgba(236,72,153,0.15)] w-fit">
                                            <svg className="w-8 h-8 text-pink-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                            @{currentPerformer.instagram.replace('@', '')}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-[240px] flex items-center justify-center">
                        <AnimatePresence mode="popLayout">
                            {activeTimer && (
                                <motion.div
                                    key={activeTimer}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -40 }}
                                    transition={{ type: "spring", bounce: 0.3 }}
                                    className="text-[14rem] font-medium leading-none tabular-nums tracking-tighter"
                                >
                                    {isTimesUp ? (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-destructive font-black uppercase tracking-tighter shrink-0 drop-shadow-sm"
                                        >
                                            Time's Up
                                        </motion.div>
                                    ) : (
                                        <div className="text-primary drop-shadow-sm">
                                            <CountdownTimer
                                                endsAt={activeTimer}
                                                onWarning={() => playChime('warning')}
                                                onEnd={() => playChime('end')}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Up Next Indicator */}
            <AnimatePresence>
                {nextPerformer && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-12 right-12 bg-card/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 flex items-center gap-6 shadow-2xl z-20"
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">Up Next</span>
                            <span className="text-2xl font-bold tracking-tight text-foreground">{nextPerformer.name}</span>
                            {nextPerformer.metadata && (
                                <span className="text-sm font-medium text-primary mt-1 truncate max-w-[200px]">{nextPerformer.metadata}</span>
                            )}
                        </div>
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-background/50 bg-muted shrink-0">
                            {nextPerformer.photoURL ? (
                                <img src={nextPerformer.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-muted-foreground">
                                    {nextPerformer.name[0]}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EMOJI REACTIONS */}
            <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                <AnimatePresence>
                    {reactions.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: '100vh', left: `${r.x}vw`, scale: 0.5 }}
                            animate={{ opacity: [0, 1, 1, 0], y: '-20vh', left: `${r.x + (Math.random() * 10 - 5)}vw`, scale: [0.5, 1.5, 2, 1.5] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            className="absolute bottom-0 text-7xl drop-shadow-xl"
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Background ambient glow matching SaaS aesthetic */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-primary/5 rounded-full blur-[100px] opacity-50 mix-blend-multiply" />
            </div>

            {/* Live Hype Meter */}
            <AnimatePresence>
                {(performanceLive || votingOpen) && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-0 inset-x-0 h-3 sm:h-5 bg-background/50 backdrop-blur-md border-t border-border z-[110]"
                    >
                        <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 shadow-[0_0_30px_rgba(236,72,153,0.7)]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${hypeLevel}%` }}
                            transition={{ type: "tween", ease: "linear", duration: 0.15 }}
                        />
                        <div
                            className="absolute inset-x-0 bottom-full mb-3 flex justify-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground transition-opacity duration-300 pointer-events-none"
                            style={{ opacity: hypeLevel > 0 ? 1 : 0 }}
                        >
                            <span className="bg-background/80 backdrop-blur-sm px-6 py-2 rounded-full border border-border shadow-md">Audience Hype Level</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
