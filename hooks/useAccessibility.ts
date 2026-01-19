/**
 * ACCESSIBILITY HOOK - Provide semantic labels and support for screen readers
 * 
 * Usage in components:
 * ```
 * const { getAccessibilityLabel, getAccessibilityRole } = useAccessibility();
 * 
 * <TouchableOpacity
 *   accessible={true}
 *   accessibilityLabel={getAccessibilityLabel('food-card', { type: 'broccoli', action: 'swipeUp' })}
 *   accessibilityRole={getAccessibilityRole('button')}
 * >
 * ```
 */

/**
 * Generate semantic accessibility labels for common components
 */
export function useAccessibility() {
  /**
   * Build accessibility label for food cards
   */
  const getFoodCardLabel = (
    foodName: string,
    faction: 'ally' | 'enemy',
    direction?: 'up' | 'down' | 'left' | 'right',
  ): string => {
    const directionMap: Record<string, string> = {
      up: 'Swipe up to rally',
      down: 'Swipe down to banish',
      left: 'Swipe left to save for later',
      right: 'Swipe right to share',
    };

    const action = direction ? directionMap[direction] : 'Double tap to interact';
    const type = faction === 'ally' ? 'healthy ally' : 'enemy invader';

    return `${foodName}, ${type}. ${action}`;
  };

  /**
   * Build accessibility label for HUD elements
   */
  const getHUDLabel = (
    element: 'stability' | 'combo' | 'timer' | 'score',
    value: number,
  ): string => {
    const labels: Record<string, string> = {
      stability: `Stability meter at ${value} percent`,
      combo: `Combo counter at ${value}`,
      timer: `Time remaining: ${value} seconds`,
      score: `Current score: ${value} points`,
    };
    return labels[element] || '';
  };

  /**
   * Build accessibility label for buttons
   */
  const getButtonLabel = (
    buttonType: 'exercise' | 'rations' | 'pause' | 'resume' | 'exit' | 'restart',
    hasCharges?: number,
  ): string => {
    const labels: Record<string, string> = {
      exercise: `Exercise button${hasCharges ? ` - ${hasCharges} charges remaining` : ''}. Double tap to call an exercise action to lower blood sugar`,
      rations: `Emergency rations button${hasCharges ? ` - ${hasCharges} charges remaining` : ''}. Double tap to consume emergency rations to raise blood sugar`,
      pause: 'Pause button. Double tap to pause the game',
      resume: 'Resume button. Double tap to resume the game',
      exit: 'Exit button. Double tap to return to main menu',
      restart: 'Restart button. Double tap to start a new game',
    };
    return labels[buttonType] || '';
  };

  /**
   * Build accessibility label for meters/progress
   */
  const getMeterLabel = (
    meterType: 'energy' | 'hydration' | 'nutrition' | 'stability',
    value: number,
    status?: 'optimal' | 'good' | 'warning' | 'critical',
  ): string => {
    const statusMap: Record<string, string> = {
      optimal: 'optimal',
      good: 'good',
      warning: 'warning',
      critical: 'critical',
    };

    const statusLabel = status ? `, ${statusMap[status]} status` : '';
    return `${meterType} meter at ${value} percent${statusLabel}`;
  };

  /**
   * Build accessibility label for game results
   */
  const getResultsLabel = (
    result: 'victory' | 'defeat',
    score: number,
    grade: string,
  ): string => {
    const resultText = result === 'victory' ? 'You won' : 'Game over';
    return `${resultText}. Score: ${score} points. Grade: ${grade}`;
  };

  /**
   * Get accessibility role for UI elements
   */
  const getAccessibilityRole = (
    role: 'button' | 'header' | 'text' | 'image' | 'list' | 'listitem' | 'none',
  ) => {
    return role;
  };

  /**
   * Get accessibility hint for guidance
   */
  const getAccessibilityHint = (
    elementType: 'swipe' | 'tap' | 'meter' | 'modal' | 'list',
  ): string => {
    const hints: Record<string, string> = {
      swipe: 'Swipe left or right, up or down to interact',
      tap: 'Double tap to activate',
      meter: 'Shows current status. Read as percentage and status',
      modal: 'Modal dialog displayed. Press back to close',
      list: 'List of items. Swipe through to browse',
    };
    return hints[elementType] || '';
  };

  /**
   * Build comprehensive accessibility configuration for a component
   */
  const getAccessibilityConfig = (
    componentType: string,
    props: Record<string, any>,
  ) => {
    let config: {
      accessible: boolean;
      accessibilityLabel: string;
      accessibilityRole: any;
      accessibilityHint: string;
    } = {
      accessible: true,
      accessibilityLabel: '',
      accessibilityRole: 'none',
      accessibilityHint: '',
    };

    switch (componentType) {
      case 'foodCard':
        config.accessibilityLabel = getFoodCardLabel(
          props.foodName || 'food',
          props.faction || 'ally',
          props.direction,
        );
        config.accessibilityRole = 'button';
        config.accessibilityHint = getAccessibilityHint('swipe');
        break;

      case 'button':
        config.accessibilityLabel = getButtonLabel(props.buttonType, props.chargesRemaining);
        config.accessibilityRole = 'button';
        config.accessibilityHint = getAccessibilityHint('tap');
        break;

      case 'meter':
        config.accessibilityLabel = getMeterLabel(
          props.meterType,
          props.value,
          props.status,
        );
        config.accessibilityRole = 'image'; // Treat meter as informational image
        break;

      case 'results':
        config.accessibilityLabel = getResultsLabel(
          props.result,
          props.score,
          props.grade,
        );
        config.accessibilityRole = 'text';
        break;

      case 'heading':
        config.accessibilityRole = 'header';
        config.accessibilityLabel = props.text;
        break;
    }

    return config;
  };

  return {
    getFoodCardLabel,
    getHUDLabel,
    getButtonLabel,
    getMeterLabel,
    getResultsLabel,
    getAccessibilityRole,
    getAccessibilityHint,
    getAccessibilityConfig,
  };
}
