/**
 * Scroll Smart Contract Interface
 * Deployed on Scroll Sepolia testnet
 * Handles privacy-controlled achievement NFT minting and fair verification
 * Uses Anyrand VRF for verifiable randomness on Scroll
 *
 * DEPLOYMENT INFORMATION:
 *
 * GlucoseWarsAchievements Contract:
 * - Address: 0xf36223131aDA53e94B08F0c098A6A93424D68EE3
 * - Network: Scroll Sepolia (Chain ID: 534351)
 * - Explorer: https://sepolia-blockscout.scroll.io/address/0xf36223131aDA53e94B08F0c098A6A93424D68EE3
 *
 * Anyrand VRF Contract:
 * - Address: 0x5d8570e6d734184357f3969b23050d64913be681
 * - Purpose: Verifiable Random Function for fair achievement minting
 *
 * Last Updated: 2025-12-12
 */

export const SCROLL_CONFIG = {
  CHAIN_ID: 534351, // Scroll Sepolia testnet
  RPC_URL: 'https://sepolia-rpc.scroll.io',
  EXPLORER_URL: 'https://sepolia-blockscout.scroll.io',
  // Deployed GlucoseWarsAchievements contract address on Scroll Sepolia
  CONTRACT_ADDRESS: '0xf36223131aDA53e94B08F0c098A6A93424D68EE3',
  // Anyrand VRF contract address on Scroll Sepolia
  ANYRAND_CONTRACT: '0x5d8570e6d734184357f3969b23050d64913be681',
};

/**
 * Enhanced Solidity contract for privacy-aware, fair achievement minting
 * Uses Anyrand VRF integration for provably fair random events on Scroll
 * Deploy to Scroll Sepolia before production
 */
