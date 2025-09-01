import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getQuotaStats, logQuotaStatus, resetQuotaCounters, getQuotaRecommendations } from '../utils/firebase';
import { listenerManager } from '../utils/ListenerManager';

/**
 * 🔍 QuotaDebugger Component
 * 
 * This component provides real-time monitoring of Firebase quota usage.
 * It's designed for developers to identify which operations are consuming
 * the most Firebase quota and get recommendations for optimization.
 * 
 * Features:
 * - Real-time quota statistics
 * - Top operations by usage count
 * - Active listener monitoring
 * - Optimization recommendations
 * - Manual counter reset
 * 
 * Usage:
 * - Import and add to your development screens
 * - Monitor during app usage to identify bottlenecks
 * - Use recommendations to optimize Firebase operations
 */

interface QuotaStats {
    reads: number;
    writes: number;
    listeners: number;
    batches: number;
    queries: number;
    topOperations: Array<{ operation: string; count: number }>;
    activeListeners: Array<{ listener: string; count: number }>;
}

export const QuotaDebugger: React.FC = () => {
    const [stats, setStats] = useState<QuotaStats | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    // Update stats every 2 seconds
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            const currentStats = getQuotaStats();
            setStats(currentStats);
            
            const currentRecommendations = getQuotaRecommendations();
            setRecommendations(currentRecommendations);
        }, 2000);

        return () => clearInterval(interval);
    }, [isVisible]);

    const handleLogToConsole = () => {
        logQuotaStatus();
    };

    const handleResetCounters = () => {
        resetQuotaCounters();
        setStats(getQuotaStats());
        setRecommendations(getQuotaRecommendations());
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
        if (!isVisible) {
            // Initialize stats when showing
            setStats(getQuotaStats());
            setRecommendations(getQuotaRecommendations());
        }
    };

    if (!isVisible) {
        return (
            <TouchableOpacity style={styles.toggleButton} onPress={toggleVisibility}>
                <Text style={styles.toggleButtonText}>🔍 Show Quota Debugger</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🔍 Firebase Quota Debugger</Text>
                <TouchableOpacity style={styles.closeButton} onPress={toggleVisibility}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Current Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Current Usage</Text>
                    {stats && (
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.reads}</Text>
                                <Text style={styles.statLabel}>Reads</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.writes}</Text>
                                <Text style={styles.statLabel}>Writes</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.listeners}</Text>
                                <Text style={styles.statLabel}>Listeners</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.batches}</Text>
                                <Text style={styles.statLabel}>Batches</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.queries}</Text>
                                <Text style={styles.statLabel}>Queries</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Top Operations */}
                {stats && stats.topOperations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🏆 Top Operations</Text>
                        {stats.topOperations.map((op, index) => (
                            <View key={index} style={styles.operationItem}>
                                <Text style={styles.operationName}>{op.operation}</Text>
                                <Text style={styles.operationCount}>{op.count}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Active Listeners */}
                {stats && stats.activeListeners.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}> 🔊 Active Listeners</Text>
                        {stats.activeListeners.map((listener, index) => (
                            <View key={index} style={styles.listenerItem}>
                                <Text style={styles.listenerName}>{listener.listener}</Text>
                                <Text style={styles.listenerCount}>{listener.count}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Listener Manager Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔧 Listener Manager</Text>
                    {(() => {
                        const listenerStats = listenerManager.getListenerStats();
                        return (
                            <View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{listenerStats.totalListeners}</Text>
                                    <Text style={styles.statLabel}>Total Listeners</Text>
                                </View>
                                {listenerStats.activeListeners.map((listener, index) => (
                                    <View key={index} style={styles.operationItem}>
                                        <Text style={styles.operationName}>{listener.key}</Text>
                                        <Text style={styles.operationCount}>{listener.count}</Text>
                                    </View>
                                ))}
                            </View>
                        );
                    })()}
                </View>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💡 Optimization Tips</Text>
                        {recommendations.map((rec, index) => (
                            <View key={index} style={styles.recommendationItem}>
                                <Text style={styles.recommendationText}>• {rec}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLogToConsole}>
                        <Text style={styles.actionButtonText}>📝 Log to Console</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionButton} onPress={handleResetCounters}>
                        <Text style={styles.actionButtonText}>🔄 Reset Counters</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        right: 10,
        width: 300,
        maxHeight: 500,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    toggleButton: {
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    toggleButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '18%',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#999',
        fontSize: 10,
        textAlign: 'center',
    },
    operationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    operationName: {
        color: 'white',
        fontSize: 12,
        flex: 1,
    },
    operationCount: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    listenerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    listenerName: {
        color: 'white',
        fontSize: 12,
        flex: 1,
    },
    listenerCount: {
        color: '#FF9500',
        fontSize: 14,
        fontWeight: 'bold',
    },
    recommendationItem: {
        paddingVertical: 4,
    },
    recommendationText: {
        color: '#34C759',
        fontSize: 12,
        lineHeight: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default QuotaDebugger;
