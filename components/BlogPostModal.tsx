import React from 'react';

interface BlogPostModalProps {
    mode: 'create' | 'edit';
    isOpen: boolean;
    editData: {
        category: string;
        title: string;
        content: string;
        tags: string;
        existingImages: string[];
    };
    postColor?: string;
    useOpal?: boolean;
    uploadingImage: boolean;
    isDragging: boolean;
    onClose: () => void;
    onSave: () => void;
    onCategoryChange: (category: string) => void;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onTagInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTagBlur: () => void;
    onOpalChange?: (checked: boolean) => void;
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: (imageUrl: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export const BlogPostModal: React.FC<BlogPostModalProps> = ({
    mode,
    isOpen,
    editData,
    postColor = 'bg-pink-50',

    uploadingImage,
    isDragging,
    onClose,
    onSave,
    onCategoryChange,
    onTitleChange,
    onContentChange,
    onTagInput,
    onTagBlur,

    onImageUpload,
    onRemoveImage,
    onDragOver,
    onDragLeave,
    onDrop,
}) => {
    if (!isOpen) return null;

    const isCreateMode = mode === 'create';

    useLockBodyScroll(isOpen);

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${postColor} p-8 pr-16 relative`}>
                    {/* Close Button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-600 hover:text-slate-900 text-2xl font-bold transition-colors"
                        title="Close"
                    >
                        ✕
                    </button>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-700 w-24">Category:</label>
                            <select
                                value={editData.category}
                                onChange={(e) => onCategoryChange(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Select post category"
                            >
                                <option value="">Select category...</option>
                                <option value="Biology">Biology</option>
                                <option value="Tech">Tech</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-700 w-24">Title:</label>
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={isCreateMode ? "Enter post title..." : ""}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-bold text-slate-700 w-24">Tags:</label>
                            <input
                                type="text"
                                value={editData.tags}
                                onChange={onTagInput}
                                onBlur={onTagBlur}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="tag1; tag2; tag3"
                            />
                        </div>

                    </div>
                </div>

                <div className="p-8 overflow-y-auto max-h-[calc(85vh-300px)]">
                    {/* Image Upload Area */}
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`mb-4 border-2 border-dashed rounded-lg p-6 transition-colors ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                    >
                        {/* Existing Images Preview */}
                        {editData.existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-slate-600 mb-3">Current Images:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {editData.existingImages.map((imageUrl: string, index: number) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imageUrl}
                                                alt={`Image ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onRemoveImage(imageUrl)}
                                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                title="Remove image"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-200 my-4"></div>
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            className="hidden"
                            id={`image-upload-${mode}`}
                        />
                        <label htmlFor={`image-upload-${mode}`} className="cursor-pointer block">
                            <div className="text-center">
                                <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {uploadingImage ? (
                                    <p className="text-blue-600 font-medium">Uploading...</p>
                                ) : (
                                    <>
                                        <p className="text-slate-600 font-medium">
                                            {editData.existingImages.length > 0 ? 'Add more images' : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-slate-400 text-sm">PNG, JPG, GIF up to 5MB</p>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    <textarea
                        value={editData.content}
                        onChange={(e) => onContentChange(e.target.value)}
                        className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Write your content here... (Images will be inserted as markdown)"
                    />

                    <div className={`flex ${isCreateMode ? 'justify-end gap-4' : 'justify-between'} mt-8`}>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
                        >
                            {isCreateMode ? 'Create' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
