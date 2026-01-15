import React from 'react';

interface LikeButtonProps {
    isLiked: boolean;
    likeCount: number;
    onLike?: (e: React.MouseEvent) => void;
    className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ isLiked, likeCount, onLike, className = '' }) => {
    return (
        <button
            onClick={onLike}
            className={`flex items-center gap-2 hover:scale-110 transition-transform ${className}`}
            title={isLiked ? 'Unlike' : 'Like'}
            type="button"
        >
            <span className={`text-xl ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>
                {isLiked ? '❤️' : '🤍'}
            </span>
            <span className="font-medium text-slate-700">{likeCount}</span>
        </button>
    );
};
