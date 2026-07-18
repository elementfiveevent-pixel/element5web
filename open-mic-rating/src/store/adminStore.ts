import { create } from 'zustand';
import { db } from '@/firebase/clientApp';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface Performer {
    id: string;
    name: string;
    photoURL: string;
    averageScore: number;
    totalVotes: number;
    totalPoints: number;
    orderIndex: number;
    isSkipped?: boolean;
    metadata?: string;
    instagram?: string;
}

interface AdminStore {
    performers: Performer[];
    setPerformers: (performers: Performer[]) => void;
    syncPerformersWithFirestore: () => () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
    performers: [],

    setPerformers: (performers) => set({ performers }),

    syncPerformersWithFirestore: () => {
        const q = query(collection(db, 'performers'), orderBy('orderIndex', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const perfs: Performer[] = [];
            snapshot.forEach((doc) => {
                perfs.push({ id: doc.id, ...doc.data() } as Performer);
            });
            set({ performers: perfs });
        });
        return unsubscribe;
    },
}));