export const CONTRACT_SOURCE = `
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRandomiserCallbackV3.sol";
import "./interfaces/IAnyrand.sol";

contract GlucoseWarsAchievements is ERC721, Ownable, IRandomiserCallbackV3 {
  // Anyrand VRF Configuration for Scroll
  address private immutable anyrandContract;
  uint256 private constant CALLBACK_GAS_LIMIT = 750000; // Max 750k gas allowed
  uint256 private constant MAX_DEADLINE_DELTA = 30; // 30 seconds max deadline

  // Token counter for new NFTs
  uint256 private _tokenIdCounter;

  // Privacy and Achievement mappings
  mapping(address => mapping(string => uint256[])) public playerAchievementsByCategory; // player -> privacyMode -> achievements
  mapping(uint256 => string) public achievementURIs;
  mapping(uint256 => uint256) public achievementRandomness; // Random value for fair events
  mapping(uint256 => bool) public achievementVerified; // Whether achievement passed fairness verification

  // Privacy settings for each achievements
  mapping(uint256 => string) public achievementPrivacy; // 'public' | 'private' | 'healthcare_only'

  // Stats tracking
  mapping(address => uint256) public totalPlayerAchievements;
  mapping(address => uint256) public privateAchievementsCount;
  mapping(address => uint256) public publicAchievementsCount;

  // Track randomness requests
  mapping(uint256 => uint256) public requestToTokenId; // Map Anyrand request ID to NFT tokenId
  mapping(address => uint256[]) public playerPendingRequests; // Track pending requests per player

  event AchievementMinted(address indexed player, uint256 indexed tokenId, uint256 achievementId);
  event AchievementPrivacyUpdated(uint256 indexed tokenId, string newPrivacy);
  event RandomnessReceived(uint256 indexed tokenId, uint256 randomness);
  event FairnessVerified(uint256 indexed tokenId, uint256 randomness);
  event RandomnessRequested(uint256 indexed requestId, uint256 indexed tokenId, address indexed player);

  constructor(address _anyrandContract) 
    ERC721("Glucose Wars Achievements", "GWA")
  {
    anyrandContract = _anyrandContract;
  }

  /**
   * Main function to mint privacy-controlled achievements
   * Can be called with or without VRF verification
   */
  function mintAchievement(
    address player,
    uint256 achievementId,
    string memory tokenURI,
    string memory privacyMode // 'public' | 'private' | 'healthcare_only'
  ) external onlyOwner returns (uint256) {
    uint256 tokenId = _getNextTokenId();
    _safeMint(player, tokenId);
    achievementURIs[tokenId] = tokenURI;
    achievementPrivacy[tokenId] = privacyMode;
    
    // Add to appropriate privacy category
    playerAchievementsByCategory[player][privacyMode].push(tokenId);

    // Update stats
    totalPlayerAchievements[player]++;
    if (keccak256(bytes(privacyMode)) == keccak256("private")) {
      privateAchievementsCount[player]++;
    } else {
      publicAchievementsCount[player]++;
    }

    emit AchievementMinted(player, tokenId, achievementId);
    return tokenId;
  }

  /**
   * Mint achievement with Anyrand VRF verification for fair events
   * Use this for plot twist victories, rare events, etc.
   */
  function mintFairAchievement(
    address player,
    uint256 achievementId,
    string memory tokenURI,
    string memory privacyMode
  ) external onlyOwner returns (uint256 requestId) {
    // First mint the achievement NFT with placeholder status
    uint256 tokenId = _getNextTokenId();
    _safeMint(player, tokenId);
    achievementURIs[tokenId] = tokenURI;
    achievementPrivacy[tokenId] = privacyMode;
    achievementVerified[tokenId] = false; // AWaiting randomness
    
    // Add to appropriate privacy category
    playerAchievementsByCategory[player][privacyMode].push(tokenId);

    // Update stats
    totalPlayerAchievements[player]++;
    if (keccak256(bytes(privacyMode)) == keccak256("private")) {
      privateAchievementsCount[player]++;
    } else {
      publicAchievementsCount[player]++;
    }

    // Calculate the deadline (timestamp when randomness should be fulfilled)
    uint256 deadline = block.timestamp + MAX_DEADLINE_DELTA;

    // Get the price for the request
    (uint256 requestPrice, ) = IAnyrand(anyrandContract).getRequestPrice(CALLBACK_GAS_LIMIT);

    // Request randomness from Anyrand
    requestId = IAnyrand(anyrandContract).requestRandomness{value: requestPrice}(
      deadline,
      CALLBACK_GAS_LIMIT
    );

    // Map the request ID to our achievement token ID
    requestToTokenId[requestId] = tokenId;

    // Track pending requests for this player
    playerPendingRequests[player].push(requestId);

    emit AchievementMinted(player, tokenId, achievementId);
    emit RandomnessRequested(requestId, tokenId, player);
  }

  /**
   * Receive randomness from Anyrand VRF (implementing IRandomiserCallbackV3 interface)
   */
  function receiveRandomness(uint256 requestId, uint256 randomWord) external override {
    require(msg.sender == anyrandContract, "Only Anyrand can call this function");
    
    // Get the associated token ID for this request
    uint256 tokenId = requestToTokenId[requestId];
    require(tokenId != 0, "Invalid request ID"); // Note: Token IDs start from 1, so 0 means invalid
    
    // Associate the randomness with the achievement
    achievementRandomness[tokenId] = randomWord;
    achievementVerified[tokenId] = true;

    emit RandomnessReceived(tokenId, randomWord);
    emit FairnessVerified(tokenId, randomWord);
  }

  /**
   * Update privacy setting for an achievement
   */
  function updateAchievementPrivacy(uint256 tokenId, string memory newPrivacy) external {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    
    achievementPrivacy[tokenId] = newPrivacy;
    emit AchievementPrivacyUpdated(tokenId, newPrivacy);
  }

  /**
   * Get achievements by privacy mode for a player
   */
  function getPlayerAchievements(
    address player,
    string memory privacyMode
  ) external view returns (uint256[] memory) {
    return playerAchievementsByCategory[player][privacyMode];
  }

  /**
   * Get all player achievements with privacy filtering
   */
  function getPlayerAchievementsWithPrivacy(
    address player,
    string memory privacyMode
  ) external view returns (uint256[] memory, string[] memory) {
    uint256[] memory tokenIds = playerAchievementsByCategory[player][privacyMode];
    string[] memory uris = new string[](tokenIds.length);
    
    for (uint256 i = 0; i < tokenIds.length; i++) {
      uris[i] = achievementURIs[tokenIds[i]];
    }
    
    return (tokenIds, uris);
  }

  /**
   * Get public achievements for display to other players
   */
  function getPublicAchievements(address player) external view returns (uint256[] memory) {
    return playerAchievementsByCategory[player]["public"];
  }

  /**
   * Get pending requests for a player
   */
  function getPlayerPendingRequests(address player) external view returns (uint256[] memory) {
    return playerPendingRequests[player];
  }

  /**
   * Get state of a randomness request
   */
  function getRequestState(uint256 requestId) external view returns (IAnyrand.RequestState) {
    return IAnyrand(anyrandContract).getRequestState(requestId);
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    return achievementURIs[tokenId];
  }

  /**
   * Check if an achievement has passed fairness verification
   */
  function isAchievementVerified(uint256 tokenId) external view returns (bool) {
    return achievementVerified[tokenId];
  }

  /**
   * Get randomness value for an achievement
   */
  function getAchievementRandomness(uint256 tokenId) external view returns (uint256) {
    return achievementRandomness[tokenId];
  }

  /**
   * Internal function to get next token ID
   */
  function _getNextTokenId() private returns (uint256) {
    return _tokenIdCounter++;
  }
}
`;

