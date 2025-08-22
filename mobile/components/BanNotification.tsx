import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface BanNotificationProps {
  visible: boolean;
  onClose: () => void;
}

const BanNotification: React.FC<BanNotificationProps> = ({ visible, onClose }) => {
  const { banInfo, logout } = useAuth();

  if (!visible) return null;

  const getBanDetails = () => {
    if (!banInfo) return { reason: 'No reason provided', duration: 'Unknown' };
    
    const reason = banInfo.reason || 'No reason provided';
    const duration = banInfo.duration || 'Unknown';
    const endDate = banInfo.banEndDate;
    
    return { reason, duration, endDate };
  };

  const { reason, duration, endDate } = getBanDetails();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Close Ban Notification',
      'Are you sure you want to close this notification? You will still be banned.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close', onPress: onClose }
      ]
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚫</Text>
          </View>
          <Text style={styles.title}>Account Banned</Text>
          <Text style={styles.subtitle}>
            Your account has been suspended from using this application.
          </Text>
        </View>

        {/* Ban Information */}
        <View style={styles.banInfo}>
          <Text style={styles.sectionTitle}>Ban Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Reason:</Text>
            <Text style={styles.value}>{reason}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>
              {duration === 'permanent' ? 'Permanent' : 'Temporary'}
            </Text>
          </View>
          
          {endDate && duration === 'temporary' && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Expires:</Text>
              <Text style={styles.value}>
                {new Date(endDate.toDate ? endDate.toDate() : endDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* What This Means */}
        <View style={styles.warningSection}>
          <Text style={styles.sectionTitle}>What This Means</Text>
          <Text style={styles.warningText}>• You cannot access any features of the application</Text>
          <Text style={styles.warningText}>• You cannot create posts or send messages</Text>
          <Text style={styles.warningText}>• Your account is suspended until further notice</Text>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsSection}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
          <Text style={styles.nextStepsText}>
            {duration === 'temporary' 
              ? 'Wait for your ban to expire, or contact an administrator if you believe this was an error.'
              : 'This is a permanent ban. Contact an administrator if you believe this was an error.'
            }
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  banInfo: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  value: {
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  warningSection: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 20,
  },
  nextStepsSection: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BanNotification;
