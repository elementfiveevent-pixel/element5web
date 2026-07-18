'use client';

import { useState, useEffect } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { db } from '@/firebase/clientApp';
import { supabase } from '@/supabase/clientApp';
import { collection, addDoc, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Trash2, Edit2, UploadCloud, GripVertical, EyeOff, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Reorder } from 'framer-motion';

export function PerformerManagementView() {
    const { performers } = useAdminStore();

    const [newName, setNewName] = useState('');
    const [newMetadata, setNewMetadata] = useState('');
    const [newInstagram, setNewInstagram] = useState('');
    const [bulkNames, setBulkNames] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const [adding, setAdding] = useState(false);
    const [localPerformers, setLocalPerformers] = useState(performers);

    // Keep local sync with store when external updates happen
    useEffect(() => {
        setLocalPerformers(performers);
    }, [performers]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName && !bulkNames) return;
        setAdding(true);

        try {
            if (bulkNames) {
                // Bulk Add
                const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
                const batch = writeBatch(db);
                names.forEach((name, idx) => {
                    const docRef = doc(collection(db, 'performers'));
                    batch.set(docRef, {
                        name,
                        photoURL: '',
                        averageScore: 0,
                        totalVotes: 0,
                        totalPoints: 0,
                        orderIndex: performers.length + idx,
                        isSkipped: false,
                        metadata: '',
                        instagram: ''
                    });
                });
                await batch.commit();
                setBulkNames('');
                toast.success(`Added ${names.length} performers`);
            } else {
                // Single Add
                let photoURL = '';
                if (photoFile) {
                    const fileName = `${Date.now()}_${photoFile.name}`;
                    const { data, error } = await supabase.storage
                        .from('performers')
                        .upload(fileName, photoFile, { cacheControl: '3600', upsert: false });

                    if (error) {
                        toast.error(`Upload failed: ${error.message}`);
                        console.error('Supabase upload error:', error);
                    } else {
                        const { data: publicData } = supabase.storage
                            .from('performers')
                            .getPublicUrl(fileName);
                        photoURL = publicData.publicUrl;
                    }
                }

                await addDoc(collection(db, 'performers'), {
                    name: newName,
                    photoURL,
                    averageScore: 0,
                    totalVotes: 0,
                    totalPoints: 0,
                    orderIndex: performers.length,
                    isSkipped: false,
                    metadata: newMetadata,
                    instagram: newInstagram
                });
                setNewName('');
                setNewMetadata('');
                setNewInstagram('');
                setPhotoFile(null);
                toast.success('Performer added');
            }
        } catch (err) {
            toast.error('Failed to add performer');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await deleteDoc(doc(db, 'performers', id));
                toast.success('Deleted');
            } catch (err) {
                toast.error('Failed to delete');
            }
        }
    };

    const handleEditPerformer = async (id: string, currentName: string, currentMeta: string, currentInsta: string) => {
        const newName = prompt('Enter new name:', currentName);
        if (newName === null) return;

        const newMeta = prompt('Enter subtext/metadata (e.g. Original Song):', currentMeta || '');
        if (newMeta === null) return;

        const newInsta = prompt('Enter Instagram:', currentInsta || '');
        if (newInsta === null) return;

        if (newName !== currentName || newMeta !== currentMeta || newInsta !== currentInsta) {
            try {
                await updateDoc(doc(db, 'performers', id), { name: newName, metadata: newMeta, instagram: newInsta });
                toast.success('Performer updated');
            } catch (err) {
                toast.error('Failed to update performer');
            }
        }
    };

    const handleToggleSkip = async (id: string, currentStatus: boolean = false) => {
        try {
            await updateDoc(doc(db, 'performers', id), { isSkipped: !currentStatus });
            toast.success(currentStatus ? 'Performer active' : 'Performer skipped');
        } catch (err) {
            toast.error('Failed to update skip status');
        }
    };

    const handleDragReorder = async (newOrder: typeof performers) => {
        // Optimistic UI update
        setLocalPerformers(newOrder);

        try {
            const batch = writeBatch(db);
            let hasChanges = false;

            newOrder.forEach((p, idx) => {
                if (p.orderIndex !== idx) {
                    hasChanges = true;
                    batch.update(doc(db, 'performers', p.id), { orderIndex: idx });
                }
            });

            if (hasChanges) {
                await batch.commit();
                toast.success('Lineup reordered');
            }
        } catch (err) {
            toast.error('Failed to save new order');
            setLocalPerformers(performers); // Revert on failure
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Performers List */}
            <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col h-[700px]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold">Performers</h2>
                        <p className="text-sm text-muted-foreground">{performers.length} total participants (Drag to reorder)</p>
                    </div>
                </div>

                <Reorder.Group
                    axis="y"
                    values={localPerformers}
                    onReorder={handleDragReorder}
                    className="flex-1 overflow-y-auto pr-2 space-y-3"
                >
                    {localPerformers.map((p, idx) => (
                        <Reorder.Item
                            key={p.id}
                            value={p}
                            className={`group flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-all cursor-grab active:cursor-grabbing hover:shadow-md bg-card ${p.isSkipped ? 'opacity-40 grayscale' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                <GripVertical className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors cursor-grab" size={20} />
                                <div className="w-12 h-12 bg-muted rounded-xl truncate overflow-hidden flex items-center justify-center font-bold text-muted-foreground shadow-sm">
                                    {p.photoURL ? <img src={p.photoURL} alt="" className="w-full h-full object-cover pointer-events-none" /> : p.name[0]}
                                </div>
                                <div className={p.isSkipped ? 'line-through' : ''}>
                                    <h3 className="font-semibold">{p.name} {p.isSkipped && '(Skipped)'}</h3>
                                    {p.metadata && <span className="text-sm font-medium text-primary/80 mr-2">{p.metadata}</span>}
                                    {p.instagram && <span className="text-sm font-medium text-pink-500">Ig: {p.instagram}</span>}
                                    <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                        <span>★ {p.averageScore.toFixed(1)}</span>
                                        <span>🗳️ {p.totalVotes} votes</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleToggleSkip(p.id, p.isSkipped)}
                                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg"
                                    title={p.isSkipped ? "Unskip Performer" : "Mark as No-Show"}
                                >
                                    {p.isSkipped ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button onClick={() => handleEditPerformer(p.id, p.name, p.metadata || '', p.instagram || '')} className="p-2 text-muted-foreground hover:bg-muted rounded-lg"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-lg"><Trash2 size={16} /></button>
                            </div>
                        </Reorder.Item>
                    ))}
                    {localPerformers.length === 0 && <div className="text-center py-12 text-muted-foreground">No performers yet.</div>}
                </Reorder.Group>
            </div>

            {/* Add Performer Form */}
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm h-fit sticky top-6">
                <h2 className="text-lg font-bold mb-1">Add Performer</h2>
                <p className="text-sm text-muted-foreground mb-6">Create new participants.</p>

                <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Single Addition</label>
                            <input
                                type="text" placeholder="Performer Name"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none mb-3"
                                value={newName} onChange={e => setNewName(e.target.value)}
                                disabled={bulkNames.length > 0}
                            />
                            <input
                                type="text" placeholder="Metadata (e.g. Original Song)"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none mb-3 text-sm"
                                value={newMetadata} onChange={e => setNewMetadata(e.target.value)}
                                disabled={bulkNames.length > 0}
                            />
                            <input
                                type="text" placeholder="Instagram (Optional)"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none mb-3 text-sm"
                                value={newInstagram} onChange={e => setNewInstagram(e.target.value)}
                                disabled={bulkNames.length > 0}
                            />
                            <label className="flex items-center justify-center w-full min-h-[50px] px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                <UploadCloud size={18} className="text-muted-foreground mr-2" />
                                <span className="text-sm text-muted-foreground">{photoFile ? photoFile.name : 'Upload Photo (Optional)'}</span>
                                <input type="file" accept="image/*" className="hidden" disabled={bulkNames.length > 0} onChange={e => e.target.files && setPhotoFile(e.target.files[0])} />
                            </label>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Bulk Addition</label>
                            <textarea
                                rows={4}
                                placeholder="Paste names separated by new lines"
                                className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none resize-none"
                                value={bulkNames} onChange={e => setBulkNames(e.target.value)}
                                disabled={newName.length > 0}
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={adding || (!newName && !bulkNames)}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {adding ? 'Adding...' : 'Add Performer(s)'}
                    </button>
                </form>
            </div>

        </div>
    );
}
