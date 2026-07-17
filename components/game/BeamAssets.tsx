import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useBeam } from '@/context/BeamContext';
import { usePlayerProgressContext } from '@/context/PlayerProgressContext';
import { Ionicons } from '@expo/vector-icons';
import { track } from '@/utils/analytics';

interface BeamAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  isMinted: boolean;
  txHash?: string;
}

const BEAM_ACHIEVEMENTS: BeamAchievement[] = [
  {
    id: 'victory_classic',
    name: 'Classic Victor',
    description: 'Win a Classic Mode game with 100% Harmony.',
    icon: '🏆',
    points: 100,
    unlocked: false,
    isMinted: false,
  },
  {
    id: 'victory_life',
    name: 'Life Guardian',
    description: 'Complete a Life Mode day with all metrics in optimal zones.',
    icon: '🛡️',
    points: 250,
    unlocked: false,
    isMinted: false,
  },
  {
    id: 'perfect_stability',
    name: 'Harmony Master',
    description: 'Maintain perfect Harmony for over 60 seconds.',
    icon: '⚖️',
    points: 150,
    unlocked: false,
    isMinted: false,
  },
  {
    id: 'high_combo',
    name: 'Combo Crusader',
    description: 'Reach a 20x combo streak.',
    icon: '⚔️',
    points: 120,
    unlocked: false,
    isMinted: false,
  },
  {
    id: 'lore_master',
    name: 'Lore Master',
    description: 'Discover all secrets in the Grand Library.',
    icon: '📜',
    points: 500,
    unlocked: false,
    isMinted: false,
  },
  {
    id: 'social_hero',
    name: 'Social Hero',
    description: 'Reach maximum Social meter in Life Mode.',
    icon: '🤝',
    points: 200,
    unlocked: false,
    isMinted: false,
  },
];

export const BeamAssets: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const beamContext = useBeam();
  const playerAccount = beamContext?.playerAccount;
  const mintAchievement = beamContext?.mintAchievement;
  const isBeamLoading = beamContext?.isLoading;
  const fetchAchievements = beamContext?.fetchAchievements;

  const { progress } = usePlayerProgressContext();
  const [achievements, setAchievements] = useState<BeamAchievement[]>(BEAM_ACHIEVEMENTS);

  useEffect(() => {
    track('treasury_opened', { privacy_mode: progress.privacyMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Sync with player progress and Beam assets
    const syncAssets = async () => {
      if (!fetchAchievements) return;
      try {
        const beamOwnedAssets = await fetchAchievements();
        
        // Update local state based on progress and Beam assets
        setAchievements(prev => prev.map(ach => {
          // Check if unlocked locally
          let isUnlocked = false;
          
          switch(ach.id) {
            case 'victory_classic': isUnlocked = progress.gamesPlayed >= 1; break;
            case 'victory_life': isUnlocked = progress.gamesPlayed >= 5; break;
            case 'perfect_stability': isUnlocked = progress.kingdomRenown >= 1000; break;
            case 'high_combo': isUnlocked = progress.kingdomRenown >= 500; break;
            case 'lore_master': isUnlocked = progress.discoveredLoreIds.length >= 8; break;
            case 'social_hero': isUnlocked = progress.kingdomRenown >= 2000; break;
            default: isUnlocked = progress.kingdomRenown >= ach.points;
          }
          
          // Check if minted on Beam
          const mintedAsset = beamOwnedAssets.find((a: any) => a.id === ach.id);
          
          return {
            ...ach,
            unlocked: isUnlocked,
            isMinted: !!mintedAsset,
            txHash: mintedAsset?.txHash,
          };
        }));
      } catch (error) {
        console.error('Failed to sync Beam assets:', error);
      }
    };

    syncAssets();
  }, [fetchAchievements, progress.discoveredLoreIds.length, progress.gamesPlayed, progress.kingdomRenown]);

  const handleMint = async (id: string) => {
    try {
      track('mint_clicked', { achievement_id: id, privacy_mode: progress.privacyMode });
      const txHash = await mintAchievement(id);
      if (txHash) {
        track('mint_success', { achievement_id: id, privacy_mode: progress.privacyMode });
        setAchievements(prev =>
          prev.map(ach => (ach.id === id ? { ...ach, isMinted: true, txHash } : ach)),
        );
      } else {
        track('mint_error', { achievement_id: id, privacy_mode: progress.privacyMode });
      }
    } catch {
      track('mint_error', { achievement_id: id, privacy_mode: progress.privacyMode });
    }
  };

  return (
    <View className="flex-1 bg-black/95 p-6 rounded-t-3xl border-t border-purple-500/50">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-amber-400 text-2xl font-bold italic tracking-wider">ROYAL TREASURY</Text>
          <Text className="text-purple-300 text-xs">Secured by the Beam</Text>
        </View>
        <TouchableOpacity onPress={onClose} className="p-2">
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {!playerAccount ? (
        <View className="flex-1 justify-center items-center p-8">
          <Ionicons name="lock-closed" size={64} color="#a78bfa" />
          <Text className="text-white text-lg font-bold mt-4 text-center">Vault Locked</Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Log in with your Social Account to secure your deeds of valor in the Royal Treasury.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
            <Text className="text-purple-400 text-xs font-bold mb-1">SOVEREIGN IDENTITY</Text>
            <Text className="text-white font-mono text-xs">{playerAccount.address}</Text>
          </View>

          <Text className="text-white text-sm font-bold mb-4">DEEDS OF VALOR</Text>
          
          {achievements.map((ach) => (
            <View 
              key={ach.id} 
              className={`mb-4 p-4 rounded-2xl border-2 ${
                ach.isMinted 
                  ? 'bg-amber-600/10 border-amber-500/50' 
                  : ach.unlocked 
                    ? 'bg-purple-600/10 border-purple-500/50' 
                    : 'bg-gray-900/50 border-gray-800'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${ach.unlocked ? 'bg-purple-500/20' : 'bg-gray-800'}`}>
                    <Text className="text-2xl">{ach.unlocked ? ach.icon : '🔒'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</Text>
                    <Text className="text-gray-400 text-xs" numberOfLines={1}>{ach.description}</Text>
                  </View>
                </View>

                {ach.isMinted ? (
                  <View className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/50">
                    <Text className="text-amber-400 text-[10px] font-bold">MINTED</Text>
                  </View>
                ) : ach.unlocked ? (
                  <TouchableOpacity 
                    onPress={() => handleMint(ach.id)}
                    disabled={isBeamLoading}
                    className="bg-purple-600 px-4 py-2 rounded-xl"
                  >
                    {isBeamLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-xs font-bold">SECURE DEED</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text className="text-gray-600 text-[10px] font-bold">LOCKED</Text>
                )}
              </View>
              
              {ach.isMinted && (
                <View className="mt-3 pt-3 border-t border-amber-500/20">
                  <Text className="text-amber-400/60 text-[8px] font-mono">TX: {ach.txHash}</Text>
                </View>
              )}
            </View>
          ))}

          <View className="bg-blue-900/10 border border-blue-500/30 rounded-2xl p-4 mt-4">
            <Text className="text-blue-400 text-xs font-bold mb-1">📜 ALCHEMIST&apos;S NOTE</Text>
            <Text className="text-gray-400 text-xs leading-5">
              Your deeds are secured on the Beam network. They represent your growth as a Guardian of the Realm and can be showcased to the entire Kingdom.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};
