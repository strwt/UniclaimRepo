import React, { useState, useEffect } from 'react';
import { postService } from '../../services/firebase/posts';
import { useToast } from '../../context/ToastContext';
import type { Post } from '../../types/Post';
import PageWrapper from '../../components/PageWrapper';
import NavHeader from '../../components/NavHeadComp';

export default function FlaggedPostsPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'hide' | 'unhide' | 'delete';
    post: Post | null;
  } | null>(null);

  // Bulk actions state
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<{
    type: 'approve' | 'hide' | 'unhide' | 'delete';
    count: number;
  } | null>(null);

  // Load flagged posts on component mount
  useEffect(() => {
    loadFlaggedPosts();
  }, []);

  const loadFlaggedPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const posts = await postService.getFlaggedPosts();
      setFlaggedPosts(posts);
    } catch (err: any) {
      setError(err.message || 'Failed to load flagged posts');
      showToast('Failed to load flagged posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'approve' | 'hide' | 'unhide' | 'delete', post: Post) => {
    setConfirmAction({ type: action, post });
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !confirmAction.post) return;

    const { type, post } = confirmAction;
    const postId = post.id;

    try {
      setActionLoading(postId);
      
      switch (type) {
        case 'approve':
          await postService.unflagPost(postId);
          setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
          showToast('Post approved and unflagged successfully', 'success');
          break;
        case 'hide':
          await postService.hidePost(postId);
          setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
          showToast('Post hidden from public view successfully', 'success');
          break;
        case 'unhide':
          await postService.unhidePost(postId);
          setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
          showToast('Post unhidden and visible to public successfully', 'success');
          break;
        case 'delete':
          await postService.deletePost(postId);
          setFlaggedPosts(prev => prev.filter(p => p.id !== postId));
          showToast('Post deleted successfully', 'success');
          break;
      }
    } catch (err: any) {
      const actionText = type === 'approve' ? 'approve' : type === 'hide' ? 'hide' : type === 'unhide' ? 'unhide' : 'delete';
      showToast(err.message || `Failed to ${actionText} post`, 'error');
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Bulk action handlers
  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === flaggedPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(flaggedPosts.map(post => post.id)));
    }
  };

  const handleBulkActionClick = (action: 'approve' | 'hide' | 'unhide' | 'delete') => {
    if (selectedPosts.size === 0) {
      showToast('Please select posts to perform bulk action', 'warning');
      return;
    }
    setBulkAction({ type: action, count: selectedPosts.size });
    setShowBulkConfirmModal(true);
  };

  const handleBulkConfirmAction = async () => {
    if (!bulkAction || selectedPosts.size === 0) return;

    const { type } = bulkAction;
    const selectedPostIds = Array.from(selectedPosts);
    let successCount = 0;
    let errorCount = 0;

    try {
      setActionLoading('bulk');
      
      for (const postId of selectedPostIds) {
        try {
          switch (type) {
            case 'approve':
              await postService.unflagPost(postId);
              break;
            case 'hide':
              await postService.hidePost(postId);
              break;
            case 'unhide':
              await postService.unhidePost(postId);
              break;
            case 'delete':
              await postService.deletePost(postId);
              break;
          }
          successCount++;
        } catch (err) {
          console.error(`Failed to ${type} post ${postId}:`, err);
          errorCount++;
        }
      }

      // Update the posts list
      setFlaggedPosts(prev => prev.filter(post => !selectedPosts.has(post.id)));
      setSelectedPosts(new Set());

      if (errorCount === 0) {
        showToast(`Successfully processed ${successCount} posts`, 'success');
      } else {
        showToast(`Processed ${successCount} posts successfully, ${errorCount} failed`, 'warning');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to process bulk action', 'error');
    } finally {
      setActionLoading(null);
      setShowBulkConfirmModal(false);
      setBulkAction(null);
    }
  };

  const handleCancelBulkAction = () => {
    setShowBulkConfirmModal(false);
    setBulkAction(null);
  };

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading) {
    return (
      <PageWrapper title="Flagged Posts">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-gray-600">Loading flagged posts...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Flagged Posts">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadFlaggedPosts}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-teal-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Flagged Posts">
      <div className="w-full mx-auto">
        {/* Page Header */}
        <div className="hidden px-4 py-3 sm:px-6 lg:px-8 lg:flex items-center justify-between fixed left-20 top-18 right-0 z-10 bg-gray-50 border-b border-zinc-200">
          <div className="">
            <h1 className="text-base font-medium text-gray-900">Flagged Posts Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage posts that have been flagged by users
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {flaggedPosts.length} Flagged
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <NavHeader
          title="Flagged Posts Management"
          description="Review and manage posts that have been flagged by users"
        />

        {/* Content */}
        <div className="lg:mt-30 p-4 sm:p-6 lg:p-8">
          {/* Bulk Actions Bar */}
          {flaggedPosts.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPosts.size === flaggedPosts.length && flaggedPosts.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-brand border-gray-300 rounded focus:ring-brand"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Select All ({selectedPosts.size}/{flaggedPosts.length})
                      </span>
                      {selectedPosts.size > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                {selectedPosts.size > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleBulkActionClick('approve')}
                      disabled={actionLoading === 'bulk'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    >
                      {actionLoading === 'bulk' ? 'Processing...' : `✓ Approve (${selectedPosts.size})`}
                    </button>
                    
                    <button
                      onClick={() => handleBulkActionClick('hide')}
                      disabled={actionLoading === 'bulk'}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    >
                      {actionLoading === 'bulk' ? 'Processing...' : `👁️ Hide (${selectedPosts.size})`}
                    </button>
                    
                    <button
                      onClick={() => handleBulkActionClick('delete')}
                      disabled={actionLoading === 'bulk'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                    >
                      {actionLoading === 'bulk' ? 'Processing...' : `🗑️ Delete (${selectedPosts.size})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {flaggedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚩</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Flagged Posts</h3>
              <p className="text-gray-500 max-w-md mx-auto">All posts are clean! No flagged content to review at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flaggedPosts.map((post) => (
                <div key={post.id} className={`bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 ${
                  selectedPosts.has(post.id) ? 'border-brand ring-2 ring-brand/20 shadow-brand/10' : 'border-gray-200'
                }`}>
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post.id)}
                          onChange={() => handleSelectPost(post.id)}
                          className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.type === 'lost' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {post.type === 'lost' ? 'Lost' : 'Found'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                        {post.isHidden && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>{post.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{post.location}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* Flag Information */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 font-medium text-sm">🚩 Flagged Content</span>
                      </div>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p><strong>Reason:</strong> {post.flagReason}</p>
                        <p><strong>Flagged by:</strong> {post.user?.firstName} {post.user?.lastName}</p>
                        <p><strong>Flagged at:</strong> {formatDate(post.flaggedAt)}</p>
                      </div>
                    </div>

                    {/* Post Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Images:</h4>
                        <div className="flex gap-2 overflow-x-auto">
                          {post.images.slice(0, 2).map((image, index) => (
                            <img
                              key={index}
                              src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                              alt={`Post image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            />
                          ))}
                          {post.images.length > 2 && (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                              +{post.images.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleActionClick('approve', post)}
                        disabled={actionLoading === post.id}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        {actionLoading === post.id ? 'Processing...' : '✓ Approve & Unflag'}
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleActionClick(post.isHidden ? 'unhide' : 'hide', post)}
                          disabled={actionLoading === post.id}
                          className={`flex-1 px-3 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors ${
                            post.isHidden 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-yellow-600 hover:bg-yellow-700'
                          }`}
                        >
                          {actionLoading === post.id ? 'Processing...' : 
                            post.isHidden ? '👁️ Unhide' : '👁️ Hide'
                          }
                        </button>
                        
                        <button
                          onClick={() => handleActionClick('delete', post)}
                          disabled={actionLoading === post.id}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                        >
                          {actionLoading === post.id ? 'Processing...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-3 w-11/12 md:w-3/4 lg:w-1/2 rounded-md bg-white">
            <div className="py-2 px-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {confirmAction.type === 'approve' && 'Approve Post'}
                  {confirmAction.type === 'hide' && 'Hide Post'}
                  {confirmAction.type === 'unhide' && 'Unhide Post'}
                  {confirmAction.type === 'delete' && 'Delete Post'}
                </h3>
                <button
                  onClick={handleCancelAction}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Post Details:</h4>
                  <p className="text-sm text-gray-700 mb-1"><strong>Title:</strong> {confirmAction.post.title}</p>
                  <p className="text-sm text-gray-700 mb-1"><strong>Type:</strong> {confirmAction.post.type === 'lost' ? 'Lost Item' : 'Found Item'}</p>
                  <p className="text-sm text-gray-700"><strong>Category:</strong> {confirmAction.post.category}</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Flag Information:</h4>
                  <p className="text-sm text-red-700 mb-1"><strong>Reason:</strong> {confirmAction.post.flagReason}</p>
                  <p className="text-sm text-red-700"><strong>Flagged by:</strong> {confirmAction.post.user?.firstName} {confirmAction.post.user?.lastName}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {confirmAction.type === 'approve' && 'This will remove the flag and make the post visible to all users again.'}
                    {confirmAction.type === 'hide' && 'This will hide the post from public view but keep it in the system. It can be unhidden later.'}
                    {confirmAction.type === 'unhide' && 'This will make the post visible to all users again. The post will remain flagged until approved.'}
                    {confirmAction.type === 'delete' && 'This will permanently delete the post and all associated data. This action cannot be undone.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading === confirmAction.post.id}
                  className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmAction.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : confirmAction.type === 'hide'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : confirmAction.type === 'unhide'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading === confirmAction.post.id ? 'Processing...' : 
                    confirmAction.type === 'approve' ? 'Approve Post' :
                    confirmAction.type === 'hide' ? 'Hide Post' :
                    confirmAction.type === 'unhide' ? 'Unhide Post' : 'Delete Post'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirmation Modal */}
      {showBulkConfirmModal && bulkAction && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-3 w-11/12 md:w-3/4 lg:w-1/2 rounded-md bg-white">
            <div className="py-2 px-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {bulkAction.type === 'approve' && 'Approve Multiple Posts'}
                  {bulkAction.type === 'hide' && 'Hide Multiple Posts'}
                  {bulkAction.type === 'unhide' && 'Unhide Multiple Posts'}
                  {bulkAction.type === 'delete' && 'Delete Multiple Posts'}
                </h3>
                <button
                  onClick={handleCancelBulkAction}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Bulk Action Details:</h4>
                  <p className="text-sm text-gray-700">
                    You are about to <strong>{bulkAction.type}</strong> <strong>{bulkAction.count}</strong> post{bulkAction.count !== 1 ? 's' : ''}.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {bulkAction.type === 'approve' && 'This will remove flags from all selected posts and make them visible to all users again.'}
                    {bulkAction.type === 'hide' && 'This will hide all selected posts from public view but keep them in the system. They can be unhidden later.'}
                    {bulkAction.type === 'unhide' && 'This will make all selected posts visible to all users again. The posts will remain flagged until approved.'}
                    {bulkAction.type === 'delete' && 'This will permanently delete all selected posts and all associated data. This action cannot be undone.'}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ This action will affect {bulkAction.count} post{bulkAction.count !== 1 ? 's' : ''} and cannot be undone.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={handleCancelBulkAction}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkConfirmAction}
                  disabled={actionLoading === 'bulk'}
                  className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    bulkAction.type === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : bulkAction.type === 'hide'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : bulkAction.type === 'unhide'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading === 'bulk' ? 'Processing...' : 
                    bulkAction.type === 'approve' ? `Approve ${bulkAction.count} Posts` :
                    bulkAction.type === 'hide' ? `Hide ${bulkAction.count} Posts` :
                    bulkAction.type === 'unhide' ? `Unhide ${bulkAction.count} Posts` : `Delete ${bulkAction.count} Posts`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
