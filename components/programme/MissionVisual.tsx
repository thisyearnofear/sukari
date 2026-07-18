import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Coffee, Footprints, HandHeart, MoonStar, Salad, Sparkles } from 'lucide-react-native';
import {
  type MissionMediaBrief,
  type PersonalisedWorldState,
  worldSceneLabel,
} from '@/domain/agent';
import { fetchMissionMedia } from '@/domain/media';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

interface MissionVisualProps {
  brief: MissionMediaBrief;
  worldState?: PersonalisedWorldState | null;
  /** Only request generated media after a patient asks for supporting context. */
  requestPersonalisation?: boolean;
}

const visualCopy: Record<MissionMediaBrief['visualIntent'], string> = {
  meal: 'One considered meal choice',
  movement: 'A short walk after eating',
  drink: 'A calmer drink choice',
  evening: 'A lighter evening routine',
  support: 'A supportive check-in',
};

function VisualGlyph({ intent }: { intent: MissionMediaBrief['visualIntent'] }) {
  const color = P.accent;
  const size = 34;
  if (intent === 'movement') return <Footprints size={size} color={color} strokeWidth={1.6} />;
  if (intent === 'drink') return <Coffee size={size} color={color} strokeWidth={1.6} />;
  if (intent === 'evening') return <MoonStar size={size} color={color} strokeWidth={1.6} />;
  if (intent === 'support') return <HandHeart size={size} color={color} strokeWidth={1.6} />;
  return <Salad size={size} color={color} strokeWidth={1.6} />;
}

export function MissionVisual({ brief, worldState, requestPersonalisation = false }: MissionVisualProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!requestPersonalisation || imageUrl) return;
    let current = true;
    fetchMissionMedia(brief).then((response) => {
      if (current && response?.imageUrl) setImageUrl(response.imageUrl);
    });
    return () => {
      current = false;
    };
  }, [brief, imageUrl, requestPersonalisation]);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessibilityLabel={`Personalised visual cue: ${worldState ? worldSceneLabel(worldState.scene) : visualCopy[brief.visualIntent]}`}
        style={styles.image}
      />
    );
  }

  return (
    <View style={styles.fallback} accessible accessibilityLabel={visualCopy[brief.visualIntent]}>
      <View style={styles.glyphCircle}>
        <VisualGlyph intent={brief.visualIntent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>TODAY&apos;S CUE</Text>
        <Text style={styles.description}>
          {worldState ? worldSceneLabel(worldState.scene) : visualCopy[brief.visualIntent]}
        </Text>
      </View>
      {requestPersonalisation ? <Sparkles size={16} color={P.cool} strokeWidth={1.7} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 132,
    width: '100%',
    borderRadius: 4,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  fallback: {
    minHeight: 82,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: P.line,
    backgroundColor: P.accentSoft,
  },
  glyphCircle: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: P.accent,
  },
  copy: { flex: 1 },
  label: {
    color: P.accent,
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  description: {
    color: P.text,
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 3,
  },
});
