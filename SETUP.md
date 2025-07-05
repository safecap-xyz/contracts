# Development Environment Setup

## Project Structure

- `contracts/`: Smart contract source files
- `scripts/`: Deployment and interaction scripts
- `tasks/`: Custom Hardhat tasks
- `test/`: Smart contract test files

## Setup Instructions

### 1. Node.js Version Compatibility

Hardhat is compatible with Node.js versions 18.x to 20.x. Using Node.js 23.x (like v23.7.0) may cause warnings and potential issues.

It's recommended to use a compatible Node.js version. You can use a version manager like `nvm` to switch Node.js versions:

```bash
# To install a compatible version
nvm install 20.10.0

# To use a compatible version
nvm use 20.10.0
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required dependencies including Hardhat and its plugins.

### 3. Configure Environment

Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit the `.env` file with your own values for:
- RPC URLs for various networks
- Your private key for deployments
- API keys for services like Etherscan and Alchemy

### 3. Compile Contracts

```bash
pnpm run compile
```

This compiles all Solidity contracts and generates artifacts.

### 5. Run Tests

```bash
pnpm test
```

This runs all tests to verify everything is working correctly.

### 6. Deploy Contracts

```bash
pnpm run deploy
```

Or specify a network:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. Interact with Contracts

Update the contract addresses in `scripts/interact.js` after deployment, then run:

```bash
pnpm run interact
```

Or specify a network:

```bash
npx hardhat run scripts/interact.js --network sepolia
```

## Custom Hardhat Tasks

This project includes custom tasks to simplify common operations:

### List Accounts and Balances

```bash
npx hardhat accounts
```

### Check Balance of a Specific Address

```bash
npx hardhat balance <address>
```

### Get Campaign Information

```bash
npx hardhat campaign-info <campaign-address>
```

## Development Workflow

1. Make changes to contracts in the `contracts/` directory
2. Run tests to verify changes: `pnpm test`
3. Deploy to a test network: `npx hardhat run scripts/deploy.js --network sepolia`
4. Interact with deployed contracts: `npx hardhat run scripts/interact.js --network sepolia`
5. Verify on Etherscan if needed (command provided after deployment)
