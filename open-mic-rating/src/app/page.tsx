'use client';

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAdminStore } from '@/store/adminStore';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { RateSlider } from '@/components/Slider';
import { CountdownTimer } from '@/components/CountdownTimer';
import { db } from '@/firebase/clientApp';
import { collection, getDocs, runTransaction, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '@/lib/socket';

export default function PublicVotingScreen() {
  const { user, loading: authLoading, signIn, logOut, uid } = useGoogleAuth();

  const { currentPerformerId, votingOpen, performanceLive, roundID, votingEndsAt, actCompleted } = useEventStore();
  const syncEvent = useEventStore(state => state.syncWithSocket);
  const notifyVoteCast = useEventStore(state => state.notifyVoteCast);

  const { performers } = useAdminStore();
  const syncPerformers = useAdminStore(state => state.syncPerformersWithFirestore);

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'vote' | 'history'>('vote');

  useEffect(() => {
    const unsubEvent = syncEvent(); // Now connects to Socket.io
    const unsubPerfs = syncPerformers();
    return () => {
      unsubEvent();
      unsubPerfs();
    }
  }, [syncEvent, syncPerformers]);

  useEffect(() => {
    if (!uid || !roundID || !currentPerformerId) return;

    const checkVote = async () => {
      const voteRef = doc(db, 'votes', `${roundID}_${uid}`);
      const voteDoc = await getDoc(voteRef);
      setHasVoted(voteDoc.exists());
    };
    checkVote();
    setRating(5);
    setFeedback("");
  }, [uid, roundID, currentPerformerId]);

  const handleSubmit = async () => {
    if (!uid || !currentPerformerId || !votingOpen || hasVoted) return;

    setSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const perfRef = doc(db, 'performers', currentPerformerId);
        const voteRef = doc(db, 'votes', `${roundID}_${uid}`);

        const voteDoc = await transaction.get(voteRef);
        if (voteDoc.exists()) throw new Error("Already voted");

        const perfDoc = await transaction.get(perfRef);
        if (!perfDoc.exists()) throw new Error("Performer not found");

        const perfData = perfDoc.data();
        const newTotalVotes = (perfData.totalVotes || 0) + 1;
        const newTotalPoints = (perfData.totalPoints || 0) + rating;
        const newAvg = newTotalPoints / newTotalVotes;

        transaction.set(voteRef, {
          roundID,
          performerId: currentPerformerId,
          uid: uid,
          email: user?.email || 'unknown',
          rating,
          feedback: feedback.trim(),
          timestamp: Date.now()
        });

        transaction.update(perfRef, {
          totalVotes: newTotalVotes,
          totalPoints: newTotalPoints,
          averageScore: newAvg
        });
      });

      setHasVoted(true);
      notifyVoteCast(); // Ping the socket server to increment live votes
      toast.success("Vote Submitted! 🎉", { icon: '🙌' });
    } catch (error) {
      toast.error("Failed to submit vote. Are you sure you haven't voted?");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentPerformer = performers.find(p => p.id === currentPerformerId);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative overflow-hidden text-center">
        <Toaster position="top-center" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="z-10 space-y-8 max-w-sm"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] mx-auto flex items-center justify-center mb-6">
            <span className="text-4xl pr-1">🎫</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Audience Voting</h1>
            <p className="text-muted-foreground font-medium">Please sign in with your Google account to log your votes.</p>
          </div>

          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-4 rounded-2xl font-bold text-lg hover:bg-foreground/90 transition-all shadow-lg active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Sign in with Google
          </button>

          <p className="text-xs text-muted-foreground/60 max-w-[250px] mx-auto leading-relaxed mt-4">
            We only ask for a Google sign-in to ensure 1 vote per person.
          </p>
        </motion.div>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_100%)] opacity-[0.03]" />
      </main>
    );
  }

  if (!currentPerformerId || !currentPerformer) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background relative overflow-hidden">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-center space-y-6 z-10 p-10 bg-card/50 backdrop-blur-xl rounded-[3rem] border border-border pb-12 shadow-2xl"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] mx-auto flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_30px_rgba(var(--color-primary),0.2)]">
            <span className="text-4xl">✨</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Welcome</h1>
            <h2 className="text-lg font-medium text-muted-foreground tracking-wide">To the Open Mic Rating Experience</h2>
          </div>
          <p className="text-muted-foreground/80 font-medium flex justify-center items-center gap-3 pt-6 text-sm bg-muted/30 py-3 px-6 rounded-full w-max mx-auto border border-border/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/80"></span>
            </span>
            Waiting for the show to begin...
          </p>
        </motion.div>

        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_70%)] opacity-[0.05]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen pt-12 pb-8 px-5 flex flex-col items-center justify-between overflow-hidden bg-background relative max-w-[500px]">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '1rem', background: 'var(--color-card)', color: 'var(--color-foreground)', border: '1px solid var(--color-border)' } }} />

      {/* Top Identity Block */}
      <div className="w-full text-center z-10 flex flex-col items-center flex-1">
        <div className="w-full flex justify-between items-center mb-6 px-2">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('vote')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'vote' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Live Screen
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My Votes
            </button>
          </div>
          <button onClick={logOut} className="text-xs border px-3 py-1.5 rounded-full hover:bg-muted font-semibold transition-colors">Sign Out</button>
        </div>

        {activeTab === 'history' ? (
          <VotingHistory uid={uid!} performers={performers} />
        ) : (
          <>
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/50 mb-10"
            >
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${votingOpen ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${votingOpen ? 'bg-green-500' : 'bg-orange-500'}`}></span>
              </span>
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {votingOpen ? 'Voting Open' : 'Performance Live'}
              </span>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentPerformer.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="flex flex-col items-center w-full"
              >
                <div className="w-44 h-44 rounded-full overflow-hidden shadow-2xl bg-card border-[6px] border-background relative z-10 mb-6">
                  {currentPerformer.photoURL ? (
                    <img
                      src={currentPerformer.photoURL}
                      alt={currentPerformer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-5xl bg-muted">
                      {currentPerformer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-4xl font-bold tracking-tight text-foreground mb-2 text-balance leading-tight">
                  {currentPerformer.name}
                </h2>
                {currentPerformer.metadata && (
                  <p className="text-lg font-medium text-primary mt-1 tracking-wide">
                    {currentPerformer.metadata}
                  </p>
                )}
                {currentPerformer.instagram && (
                  <a
                    href={`https://instagram.com/${currentPerformer.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-tr from-pink-500 to-orange-400 text-white px-4 py-1.5 rounded-full shadow-md hover:scale-105 transition-transform"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    @{currentPerformer.instagram.replace('@', '')}
                  </a>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Sub-Timer */}
            <div className="mt-8 mb-4 h-12 flex items-center justify-center w-full">
              <AnimatePresence>
                {votingOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-sm text-muted-foreground font-medium mb-1">Time Remaining to Vote</div>
                    <div className="text-3xl font-bold tabular-nums text-primary tracking-tighter">
                      <CountdownTimer endsAt={votingEndsAt} onEnd={() => { }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* EMOJI REACTION BAR */}
            <AnimatePresence>
              {(performanceLive || votingOpen) && !actCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="mb-6 flex justify-center gap-2 sm:gap-3 bg-card/80 backdrop-blur-md p-3 rounded-[2rem] border border-border/50 shadow-lg z-20 relative mx-auto"
                >
                  {['👏', '🔥', '😂', '😍', '🎸', '🎤'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => socket.emit('send_reaction', emoji)}
                      className="text-2xl hover:scale-125 transition-transform active:scale-90 bg-muted/50 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl overflow-visible"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Voting Component */}
      {
        activeTab === 'vote' && (
          <motion.div
            layout
            className="w-full bg-card/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-border/60 z-10 relative overflow-hidden"
          >
            {/* Subtle internal glow inside the card */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <AnimatePresence mode="wait">
              {actCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-center py-5 flex flex-col items-center"
                >
                  <div className="w-20 h-20 bg-muted/50 rounded-full mx-auto flex items-center justify-center mb-6 border border-border">
                    <span className="text-3xl opacity-50">🏁</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">Act Concluded</p>
                  <p className="text-muted-foreground mt-2 font-medium max-w-[250px] mx-auto text-balance">The performers have finished their set. Sit tight for the next act!</p>
                </motion.div>
              ) : !votingOpen ? (
                <motion.div
                  key="closed"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="text-center py-6 flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted/50 mb-4 flex items-center justify-center">
                    <span className="text-2xl opacity-50">⏳</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">Prepare to rate</p>
                  <p className="text-sm max-w-[200px] text-center mx-auto mt-2 tracking-wide text-muted-foreground/80">
                    Voting unlocks as soon as the performance finishes.
                  </p>
                </motion.div>
              ) : hasVoted ? (
                <motion.div
                  key="voted"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-center py-5"
                >
                  <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6 ring-4 ring-primary/5">
                    <span className="text-4xl drop-shadow-sm">🙏</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">Vote Logged</p>
                  <p className="text-muted-foreground mt-2 font-medium">Thank you for rating!</p>
                </motion.div>
              ) : (
                <motion.div
                  key="voting"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 py-2"
                >
                  <div className="text-center flex justify-between items-end px-2">
                    <span className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Your Rating</span>
                    <span className="text-3xl font-bold text-primary tabular-nums tracking-tighter">{rating}<span className="text-lg text-muted-foreground/50">/10</span></span>
                  </div>

                  <RateSlider
                    value={rating}
                    onChange={setRating}
                    disabled={submitting}
                  />

                  {/* Private Constructive Feedback */}
                  <div className="mt-6 flex flex-col gap-2 relative">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Private Feedback (Optional)</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Leave a kind note or constructive tip for the artist..."
                      className="w-full bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl p-5 text-sm resize-none h-28 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 shadow-inner"
                      disabled={submitting}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !uid}
                    className="w-full bg-foreground text-background py-4 rounded-3xl font-bold text-lg hover:bg-foreground/90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center overflow-hidden relative"
                  >
                    {submitting && (
                      <div className="absolute inset-0 bg-background/20 animate-pulse pointer-events-none" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      }

      {/* Environmental ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full max-w-lg bg-[radial-gradient(ellipse_at_top,var(--color-primary)_0%,transparent_70%)] opacity-[0.05] absolute top-0" />
      </div>
    </main >
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function VotingHistory({ uid, performers }: { uid: string, performers: any[] }) {
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const q = query(
          collection(db, 'votes'),
          where('uid', '==', uid)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data());
        docs.sort((a, b) => b.timestamp - a.timestamp);
        setVotes(docs);
      } catch (error) {
        console.error("Error fetching votes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVotes();
  }, [uid]);

  if (loading) return <div className="mt-12 opacity-50"><Spinner /></div>;

  if (votes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-24 text-center">
        <div className="text-4xl mb-4 opacity-50">📝</div>
        <h3 className="text-xl font-bold mb-2">No Votes Yet</h3>
        <p className="text-muted-foreground text-sm">Your voting history will appear here once you rate a performance.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mt-4 text-left">
      <h2 className="text-2xl font-bold mb-6">Voting History</h2>
      <div className="flex flex-col gap-3">
        {votes.map((v, i) => {
          const perf = performers.find(p => p.id === v.performerId);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border/50 p-4 rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border bg-muted overflow-hidden flex items-center justify-center text-muted-foreground font-bold shrink-0">
                  {perf && perf.photoURL ? <img src={perf.photoURL} alt="" className="w-full h-full object-cover" /> : (perf ? perf.name[0] : '?')}
                </div>
                <div>
                  <div className="font-bold text-foreground">{perf ? perf.name : 'Unknown Performer'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-wider text-muted-foreground/80 font-bold mb-0.5">Rating</span>
                <span className="text-2xl font-black tabular-nums text-primary">{v.rating}<span className="text-sm text-muted-foreground/50">/10</span></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