/**
 * Anyrand interfaces needed for Scroll integration
 */
export const ANYRAND_INTERFACES = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRandomiserCallbackV3 {
    /// @notice Receive random words from a randomiser.
    /// @dev Ensure that proper access control is enforced on this function;
    ///     only the designated randomiser may call this function and the
    ///     requestId should be as expected from the randomness request.
    /// @param requestId The identifier for the original randomness request
    /// @param randomWord Uniform random number in the range [0, 2**256)
    function receiveRandomness(uint256 requestId, uint256 randomWord) external;
}

interface IAnyrand {
    /// @notice State of a request
    enum RequestState {
        /// @notice The request does not exist
        Nonexistent,
        /// @notice A request has been made, waiting for fulfilment
        Pending,
        /// @notice The request has been fulfilled successfully
        Fulfilled,
        /// @notice The request was fulfilled, but the callback failed
        Failed
    }

    /// @notice Compute the total request price
    /// @param callbackGasLimit The callback gas limit that will be used for
    ///     the randomness request
    function getRequestPrice(
        uint256 callbackGasLimit
    ) external view returns (uint256 totalPrice, uint256 effectiveFeePerGas);

    /// @notice Request randomness
    /// @param deadline Timestamp of when the randomness should be fulfilled. A
    ///     beacon round closest to this timestamp (rounding up to the nearest
    ///     future round) will be used as the round from which to derive
    ///     randomness.
    /// @param callbackGasLimit Gas limit for callback
    function requestRandomness(
        uint256 deadline,
        uint256 callbackGasLimit
    ) external payable returns (uint256);

