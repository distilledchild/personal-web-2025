import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { LikeButton } from './LikeButton';

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

interface GuestbookCardProps {
    entry: GuestbookEntry;
    user: any; // Using any to match existing props usage, cleaner would be a User interface
    onEdit: (entry: GuestbookEntry) => void;
    onDelete: (entry: GuestbookEntry) => void;
    onLike: (entryId: string, e: React.MouseEvent) => void;
}

export const GuestbookCard: React.FC<GuestbookCardProps> = ({
    entry,
    user,
    onEdit,
    onDelete,
    onLike
}) => {
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

    const hasUserLiked = (entry: GuestbookEntry) => {
        if (!user || !entry.likedBy || !Array.isArray(entry.likedBy)) return false;
        return entry.likedBy.includes(user.email);
    };

    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-purple-100 hover:shadow-lg transition-all duration-300 group">
            {/* Header - Author Info (Light Purple Background from Contact card hover) */}
            <div className="bg-purple-50 p-4 border-b border-purple-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {entry.picture ? (
                            <img
                                src={entry.picture}
                                alt={entry.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg border-2 border-white">
                                {entry.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-slate-900">{entry.name}</p>
                            <p className="text-xs text-purple-600 font-medium">{formatDate(entry.createdAt)}</p>
                        </div>
                    </div>

                    {/* Edit/Delete buttons - only for the author */}
                    {user && user.email === entry.email && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEdit(entry)}
                                className="p-2 rounded-full hover:bg-white text-purple-600 transition-colors"
                                title="Edit message"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => onDelete(entry)}
                                className="p-2 rounded-full hover:bg-red-50 text-red-400 transition-colors"
                                title="Delete message"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Body - Message Content (White Background) */}
            <div className="p-5 bg-white">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {entry.message}
                </p>

                {/* Footer with likes and edit info */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {/* Like button */}
                    <LikeButton
                        isLiked={hasUserLiked(entry)}
                        likeCount={entry.likes || 0}
                        onLike={(e) => onLike(entry._id, e)}
                    />

                    {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
                        <p className="text-xs text-slate-400 italic">
                            (edited)
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
