/**
 * Closed-loop phase strip — detect → mission → rehearse → act → measure → adapt
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/constants/designSystem';

const P = COLORS.PROGRAMME;

export interface LoopStep {
  key: string;
  title: string;
  done: boolean;
  active: boolean;
}

interface LoopStripProps {
  steps: LoopStep[];
}

export function LoopStrip({ steps }: LoopStripProps) {
  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text style={styles.eyebrow}>Adherence loop</Text>
      <View style={styles.row}>
        {steps.map((step, i) => (
          <View key={step.key} style={styles.stepWrap}>
            <View
              style={[
                styles.dot,
                step.done && styles.dotDone,
                step.active && styles.dotActive,
              ]}
            />
            <Text
              style={[
                styles.label,
                step.active && styles.labelActive,
                step.done && styles.labelDone,
              ]}
              numberOfLines={2}
            >
              {step.title}
            </Text>
            {i < steps.length - 1 ? <View style={styles.connector} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: FONTS.bodyMedium,
    color: P.textMuted,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: P.line,
    marginBottom: 6,
  },
  dotDone: {
    backgroundColor: 'rgba(61, 155, 122, 0.6)',
  },
  dotActive: {
    backgroundColor: P.accent,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  label: {
    fontFamily: FONTS.body,
    color: P.textMuted,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  labelActive: {
    color: P.text,
    fontFamily: FONTS.bodyMedium,
  },
  labelDone: {
    color: P.textSoft,
  },
  connector: {
    position: 'absolute',
    top: 4,
    left: '58%',
    right: '-42%',
    height: 1,
    backgroundColor: P.line,
    zIndex: -1,
  },
});
