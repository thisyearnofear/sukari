import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FairnessBadgeProps {
  proof: string;
  isVerified?: boolean;
  onVerify?: () => void;
  onPress?: () => void;
}

export const FairnessBadge: React.FC<FairnessBadgeProps> = ({
  proof,
  isVerified = false,
  onVerify,
  onPress,
}) => {
  const handlePress = () => {
    if (onVerify) {
      onVerify();
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.badge,
        isVerified ? styles.verifiedBadge : styles.unverifiedBadge,
      ]}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.badgeText,
        isVerified ? styles.verifiedText : styles.unverifiedText
      ]}>
        {isVerified ? '✅ FAIR' : '⚖️ VERIFY'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  unverifiedBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifiedText: {
    color: '#22c55e',
  },
  unverifiedText: {
    color: '#818cf8',
  },
});