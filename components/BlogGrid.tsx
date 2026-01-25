import React from 'react';
import { BlogCard } from './BlogCard';
import { Pagination } from './Pagination';
import { Coffee } from 'lucide-react';

interface BlogGridProps {
    posts: any[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPostClick: (index: number) => void; // Uses global index logic internally or passed from parent? Parent should handle "which post" logic.
    onLike: (postId: string, e: React.MouseEvent) => void;
    isLikedByUser: (post: any) => boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSearch: () => void;
    emptyMessage?: string;
}

export const BlogGrid: React.FC<BlogGridProps> = ({
    posts,
    loading,
    currentPage,
    totalPages,
    onPageChange,
    onPostClick,
    onLike,
    isLikedByUser,
    searchQuery,
    onSearchChange,
    onSearch,
    emptyMessage = "No posts found."
}) => {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-400">Loading posts...</div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-slate-400 text-xl font-medium flex flex-col items-center gap-4">
                    <Coffee size={48} className="text-slate-300" />
                    <span>{emptyMessage}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 lg:overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2 pb-20 lg:pb-2">
                {posts.map((post, i) => (
                    <div key={post._id || i} className="h-full">
                        <BlogCard
                            post={post}
                            isLiked={isLikedByUser(post)}
                            onLike={(e) => onLike(post._id, e)}
                            onClick={() => onPostClick(i)}
                        />
                    </div>
                ))}
            </div>

            {/* Pagination and Search Row */}
            <div className="flex items-center justify-between mt-8 pb-8 px-4">
                {/* Left Spacer */}
                <div className="flex-1"></div>

                {/* Pagination (Centered) */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    theme="pink"
                />

                {/* Search Section (Right Aligned) */}
                <div className="flex-1 flex justify-end">
                    <div className="flex items-center gap-2 w-full max-w-xs justify-end">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    onSearch();
                                }
                            }}
                            placeholder="Search posts..."
                            className="w-48 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        />
                        <button
                            onClick={onSearch}
                            className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:border-pink-300 transition-all flex items-center justify-center group"
                            title="Search"
                        >
                            <svg
                                className="w-5 h-5 text-pink-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
