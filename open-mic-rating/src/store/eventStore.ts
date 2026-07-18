import { create } from 'zustand';
import { socket } from '@/lib/socket';

export interface EventState {
    currentPerformerId: string | null;
    votingOpen: boolean;
    performanceLive: boolean;
    roundID: string;
    performanceEndsAt: number | null; // Timestamp
    votingEndsAt: number | null; // Timestamp
    liveVoteCount: number; // Socket exclusive
    revealLeaderboard?: boolean;
    actCompleted?: boolean;
}

interface EventStore extends EventState {
    setEventState: (state: Partial<EventState>) => void;
    syncWithSocket: () => () => void; // Returns unsubscribe function
    adminUpdateState: (newState: Partial<EventState>) => void;
    notifyVoteCast: () => void;
}

export const useEventStore = create<EventStore>((set) => ({
    currentPerformerId: null,
    votingOpen: false,
    performanceLive: false,
    roundID: "default",
    performanceEndsAt: null,
    votingEndsAt: null,
    liveVoteCount: 0,
    revealLeaderboard: false,
    actCompleted: false,

    setEventState: (state) => set((prev) => ({ ...prev, ...state })),

    syncWithSocket: () => {
        const handleStateUpdate = (newState: EventState) => {
            set({
                currentPerformerId: newState.currentPerformerId || null,
                votingOpen: newState.votingOpen || false,
                performanceLive: newState.performanceLive || false,
                roundID: newState.roundID || "default",
                performanceEndsAt: newState.performanceEndsAt || null,
                votingEndsAt: newState.votingEndsAt || null,
                liveVoteCount: newState.liveVoteCount || 0,
                revealLeaderboard: newState.revealLeaderboard || false,
                actCompleted: newState.actCompleted || false,
            });
        };

        // Listen for server broadcasts
        socket.on('state_update', handleStateUpdate);

        // Return cleanup function
        return () => {
            socket.off('state_update', handleStateUpdate);
        };
    },

    // Admin helper to push state to server
    adminUpdateState: (newState) => {
        socket.emit('admin_update_state', newState);
    },

    // Audience helper to notify vote
    notifyVoteCast: () => {
        socket.emit('vote_cast');
    }
}));

