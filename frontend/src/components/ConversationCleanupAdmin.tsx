import GhostConversationCleanup from './GhostConversationCleanup';

/**
 * ConversationCleanupAdmin Component
 * 
 * This is the admin interface for cleaning up conversations and messages.
 * It provides a user-friendly wrapper around the GhostConversationCleanup tool
 * with additional admin-specific context and styling.
 */
export default function ConversationCleanupAdmin() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Maintenance & Cleanup
          </h1>
          <p className="text-lg text-gray-600">
            Administrative tools for maintaining system integrity and cleaning up orphaned data
          </p>
        </div>

        {/* Admin Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Administrator Access Required
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This maintenance tool is restricted to system administrators only. 
                  Use these tools carefully as cleanup operations cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Cleanup Tool */}
        <GhostConversationCleanup />
      </div>
    </div>
  );
}
