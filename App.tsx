import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { Dna, Mail, Github, MapPin, Loader2, Plus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThreeDNA } from './components/ThreeDNA';
import { Research } from './pages/Research';
import { Interests } from './pages/Interests';
import { About } from './pages/About';
import { StravaCallback } from './pages/StravaCallback';

const Home: React.FC = () => (
  <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
    {/* 3D Background Layer - Z index 0 */}
    <ThreeDNA />

    {/* Content Overlay - Z index 10, Pointer Events None allows clicking through to Canvas */}
    <div className="relative z-10 text-center space-y-4 px-4 pointer-events-none select-none mt-[-5vh]">
      <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight drop-shadow-2xl">
        <span className="text-white">Computational </span>
        <br className="md:hidden" />
        <span
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 animate-gradient pr-2"
          style={{
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Biology
        </span>
      </h1>
      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
        unraveling the 3D genome, one interaction at a time.
      </p>
    </div>

    {/* Instruction Text - Centered and Animated */}
    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none hidden md:block">
      <p className="text-lg md:text-xl text-white font-light animate-double-blink">
        Drag or Zoom to interact
      </p>
    </div>
  </div>
);



const Test: React.FC = () => {
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      try {
        setUserData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center border-b border-slate-100 pb-6">
          OAuth User Data Test
        </h2>

        {userData ? (
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Logged In User Data:</h3>
            <pre className="bg-slate-900 text-green-400 p-6 rounded-lg overflow-auto text-sm font-mono">
              {JSON.stringify(userData, null, 2)}
            </pre>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700 w-32">Name:</span>
                <span className="text-slate-900">{userData.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700 w-32">Email:</span>
                <span className="text-slate-900">{userData.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700 w-32">User ID:</span>
                <span className="text-slate-900 font-mono text-sm">{userData.sub || userData.id || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-700 w-32">Avatar:</span>
                {userData.picture && (
                  <img src={userData.picture} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div className="flex items-start gap-4">
                <span className="font-bold text-slate-700 w-32">Avatar URL:</span>
                <span className="text-slate-900 text-xs font-mono break-all">{userData.picture || 'N/A'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No user logged in. Please login with Google OAuth.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Tech: React.FC = () => {
  const [selectedPost, setSelectedPost] = React.useState<number | null>(null);
  const [blogPosts, setBlogPosts] = React.useState<any[]>([]);
  const [user, setUser] = React.useState<any>(null);
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastPos, setToastPos] = React.useState({ x: 0, y: 0 });
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [editData, setEditData] = React.useState({ category: '', title: '', content: '' });
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [showValidationDialog, setShowValidationDialog] = React.useState(false);

  React.useEffect(() => {
    // Fetch blog posts
    const fetchBlogs = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : 'https://personal-web-2025-production.up.railway.app';

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
          const API_URL = window.location.hostname === 'localhost'
            ? 'http://localhost:4000'
            : 'https://personal-web-2025-production.up.railway.app';

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
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://personal-web-2025-production.up.railway.app';

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
    if (selectedPost !== null && posts[selectedPost]) {
      setEditData({
        category: posts[selectedPost].category || '',
        title: posts[selectedPost].title || '',
        content: posts[selectedPost].content || ''
      });
      setIsEditMode(true);
    }
  };

  // Handle save
  const handleSave = async () => {
    if (selectedPost === null || !posts[selectedPost]) return;

    try {
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://personal-web-2025-production.up.railway.app';

      const response = await fetch(`${API_URL}/api/tech-blog/${posts[selectedPost]._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
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
    if (selectedPost === null || !posts[selectedPost]) return;

    try {
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://personal-web-2025-production.up.railway.app';

      const response = await fetch(`${API_URL}/api/tech-blog/${posts[selectedPost]._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email
        })
      });

      if (response.ok) {
        // Remove from local state
        setBlogPosts(prev => prev.filter(post => post._id !== posts[selectedPost]._id));
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
    setEditData({ category: '', title: '', content: '' });
    setIsCreateMode(true);
  };

  // Handle create save
  const handleCreateSave = async () => {
    // Validation check
    if (!editData.category.trim() || !editData.title.trim() || !editData.content.trim()) {
      setShowValidationDialog(true);
      return;
    }

    try {
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000'
        : 'https://personal-web-2025-production.up.railway.app';

      const response = await fetch(`${API_URL}/api/tech-blog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
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
        setEditData({ category: '', title: '', content: '' });
      }
    } catch (error) {
      console.error('Failed to create post:', error);
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
      setEditData({ category: '', title: '', content: '' });
    }
  };

  // Handle discard create
  const handleDiscardCreate = () => {
    setIsCreateMode(false);
    setShowDiscardDialog(false);
    setEditData({ category: '', title: '', content: '' });
  };

  // Unified Color Theme: All Pink
  const colorThemes = [
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
  ];

  // Combine blog posts with themes
  const posts = blogPosts.map((post, i) => ({
    ...post,
    ...colorThemes[i % colorThemes.length]
  }));

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Strip markdown syntax for preview
  const stripMarkdown = (markdown: string) => {
    if (!markdown) return '';

    return markdown
      // Remove headers (# ## ###)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      // Remove italic (*text* or _text_)
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove images ![alt](url)
      .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
      // Remove inline code `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks ```code```
      .replace(/```[\s\S]*?```/g, '')
      // Remove blockquotes (>)
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules (---, ___, ***)
      .replace(/^([-_*]){3,}$/gm, '')
      // Remove list markers (-, *, +, 1.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  return (
    <div className="h-screen bg-white pt-32 pb-4 px-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <h2 className="text-4xl font-bold text-slate-900 mb-6 text-center border-b border-slate-100 pb-4 flex-shrink-0">Tech Blog</h2>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-400">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-slate-400">No blog posts found.</div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            {/* Sidebar TOC */}
            <div className="lg:w-64 flex-shrink-0 space-y-3 overflow-y-auto pr-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-2">Latest Posts</h3>
              {posts.map((post, i) => (
                <div
                  key={post._id || i}
                  onClick={() => setSelectedPost(i)}
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

                    <button
                      onClick={() => setSelectedPost(i)}
                      className={`mt-4 text-xs font-bold text-slate-900 ${post.hoverColor} transition-colors self-start flex items-center gap-1`}
                    >
                      Read Article &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Popup - View/Edit Mode */}
      {selectedPost !== null && posts[selectedPost] && !isEditMode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modalBackdrop"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-modalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${posts[selectedPost].color} p-8`}>
              <span className={`text-xs font-bold uppercase tracking-wider ${posts[selectedPost].textColor} bg-white/80 w-fit px-3 py-1.5 rounded-md`}>
                {posts[selectedPost].category}
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mt-4">
                {posts[selectedPost].title}
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
                  {posts[selectedPost].content}
                </ReactMarkdown>
              </div>

              {/* Footer in modal */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={(e) => handleLike(posts[selectedPost]._id, e)}
                  className="flex items-center gap-3 cursor-pointer hover:scale-110 transition-transform"
                >
                  <span className={`text-2xl ${isLikedByUser(posts[selectedPost]) ? 'text-red-500' : 'text-gray-400'}`}>
                    {isLikedByUser(posts[selectedPost]) ? '❤️' : '🤍'}
                  </span>
                  <span className="font-medium text-slate-700 text-base">{posts[selectedPost].likes || 0}</span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{formatDate(posts[selectedPost].createdAt)}</span>
                </div>
              </div>

              <div className={`flex mt-8 ${isAuthor(posts[selectedPost]) ? 'justify-between' : 'justify-start'}`}>
                {isAuthor(posts[selectedPost]) && (
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-4">
                  <button
                    onClick={handleEdit}
                    className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                  >
                    Update
                  </button>
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
      {selectedPost !== null && posts[selectedPost] && isEditMode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${posts[selectedPost].color} p-8`}>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-slate-700 w-24">Category:</label>
                  <input
                    type="text"
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-slate-700 w-24">Title:</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(85vh-300px)]">
              <textarea
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Content..."
              />

              <div className="flex justify-between mt-8">
                <button
                  onClick={handleCloseEdit}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
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
            <p className="text-slate-600 mb-6">This action will permanently delete this blog post. Are you sure you want to continue?</p>
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
      {isCreateMode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-50 p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-slate-700 w-24">Category:</label>
                  <input
                    type="text"
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Technology, Tutorial, etc."
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-bold text-slate-700 w-24">Title:</label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter post title..."
                  />
                </div>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(85vh-300px)]">
              <textarea
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Write your content here..."
              />

              <div className="flex justify-between mt-8">
                <button
                  onClick={handleCreateSave}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCreateCancel}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
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

      {/* Create Button (+ icon) - Tech page only */}
      {canCreatePost() && location.pathname === '/tech' && !isCreateMode && !isEditMode && selectedPost === null && (
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
    </div>
  );
};

const Contact: React.FC = () => {
  const [showCopied, setShowCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ city: string; state: string; country: string; lat: number; lon: number } | null>(null);
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    Email: '',
    GitHub: '',
    LinkedIn: '',
    city: '',
    state: '',
    country: ''
  });

  const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:4000'
    : 'https://personal-web-2025-production.up.railway.app';

  // Fetch user's IP-based location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon');
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setUserLocation({
              city: data.city,
              state: data.regionName,
              country: data.country,
              lat: data.lat,
              lon: data.lon
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch user location:', error);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    // Check user auth and fetch contact info
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user_profile');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Check authorization from MEMBER collection
        try {
          const response = await fetch(`${API_URL}/api/member/role/${parsedUser.email}`);
          if (response.ok) {
            const data = await response.json();
            setIsAuthorized(data.authorized);
          } else {
            setIsAuthorized(false);
          }
        } catch (err) {
          console.error('Failed to check authorization:', err);
          setIsAuthorized(false);
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
    };

    // Initial check
    checkAuth();

    // Fetch contact info once
    fetchContactInfo();

    // Listen for storage changes (works across tabs)
    window.addEventListener('storage', checkAuth);

    // Poll for changes in same tab (since storage event doesn't fire in same tab)
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/contact`);
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch contact info:', error);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    navigator.clipboard.writeText(contactInfo?.Email || 'distilledchild@gmail.com');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const openModal = () => {
    if (contactInfo) {
      setFormData({
        Email: contactInfo.Email || '',
        GitHub: contactInfo.GitHub || '',
        LinkedIn: contactInfo.LinkedIn || '',
        city: contactInfo.Location?.city || '',
        state: contactInfo.Location?.state || '',
        country: contactInfo.Location?.country || ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStateSuggestions([]);
  };

  // Geocode location to get coordinates
  const geocodeLocation = async (city: string, state: string, country: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      // Build search query
      const parts = [city, state, country].filter(Boolean);
      if (parts.length === 0) return null;

      const searchQuery = parts.join(', ');

      // Use Nominatim (OpenStreetMap) geocoding API - free, no key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'PersonalWebsite/1.0' // Required by Nominatim
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!user || !contactInfo) return;

    try {
      // Always geocode if city/state/country is provided to ensure accurate pin placement
      let finalLatitude = undefined;
      let finalLongitude = undefined;

      if (formData.city || formData.state || formData.country) {
        console.log('Geocoding location...', { city: formData.city, state: formData.state, country: formData.country });
        const coords = await geocodeLocation(formData.city, formData.state, formData.country);

        if (coords) {
          finalLatitude = coords.lat;
          finalLongitude = coords.lon;
          console.log('Geocoded coordinates:', coords);
        } else {
          console.log('Geocoding failed, coordinates will not be saved');
        }
      }

      const response = await fetch(`${API_URL}/api/contact/${contactInfo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: formData.Email,
          GitHub: formData.GitHub,
          LinkedIn: formData.LinkedIn,
          Location: {
            city: formData.city,
            state: formData.state,
            country: formData.country,
            latitude: finalLatitude,
            longitude: finalLongitude
          },
          userEmail: user.email
        })
      });

      if (response.ok) {
        fetchContactInfo();
        closeModal();
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
    }
  };

  // US States list for autocomplete
  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  // Filter state suggestions
  const handleStateInput = (value: string) => {
    setFormData({ ...formData, state: value });
    if (value.length > 0) {
      const filtered = US_STATES.filter(state =>
        state.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 5);
      setStateSuggestions(filtered);
    } else {
      setStateSuggestions([]);
    }
  };

  // Get Google Maps embed URL with red marker
  const getMapUrl = () => {
    const hasContactLocation = contactInfo?.Location?.city || contactInfo?.Location?.state || (contactInfo?.Location?.latitude && contactInfo?.Location?.longitude);

    if (hasContactLocation) {
      const { city, state, country, latitude, longitude } = contactInfo.Location;
      if (latitude && longitude) {
        return `https://maps.google.com/maps?q=${latitude},${longitude}&z=12&output=embed`;
      }
      const location = `${city || ''}, ${state || ''}, ${country || ''}`.replace(/^,\s*|\s*,$/g, '');
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=12&output=embed`;
    } else if (userLocation) {
      // Fallback to user's IP-based location with coordinates to show exact pin
      return `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lon}&z=12&output=embed`;
    }

    return '';
  };

  // Get display location text
  const getLocationText = () => {
    if (contactInfo?.Location?.city || contactInfo?.Location?.state) {
      const { city, state, country } = contactInfo.Location;
      const parts = [city, state, country].filter(Boolean);
      return parts.join(', ');
    } else if (userLocation) {
      return `${userLocation.city}, ${userLocation.state}, ${userLocation.country}`;
    }
    return 'Loading...';
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 relative">
      {/* Notification Toast */}
      {showCopied && (
        <div
          className="fixed z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg animate-fadeIn flex items-center gap-2 pointer-events-none"
          style={{
            left: cursorPos.x + 16,
            top: cursorPos.y - 16
          }}
        >
          <span>✨ Email copied to clipboard!</span>
        </div>
      )}

      {/* Edit Button - Only for authorized users */}
      {isAuthorized && (
        <div className="fixed bottom-24 left-6 z-50">
          <button
            onClick={openModal}
            className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-600 transition-all hover:scale-110"
            title="Edit Contact Info"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto animate-fadeIn">
        <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center border-b border-slate-100 pb-8">Get in Touch</h2>

        {/* 2 Column Layout: 50% Contact Cards, 50% Google Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Contact Cards */}
          <div className="space-y-6">
            <button
              onClick={handleCopy}
              className="w-full flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100 cursor-pointer text-left"
            >
              <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#9332EA] transition-colors">
                <Mail size={32} />
              </div>
              <div className="ml-6 text-left">
                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">Email</p>
                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.Email || 'Loading...'}</p>
              </div>
            </button>

            <a href={`https://${contactInfo?.GitHub}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
              <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-black transition-colors">
                <Github size={32} />
              </div>
              <div className="ml-6 text-left">
                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">GitHub</p>
                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.GitHub || 'Loading...'}</p>
              </div>
            </a>

            <a href={`https://${contactInfo?.LinkedIn}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
              <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#2362BC] transition-colors">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="ml-6 text-left">
                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">LinkedIn</p>
                <p className="text-xl text-slate-900 font-medium break-all">{contactInfo?.LinkedIn || 'Loading...'}</p>
              </div>
            </a>

            <div className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group border border-slate-100 hover:border-purple-100">
              <div className="bg-white p-4 rounded-full shadow-sm text-black group-hover:text-[#DC2726] transition-colors">
                <MapPin size={32} />
              </div>
              <div className="ml-6 text-left">
                <p className="text-sm text-slate-500 group-hover:text-purple-600 uppercase font-bold tracking-wider mb-1 transition-colors">Location</p>
                <p className="text-xl text-slate-900 font-medium">
                  {getLocationText()}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Google Map */}
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            {(contactInfo?.Location || userLocation) ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={getMapUrl()}
                title="Location Map"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                <p className="text-slate-400">Loading map...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-slate-900 mb-6">Edit Contact Info</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">GitHub</label>
                <input
                  type="text"
                  value={formData.GitHub}
                  onChange={(e) => setFormData({ ...formData, GitHub: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn</label>
                <input
                  type="text"
                  value={formData.LinkedIn}
                  onChange={(e) => setFormData({ ...formData, LinkedIn: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="linkedin.com/in/username"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleStateInput(e.target.value)}
                    onFocus={() => formData.state && handleStateInput(formData.state)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {stateSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {stateSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({ ...formData, state: suggestion });
                            setStateSuggestions([]);
                          }}
                          className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Liquid Crystal Tab Component - 95% of original size
const LiquidTab = ({ to, label, active, colorClass, badgeCount }: { to: string; label: string; active: boolean; colorClass: string; badgeCount?: number }) => (
  <Link
    to={to}
    className={`
      relative px-3 md:px-5 py-2 md:py-3 rounded-full transition-all duration-200 group overflow-hidden
      font-extrabold tracking-tighter hover:scale-105
      ${colorClass}
    `}
    style={{ fontSize: 'clamp(1.3rem, 3.2vw, 2rem)' }}
  >
    {/* Content with Floating Animation */}
    <span className="relative z-10 block transition-transform duration-300 ease-out group-hover:-translate-y-2 flex items-center gap-2 -translate-y-2">
      {label}
      {badgeCount !== undefined && (
        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {badgeCount}
        </span>
      )}
    </span>
  </Link>
);

const Layout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Google Analytics - Track page views on route change
  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-GD5495D6KD', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);

  // Log access information
  useEffect(() => {
    const logAccess = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost'
          ? 'http://localhost:4000'
          : 'https://personal-web-2025-production.up.railway.app';

        // Generate or retrieve session ID
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
          sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          sessionStorage.setItem('session_id', sessionId);
        }

        const payload = {
          page_url: window.location.href,
          referrer: document.referrer,
          session_id: sessionId
        };

        console.log('[CLIENT] Logging access:', payload);

        const response = await fetch(`${API_URL}/api/access/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error('[CLIENT] Access logging failed:', response.status, response.statusText);
        } else {
          const data = await response.json();
          console.log('[CLIENT] Access logged successfully:', data);
        }
      } catch (error) {
        console.error('[CLIENT] Access logging error:', error);
      }
    };

    logAccess();
  }, [location.pathname]); // Log on every page change


  return (
    <div className="min-h-screen font-sans text-slate-900">
      {/* Branding Logo - Visible on ALL pages top left */}
      <div className="fixed top-0 left-0 z-50 p-4 md:p-8 flex items-center">
        <Link to="/" className="font-extrabold tracking-tighter flex items-center text-slate-900" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}>
          <span className="text-green-500">Distilled</span>
          <span className="text-[#0D1584]">Child</span>
        </Link>
      </div>

      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-0 right-0 z-50 p-6 lg:hidden pointer-events-auto"
        aria-label="Toggle menu"
      >
        <div className="w-8 h-8 flex flex-col justify-center items-center gap-1.5">
          <span className={`w-full h-0.5 bg-red-500 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-full h-0.5 bg-red-500 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-full h-0.5 bg-red-500 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-modalBackdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="fixed top-20 right-4 bg-white rounded-3xl shadow-2xl p-6 animate-modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-4">
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-blue-500 hover:text-blue-300 transition-colors px-4 py-2">
                About
              </Link>
              <Link to="/research/peinteractions" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-teal-500 hover:text-teal-300 transition-colors px-4 py-2">
                Research
              </Link>
              <Link to="/tech" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-pink-500 hover:text-pink-300 transition-colors px-4 py-2">
                Tech
              </Link>
              <Link to="/interests/travel" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-[#FFA300] hover:text-[#FFD180] transition-colors px-4 py-2">
                Interests
              </Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-purple-500 hover:text-purple-300 transition-colors px-4 py-2">
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar - Desktop Only */}
      <nav className="fixed top-0 right-0 w-full z-50 p-4 md:p-8 justify-end pointer-events-none hidden lg:flex">
        <div className="pointer-events-auto flex gap-3 items-center bg-white/0 backdrop-blur-none">
          {window.location.hostname === 'localhost' && (
            <LiquidTab
              to="/test"
              label="Test"
              active={location.pathname === '/test'}
              colorClass="text-gray-500 hover:text-gray-300"
            />
          )}
          <LiquidTab
            to="/about"
            label="About"
            active={location.pathname === '/about'}
            colorClass="text-blue-500 hover:text-blue-300"
          />
          <LiquidTab
            to="/research/peinteractions"
            label="Research"
            active={location.pathname.startsWith('/research')}
            colorClass="text-teal-500 hover:text-teal-300"
          />
          <LiquidTab
            to="/tech"
            label="Tech"
            active={location.pathname === '/tech'}
            colorClass="text-pink-500 hover:text-pink-300"
          />
          <LiquidTab
            to="/interests/travel"
            label="Interests"
            active={location.pathname.startsWith('/interests')}
            colorClass="text-[#FFA300] hover:text-[#FFD180]"
          />
          <LiquidTab
            to="/contact"
            label="Contact"
            active={location.pathname === '/contact'}
            colorClass="text-purple-500 hover:text-purple-300"
          />
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/about" element={<About />} />
        <Route path="/research" element={<Navigate to="/research/peinteractions" replace />} />
        <Route path="/research/:submenu" element={<Research />} />
        <Route path="/tech" element={<Tech />} />
        <Route path="/interests" element={<Navigate to="/interests/travel" replace />} />
        <Route path="/interests/:submenu" element={<Interests />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/strava/callback" element={<StravaCallback />} />
      </Routes>

      <GoogleLogin />
    </div>
  );
};

const GoogleLogin: React.FC = () => {
  const [user, setUser] = useState<{ picture: string; name: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user_profile');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }
  }, []);

  const handleLogin = () => {
    if (user) {
      // Logout logic if needed, or just show info
      if (confirm('Do you want to logout?')) {
        localStorage.removeItem('user_profile');
        setUser(null);
      }
      return;
    }

    const isProduction = window.location.hostname !== 'localhost';
    const redirectUri = isProduction
      ? 'https://www.distilledchild.space/oauth/google/callback'
      : 'http://localhost:3000/oauth/google/callback';

    const params = new URLSearchParams({
      client_id: '511732610766-qma8v1ljq0qia68rtvuq790shn03bvmo.apps.googleusercontent.com',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={handleLogin}
        className="bg-white p-0 rounded-full shadow-lg hover:shadow-xl border border-slate-100 transition-all duration-300 hover:scale-105 overflow-hidden w-[58px] h-[58px] flex items-center justify-center"
        title={user ? `Logged in as ${user.name}` : "Login with Google"}
      >
        {user ? (
          <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="bg-red-600 w-full h-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
        )}
      </button>
    </div>
  );
};

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = React.useMemo(() => {
    // This is a hack because useNavigate might not be available if this component is rendered outside Router context,
    // but here it is inside. However, to be safe and simple:
    return (path: string) => window.location.href = path;
  }, []);

  const code = searchParams.get('code');
  const [status, setStatus] = useState('Processing login...');

  useEffect(() => {
    if (code) {
      const API_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:4000/api/auth/google'
        : 'https://personal-web-2025-production.up.railway.app/api/auth/google';

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Login failed');
          }
          return res.json();
        })
        .then(data => {
          if (data.picture) {
            localStorage.setItem('user_profile', JSON.stringify(data));
            setStatus('Login successful! Redirecting...');
            setTimeout(() => navigate('/'), 1000);
          }
        })
        .catch(err => {
          console.error(err);
          setStatus(`Login failed: ${err.message}`);
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      navigate('/');
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-slate-600 text-lg">{status}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/oauth/google/callback" element={<OAuthCallback />} />
        <Route path="*" element={<Layout />} />
      </Routes>
      {/* Google Login is part of Layout logically, but since we have a catch-all route for Layout, 
          we can put it here to ensure it's on every page except maybe the callback page if we wanted.
          But Layout wraps everything else. Let's put it inside Layout.
      */}
    </Router>
  );
};

export default App;
