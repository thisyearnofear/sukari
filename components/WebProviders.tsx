import React from 'react';
import { Web3Provider } from '@/context/Web3Context';

/**
 * Web3 Provider Wrapper (Cross-Platform)
 * 
 * Wraps application with Web3 context for blockchain integration
 * Uses same context implementation for web and native platforms
 * 
 * Migration: Consolidated from .web.tsx and .native.tsx (identical implementations)
 */
const WebProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Web3Provider>{children}</Web3Provider>;
};

export default WebProviders;
