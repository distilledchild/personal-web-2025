import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Dna, Mail, Github, MapPin, Loader2, Plus } from 'lucide-react';
import { ThreeDNA } from './components/ThreeDNA';
import { ChatBot } from './components/ChatBot';
import { Research } from './pages/Research';
import { Interests } from './pages/Interests';
import { About } from './pages/About';
import { io, Socket } from 'socket.io-client';

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
    const userData = localStorage.getItem('user_profile');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Add userId from OAuth sub or id
        setUser({
          ...parsedUser,
          userId: parsedUser.sub || parsedUser.id || parsedUser.email
        });
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
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
        setSelectedPost(null);
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
    const authorizedEmails = ['distilledchild@gmail.com', 'wellclouder@gmail.com'];
    return user && authorizedEmails.includes(user.email);
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

  // Fixed Color Themes Order: Blue -> Green -> Pink -> Purple
  const colorThemes = [
    { color: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-100", hoverBorderColor: "hover:border-blue-200", hoverColor: "group-hover:text-blue-600" },
    { color: "bg-green-50", textColor: "text-green-700", borderColor: "border-green-100", hoverBorderColor: "hover:border-green-200", hoverColor: "group-hover:text-green-600" },
    { color: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-100", hoverBorderColor: "hover:border-pink-200", hoverColor: "group-hover:text-pink-600" },
    { color: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-100", hoverBorderColor: "hover:border-purple-200", hoverColor: "group-hover:text-purple-600" },
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
                      {post.content?.substring(0, 150)}...
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
              <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                {posts[selectedPost].content}
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
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                  {isAuthor(posts[selectedPost]) && (
                    <button
                      onClick={handleEdit}
                      className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                    >
                      Update
                    </button>
                  )}
                </div>
                {isAuthor(posts[selectedPost]) && (
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
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
                  onClick={handleSave}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCloseEdit}
                  className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancel
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

  const handleCopy = (e: React.MouseEvent) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    navigator.clipboard.writeText('distilledchild@gmail.com');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-6 flex flex-col items-center relative">
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

      <div className="max-w-2xl w-full animate-fadeIn">
        <h2 className="text-4xl font-bold text-slate-900 mb-16 text-center border-b border-slate-100 pb-8">Get in Touch</h2>

        <div className="space-y-8">
          <button
            onClick={handleCopy}
            className="w-full flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group border border-slate-100 hover:border-blue-100 cursor-pointer text-left"
          >
            <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-blue-600 transition-colors">
              <Mail size={32} />
            </div>
            <div className="ml-6 text-left">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Email</p>
              <p className="text-xl text-slate-900 font-medium break-all">distilledchild@gmail.com</p>
            </div>
          </button>

          <a href="https://github.com/distilledchild" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-green-50 transition-colors group border border-slate-100 hover:border-green-100">
            <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-green-600 transition-colors">
              <Github size={32} />
            </div>
            <div className="ml-6 text-left">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">GitHub</p>
              <p className="text-xl text-slate-900 font-medium break-all">github.com/distilledchild</p>
            </div>
          </a>

          <a href="https://www.linkedin.com/in/pkim11/" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-pink-50 transition-colors group border border-slate-100 hover:border-pink-100">
            <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-pink-600 transition-colors">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div className="ml-6 text-left">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">LinkedIn</p>
              <p className="text-xl text-slate-900 font-medium break-all">linkedin.com/in/distilledchild</p>
            </div>
          </a>

          <a href="https://www.google.com/maps/place/Memphis,+TN" target="_blank" rel="noopener noreferrer" className="flex items-center p-6 bg-slate-50 rounded-2xl hover:bg-purple-50 transition-colors group cursor-default border border-slate-100 hover:border-purple-100">
            <div className="bg-white p-4 rounded-full shadow-sm text-slate-700 group-hover:text-purple-600 transition-colors">
              <MapPin size={32} />
            </div>
            <div className="ml-6 text-left">
              <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Location</p>
              <p className="text-xl text-slate-900 font-medium">Memphis, TN, USA</p>
            </div>
          </a>


        </div>
      </div>
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
    style={{ fontSize: 'clamp(1.5rem, 3.8vw, 2.28rem)' }}
  >
    {/* Content with Floating Animation */}
    <span className="relative z-10 block transition-transform duration-300 ease-out group-hover:-translate-y-2 flex items-center gap-2">
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

  // Owner Queue State
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const [queueCount, setQueueCount] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin) {
      const socket = io('https://personal-web-2025-production.up.railway.app');

      socket.on('connect', () => {
        socket.emit('register_owner');
      });

      socket.on('queue_update', (data: { count: number }) => {
        setQueueCount(data.count);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAdmin]);

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
              <Link to="/research" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-teal-500 hover:text-teal-300 transition-colors px-4 py-2">
                Research
              </Link>
              <Link to="/tech" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-pink-500 hover:text-pink-300 transition-colors px-4 py-2">
                Tech
              </Link>
              <Link to="/interests" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-extrabold text-[#FFA300] hover:text-[#FFD180] transition-colors px-4 py-2">
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
      <nav className="fixed top-0 right-0 w-full z-50 p-[0.9rem] md:p-[1.8rem] justify-end pointer-events-none hidden lg:flex">
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
            to="/research"
            label="Research"
            active={location.pathname === '/research'}
            colorClass="text-teal-500 hover:text-teal-300"
          />
          <LiquidTab
            to="/tech"
            label="Tech"
            active={location.pathname === '/tech'}
            colorClass="text-pink-500 hover:text-pink-300"
          />
          <LiquidTab
            to="/interests"
            label="Interests"
            active={location.pathname === '/interests'}
            colorClass="text-[#FFA300] hover:text-[#FFD180]"
          />
          <LiquidTab
            to="/contact"
            label="Contact"
            active={location.pathname === '/contact'}
            colorClass="text-purple-500 hover:text-purple-300"
            badgeCount={queueCount !== null ? queueCount : undefined}
          />
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<Test />} />
        <Route path="/about" element={<About />} />
        <Route path="/research" element={<Research />} />
        <Route path="/tech" element={<Tech />} />
        <Route path="/interests" element={<Interests />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <ChatBot />
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
