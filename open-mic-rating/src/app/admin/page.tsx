'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/firebase/clientApp';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { AdminDashboard } from './AdminDashboard';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Logged in successfully');
        } catch (err: any) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoggingIn(false);
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-muted/30">
                <Toaster />
                <div className="w-full max-w-sm bg-card p-8 rounded-3xl shadow-sm border border-border">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Admin Login</h1>
                        <p className="text-sm text-muted-foreground mt-2">Sign in to control the event</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                value={email} onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none transition-shadow"
                                value={password} onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loggingIn}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold mt-4 disabled:opacity-50"
                        >
                            {loggingIn ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20">
            <Toaster />
            <header className="bg-card border-b border-border py-4 px-6 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight">Open Mic Control Panel</h1>
                <button
                    onClick={() => signOut(auth)}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    Sign Out
                </button>
            </header>
            <AdminDashboard />
        </div>
    );
}
