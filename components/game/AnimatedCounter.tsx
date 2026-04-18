/**
 * AnimatedCounter — Rolls up/down to target value over duration.
 * Used for score display to make every point feel earned.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, Animated } from 'react-native';

interface Props {
  value: number;
  duration?: number;
  style?: TextStyle;
  formatter?: (n: number) => string;
}

export const AnimatedCounter: React.FC<Props> = ({ value, duration = 300, style, formatter }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) return;

    const diff = to - from;
    const steps = Math.min(Math.abs(diff), 20);
    const stepDuration = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplay(Math.round(from + diff * progress));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(to);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <Text style={style}>{formatter ? formatter(display) : display.toLocaleString()}</Text>;
};
