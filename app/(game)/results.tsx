import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ResultsScroll } from '@/components/game/ResultsScroll';
import { useGameSession } from '@/context/GameSessionContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { GameTier } from '@/constants/gameTiers';

export default function ResultsScreen() {
  const {
    battleGame,
    tierConfig,
    healthProfile,
    selectedTier,
    setSelectedTier,
  } = useGameSession();

  const { gameState } = battleGame;
  const { progress } = usePlayerProgressContext();

  const [showTierAdvanceModal, setShowTierAdvanceModal] = useState(false);
  const [pendingTierAdvance, setPendingTierAdvance] = useState<GameTier | null>(null);

  const handlePlayAgain = useCallback(() => {
    if (selectedTier === 'tier1') {
      setPendingTierAdvance('tier2');
      setShowTierAdvanceModal(true);
    } else {
      router.replace('/');
    }
  }, [selectedTier]);

  const handleMainMenu = useCallback(() => {
    router.replace('/');
  }, []);

  const confirmTierAdvance = useCallback(() => {
    if (pendingTierAdvance) {
      setSelectedTier(pendingTierAdvance);
      setShowTierAdvanceModal(false);
      setPendingTierAdvance(null);
      router.replace('/(game)/onboarding');
    }
  }, [pendingTierAdvance, setSelectedTier]);

  const cancelTierAdvance = useCallback(() => {
    setShowTierAdvanceModal(false);
    setPendingTierAdvance(null);
    router.replace('/');
  }, []);

  return (
    <>
      <View style={{ flex: 1 }}>
        <ResultsScroll
          result={gameState.gameResult || 'defeat'}
          score={gameState.score}
          glucoseLevel={gameState.stability}
          correctSwipes={gameState.correctSwipes}
          incorrectSwipes={gameState.incorrectSwipes}
          timeInBalanced={gameState.timeInBalanced}
          comboMax={gameState.comboCount}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
          gameMode={tierConfig.gameMode}
          finalMetrics={gameState.metrics}
          morningCondition={gameState.morningCondition}
          gameState={gameState}
          healthProfile={tierConfig.healthProfile ? healthProfile.healthProfile : undefined}
          tier={selectedTier || 'tier1'}
          dexcomOption={tierConfig.dexcomOption}
          userMode={progress.userMode || undefined}
        />
      </View>

      <Modal
        visible={showTierAdvanceModal}
        transparent
        animationType="fade"
        onRequestClose={cancelTierAdvance}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>⚔️</Text>
            <Text style={styles.modalTitle}>ADVANCE TO CHALLENGE 1?</Text>
            <Text style={styles.modalDescription}>
              You&apos;ve mastered the Warm-Up! Challenge 1 introduces real glucose management with:
            </Text>
            <View style={styles.modalFeatures}>
              <Text style={styles.modalFeature}>• Real glucose simulation</Text>
              <Text style={styles.modalFeature}>• Your actual health profile</Text>
              <Text style={styles.modalFeature}>• Tougher penalties for mistakes</Text>
            </View>
            <Text style={styles.modalHint}>
              You can always return to practice mode anytime.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalAdvanceButton}
                onPress={confirmTierAdvance}
              >
                <Text style={styles.modalAdvanceText}>⚡ TAKE THE CHALLENGE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalStayButton}
                onPress={cancelTierAdvance}
              >
                <Text style={styles.modalStayText}>🏰 PRACTICE MORE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fbbf24',
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    color: '#fbbf24',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalFeatures: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  modalFeature: {
    color: '#86efac',
    fontSize: 13,
    marginBottom: 6,
  },
  modalHint: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalAdvanceButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  modalAdvanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalStayButton: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
  },
  modalStayText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
