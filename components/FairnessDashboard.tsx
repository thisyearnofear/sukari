import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Linking, Alert } from 'react-native';
import { FairnessBadge } from './FairnessBadge';

interface VerificationEvent {
  id: string;
  timestamp: number;
  type: 'plot_twist' | 'achievement' | 'other';
  gameId: string;
  proof: string;
  verified: boolean;
}

interface FairnessMetrics {
  verifiedEvents: number;
  totalEvents: number;
  integrityScore: number; // 0-100
  recentVerifications: VerificationEvent[];
  vrfEnabled?: boolean;
  blockchainSynced?: boolean;
}

interface FairnessDashboardProps {
  metrics: FairnessMetrics;
  onRefresh?: () => void;
  onVerifyAll?: () => void;
  scrollscanBaseUrl?: string;
  contractAddress?: string;
}

export const FairnessDashboard: React.FC<FairnessDashboardProps> = ({
  metrics,
  onRefresh,
  onVerifyAll,
  scrollscanBaseUrl = 'https://sepolia.scrollscan.com/address',
  contractAddress = '0xf36223131aDA53e94B08F0c098A6A93424D68EE3',
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  // Calculate integrity percentage
  const integrityPercentage = metrics.totalEvents > 0
    ? Math.round((metrics.verifiedEvents / metrics.totalEvents) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Integrity Score Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🏆 GAME INTEGRITY</Text>
        <View style={styles.integrityRow}>
          <View style={styles.integrityItem}>
            <Text style={styles.integrityNumber}>{integrityPercentage}%</Text>
            <Text style={styles.integrityLabel}>FAIRNESS SCORE</Text>
          </View>
          <View style={styles.integrityItem}>
            <Text style={styles.integrityNumber}>{metrics.verifiedEvents}</Text>
            <Text style={styles.integrityLabel}>VERIFIED EVENTS</Text>
          </View>
          <View style={styles.integrityItem}>
            <Text style={styles.integrityNumber}>{metrics.totalEvents}</Text>
            <Text style={styles.integrityLabel}>TOTAL EVENTS</Text>
          </View>
        </View>
      </View>

      {/* VRF Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔐 ZK PROOF STATUS</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>VRF Enabled</Text>
          <View style={[styles.statusIndicator, metrics.vrfEnabled !== false ? styles.statusActive : styles.statusInactive]} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Last Verification</Text>
          <Text style={styles.statusValue}>
            {metrics.recentVerifications[0] 
              ? new Date(metrics.recentVerifications[0].timestamp).toLocaleTimeString()
              : 'Never'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Blockchain Sync</Text>
          <View style={[styles.statusIndicator, metrics.blockchainSynced !== false ? styles.statusActive : styles.statusInactive]} />
        </View>
      </View>

      {/* Recent Verifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔍 RECENT VERIFICATIONS</Text>
        {metrics.recentVerifications.length > 0 ? (
          <View style={styles.verificationsList}>
            {metrics.recentVerifications.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.verificationItem}>
                <View style={styles.verificationHeader}>
                  <Text style={styles.verificationType}>
                    {event.type.toUpperCase()}
                  </Text>
                  <Text style={styles.timestamp}>
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.verificationDetails}>
                  <Text style={styles.gameId} numberOfLines={1} ellipsizeMode="tail">
                    Game: {event.gameId.substring(0, 8)}...
                  </Text>
                  <FairnessBadge
                    proof={event.proof}
                    isVerified={event.verified}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No verifications yet</Text>
            <Text style={styles.emptySubtext}>Play games to see verifiable events</Text>
          </View>
        )}
      </View>

      {/* Verification Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔧 VERIFICATION TOOLS</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onVerifyAll}
            accessibilityLabel="Verify all events"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>🔄 VERIFY ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Report', 'Fairness report generation is coming soon.')}
            accessibilityLabel="Generate fairness report"
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>📋 REPORT</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.fullButton}
          onPress={() => Linking.openURL(`${scrollscanBaseUrl}/${contractAddress}`)}
          accessibilityLabel="View proof on ScrollScan"
          accessibilityRole="link"
        >
          <Text style={styles.fullButtonText}>VIEW PROOF ON SCROLLSCAN</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a12',
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 46, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  sectionTitle: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  integrityRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  integrityItem: {
    alignItems: 'center',
  },
  integrityNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  integrityLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  statusText: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  statusValue: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#22c55e',
  },
  statusInactive: {
    backgroundColor: '#6b7280',
  },
  verificationsList: {
    marginBottom: -16,
  },
  verificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  verificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verificationType: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 12,
  },
  verificationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameId: {
    color: '#c7d2fe',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fullButton: {
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fullButtonText: {
    color: '#22d3ee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
});