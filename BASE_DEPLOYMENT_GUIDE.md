# SafeCap Base Network Deployment Guide

## 🎯 Overview

This guide walks through deploying SafeCap's optimized smart contracts to Base Sepolia (testnet) and Base Mainnet with single NFT strategy.

**Key Benefits:**
- ✅ **2 signatures** instead of 6 (67% reduction)
- ✅ **Single NFT** approach (simple, proven UX)
- ✅ **Permissionless** campaign creation
- ✅ **Base L2** ultra-low fees (~$0.01-0.05 per donation)

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js installed (v16-20 recommended, not v23)
- [ ] Private key configured in `.env` file
- [ ] Hardhat configuration includes Base networks
- [ ] All dependencies installed (`npm install`)

### 2. Network Configuration Verification
```bash
# Verify hardhat.config.js includes:
networks: {
  "base-sepolia": {
    url: "https://sepolia.base.org",
    accounts: [process.env.PRIVATE_KEY],
    chainId: 84532,
    gasPrice: 1000000000 // 1 gwei
  },
  base: {
    url: "https://mainnet.base.org",
    accounts: [process.env.PRIVATE_KEY], 
    chainId: 8453,
    gasPrice: "auto"
  }
}
```

### 3. Contract Compilation
- [ ] All optimized contracts compiled successfully
- [ ] ABI files generated in `artifacts/` directory
- [ ] No compilation errors or warnings

---

## 🚀 Base Sepolia Deployment (Testnet)

### Step 1: Fund Deployer Wallet

**Deployer Address**: `0xFd638308290BD73ab40F1C04d9EB9c1e93525c31`

**Get Base Sepolia ETH:**
1. Go to: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Enter wallet address: `0xFd638308290BD73ab40F1C04d9EB9c1e93525c31`
3. Request 0.5 ETH (more than enough for deployment)
4. Wait for confirmation (~1-2 minutes)

### Step 2: Verify Wallet Balance

```bash
npx hardhat run scripts/check-balance.js --network base-sepolia
```

**Expected Output:**
```
💰 Checking wallet balance for deployment
=========================================
Wallet address: 0xFd638308290BD73ab40F1C04d9EB9c1e93525c31
Current balance: 0.5 ETH
Estimated deployment cost: 0.002 ETH
Gas price: 1.0 gwei
✅ Sufficient balance for deployment
💡 Ready to deploy optimized contracts!
```

### Step 3: Deploy Optimized Contracts (2 Signatures)

```bash
npx hardhat run scripts/deploy-optimized.js --network base-sepolia
```

**Expected Process:**
1. **Signature 1**: Deploy Registry + Factory + NFT contracts
2. **Signature 2**: Initialize registry connections
3. **Automatic**: Create sample campaign for testing

**Expected Output:**
```
🚀 OPTIMIZED DEPLOYMENT PROCESS
===============================
Reducing from 6 signatures to 2 signatures

📝 SIGNATURE 1: Deploying Registry + Factory + NFT contracts
   Deploying CampaignRegistry...
   ✅ Registry deployed to: 0x[ADDRESS]
   Deploying OptimizedCampaignFactory...
   ✅ Factory deployed to: 0x[ADDRESS]
   Deploying UniversalCampaignNFT...
   ✅ NFT deployed to: 0x[ADDRESS]

📝 SIGNATURE 2: Initialize registry connections
   ✅ Registry initialized successfully!

🧪 Testing permissionless campaign creation...
   ✅ Sample campaign created at: 0x[ADDRESS]

📊 DEPLOYMENT SUMMARY
=====================
✅ OPTIMIZED PROCESS COMPLETED!

📄 Contract Addresses:
   Registry:  0x[REGISTRY_ADDRESS]
   Factory:   0x[FACTORY_ADDRESS]
   NFT:       0x[NFT_ADDRESS]
   Campaign:  0x[CAMPAIGN_ADDRESS]

💾 Deployment data saved to optimized-deployment.json
```

