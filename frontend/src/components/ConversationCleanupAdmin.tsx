import React, { useState, useEffect } from 'react';
import { conversationCleanupService, type CleanupResult } from '../utils/conversationCleanupService';

/**
 * Admin Component for Conversation Cleanup
 * Allows administrators to manually trigger 24-hour cleanup and monitor status
 */
export default function ConversationCleanupAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);
  const [stats, setStats] = useState<{ lastCleanup: number; isRunning: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const currentStats = conversationCleanupService.getCleanupStats();
    setStats(currentStats);
  };

  const handleManualCleanup = async () => {
    if (!confirm('Are you sure you want to manually trigger the 24-hour conversation cleanup? This will delete conversations older than 24 hours.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      console.log('🧹 Admin: Manual cleanup triggered');
      const result = await conversationCleanupService.forceCleanup();
      setLastResult(result);
      
      if (result.success) {
        console.log('✅ Admin: Manual cleanup completed successfully');
      } else {
        console.warn('⚠️ Admin: Manual cleanup completed with errors:', result.errors);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Admin: Manual cleanup failed:', errorMessage);
    } finally {
      setIsLoading(false);
      loadStats(); // Refresh stats after cleanup
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">🧹</div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Conversation Cleanup Admin</h2>
          <p className="text-sm text-gray-600">
            Automatically deletes conversations older than 24 hours to free up Firebase storage
          </p>
        </div>
      </div>

      {/* Current Status */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Current Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Last Cleanup:</span>
              <div className="font-medium">{formatTimestamp(stats.lastCleanup)}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className={`font-medium ${stats.isRunning ? 'text-blue-600' : 'text-green-600'}`}>
                {stats.isRunning ? '🔄 Running' : '✅ Idle'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Cleanup Button */}
      <div className="mb-6">
        <button
          onClick={handleManualCleanup}
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Running Cleanup...
            </div>
          ) : (
            '🔄 Trigger Manual Cleanup'
          )}
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          This will bypass the 1-hour interval and run cleanup immediately
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <span>❌</span>
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Last Result Display */}
      {lastResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{getStatusIcon(lastResult.success)}</span>
            <h3 className="font-medium text-blue-800">
              {lastResult.success ? 'Cleanup Completed' : 'Cleanup Completed with Errors'}
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{lastResult.conversationsDeleted}</div>
              <div className="text-blue-600">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{lastResult.messagesDeleted}</div>
              <div className="text-blue-600">Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{lastResult.imagesDeleted}</div>
              <div className="text-blue-600">Images</div>
            </div>
          </div>

          {lastResult.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {lastResult.errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600 text-lg">ℹ️</span>
          <div className="text-sm text-yellow-800">
            <h4 className="font-medium mb-2">How It Works:</h4>
            <ul className="space-y-1">
              <li>• Automatically runs every hour (if needed)</li>
              <li>• Deletes conversations older than 24 hours</li>
              <li>• Removes all messages and associated images</li>
              <li>• Frees up Firebase storage space</li>
              <li>• Prevents multiple simultaneous runs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
