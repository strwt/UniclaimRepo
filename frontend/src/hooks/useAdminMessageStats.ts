import { useState, useEffect } from 'react';
import { messageService } from '../services/firebase/messages';

interface AdminMessageStats {
    totalConversations: number;
    totalUnreadMessages: number;
    pendingHandoverRequests: number;
    pendingClaimRequests: number;
}

export const useAdminMessageStats = () => {
    const [stats, setStats] = useState<AdminMessageStats>({
        totalConversations: 0,
        totalUnreadMessages: 0,
        pendingHandoverRequests: 0,
        pendingClaimRequests: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const messageStats = await messageService.getAdminMessageStats();
            setStats(messageStats);
        } catch (err: any) {
            console.error('Failed to fetch admin message stats:', err);
            setError(err.message || 'Failed to fetch message statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Refresh stats every 30 seconds for real-time updates
        const interval = setInterval(fetchStats, 30000);

        return () => clearInterval(interval);
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
    };
};