### Step 4: Test Deployment Functionality

```bash
npx hardhat run scripts/test-optimized-donation.js --network base-sepolia
```

**Expected Tests:**
- ✅ Permissionless campaign creation
- ✅ ETH donations and NFT minting
- ✅ Campaign progress tracking
- ✅ Batch campaign creation
- ✅ Registry validation
- ✅ NFT metadata and tracking

**Expected Output:**
```
🧪 Testing optimized SafeCap deployment
=====================================

1️⃣ Testing permissionless campaign creation
   ✅ Campaign created at: 0x[ADDRESS]
   ✅ Campaign registered in registry: true

2️⃣ Testing campaign donations and NFT minting
   ✅ Donation successful!
   ✅ NFT correctly minted to donor

3️⃣ Testing campaign progress tracking
   Current amount: 0.01 ETH
   Goal amount: 0.1 ETH
   Progress: 10%

✅ OPTIMIZED SAFECAP TESTING COMPLETED SUCCESSFULLY!
```

### Step 5: Verify Contracts on Block Explorer

```bash
npx hardhat run scripts/verify-optimized.js --network base-sepolia
```

**Note**: Block explorer verification may not be available immediately on Base Sepolia. This step may show warnings but is not critical for functionality.

### Step 6: Document Deployment Results

**Record the following from deployment output:**
- [ ] Registry Address: `0x...`
- [ ] Factory Address: `0x...`
- [ ] NFT Address: `0x...`
- [ ] Sample Campaign Address: `0x...`
- [ ] Transaction Hashes for both signatures
- [ ] Total gas used and cost in ETH

**Update Configuration Files:**
```typescript
// safecap-mono/apps/admin/src/web3/contractAddresses.ts
baseSepolia: {
  registry: "0x[REGISTRY_ADDRESS]",
  factory: "0x[FACTORY_ADDRESS]",
  nft: "0x[NFT_ADDRESS]"
}
```

---

## 🎯 Base Mainnet Deployment (Production)

### Pre-Production Checklist

**Before mainnet deployment, ensure:**
- [ ] Base Sepolia deployment working perfectly
- [ ] All tests passing on testnet
- [ ] Frontend integration tested on testnet
- [ ] Security review completed
- [ ] Team approval for mainnet deployment
- [ ] Sufficient ETH for mainnet gas fees

### Step 1: Fund Mainnet Wallet

**Get Base ETH for mainnet:**
- Purchase ETH on exchange (Coinbase, Binance, etc.)
- Bridge to Base network using official Base bridge
- **Estimated needed**: 0.01 ETH ($25-50 depending on ETH price)

### Step 2: Verify Mainnet Balance

```bash
npx hardhat run scripts/check-balance.js --network base
```

### Step 3: Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-optimized.js --network base
```

**⚠️ IMPORTANT**: This deploys to production and costs real money!

### Step 4: Test Mainnet Deployment

```bash
npx hardhat run scripts/test-optimized-donation.js --network base
```

**Use small amounts for testing (0.001 ETH donations)**

### Step 5: Verify Mainnet Contracts

```bash
npx hardhat run scripts/verify-optimized.js --network base
```

### Step 6: Configure Production Settings

**Set Creation Fee (Optional Revenue Generation):**
```bash
npx hardhat console --network base

# In console:
const factory = await ethers.getContractAt("OptimizedCampaignFactory", "0x[FACTORY_ADDRESS]")

# Set small creation fee (example: $0.50 worth of ETH)
await factory.setCreationFee(ethers.parseEther("0.0005"))

