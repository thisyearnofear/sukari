/**
 * Insulin Control UI
 * Allows player to administer insulin doses during gameplay
 * Only available when health profile is active
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { HealthProfile, InsulinType } from '@/types/health';
import { INSULIN_PROFILES } from '@/constants/healthScenarios';

interface InsulinControlProps {
  healthProfile: HealthProfile;
  onAdministerInsulin: (units: number, insulinType?: InsulinType) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const InsulinControl: React.FC<InsulinControlProps> = ({
  healthProfile,
  onAdministerInsulin,
  isVisible,
  onClose,
}) => {
  const handleInsulinDose = (units: number) => {
    onAdministerInsulin(units, healthProfile.insulinType);
  };

  const doseOptions = [1, 2, 4, 6, 10]; // Common insulin doses

  if (healthProfile.insulinType === 'none') {
    // Non-diabetic or prediabetic - no insulin available
    return null;
  }

  const insulinProfile = INSULIN_PROFILES[healthProfile.insulinType];
  const currentGlucose = healthProfile.currentGlucose;
  const targetMin = healthProfile.targetRange.min;
  const targetMax = healthProfile.targetRange.max;

  // Calculate estimated glucose drop for each dose
  const estimateGlucoseDrop = (units: number) => {
    return Math.round(units * healthProfile.insulinSensitivityFactor);
  };

  // Determine which doses would be helpful
  const isInRange = currentGlucose >= targetMin && currentGlucose <= targetMax;
  const isHigh = currentGlucose > targetMax;
  const needsInsulin = isHigh;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}>
        <View style={{
          backgroundColor: '#0f0f1a',
          borderWidth: 2,
          borderColor: '#7c3aed',
          borderRadius: 16,
          padding: 20,
          maxWidth: 350,
        }}>
          {/* Header */}
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 4,
          }}>
            💉 Administer Insulin
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#9ca3af',
            marginBottom: 16,
          }}>
            {insulinProfile.name}
          </Text>

          {/* Current Status */}
          <View style={{
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            borderLeftWidth: 3,
            borderLeftColor: '#7c3aed',
            padding: 12,
            marginBottom: 16,
            borderRadius: 8,
          }}>
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 10, color: '#9ca3af' }}>Current Glucose</Text>
              <Text style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: currentGlucose > targetMax ? '#ef4444' : currentGlucose < targetMin ? '#f59e0b' : '#22c55e',
              }}>
                {Math.round(currentGlucose)} mg/dL
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 10, color: '#9ca3af' }}>Target Range</Text>
              <Text style={{ fontSize: 12, color: '#d1d5db' }}>
                {targetMin} - {targetMax} mg/dL
              </Text>
            </View>
          </View>

          {/* Status message */}
          {isInRange && (
            <View style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 12, color: '#4ade80', fontWeight: '600' }}>
                ✓ Glucose is in target range
              </Text>
            </View>
          )}

          {needsInsulin && (
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 12, color: '#f87171', fontWeight: '600' }}>
                ⚠️ High glucose - insulin recommended
              </Text>
            </View>
          )}

          {/* Dose selector */}
          <Text style={{
            fontSize: 12,
            color: '#9ca3af',
            fontWeight: '600',
            marginBottom: 8,
          }}>
            Select Dose:
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
          }}>
            {doseOptions.map((dose) => {
              const drop = estimateGlucoseDrop(dose);
              const projected = currentGlucose - drop;
              const wouldBeInRange = projected >= targetMin && projected <= targetMax;

              return (
                <TouchableOpacity
                  key={dose}
                  onPress={() => handleInsulinDose(dose)}
                  style={{
                    flex: 1,
                    minWidth: '30%',
                    backgroundColor: wouldBeInRange ? 'rgba(34, 197, 94, 0.2)' : 'rgba(79, 70, 229, 0.2)',
                    borderWidth: 2,
                    borderColor: wouldBeInRange ? '#22c55e' : '#4f46e5',
                    borderRadius: 8,
                    padding: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>
                    {dose}U
                  </Text>
                  <Text style={{
                    fontSize: 9,
                    color: '#d1d5db',
                  }}>
                    -~{drop} mg/dL
                  </Text>
                  {wouldBeInRange && (
                    <Text style={{ fontSize: 8, color: '#22c55e', marginTop: 2 }}>
                      ✓ In range
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Insulin profile info */}
          <View style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 10, color: '#60a5fa', fontWeight: '600', marginBottom: 6 }}>
              📋 Insulin Profile:
            </Text>
            <Text style={{ fontSize: 9, color: '#93c5fd', marginBottom: 2 }}>
              Onset: {insulinProfile.onsetMins} min | Peak: {insulinProfile.peakMins} min
            </Text>
            <Text style={{ fontSize: 9, color: '#93c5fd' }}>
              Duration: {insulinProfile.durationMins} min (~{(insulinProfile.durationMins / 60).toFixed(1)} hours)
            </Text>
          </View>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: '#374151',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
