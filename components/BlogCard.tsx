import React from 'react';
import { LikeButton } from './LikeButton';

interface BlogCardProps {
    post: any;
    isLiked: boolean;
    onLike: (e: React.MouseEvent) => void;
    onClick: () => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, isLiked, onLike, onClick }) => {
    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Strip markdown syntax for preview
    const stripMarkdown = (markdown: string) => {
        if (!markdown) return '';
        return markdown
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
            .replace(/^#{1,6}\s+(.*)$/gm, '||BR||$1') // Mark Headers
            .replace(/^[\s]*[-*+]\s+/gm, '||BR||• ') // Mark List Items
            .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
            .replace(/(\*|_)(.*?)\1/g, '$2') // Italic
            .replace(/`([^`]+)`/g, '$1') // Code
            .replace(/\n+/g, ' ') // Flatten logical newlines
            .replace(/\|\|BR\|\|/g, '\n') // Restore our breaks
            .replace(/  +/g, ' ') // Trim multiple spaces
            .trim();
    };

    return (
        <div
            onClick={onClick}
            className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full cursor-pointer"
        >
            {/* Header with Category and Tags */}
            <div className={`${post.color} py-3 px-5 flex items-center justify-between flex-shrink-0`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${post.textColor} bg-white/80 w-fit px-2 py-1 rounded-md`}>
                    {post.category}
                </span>

                {/* Tags moved to header for space efficiency */}
                {/* Tags moved to header for space efficiency */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-1">
                        {(() => {
                            const normalizedTags = post.tags
                                .flatMap((t: string) => t.split(','))
                                .map((t: string) => t.trim())
                                .filter((t: string) => t);

                            return (
                                <>
                                    {normalizedTags.slice(0, 2).map((tag: string, idx: number) => (
                                        <span key={idx} className={`text-[9px] font-medium ${post.textColor} bg-white/60 px-1.5 py-0.5 rounded`}>
                                            {tag}
                                        </span>
                                    ))}
                                    {normalizedTags.length > 2 && (
                                        <span className={`text-[9px] font-medium ${post.textColor} bg-white/60 px-1.5 py-0.5 rounded`}>
                                            +{normalizedTags.length - 2}
                                        </span>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            <div className="p-3 flex-1 flex flex-col">
                <h3 className="text-base font-bold text-slate-800 mb-1 transition-colors line-clamp-2">
                    {post.title}
                </h3>

                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 whitespace-pre-line">
                    {stripMarkdown(post.content || '').substring(0, 150)}...
                </p>

                <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <LikeButton
                                isLiked={isLiked}
                                likeCount={post.likes || 0}
                                onLike={(e) => {
                                    e.stopPropagation();
                                    onLike(e);
                                }}
                            />
                        </div>
                        <span>{formatDate(post.createdAt)}</span>
                    </div>

                    <button
                        className={`text-xs font-bold text-slate-900 ${post.hoverColor} transition-colors flex items-center gap-1`}
                    >
                        Read Article &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
};
