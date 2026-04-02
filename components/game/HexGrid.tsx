import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect, G, Use, ClipPath } from 'react-native-svg';

interface HexGridProps {
  width: number;
  height: number;
  pathData: string;
  bridgeTransforms: string[];
  particles: { id: string; position: number; color: string; glow: string }[];
}

export const HexGrid: React.FC<HexGridProps> = ({
  width,
  height,
  pathData,
  bridgeTransforms,
  particles,
}) => {
  return (
    <View style={{ width, height, backgroundColor: '#1a1a2e' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Clip path for hexagon bridges */}
        <Defs>
          <ClipPath id="clip">
            <Rect x="-6" y="-6" width="12" height="12" />
          </ClipPath>
          <Rect
            id="br"
            x="-4.35"
            y="-7.5"
            width="8.7"
            height="15"
            clipPath="url(#clip)"
          />
          
          {/* Hexagon pattern */}
          <Pattern
            id="waben"
            width="69.2"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M43.25 15.029 56.2 22.506V37.494L43.25 44.971 30.3 37.494V22.506ZM13-9H4.3V7.494L-9.969 15.733l4.35 7.534L8.65 15.029 21.6 22.506V37.494L8.65 44.971-5.619 36.733l-4.35 7.534L4.3 52.506V69H13V52.506l12.95-7.477L38.9 52.506V69h8.7V52.506l12.95-7.477 14.269 8.238 4.35-7.534L64.9 37.494V22.506l14.269-8.239-4.35-7.534L60.55 14.971 47.6 7.494V-9H38.9V7.494L25.95 14.971 13 7.494Z"
              fill="#0f3460"
              stroke="#16213e"
              strokeWidth="0.5"
            />
          </Pattern>
        </Defs>

        {/* Background hexagon pattern */}
        <Rect width={width} height={height} fill="url(#waben)" />

        {/* Blood vessel path */}
        <G id="container">
          <Path
            d={pathData}
            fill="none"
            stroke="#e94560"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="10 10"
            strokeDashoffset="0"
          />
        </G>

        {/* Hexagon bridges/nodes */}
        <G id="bridges">
          {bridgeTransforms.map((transform, i) => (
            <Use
              key={i}
              href="#br"
              transform={transform}
              fill="#533483"
              stroke="#e94560"
              strokeWidth="1"
            />
          ))}
        </G>

        {/* Glucose particles */}
        {particles.map((particle) => {
          // Calculate position along path - simplified for now
          const progress = particle.position;
          const x = width / 2 + Math.cos(progress * Math.PI * 2) * 100;
          const y = height / 2 + Math.sin(progress * Math.PI * 2) * 100;
          
          return (
            <G key={particle.id}>
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={particle.color}
                opacity="0.9"
              />
              <circle
                cx={x}
                cy={y}
                r="12"
                fill={particle.glow}
                opacity="0.3"
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};
