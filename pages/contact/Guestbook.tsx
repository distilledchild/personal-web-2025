import React, { useState, useEffect } from 'react';
import { Plus, X, MessageSquare } from 'lucide-react';
import { GuestbookCard } from '../../components/GuestbookCard';
import { API_URL } from '../../utils/apiConfig';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface GuestbookEntry {
    _id: string;
    name: string;
    email: string;
    picture?: string;
    message: string;
    likes: number;
    likedBy: string[];
    createdAt: string;
    updatedAt?: string;
}

interface GuestbookProps {
    user: any;
    isAuthorized: boolean;
}

export const Guestbook: React.FC<GuestbookProps> = ({ user, isAuthorized }) => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingEntry, setEditingEntry] = useState<GuestbookEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        message: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 4;

    useLockBodyScroll(isModalOpen);

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/guestbook`);
            if (response.ok) {
                const data = await response.json();
                setEntries(data);
            }
        } catch (error) {
            console.error('Failed to fetch guestbook entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = () => {
        if (!user) {
            alert('Please sign in with Google to leave a message in the guestbook.');
            return;
        }
        setIsEditMode(false);
        setEditingEntry(null);
        setFormData({ message: '' });
        setIsModalOpen(true);
    };

    const handleEditClick = (entry: GuestbookEntry) => {
        if (!user || user.email !== entry.email) {
            alert('You can only edit your own messages.');
            return;
        }
        setIsEditMode(true);
        setEditingEntry(entry);
        setFormData({ message: entry.message });
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (entry: GuestbookEntry) => {
        if (!user || user.email !== entry.email) {
            alert('You can only delete your own messages.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/guestbook/${entry._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email })
            });

            if (response.ok) {
                fetchEntries();
            } else {
                alert('Failed to delete the message.');
            }
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert('Failed to delete the message.');
        }
    };

    // Handle like/unlike
    const handleLike = async (entryId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            alert('Please sign in with Google to like messages.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/guestbook/${entryId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            if (response.ok) {
                const data = await response.json();
                // Update local state
                setEntries(prev => prev.map(entry =>
                    entry._id === entryId
                        ? { ...entry, likes: data.likes, likedBy: data.likedBy }
                        : entry
                ));
            }
        } catch (error) {
            console.error('Failed to like entry:', error);
        }
    };

    // Check if current user has liked an entry
    const hasUserLiked = (entry: GuestbookEntry) => {
        if (!user || !entry.likedBy || !Array.isArray(entry.likedBy)) return false;
        return entry.likedBy.includes(user.email);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingEntry(null);
        setFormData({ message: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            if (isEditMode && editingEntry) {
                // Update existing entry
                const response = await fetch(`${API_URL}/api/guestbook/${editingEntry._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: formData.message,
                        userEmail: user.email
                    })
                });

                if (response.ok) {
                    fetchEntries();
                    closeModal();
                } else {
                    alert('Failed to update the message.');
                }
            } else {
                // Create new entry
                const response = await fetch(`${API_URL}/api/guestbook`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: user.name,
                        email: user.email,
                        picture: user.picture,
                        message: formData.message
                    })
                });

                if (response.ok) {
                    fetchEntries();
                    closeModal();
                } else {
                    alert('Failed to post the message.');
                }
            }
        } catch (error) {
            console.error('Failed to submit entry:', error);
            alert('Failed to submit the message.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fadeIn relative">
            {/* Add Button - Only for logged-in users */}
            {user && (
                <div className="fixed bottom-24 left-6 z-50">
                    <button
                        onClick={handleAddClick}
                        className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-600 transition-all hover:scale-110"
                        title="Leave a message"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            <div className="space-y-6">
                <div className="text-left mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Leave a Message</h3>
                    <p className="text-slate-500 text-lg">Share your thoughts, say hello, or just leave your mark! (Please login to leave a message.)</p>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
                        <p>Loading messages...</p>
                    </div>
                ) : entries.length > 0 ? (
                    <>
                        {/* Pagination logic */}
                        {(() => {
                            const totalPages = Math.ceil(entries.length / entriesPerPage);
                            const indexOfLastEntry = currentPage * entriesPerPage;
                            const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
                            const currentEntries = entries.slice(indexOfFirstEntry, indexOfLastEntry);

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentEntries.map((entry) => (
                                            <GuestbookCard
                                                key={entry._id}
                                                entry={entry}
                                                user={user}
                                                onEdit={handleEditClick}
                                                onDelete={handleDeleteClick}
                                                onLike={handleLike}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination Controls - Always visible */}
                                    <div className="flex justify-center items-center gap-2 mt-8">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 1
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </>
                ) : (
                    <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="mb-4">No messages yet. Be the first to leave one!</p>
                        {!user && (
                            <p className="text-sm">Sign in with Google to leave a message.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Write/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="relative bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scaleIn">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>

                        <h3 className="text-2xl font-bold text-slate-900 mb-6">
                            {isEditMode ? 'Edit Your Message' : 'Leave a Message'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Your Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ message: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                    placeholder="Write something nice... 💬"
                                    rows={5}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 text-sm text-slate-500 bg-purple-50 rounded-xl p-4">
                                {user?.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-10 h-10 rounded-full object-cover shadow-md"
                                    />
                                ) : (
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                        {user?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-slate-700">Posting as {user?.name}</p>
                                    <p className="text-xs">{user?.email}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    {isEditMode ? 'Save Changes' : 'Post Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
