import React from 'react';
import { Web3Provider } from '@/context/Web3Context';
import { BeamProvider } from '@/context/BeamContext';

/**
 * Web3 & Beam Provider Wrapper (Cross-Platform)
 * 
 * Wraps application with Web3 and Beam context for blockchain and account abstraction integration
 * Uses same context implementation for web and native platforms
 * 
 * Migration: Consolidated from .web.tsx and .native.tsx (identical implementations)
 * Enhancement: Added BeamProvider for frictionless onboarding and game sessions.
 */
const WebProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Web3Provider>
      <BeamProvider>
        {children}
      </BeamProvider>
    </Web3Provider>
  );
};

export default WebProviders;
