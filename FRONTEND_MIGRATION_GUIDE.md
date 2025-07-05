# SafeCap Frontend Migration Guide

## 📋 Overview

This guide details how to update the SafeCap frontend (`/safecap-mono/apps/admin`) to work with the new optimized smart contract architecture.

## 🔄 Key Changes Required

### 1. Contract Architecture Changes

**Old (Legacy) Architecture:**
- `CampaignFactory.sol` (6-signature deployment)
- `CampaignNFT.sol` (circular dependency)
- Owner-only campaign creation

**New (Optimized) Architecture:**
- `CampaignRegistry.sol` (central registry)
- `OptimizedCampaignFactory.sol` (permissionless, 2-signature deployment)
- `UniversalCampaignNFT.sol` (registry-based validation)

### 2. Deployment Process Changes

**Old Process (6 signatures):**
```typescript
// DeploymentService.ts - OLD COMPLEX FLOW
1. Deploy temp factory
2. Deploy NFT with temp factory
3. Deploy final factory with NFT
4. Update NFT to point to final factory
5. Create sample campaign
6. Verification steps
```

**New Process (2 signatures):**
```typescript
// DeploymentService.ts - NEW OPTIMIZED FLOW
1. Deploy Registry + Factory + NFT (single transaction)
2. Initialize registry connections
3. Done! Permissionless campaign creation enabled
```

## 📁 Files That Need Updates

### 1. ABI Files (`src/web3/abis/`)
**Files to Add:**
- `CampaignRegistry.json` - Registry contract ABI
- `OptimizedCampaignFactory.json` - New factory ABI
- `UniversalCampaignNFT.json` - New NFT ABI

**Files to Update:**
- Keep existing ABIs for backward compatibility
- Update imports to use new contracts

### 2. Service Files (`src/web3/services/`)
**DeploymentService.ts:**
- Replace 6-step deployment with 2-step optimized flow
- Remove circular dependency handling
- Add registry initialization
- Update contract addresses and ABIs

**UserOpService.ts:**
- Update contract references
- Add support for permissionless campaign creation
- Update fee handling for creation fees

### 3. Component Files (`src/components/`)
**Files to Update:**
- `DeployContracts.tsx` - Simplify deployment UI
- `CampaignList.tsx` - Update contract interactions
- `DonateCampaign.tsx` - Update donation flow
- Any components using factory owner restrictions

### 4. Configuration Files
**Environment Variables:**
- Add contract addresses for different networks
- Add registry contract addresses
- Update Base Sepolia deployment configs

## 🛠️ Step-by-Step Migration

### Step 1: Add New ABI Files

Create new ABI files from compiled contracts:

```bash
# Copy ABI files from contracts to frontend
cp contracts/artifacts/contracts/optimized/CampaignRegistry.sol/CampaignRegistry.json \
   safecap-mono/apps/admin/src/web3/abis/

cp contracts/artifacts/contracts/optimized/OptimizedCampaignFactory.sol/OptimizedCampaignFactory.json \
   safecap-mono/apps/admin/src/web3/abis/

cp contracts/artifacts/contracts/optimized/UniversalCampaignNFT.sol/UniversalCampaignNFT.json \
   safecap-mono/apps/admin/src/web3/abis/
```

### Step 2: Update DeploymentService.ts

**Key Changes:**
```typescript
// OLD - Complex 6-step deployment
const deployContracts = async () => {
  // Deploy temp factory
  // Deploy NFT
  // Deploy final factory
  // Update NFT
  // Create campaign
}

// NEW - Optimized 2-step deployment
const deployOptimizedContracts = async () => {
  // 1. Deploy all contracts in single transaction
  const registryTx = await deployRegistry()
  const factoryTx = await deployFactory(registryAddress)
  const nftTx = await deployNFT(registryAddress)
  
  // 2. Initialize connections
  await registry.initializeContracts(factoryAddress, nftAddress)
  
  // Done! Permissionless campaign creation ready
}
```

### Step 3: Update Contract Addresses

**Add Network Configuration:**
```typescript
// src/web3/contractAddresses.ts (new file)
export const OPTIMIZED_CONTRACT_ADDRESSES = {
  sepolia: {
    registry: "0xcB43B752C64d05071595A07dc6A52e120eeF0e61",
    factory: "0xCC2e9E817932Dd559Ab306C88D2f506A6a103E97",
    nft: "0x8Cf7e2C38c2899981C9F5D3ddddB1DdF63515369"
  },
  baseSepolia: {
    // Add Base Sepolia addresses when deployed
    registry: "",
    factory: "",
    nft: ""
  },
  mainnet: {
    // Add mainnet addresses when deployed
    registry: "",
    factory: "",
    nft: ""
  }
}
```

### Step 4: Update Campaign Creation

**Remove Owner Restrictions:**
```typescript
// OLD - Owner-only campaign creation
const createCampaign = async (params) => {
  // Required factory owner signature
  await factory.connect(owner).createCampaign(...)
}

// NEW - Permissionless campaign creation
const createCampaign = async (params) => {
  // Any user can create campaigns
  await factory.createCampaign(...)
  // Optional: Include creation fee
}
```

