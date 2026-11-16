import { VITALS_SERVICE_URL, type VitalsProvider } from './types';
import { createWsVitalsProvider } from './wsProvider';
import { createSimulatedVitalsProvider } from './simulatedProvider';

export * from './types';
export { createWsVitalsProvider, createSimulatedVitalsProvider };

/**
 * Pick the provider for this run. `EXPO_PUBLIC_VITALS_SIMULATED=1` forces
 * the simulated provider; otherwise the local SmartSpectra service.
 */
export function createVitalsProvider(): VitalsProvider {
  if (process.env.EXPO_PUBLIC_VITALS_SIMULATED === '1') {
    return createSimulatedVitalsProvider();
  }
  return createWsVitalsProvider(VITALS_SERVICE_URL);
}
