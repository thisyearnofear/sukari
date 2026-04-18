import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants/designSystem';
import { captureException } from '@/utils/errorMonitoring';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error, { componentStack: info.componentStack });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} accessible accessibilityRole="alert">
        <Text style={styles.emoji}>⚔️</Text>
        <Text style={styles.title}>
          {this.props.fallbackMessage ?? 'The Realm has encountered a disturbance'}
        </Text>
        <Text style={styles.detail}>{this.state.error?.message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.handleReset}
          accessibilityRole="button"
          accessibilityLabel="Return to safety. Double tap to retry."
        >
          <Text style={styles.buttonText}>⚡ Return to Safety</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_DARK,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[6],
  },
  emoji: { fontSize: 48, marginBottom: SPACING[4] },
  title: {
    ...TYPOGRAPHY.PRESETS.TITLE_SMALL,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  detail: {
    ...TYPOGRAPHY.PRESETS.BODY_SMALL,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    marginBottom: SPACING[6],
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING[6],
    paddingVertical: SPACING[3],
    borderRadius: 12,
  },
  buttonText: {
    ...TYPOGRAPHY.PRESETS.BUTTON,
    color: COLORS.TEXT_PRIMARY,
  },
});