# Verify fee was set
const fee = await factory.campaignCreationFee()
console.log("Creation fee:", ethers.formatEther(fee), "ETH")
```

**Update Production Configuration:**
```typescript
// safecap-mono/apps/admin/src/web3/contractAddresses.ts
base: {
  registry: "0x[MAINNET_REGISTRY_ADDRESS]",
  factory: "0x[MAINNET_FACTORY_ADDRESS]",
  nft: "0x[MAINNET_NFT_ADDRESS]"
}
```

---

## 📊 Post-Deployment Monitoring

### Revenue Collection (Your Income)

**Check collected fees:**
```bash
npx hardhat console --network base
const factory = await ethers.getContractAt("OptimizedCampaignFactory", "0x[FACTORY_ADDRESS]")
const balance = await ethers.provider.getBalance(factory.address)
console.log("Collected fees:", ethers.formatEther(balance), "ETH")
```

**Withdraw fees to your wallet:**
```bash
# In hardhat console
await factory.withdrawFees("0x[YOUR_WALLET_ADDRESS]")
```

### Platform Analytics

**Monitor key metrics:**
- Total campaigns created: `await registry.getCampaignCount()`
- NFTs minted: `await nft.getTotalNFTs()`
- Platform usage and growth
- Average donation amounts
- User satisfaction and support tickets

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

**Issue**: "Insufficient funds for gas"
**Solution**: Add more ETH to deployer wallet

**Issue**: "Network not responding"  
**Solution**: Check internet connection, try different RPC endpoint

**Issue**: "Contract verification failed"
**Solution**: Verification is optional, contracts still work

**Issue**: "Transaction reverted during testing"
**Solution**: Check if sample campaign was created successfully, may be due to duplicate testing

### Support Resources

**Documentation:**
- [Base Network Docs](https://docs.base.org/)
- [Hardhat Network Guide](https://hardhat.org/hardhat-network/)
- [SafeCap Technical Docs](./OPTIMIZATION_SUMMARY.md)

**Block Explorers:**
- Base Sepolia: https://sepolia.basescan.org/
- Base Mainnet: https://basescan.org/

---

## 📋 Complete Deployment Checklist

### Base Sepolia (Testnet)
- [ ] Fund wallet with Base Sepolia ETH
- [ ] Check balance: `npx hardhat run scripts/check-balance.js --network base-sepolia`
- [ ] Deploy contracts: `npx hardhat run scripts/deploy-optimized.js --network base-sepolia`
- [ ] Test deployment: `npx hardhat run scripts/test-optimized-donation.js --network base-sepolia`
- [ ] Verify contracts: `npx hardhat run scripts/verify-optimized.js --network base-sepolia`
- [ ] Update frontend config with addresses
- [ ] Test frontend integration
- [ ] Document all addresses and transaction hashes

### Base Mainnet (Production)
- [ ] Complete testnet deployment successfully
- [ ] Security review and team approval
- [ ] Fund wallet with Base ETH (~0.01 ETH)
- [ ] Check balance: `npx hardhat run scripts/check-balance.js --network base`
- [ ] Deploy contracts: `npx hardhat run scripts/deploy-optimized.js --network base`
- [ ] Test deployment: `npx hardhat run scripts/test-optimized-donation.js --network base`
- [ ] Verify contracts: `npx hardhat run scripts/verify-optimized.js --network base`
- [ ] Configure creation fees (optional)
- [ ] Update production frontend config
- [ ] Announce launch
- [ ] Monitor platform metrics

### Success Criteria
- [ ] All deployment scripts run without errors
- [ ] All tests pass on both networks
- [ ] Frontend can interact with contracts
- [ ] Users can create campaigns permissionlessly
- [ ] Donations work and NFTs mint correctly
- [ ] Fee collection mechanism works (if enabled)
- [ ] Platform ready for user onboarding

---

## 🎉 Launch Readiness

Once both deployments are complete:

**✅ Your SafeCap platform will have:**
- **Ultra-low fees** (~$0.01-0.05 per donation on Base)
- **2-signature deployment** vs 6 signatures (67% reduction)
- **Permissionless campaign creation** (anyone can create campaigns)
- **Single NFT rewards** (simple, proven UX)
- **Revenue generation** (optional creation fees)
- **Scalable architecture** (registry-based, no circular dependencies)

**🚀 Ready for users and growth!**

This deployment guide ensures a smooth, documented process that can be replicated reliably across networks.