### Step 5: Add Batch Operations Support

**New Feature - Batch Campaign Creation:**
```typescript
// NEW - Batch campaign creation
const createCampaignsBatch = async (campaigns) => {
  const goals = campaigns.map(c => parseEther(c.goal))
  const tokens = campaigns.map(c => c.token || ethers.ZeroAddress)
  const uris = campaigns.map(c => c.uri)
  
  await factory.createCampaignsBatch(goals, tokens, uris, {
    value: creationFee * campaigns.length
  })
}
```

## 🎯 Frontend-Specific Updates

### Campaign Creation Fee Handling

**Answer to "Where do fees go?":**

The creation fees are collected by the **factory contract owner** (the deployer account):

```typescript
// Fee collection mechanism
const OptimizedCampaignFactory = {
  // Users pay fee when creating campaigns
  createCampaign: (goal, token, uri) => {
    // msg.value >= campaignCreationFee required
    // Fee stored in contract balance
  },
  
  // Owner can withdraw collected fees
  withdrawFees: (recipient) => {
    // Only contract owner can call
    // Transfers all collected fees to recipient
  },
  
  // Owner can set fee amount
  setCreationFee: (newFee) => {
    // Only contract owner can call
    // Sets fee amount (0 = free, >0 = paid)
  }
}
```

**Frontend Implementation:**
```typescript
// Check current fee
const creationFee = await factory.campaignCreationFee()

// Create campaign with fee
const tx = await factory.createCampaign(goal, token, uri, {
  value: creationFee // Include fee in transaction
})

// Owner operations (admin panel)
const withdrawFees = async (recipient: string) => {
  await factory.withdrawFees(recipient)
}

const setCreationFee = async (feeInEth: string) => {
  await factory.setCreationFee(parseEther(feeInEth))
}
```

### Base Sepolia Deployment

**Add Base Sepolia Network Config:**

1. **Update hardhat.config.js:**
```javascript
// contracts/hardhat.config.js
networks: {
  "base-sepolia": {
    url: "https://sepolia.base.org",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 84532,
    gasPrice: 1000000000, // 1 gwei
  }
}
```

2. **Deploy to Base Sepolia:**
```bash
# Get Base Sepolia ETH from faucet
# https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

# Deploy optimized contracts
npx hardhat run scripts/deploy-optimized.js --network base-sepolia

# Test deployment
npx hardhat run scripts/test-optimized-donation.js --network base-sepolia
```

3. **Update Frontend Config:**
```typescript
// frontend src/web3/contractAddresses.ts
export const OPTIMIZED_CONTRACT_ADDRESSES = {
  // ... existing networks
  baseSepolia: {
    registry: "0x...", // From deployment output
    factory: "0x...",  // From deployment output
    nft: "0x..."       // From deployment output
  }
}
```

## 🔧 Implementation Checklist

### Phase 1: Core Migration
- [ ] Copy new ABI files to frontend
- [ ] Create contract address configuration
- [ ] Update DeploymentService.ts with optimized flow
- [ ] Update campaign creation components
- [ ] Remove owner-only restrictions from UI

### Phase 2: Enhanced Features
- [ ] Add batch campaign creation UI
- [ ] Implement creation fee display and handling
- [ ] Add registry contract interactions
- [ ] Update error handling for new contracts

### Phase 3: Network Expansion
- [ ] Deploy to Base Sepolia
- [ ] Update frontend for Base Sepolia support
- [ ] Test cross-network functionality
- [ ] Prepare for mainnet deployment

### Phase 4: Testing & Validation
- [ ] Test optimized deployment flow
- [ ] Test permissionless campaign creation
- [ ] Test donation flow with new NFT contract
- [ ] Test batch operations
- [ ] Validate fee collection mechanism

## 🚀 Benefits After Migration

### For Users
- **67% fewer signatures** required for deployment
- **Permissionless campaign creation** - no approval needed
- **Batch operations** - create multiple campaigns efficiently
- **Lower gas costs** - 39% reduction in deployment costs

### For Developers
- **Simplified deployment** - 2 steps vs 6 steps
- **No circular dependencies** - cleaner architecture
- **Enhanced features** - batch ops, fees, analytics
- **Better scalability** - registry-based validation

### For Platform Operators
- **Revenue generation** - optional creation fees
- **Spam prevention** - configurable fee barrier
- **Better analytics** - comprehensive tracking
- **Reduced complexity** - streamlined operations

## 📞 Support & Resources

**Contract Addresses (Sepolia):**
- Registry: `0xcB43B752C64d05071595A07dc6A52e120eeF0e61`
- Factory: `0xCC2e9E817932Dd559Ab306C88D2f506A6a103E97`
- NFT: `0x8Cf7e2C38c2899981C9F5D3ddddB1DdF63515369`

**Documentation:**
- [Optimization Summary](./OPTIMIZATION_SUMMARY.md)
- [Change Log](./CHANGELOG.md)
- [TODO List](./TODO.md)

**Testing Scripts:**
- `scripts/deploy-optimized.js` - Deploy optimized contracts
- `scripts/test-optimized-donation.js` - Test functionality
- `scripts/compare-deployments.js` - Performance comparison