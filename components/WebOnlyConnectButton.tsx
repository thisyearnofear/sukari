import React from 'react';

/**
 * Web-Wallet Connect Button (Cross-Platform)
 * 
 * Renders nothing - wallet connection is handled in MainMenu
 * Preserved for potential future use of RainbowKit or other wallet features
 * 
 * Migration: Consolidated from .web.tsx and .native.tsx (identical implementations)
 */
const WebOnlyConnectButton: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default WebOnlyConnectButton;
