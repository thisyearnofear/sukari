import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWeb3 } from '@/context/Web3Context';
import { UserMode } from '@/types/game';
import { USER_MODE_CONFIGS } from '@/constants/userModes';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width * 0.9, 400);

interface RoleBadgeModalProps {
  visible: boolean;
  onClose: () => void;
  role: UserMode | null;
  userMode: UserMode | null;
  onMintSuccess: () => void;
}

export const RoleBadgeModal: React.FC<RoleBadgeModalProps> = ({
  visible,
  onClose,
  role,
  userMode,
  onMintSuccess,
}) => {
  const { isConnected, address } = useWeb3();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const roleData = role ? USER_MODE_CONFIGS[role] : null;

  const handleMintBadge = async () => {
    if (!role || !isConnected || !address) return;

    setIsMinting(true);
    setMintStatus('idle');

    try {
      // Simulate minting process (in production, this would call the contract)
      console.log(`Minting ${role} badge for ${address}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, this would be:
      // const tx = await contract.mintRoleBadge(role, address);
      // await tx.wait();

      setMintStatus('success');
      onMintSuccess();
    } catch (error) {
      console.error('Minting failed:', error);
      setMintStatus('error');
    } finally {
      setIsMinting(false);
    }
  };

  const badgeMetadata = {
    personal: {
      name: 'Glucose Warrior Badge',
      description: 'Committed to mastering personal glucose management',
      emoji: '🏰',
      color: 'text-red-400',
    },
    caregiver: {
      name: 'Health Guardian Badge',
      description: 'Dedicated to supporting others in their health journey',
      emoji: '🛡️',
      color: 'text-blue-400',
    },
    curious: {
      name: 'Knowledge Seeker Badge',
      description: 'Exploring diabetes education for personal growth',
      emoji: '📜',
      color: 'text-purple-400',
    },
  }[role || 'personal'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/80">
        <View style={{ width: maxWidth }} className="bg-[#1a1a2e] p-6 rounded-2xl border-2 border-amber-400">

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 p-2">
            <Ionicons name="close" size={24} color="#fbbf24" />
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-4xl text-center mb-2">🏅</Text>
          <Text className="text-amber-400 text-2xl font-bold text-center mb-1">
            ROLE BADGE
          </Text>
          <Text className="text-white text-lg text-center mb-4">
            {badgeMetadata.name}
          </Text>

          {/* Badge Preview */}
          <View className="items-center mb-4">
            <View className="w-32 h-32 rounded-2xl border-4 border-amber-400 bg-black/40 items-center justify-center mb-2">
              <Text className="text-6xl mb-2">{roleData?.icon || '👤'}</Text>
              <Text className={`text-xl font-bold ${badgeMetadata.color}`}>
                {role ? role.toUpperCase() : 'ROLE'}
              </Text>
            </View>
            <Text className="text-cyan-300 text-xs text-center">
              {badgeMetadata.description}
            </Text>
          </View>

          {/* Educational Content */}
          <View className="bg-black/40 p-3 rounded-xl border border-cyan-700 mb-4">
            <Text className="text-cyan-400 text-xs font-bold mb-2">📚 WHY MINT?</Text>
            <View className="flex-row items-start mb-1">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Carry your commitment onchain as a verifiable badge
              </Text>
            </View>
            <View className="flex-row items-start mb-1">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Show your learning journey to healthcare providers
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-cyan-300 mr-2">•</Text>
              <Text className="text-white text-xs flex-1">
                Completely optional - no impact on gameplay
              </Text>
            </View>
          </View>

          {/* Wallet Connection Check */}
          {!isConnected ? (
            <View className="bg-black/40 p-3 rounded-xl border border-gray-600 mb-4">
              <Text className="text-gray-400 text-xs text-center mb-2">
                Connect wallet to mint your badge
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-600/20"
              >
                <Text className="text-amber-300 text-xs text-center">
                  Connect Wallet First
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-black/40 p-3 rounded-xl border border-green-700 mb-4">
              <Text className="text-green-400 text-xs text-center mb-2">
                Mint to: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
              </Text>

              {mintStatus === 'success' ? (
                <View className="items-center">
                  <Text className="text-green-400 text-lg mb-2">✅ Success!</Text>
                  <Text className="text-white text-xs text-center mb-2">
                    Your badge has been minted!
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    className="px-4 py-2 rounded-lg border border-green-400 bg-green-600/20"
                  >
                    <Text className="text-green-300 text-xs text-center">
                      Continue Journey
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : mintStatus === 'error' ? (
                <View className="items-center">
                  <Text className="text-red-400 text-lg mb-2">❌ Error</Text>
                  <Text className="text-white text-xs text-center mb-2">
                    Minting failed. Please try again.
                  </Text>
                  <TouchableOpacity
                    onPress={handleMintBadge}
                    disabled={isMinting}
                    className="px-4 py-2 rounded-lg border border-amber-400 bg-amber-600/20"
                  >
                    <Text className="text-amber-300 text-xs text-center">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleMintBadge}
                  disabled={isMinting}
                  className={`px-4 py-3 rounded-xl border-2 ${
                    isMinting 
                      ? 'border-gray-600 bg-gray-600/20'
                      : 'border-amber-400 bg-amber-600/30'
                  }`}
                >
                  {isMinting ? (
                    <ActivityIndicator size="small" color="#fbbf24" />
                  ) : (
                    <Text className="text-amber-300 text-sm font-bold text-center">
                      MINT BADGE (FREE)
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Footer */}
          <Text className="text-gray-500 text-xs text-center">
            Minting is optional and doesn&apos;t affect gameplay or learning
          </Text>
        </View>
      </View>
    </Modal>
  );
};