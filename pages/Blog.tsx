import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BlogPostModal } from '../components/BlogPostModal';
import { API_URL } from '../utils/apiConfig';

export const Blog: React.FC = () => {
    const location = useLocation();
    const [selectedPost, setSelectedPost] = React.useState<number | null>(null);
    const [blogPosts, setBlogPosts] = React.useState<any[]>([]);
    const [user, setUser] = React.useState<any>(null);
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [showToast, setShowToast] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState('');
    const [toastPos, setToastPos] = React.useState({ x: 0, y: 0 });
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editData, setEditData] = React.useState({ category: '', title: '', content: '', tags: '', existingImages: [] as string[] });
    const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isCreateMode, setIsCreateMode] = React.useState(false);
    const [showValidationDialog, setShowValidationDialog] = React.useState(false);
    const [uploadingImage, setUploadingImage] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [useOpal, setUseOpal] = React.useState(false);
    const [showOpalDialog, setShowOpalDialog] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const postsPerPage = 4;

    React.useEffect(() => {
        // Fetch blog posts
        const fetchBlogs = async () => {
            try {
                console.log('Fetching from:', `${API_URL}/api/tech-blog`);
                const response = await fetch(`${API_URL}/api/tech-blog`);
                console.log('Response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched blog posts:', data);
                    console.log('Number of posts:', data.length);
                    setBlogPosts(data);
                } else {
                    console.error('Failed to fetch:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch blog posts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();

        // Get user data from localStorage (set by Google OAuth)
        const checkAuth = async () => {
            const userData = localStorage.getItem('user_profile');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    // Add userId from OAuth sub or id
                    setUser({
                        ...parsedUser,
                        userId: parsedUser.sub || parsedUser.id || parsedUser.email
                    });

                    // Check authorization from MEMBER collection


                    const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
                    if (response.ok) {
                        const data = await response.json();
                        setIsAuthorized(data.authorized);
                    } else {
                        setIsAuthorized(false);
                    }
                } catch (e) {
                    console.error('Failed to parse user data or check authorization', e);
                    setIsAuthorized(false);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
            }
        };

        // Initial check
        checkAuth();

        // Listen for storage changes (works across tabs)
        window.addEventListener('storage', checkAuth);

        // Poll for changes in same tab (since storage event doesn't fire in same tab)
        const interval = setInterval(checkAuth, 1000);

        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    // ESC key listener for modal
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedPost !== null) {
                e.preventDefault();
                setSelectedPost(null);
            }
        };

        if (selectedPost !== null) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [selectedPost]);

    // Handle like/unlike
    const handleLike = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            setToastMessage('Login required to like posts');
            setToastPos({ x: e.clientX, y: e.clientY });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
            return;
        }

        try {


            const response = await fetch(`${API_URL}/api/tech-blog/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Update local state
                setBlogPosts(prev => prev.map(post =>
                    post._id === postId
                        ? { ...post, likes: data.likes, likedBy: data.likedBy }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    // Check if current user liked a post
    const isLikedByUser = (post: any) => {
        // Heart color is determined by likes count only
        return (post.likes || 0) > 0;
    };

    // Check if current user has already liked (for toggle logic)
    const hasUserLiked = (post: any) => {
        if (!user || !post.likedBy || !Array.isArray(post.likedBy)) return false;
        return post.likedBy.includes(user.email);
    };

    // Check if current user is the author
    const isAuthor = (post: any) => {
        return user && post.author?.email && user.email === post.author.email;
    };

    // Handle edit button click
    const handleEdit = () => {
        if (selectedPost !== null && allPosts[selectedPost]) {
            const content = allPosts[selectedPost].content || '';
            // Extract existing images from markdown content
            const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
            const existingImages: string[] = [];
            let match: RegExpExecArray | null;
            while ((match = imageRegex.exec(content)) !== null) {
                existingImages.push(match[1]);
            }

            setEditData({
                category: allPosts[selectedPost].category || '',
                title: allPosts[selectedPost].title || '',
                content: content,
                tags: allPosts[selectedPost].tags ? allPosts[selectedPost].tags.join('; ') : '',
                existingImages: existingImages
            });
            setIsEditMode(true);
        }
    };

    // Handle save
    const handleSave = async () => {
        if (selectedPost === null || !allPosts[selectedPost]) return;

        try {


            const tagsArray = editData.tags.split(';').map(t => t.trim()).filter(t => t);
            console.log('[FRONTEND] Sending UPDATE with tags:', tagsArray);

            const response = await fetch(`${API_URL}/api/tech-blog/${allPosts[selectedPost]._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editData,
                    tags: tagsArray,
                    email: user.email
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                // Update local state
                setBlogPosts(prev => prev.map(post =>
                    post._id === updatedPost._id ? updatedPost : post
                ));
                setIsEditMode(false);
                // Keep selectedPost to stay on detail page
            }
        } catch (error) {
            console.error('Failed to update post:', error);
        }
    };

    // Handle close edit (show discard dialog)
    const handleCloseEdit = () => {
        setShowDiscardDialog(true);
    };

    // Handle discard
    const handleDiscard = () => {
        setIsEditMode(false);
        setShowDiscardDialog(false);
        setSelectedPost(null);
    };

    // Handle continue editing
    const handleContinueEdit = () => {
        setShowDiscardDialog(false);
    };

    // Handle delete button click
    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (selectedPost === null || !allPosts[selectedPost]) return;

        try {


            const response = await fetch(`${API_URL}/api/tech-blog/${allPosts[selectedPost]._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email
                })
            });

            if (response.ok) {
                // Remove from local state
                setBlogPosts(prev => prev.filter(post => post._id !== allPosts[selectedPost]._id));
                setShowDeleteDialog(false);
                setSelectedPost(null);
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setSelectedPost(null);
    };

    // Check if user can create posts
    const canCreatePost = () => {
        return user && isAuthorized;
    };

    // Handle create button click
    const handleCreate = () => {
        setEditData({ category: '', title: '', content: '', tags: '', existingImages: [] });
        setIsCreateMode(true);
    };

    // Handle create save
    const handleCreateSave = async () => {
        // Validation check (relaxed for OPAL - only title required)
        if (useOpal) {
            if (!editData.title.trim()) {
                setShowValidationDialog(true);
                return;
            }
        } else {
            if (!editData.category.trim() || !editData.title.trim() || !editData.content.trim()) {
                setShowValidationDialog(true);
                return;
            }
        }

        try {


            // If OPAL is checked, call OPAL API
            if (useOpal) {
                const opalResponse = await fetch(`${API_URL}/api/tech-blog/opal-generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category: editData.category,
                        title: editData.title,
                        content: editData.content
                    })
                });

                if (opalResponse.ok) {
                    // Show success dialog
                    setShowOpalDialog(true);
                } else {
                    const errorData = await opalResponse.json();
                    alert(`OPAL workflow failed: ${errorData.error || 'Unknown error'}`);
                }
            } else {
                // Normal save (unchecked OPAL)
                const tagsArray = editData.tags.split(';').map(t => t.trim()).filter(t => t);
                console.log('[FRONTEND] Sending CREATE with tags:', tagsArray);

                const response = await fetch(`${API_URL}/api/tech-blog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...editData,
                        tags: tagsArray,
                        author: {
                            name: user.name,
                            email: user.email,
                            avatar: user.picture
                        }
                    })
                });

                if (response.ok) {
                    const newPost = await response.json();
                    // Add to local state
                    setBlogPosts(prev => [newPost, ...prev]);
                    setIsCreateMode(false);
                    setEditData({ category: '', title: '', content: '', tags: '', existingImages: [] });
                    setUseOpal(false);
                }
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            alert('Failed to save post. Please try again.');
        }
    };

    // Handle create cancel
    const handleCreateCancel = () => {
        // Check if any field has content
        const hasContent = editData.category.trim() || editData.title.trim() || editData.content.trim();

        if (hasContent) {
            setShowDiscardDialog(true);
        } else {
            // No content, just close
            setIsCreateMode(false);
            setEditData({ category: '', title: '', content: '', tags: '', existingImages: [] });
        }
    };

    // Handle discard create
    const handleDiscardCreate = () => {
        setIsCreateMode(false);
        setShowDiscardDialog(false);
        setEditData({ category: '', title: '', content: '', tags: '', existingImages: [] });
    };

    // Handle tag input with auto-formatting
    const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val.endsWith(' ') && !val.endsWith('; ')) {
            setEditData({ ...editData, tags: val.trim() + '; ' });
        } else {
            setEditData({ ...editData, tags: val });
        }
    };

    // Handle tag input blur to remove trailing semicolon
    const handleTagBlur = () => {
        let val = editData.tags.trim();
        if (val.endsWith(';')) {
            val = val.slice(0, -1);
        }
        setEditData({ ...editData, tags: val });
    };

    // Handle image upload
    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setUploadingImage(true);
        try {


            const formData = new FormData();
            formData.append('image', file);
            // Add category for server-side path determination
            formData.append('category', editData.category);

            const response = await fetch(`${API_URL}/api/tech-blog/upload-image`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                // Insert markdown image syntax at the beginning of content (after title)
                const imageMarkdown = `![${file.name}](${data.url})\n\n`;
                setEditData({
                    ...editData,
                    content: imageMarkdown + editData.content,
                    existingImages: [...editData.existingImages, data.url]
                });
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    };

    // Handle file input change
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleImageUpload(files[0]);
        }
    };

    // Handle removing existing image
    const handleRemoveImage = (imageUrl: string) => {
        // Remove image markdown from content
        const imageMarkdownPattern = new RegExp(`!\\[.*?\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\n*`, 'g');
        const newContent = editData.content.replace(imageMarkdownPattern, '');

        // Remove from existingImages array
        const newExistingImages = editData.existingImages.filter((img: string) => img !== imageUrl);

        setEditData({
            ...editData,
            content: newContent,
            existingImages: newExistingImages
        });
    };

    // Unified Color Theme: All Pink
    const colorThemes = [
        { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
        { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
        { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
        { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    ];

    // Combine blog posts with themes
    const allPosts = blogPosts.map((post, i) => ({
        ...post,
        ...colorThemes[i % colorThemes.length]
    }));

    // Filter posts based on search query (button/enter triggered)
    const filteredPosts = isSearching
        ? allPosts.map((post, index) => ({ ...post, globalIndex: index })).filter(post => {
            const searchLower = searchQuery.toLowerCase();
            const titleMatch = post.title?.toLowerCase().includes(searchLower);
            const contentMatch = post.content?.toLowerCase().includes(searchLower);
            const tagsMatch = post.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower));
            return titleMatch || contentMatch || tagsMatch;
        }).sort((a, b) => {
            // Sort by createdAt descending (most recent first)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        })
        : allPosts.map((post, index) => ({ ...post, globalIndex: index })).sort((a, b) => {
            // Always sort by createdAt descending (most recent first)
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

    // Pagination logic
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const posts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    // Get global index for selectedPost (since posts is now paginated)
    const getGlobalIndex = (localIndex: number) => {
        const post = posts[localIndex];
        return post?.globalIndex ?? indexOfFirstPost + localIndex;
    };

    // Handle page change
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        setSelectedPost(null); // Close any open post when changing pages
    };

    // Handle search - triggered by button click or enter key
    const handleSearch = () => {
        if (searchQuery.trim()) {
            setIsSearching(true);
            setCurrentPage(1); // Reset to first page when searching
        } else {
            setIsSearching(false);
            setCurrentPage(1);
        }
    };

    // Format date helper
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Strip markdown syntax for preview
    const stripMarkdown = (markdown: string) => {
        if (!markdown) return '';

        return markdown
            // Remove images ![alt](url) - MUST be before links to avoid conflicts
            .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
            // Remove headers (# ## ###)
            .replace(/^#{1,6}\s+/gm, '')
            // Remove code blocks ```code``` - MUST be before inline code
            .replace(/```[\s\S]*?```/g, '')
            // Remove inline code `code`
            .replace(/`([^`]+)`/g, '$1')
            // Remove links [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remove bold (**text** or __text__)
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            // Remove italic (*text* or _text_)
            .replace(/(\*|_)(.*?)\1/g, '$2')
            // Remove blockquotes (>)
            .replace(/^>\s+/gm, '')
            // Remove horizontal rules (---, ___, ***)
            .replace(/^([-_*]){3,}$/gm, '')
            // Remove list markers (-, *, +, 1.)
            .replace(/^[\s]*[-*+]\s+/gm, '')
            .replace(/^[\s]*\d+\.\s+/gm, '')
            // Remove extra whitespace and newlines
            .replace(/\n\s*\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    return (
        <>
            <div className="h-screen bg-white pt-32 pb-4 px-6 flex flex-col overflow-hidden">
                <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6 text-center border-b border-slate-100 pb-4 flex-shrink-0">Tech & Bio</h2>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-slate-400">Loading posts...</div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-slate-400">No posts found.</div>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                            {/* Sidebar TOC */}
                            {/* Sidebar TOC */}
                            <div className="lg:w-64 flex-shrink-0 space-y-3 overflow-y-auto pr-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-2">Latest Posts</h3>
                                <hr className="border-slate-200 my-2" />

                                {/* Tech Section */}
                                <h4 className="text-sm font-bold text-pink-500 mb-2">Tech</h4>
                                {filteredPosts
                                    .map((post, index) => ({ ...post, originalIndex: index }))
                                    .filter(post => post.category === 'Tech')
                                    .slice(0, 3)
                                    .map((post) => (
                                        <div
                                            key={post._id || post.originalIndex}
                                            onClick={() => setSelectedPost(post.originalIndex)}
                                            className={`
                    group cursor-pointer transition-all duration-200
                    bg-slate-50 px-4 py-3 rounded-lg border border-slate-200
                    hover:${post.color} hover:${post.borderColor}
                  `}
                                        >
                                            <p className={`
                    text-sm font-medium text-slate-600 truncate
                    group-hover:${post.textColor}
                  `}>
                                                {post.title}
                                            </p>
                                        </div>
                                    ))}

                                <hr className="border-slate-200 my-4" />

                                {/* Bio Section */}
                                <h4 className="text-sm font-bold text-pink-500 mb-2">Bio</h4>
                                {filteredPosts
                                    .map((post, index) => ({ ...post, originalIndex: index }))
                                    .filter(post => post.category === 'Biology')
                                    .slice(0, 3)
                                    .map((post) => (
                                        <div
                                            key={post._id || post.originalIndex}
                                            onClick={() => setSelectedPost(post.originalIndex)}
                                            className={`
                    group cursor-pointer transition-all duration-200
                    bg-slate-50 px-4 py-3 rounded-lg border border-slate-200
                    hover:${post.color} hover:${post.borderColor}
                  `}
                                        >
                                            <p className={`
                    text-sm font-medium text-slate-600 truncate
                    group-hover:${post.textColor}
                  `}>
                                                {post.title}
                                            </p>
                                        </div>
                                    ))}
                            </div>

                            {/* Grid */}
                            <div className="hidden sm:grid flex-1 grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                                {posts.map((post, i) => (
                                    <div key={post._id || i} className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                                        {/* Header */}
                                        <div className={`${post.color} py-3 px-6 flex flex-col justify-center flex-shrink-0`}>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${post.textColor} bg-white/80 w-fit px-2 py-1 rounded-md`}>
                                                {post.category}
                                            </span>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col min-h-0">
                                            <h3 className="text-lg font-bold text-slate-800 mb-2 transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                            <p className="text-slate-600 text-sm leading-relaxed flex-1 line-clamp-3">
                                                {stripMarkdown(post.content || '').substring(0, 150)}...
                                            </p>

                                            {/* Footer with likes, date */}
                                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xl ${isLikedByUser(post) ? 'text-red-500' : 'text-gray-400'}`}>
                                                        {isLikedByUser(post) ? '❤️' : '🤍'}
                                                    </span>
                                                    <span className="font-medium text-slate-700">{post.likes || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>{formatDate(post.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                <button
                                                    onClick={() => setSelectedPost(getGlobalIndex(i))}
                                                    className={`text-xs font-bold text-slate-900 ${post.hoverColor} transition-colors flex items-center gap-1`}
                                                >
                                                    Read Article &rarr;
                                                </button>
                                                {post.tags && post.tags.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {post.tags.slice(0, 3).map((tag: string, idx: number) => (
                                                            <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pagination Controls with Search */}
                    {!loading && allPosts.length > 0 && (
                        <div className="flex justify-between items-center gap-4 mt-6 pb-4 flex-shrink-0">
                            {/* Empty spacer for alignment */}
                            <div className="flex-1 max-w-sm"></div>

                            {/* Pagination Section */}
                            {filteredPosts.length > postsPerPage && (
                                <div className="flex justify-center items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
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
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === totalPages
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {/* Search Section */}
                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                    placeholder="Search posts by title, content, or tags..."
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                />
                                {/* Search button - always shows magnifying glass */}
                                <button
                                    onClick={handleSearch}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-300 hover:border-pink-300 transition-all flex items-center justify-center group"
                                    title="Search"
                                >
                                    {/* Magnifying glass icon */}
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
                    )}
                </div>
            </div>

            {/* Modal Popup - View/Edit Mode */}
            {selectedPost !== null && allPosts[selectedPost] && !isEditMode && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modalBackdrop"
                    onClick={() => setSelectedPost(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-modalContent"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`${allPosts[selectedPost].color} p-8`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${allPosts[selectedPost].textColor} bg-white/80 w-fit px-3 py-1.5 rounded-md`}>
                                {allPosts[selectedPost].category}
                            </span>
                            <h2 className="text-3xl font-bold text-slate-900 mt-4">
                                {allPosts[selectedPost].title}
                            </h2>
                        </div>
                        <div className="p-8 overflow-y-auto max-h-[calc(85vh-200px)]">
                            <div className="markdown-content text-slate-700 leading-relaxed">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        // Headings
                                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-slate-900" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-slate-900 border-b pb-2" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2 mt-4 text-slate-900" {...props} />,
                                        h4: ({ node, ...props }) => <h4 className="text-lg font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                        h5: ({ node, ...props }) => <h5 className="text-base font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                        h6: ({ node, ...props }) => <h6 className="text-sm font-bold mb-2 mt-3 text-slate-900" {...props} />,
                                        // Paragraphs
                                        p: ({ node, ...props }) => <p className="mb-4 leading-7" {...props} />,
                                        // Lists
                                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 ml-4 space-y-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 ml-4 space-y-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="leading-7" {...props} />,
                                        // Links
                                        a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                        // Code
                                        code: ({ node, inline, ...props }: any) =>
                                            inline
                                                ? <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                                : <code className="block bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4" {...props} />,
                                        pre: ({ node, ...props }) => <pre className="mb-4" {...props} />,
                                        // Blockquotes
                                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600" {...props} />,
                                        // Horizontal rule
                                        hr: ({ node, ...props }) => <hr className="my-6 border-slate-300" {...props} />,
                                        // Tables
                                        table: ({ node, ...props }) => <table className="min-w-full border-collapse border border-slate-300 mb-4" {...props} />,
                                        thead: ({ node, ...props }) => <thead className="bg-slate-100" {...props} />,
                                        tbody: ({ node, ...props }) => <tbody {...props} />,
                                        tr: ({ node, ...props }) => <tr className="border-b border-slate-300" {...props} />,
                                        th: ({ node, ...props }) => <th className="border border-slate-300 px-4 py-2 text-left font-bold" {...props} />,
                                        td: ({ node, ...props }) => <td className="border border-slate-300 px-4 py-2" {...props} />,
                                        // Images
                                        img: ({ node, ...props }) => <img className="max-w-full h-auto rounded-lg my-4" {...props} />,
                                        // Strong and emphasis
                                        strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                                    }}
                                >
                                    {allPosts[selectedPost].content}
                                </ReactMarkdown>
                            </div>

                            {/* Tags Section */}
                            {allPosts[selectedPost].tags && allPosts[selectedPost].tags.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <div className="flex flex-wrap gap-2">
                                        {allPosts[selectedPost].tags.map((tag: string, idx: number) => (
                                            <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer in modal */}
                            <div className={`mt-4 flex items-center justify-between ${!allPosts[selectedPost].tags || allPosts[selectedPost].tags.length === 0 ? 'pt-6 border-t border-slate-200' : ''}`}>
                                <button
                                    onClick={(e) => handleLike(allPosts[selectedPost]._id, e)}
                                    className="flex items-center gap-3 cursor-pointer hover:scale-110 transition-transform"
                                >
                                    <span className={`text-2xl ${isLikedByUser(allPosts[selectedPost]) ? 'text-red-500' : 'text-gray-400'}`}>
                                        {isLikedByUser(allPosts[selectedPost]) ? '❤️' : '🤍'}
                                    </span>
                                    <span className="font-medium text-slate-700 text-base">{allPosts[selectedPost].likes || 0}</span>
                                </button>
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500">{formatDate(allPosts[selectedPost].createdAt)}</span>
                                </div>
                            </div>

                            <div className={`flex mt-8 ${isAuthor(allPosts[selectedPost]) ? 'justify-between' : 'justify-start'}`}>
                                {isAuthor(allPosts[selectedPost]) && (
                                    <button
                                        onClick={handleDelete}
                                        className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                                <div className="flex gap-4">
                                    {/* Update button */}
                                    {(user && isAuthorized) && (
                                        <button
                                            onClick={handleEdit}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                                        >
                                            Update
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedPost(null)}
                                        className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Mode Modal */}
            {selectedPost !== null && allPosts[selectedPost] && (
                <BlogPostModal
                    mode="edit"
                    isOpen={isEditMode}
                    editData={editData}
                    postColor={allPosts[selectedPost].color}
                    uploadingImage={uploadingImage}
                    isDragging={isDragging}
                    onClose={handleCloseEdit}
                    onSave={handleSave}
                    onCategoryChange={(category: string) => setEditData({ ...editData, category })}
                    onTitleChange={(title: string) => setEditData({ ...editData, title })}
                    onContentChange={(content: string) => setEditData({ ...editData, content })}
                    onTagInput={handleTagInput}
                    onTagBlur={handleTagBlur}
                    onImageUpload={handleFileSelect}
                    onRemoveImage={handleRemoveImage}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                />
            )}

            {/* Discard Confirmation Dialog */}
            {showDiscardDialog && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            isCreateMode ? handleDiscardCreate() : handleDiscard();
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <button
                            onClick={isCreateMode ? () => setShowDiscardDialog(false) : handleContinueEdit}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Unsaved Changes</h3>
                        <p className="text-slate-600 mb-6">
                            {isCreateMode
                                ? 'Your new post will not be saved. Are you sure you want to discard it?'
                                : 'Your changes will not be saved. Are you sure you want to discard them?'}
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={isCreateMode ? () => setShowDiscardDialog(false) : handleContinueEdit}
                                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                {isCreateMode ? 'Continue Writing' : 'Continue Editing'}
                            </button>
                            <button
                                onClick={isCreateMode ? handleDiscardCreate : handleDiscard}
                                className="px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Delete Post Permanently?</h3>
                        <p className="text-slate-600 mb-6">This action will permanently delete this post. Are you sure you want to continue?</p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={handleCancelDelete}
                                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-6 py-2 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Mode Modal */}
            <BlogPostModal
                mode="create"
                isOpen={isCreateMode}
                editData={editData}
                postColor="bg-pink-50"
                useOpal={useOpal}
                uploadingImage={uploadingImage}
                isDragging={isDragging}
                onClose={handleCreateCancel}
                onSave={handleCreateSave}
                onCategoryChange={(category: string) => setEditData({ ...editData, category })}
                onTitleChange={(title: string) => setEditData({ ...editData, title })}
                onContentChange={(content: string) => setEditData({ ...editData, content })}
                onTagInput={handleTagInput}
                onTagBlur={handleTagBlur}
                onOpalChange={setUseOpal}
                onImageUpload={handleFileSelect}
                onRemoveImage={handleRemoveImage}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            />

            {/* OPAL Success Dialog */}
            {showOpalDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl relative text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Request Sent to OPAL</h3>
                        <p className="text-slate-600 mb-8">Your request has been successfully sent to the OPAL workflow.</p>
                        <button
                            onClick={() => {
                                setShowOpalDialog(false);
                                setIsCreateMode(false);
                                setEditData({ category: '', title: '', content: '', tags: '', existingImages: [] });
                                setUseOpal(false);
                            }}
                            className="w-full px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}

            {/* Validation Dialog */}
            {showValidationDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-8 shadow-2xl relative text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Missing Information</h3>
                        <p className="text-slate-600 mb-8">Please fill in all fields (Category, Title, and Content) before saving.</p>
                        <button
                            onClick={() => setShowValidationDialog(false)}
                            className="w-full px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}

            {/* Create Button (+ icon) - Blog page only */}
            {canCreatePost() && location.pathname === '/blog' && !isCreateMode && !isEditMode && selectedPost === null && (
                <button
                    onClick={handleCreate}
                    className="fixed bottom-24 left-6 w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-pink-600 transition-all hover:scale-110 z-40"
                    title="Create new post"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div
                    className="fixed z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg animate-fadeIn flex items-center gap-2 pointer-events-none"
                    style={{
                        left: toastPos.x + 16,
                        top: toastPos.y - 40,
                        transform: 'translateX(-50%)'
                    }}
                >
                    {toastMessage}
                </div>
            )}
        </>
    );
};
