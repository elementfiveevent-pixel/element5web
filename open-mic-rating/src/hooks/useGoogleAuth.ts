import { useState, useEffect } from 'react';
import { auth } from '@/firebase/clientApp';
import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

export function useGoogleAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    const signIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Enforce account selection so they don't accidentally auto-login to a wrong account
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
            toast.success('Signed in successfully');
        } catch (error: any) {
            console.error(error);
            toast.error('Failed to sign in. Please try again.');
        }
    };

    const logOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error(error);
        }
    };

    return { user, loading, signIn, logOut, uid: user?.uid };
}
