# Archived: VRF Integration Guide

This is historical prototype material from the GlucoseWars blockchain/fairness era. It is not active Sukari product direction.

---

# VRF Integration Guide

This document outlines how to connect the mocked VRF (Verifiable Random Function) implementation to real Scroll blockchain services.

## Current Status

The VRF system in GlucoseWars is currently using a **mocked implementation** that simulates VRF functionality. It's designed to be easily swapped with a real Scroll VRF integration when deployed on the blockchain.

## Files to Update

### 1. hooks/useVRFService.ts
This is the main VRF service hook with the mocked implementation.

### 2. Components Using VRF
- `hooks/useBattleGame.ts` - Contains the game logic that uses VRF
- `components/FairnessDashboard.tsx` - Shows fairness metrics
- `components/FairnessBadge.tsx` - Displays verification status

## Real Scroll VRF Integration Steps

### Step 1: Install Scroll SDK
```bash
npm install @scroll-tech/sdk
# or
npm install @chainlink/contracts
```

### Step 2: Deploy VRF Consumer Contract
Deploy a VRF consumer contract on Scroll that will:
- Request randomness from Scroll's VRF coordinator
- Handle the callback when random values are fulfilled
- Store proofs for verification

Example contract structure:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract GlucoseWarsVRFConsumer is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID assigned by Chainlink
    uint64 s_subscriptionId;
    
    // Hash of the key for randomness
    bytes32 s_keyHash;
    
    // Callback gas limit
    uint32 s_callbackGasLimit = 100000;
    
    // Request count for tracking
    uint256 s_requestCount;

    struct RequestStatus {
        bool fulfilled;
        bool exists;
        uint256[] randomWords;
    }
    mapping(uint256 => RequestStatus) public s_requests;

    event RequestSent(uint256 indexed requestId);
    event RequestFulfilled(uint256 indexed requestId, uint256[] randomWords);

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        s_keyHash = keyHash;
    }

    function requestRandomWords() external returns (uint256 requestId) {
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            3, // minimumRequestConfirmations
            s_callbackGasLimit,
            1 // numWords
        );
        s_requests[requestId] = RequestStatus({
            randomWords: new uint256[](0),
            exists: true,
            fulfilled: false
        });
        s_requestCount++;
        emit RequestSent(requestId);
        return requestId;
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        require(s_requests[requestId].exists, "request not found");
        s_requests[requestId].fulfilled = true;
        s_requests[requestId].randomWords = randomWords;
        emit RequestFulfilled(requestId, randomWords);
        
        // Process the randomness to generate plot twists
        processRandomness(requestId, randomWords);
    }
    
    function processRandomness(uint256 requestId, uint256[] memory randomWords) internal {
        // Your logic to turn random words into plot twists
        // This is where you'd generate the actual fair plot twists
    }
}
```

### Step 3: Update useVRFService.ts
Replace the mocked functions with real blockchain calls:

```typescript
// In useVRFService.ts, replace the mock implementations:

const requestRandomness = useCallback(async (seed: string): Promise<VRFResult> => {
  // Convert seed to bytes32 for smart contract
  const seedBytes = ethers.utils.formatBytes32String(seed);
  
  // Call the smart contract to request randomness
  const tx = await vrfConsumerContract.requestRandomWords();
  const receipt = await tx.wait();
  
  // Extract request ID from event
  const requestId = receipt.events?.find(e => e.event === 'RequestSent')?.args?.requestId;
  
  // Wait for the fulfillment event
  return new Promise((resolve, reject) => {
    const listener = (fulfilledRequestId: any, randomWords: any[]) => {
      if (fulfilledRequestId === requestId) {
        // Verify the randomness is for our request
        const randomValue = randomWords[0].toNumber();
        
        // Generate cryptographic proof
        const proof = generateProof(requestId, randomValue, seed);
        
        vrfConsumerContract.off('RequestFulfilled', listener);
        
        resolve({
          randomValue,
          proof,
          seed,
        });
      }
    };
    
    vrfConsumerContract.on('RequestFulfilled', listener);
    
    // Timeout after 5 minutes if no fulfillment
    setTimeout(() => {
      vrfConsumerContract.off('RequestFulfilled', listener);
      reject(new Error('VRF request timed out'));
    }, 5 * 60 * 1000);
  });
}, []);

const verifyVRFProof = useCallback(async (proof: string, seed: string): Promise<boolean> => {
  // Call the smart contract to verify the proof
  return await vrfVerifierContract.isValidProof(proof, seed);
}, []);
```

### Step 4: Set up Scroll Infra
1. Fund a wallet with ETH on Scroll Sepolia
2. Create a Chainlink VRF subscription
3. Deploy the consumer contract
4. Configure the contract addresses and keys

### Step 5: Environment Variables
Add to `.env`:
```env
REACT_APP_SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
REACT_APP_VRF_CONSUMER_CONTRACT=0x...
REACT_APP_VRF_VERIFIER_CONTRACT=0x...
REACT_APP_VRF_SUBSCRIPTION_ID=123
REACT_APP_VRF_KEY_HASH=0x...
```

### Step 6: Update Contract Interactions
In your main game logic, ensure the contract interactions are properly handled:

```typescript
// Example of how to use real VRF in game
const triggerFairPlotTwist = async () => {
  try {
    // Enable real VRF if user has blockchain connection
    const hasWalletConnection = await checkWalletConnection();
    if (hasWalletConnection) {
      // Use real VRF
      const result = await generateFairPlotTwist(gameId, Date.now());
      // Process the result
      return result;
    } else {
      // Fallback to client-side randomness
      return fallbackPlotTwist();
    }
  } catch (error) {
    console.error('VRF error, falling back to client randomness:', error);
    return fallbackPlotTwist();
  }
};
```

### Step 7: Testing
1. Deploy contracts to Scroll Sepolia
2. Test VRF request and fulfillment cycles
3. Verify that the randomness is properly integrated into plot twist selection
4. Ensure fallback mechanisms work when blockchain is unavailable

## Security Considerations

1. **Proper Access Control**: Ensure only authorized functions can trigger VRF requests
2. **Gas Optimization**: VRF requests cost gas; optimize the contract to minimize costs
3. **Reentrancy Protection**: Protect against reentrancy attacks in callback handlers
4. **Proof Verification**: Implement proper cryptographic proof verification
5. **Timeout Handling**: Handle cases where VRF requests are not fulfilled

## Performance Optimizations

1. **Batch Requests**: Batch multiple VRF requests to reduce contract calls
2. **Local Caching**: Cache recent randomness results for quick access
3. **Connection State Management**: Efficiently handle online/offline states
4. **Fallback Strategies**: Maintain smooth gameplay even when blockchain is temporarily unavailable

## Integration Checklist

- [ ] Smart contracts deployed and verified
- [ ] Wallet connection integration
- [ ] Real VRF functions replacing mocks
- [ ] Proper error handling and fallbacks
- [ ] Security audits performed
- [ ] Performance testing completed
- [ ] User experience validation