    /// @notice Get the state of a request
    /// @param requestId The request identifier
    function getRequestState(
        uint256 requestId
    ) external view returns (RequestState);
}
`;

/**
 * Achievement metadata for NFT minting
 * Set EXPO_PUBLIC_NFT_METADATA_BASE_URI to your IPFS/Arweave gateway.
 */
const NFT_BASE_URI = process.env.EXPO_PUBLIC_NFT_METADATA_BASE_URI || 'https://glucosewars.app/metadata';

export const ACHIEVEMENT_METADATA = {
  victory_classic: {
    name: 'Harmony Master',
    description: 'Maintained the Kingdom\'s Harmony - proof of tactical glucose mastery',
    image: `${NFT_BASE_URI}/harmony_master.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Common' },
      { trait_type: 'Category', value: 'Deed' },
      { trait_type: 'Points', value: '100' },
      { trait_type: 'Lore Value', value: 'Basic Harmony maintenance' },
    ],
    educationalContent: {
      title: 'Foundations of the Kingdom\'s Harmony',
      summary: 'You\'ve mastered the basics of identifying and responding to different food tribes.',
      keyLessons: [
        'Recognizing the Sugar Horde and their impact on Harmony',
        'Understanding the difference between the Green Aegis and the Horde',
        'Building quick tactical skills for Kingdom protection'
      ],
      resources: [
        'https://diabetes.org/healthy-living/recipes-nutrition/understanding-carbs',
        'https://www.cdc.gov/diabetes/managing/eat-well.html'
      ]
    }
  },
  victory_life: {
    name: 'Realm Guardian',
    description: 'Guarded the Realm through a full cycle - advanced health stewardship',
    image: `${NFT_BASE_URI}/realm_guardian.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Category', value: 'Deed' },
      { trait_type: 'Points', value: '250' },
      { trait_type: 'Lore Value', value: 'Advanced Harmony stewardship' },
    ],
    educationalContent: {
      title: 'Advanced Realm Stewardship',
      summary: 'You\'ve demonstrated the ability to manage complex Harmony scenarios over a full cycle.',
      keyLessons: [
        'Understanding how the sugar tide changes throughout the day',
        'Managing the Royal Key (Insulin) timing and dosage effectively',
        'Handling unexpected plot twists and their impact on the Kingdom'
      ],
      resources: [
        'https://diabetes.org/healthy-living/medication-treatments/insulin-other-injectables',
        'https://www.diatribe.org/learn/advanced-glucose-management'
      ]
    }
  },
  perfect_stability: {
    name: 'Perfect Harmony',
    description: 'Kept the Kingdom in perfect balance throughout the entire conflict',
    image: `${NFT_BASE_URI}/perfect_harmony.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Epic' },
      { trait_type: 'Category', value: 'Excellence' },
      { trait_type: 'Points', value: '150' },
      { trait_type: 'Lore Value', value: 'Precision Harmony control' },
    ],
    educationalContent: {
      title: 'Precision Harmony Control',
      summary: 'You\'ve achieved perfect Harmony, demonstrating expert-level stewardship skills.',
      keyLessons: [
        'The importance of consistent monitoring of the sugar tide',
        'How to maintain balance during the most intense feasts',
        'Advanced techniques for repelling the Sugar Horde'
      ],
      resources: [
        'https://diabetes.org/healthy-living/managing-diabetes/blood-glucose',
        'https://www.joslin.org/patient-care/diabetes-education'
      ]
    }
  },
  high_combo: {
    name: 'Tactical Genius',
    description: 'Achieved 50+ consecutive successful maneuvers',
    image: `${NFT_BASE_URI}/tactical_genius.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Category', value: 'Skill' },
      { trait_type: 'Points', value: '120' },
      { trait_type: 'Lore Value', value: 'Rapid tactical decision making' },
    ],
    educationalContent: {
      title: 'Rapid Tactical Decision Making',
      summary: 'Your ability to make quick, accurate decisions demonstrates mastery of the Kingdom\'s tactical principles.',
      keyLessons: [
        'Building instinctive responses to the Sugar Horde',
        'Developing pattern recognition for Ally food impacts',
        'Improving reaction time for better real-world management'
      ],
      resources: [
        'https://diabetes.org/healthy-living/managing-diabetes/decision-making',
        'https://www.healthline.com/diabetesmine/quick-decision-tips'
      ]
    }
  },
  health_streak: {
    name: 'Eternal Guardian',
    description: 'Defended the Kingdom in 3 consecutive conflicts - demonstrating consistent stewardship',
    image: `${NFT_BASE_URI}/eternal_guardian.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Category', value: 'Dedication' },
      { trait_type: 'Points', value: '300' },
      { trait_type: 'Lore Value', value: 'Consistency in Realm stewardship' },
    ],
    educationalContent: {
      title: 'The Power of Consistent Stewardship',
      summary: 'You\'ve demonstrated the ability to maintain good Harmony over multiple conflicts.',
      keyLessons: [
        'Consistent habits lead to better long-term Harmony control',
        'Small daily victories compound into a thriving Kingdom',
        'Building routines reduces the burden of Realm stewardship'
      ],
      resources: [
        'https://diabetes.org/healthy-living/managing-diabetes/building-routines',
        'https://cdc.gov/diabetes/managing/manage-blood-sugar.html'
      ]
    }
  },
  explorer: {
    name: 'Realm Scholar',
    description: 'Explored all paths of the Kingdom - comprehensive Realm knowledge',
    image: `${NFT_BASE_URI}/realm_scholar.png`,
    attributes: [
      { trait_type: 'Rarity', value: 'Rare' },
      { trait_type: 'Category', value: 'Discovery' },
      { trait_type: 'Points', value: '200' },
      { trait_type: 'Lore Value', value: 'Broad Realm knowledge' },
    ],
    educationalContent: {
      title: 'Comprehensive Realm Understanding',
      summary: 'You\'ve explored all aspects of Harmony management, from basic concepts to advanced strategies.',
      keyLessons: [
        'Different conflicts require different stewardship approaches',
        'Flexibility and adaptability are key to the Kingdom\'s long-term success',
        'Continuous learning leads to a healthier Realm'
      ],
      resources: [
        'https://diabetes.org/diabetes/type-1/learning-zone',
        'https://www.niddk.nih.gov/health-information/diabetes/overview/managing-diabetes'
      ]
    }
  },
};

/**
 * Helper to generate NFT metadata JSON with educational content
 */
export const generateMetadataJSON = (
  achievementId: keyof typeof ACHIEVEMENT_METADATA,
  playerAddress: string
) => {
  const base = ACHIEVEMENT_METADATA[achievementId];
  
  // Base metadata with educational attributes
  const metadata = {
    ...base,
    attributes: [
      ...base.attributes,
      { trait_type: 'Earned By', value: playerAddress },
      { trait_type: 'Earned On', value: new Date().toISOString() },
    ],
  };
  
  // Add educational content if available
  if (base.educationalContent) {
    metadata.educationalContent = base.educationalContent;
    metadata.attributes.push(
      { trait_type: 'Educational Achievement', value: 'Yes' },
      { trait_type: 'Verifiable Learning', value: base.educationalContent.title }
    );
  }
  
  return metadata;
};