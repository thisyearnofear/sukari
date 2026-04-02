import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { KINGDOM_LORE } from '@/constants/gameConfig';

interface GrandLibraryProps {
  discoveredLoreIds: string[];
  onClose: () => void;
}

export const GrandLibrary: React.FC<GrandLibraryProps> = ({ discoveredLoreIds, onClose }) => {
  const [showAncientScrolls, setShowAncientScrolls] = React.useState(false);

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      zIndex: 1000,
      padding: 20,
      paddingTop: 60,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <View>
          <Text style={{ color: '#fbbf24', fontSize: 24, fontWeight: 'bold' }}>📜 THE GRAND LIBRARY</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>Uncover the secrets of the Realm\'s Harmony</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
          <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Discovery Progress */}
      <View style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.3)', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>LORE DISCOVERED</Text>
          <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: 'bold' }}>{discoveredLoreIds.length} / {KINGDOM_LORE.length}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${(discoveredLoreIds.length / KINGDOM_LORE.length) * 100}%`, backgroundColor: '#fbbf24' }} />
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <TouchableOpacity 
          onPress={() => setShowAncientScrolls(false)}
          style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 21, backgroundColor: !showAncientScrolls ? 'rgba(251, 191, 36, 0.2)' : 'transparent' }}
        >
          <Text style={{ color: !showAncientScrolls ? '#fbbf24' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>COMMON LORE</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowAncientScrolls(true)}
          style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 21, backgroundColor: showAncientScrolls ? 'rgba(59, 130, 246, 0.2)' : 'transparent' }}
        >
          <Text style={{ color: showAncientScrolls ? '#60a5fa' : '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>ANCIENT SCROLLS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {KINGDOM_LORE.map((lore) => {
          const isUnlocked = discoveredLoreIds.includes(lore.id);

          return (
            <View key={lore.id} style={{
              backgroundColor: isUnlocked ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.4)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: isUnlocked ? (showAncientScrolls ? '#3b82f6' : '#fbbf24') : 'rgba(255,255,255,0.05)',
              opacity: isUnlocked ? 1 : 0.6,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 48, height: 48, backgroundColor: isUnlocked ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ fontSize: 24 }}>{isUnlocked ? lore.emoji : '❓'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isUnlocked ? '#fff' : '#475569', fontSize: 16, fontWeight: 'bold' }}>
                    {isUnlocked ? lore.fact.split(':')[0] : 'Locked Secret'}
                  </Text>
                  {isUnlocked && (
                    <Text style={{ color: showAncientScrolls ? '#60a5fa' : '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                      {showAncientScrolls ? 'FORGOTTEN WISDOM' : 'COMMON LORE'}
                    </Text>
                  )}
                </View>
              </View>

              {isUnlocked ? (
                <>
                  <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                    {showAncientScrolls ? getMedicalContext(lore.id) : lore.fact.split(':')[1]?.trim() || lore.fact}
                  </Text>
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10 }}>
                    <Text style={{ color: showAncientScrolls ? '#93c5fd' : '#fde68a', fontSize: 12, fontWeight: '600' }}>
                      💡 {showAncientScrolls ? 'SCRIBE\'S NOTE' : 'ALCHEMIST\'S TIP'}
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                      {showAncientScrolls ? getClinicalTip(lore.id) : lore.tip}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
                  Complete challenges to unlock this secret...
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Helper to provide deeper medical context for parents
function getMedicalContext(id: string): string {
  const contexts: Record<string, string> = {
    brain: "The brain is strictly glucose-dependent. Unlike muscles, it cannot store glucose and requires a continuous supply from the blood to function optimally.",
    exercise: "Physical activity increases insulin sensitivity, allowing your muscle cells to use any available insulin to take up glucose during and after activity.",
    fiber: "Soluble fiber slows the absorption of sugar and helps improve blood sugar levels. A diet high in fiber can also reduce the risk of type 2 diabetes.",
    sleep: "Sleep deprivation can lead to higher blood sugar levels and increased insulin resistance. It also affects hormones that control hunger.",
    hydration: "When blood sugar levels are high, the kidneys try to remove excess sugar through urine, leading to dehydration if fluids aren't replaced.",
    breakfast: "A high-protein breakfast helps stabilize postprandial (after-meal) glucose levels and can reduce glycemic variability throughout the day.",
  };
  return contexts[id] || "Medical information for this topic.";
}

function getClinicalTip(id: string): string {
  const tips: Record<string, string> = {
    brain: "Consistent glucose levels prevent 'brain fog' and support cognitive development in children.",
    exercise: "Always check glucose levels before and after exercise to understand your personal response to activity.",
    fiber: "Aim for 25-35g of fiber daily. Start meals with non-starchy vegetables to create a 'fiber filter'.",
    sleep: "Maintain a consistent sleep schedule. Poor sleep can mimic the effects of a high-carb meal on insulin resistance.",
    hydration: "Water is the best choice. Avoid sugary drinks which cause rapid spikes and further dehydration.",
    breakfast: "Combining protein with complex carbohydrates in the morning creates a steady energy release curve.",
  };
  return tips[id] || "Consult with your healthcare provider for personalized advice.";
}
