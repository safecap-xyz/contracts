
## 5. CampaignRegistry

The `CampaignRegistry` contract acts as a central hub for managing the relationships between the campaign factory, NFT contract, and individual campaign instances. It provides a single source of truth for validating campaigns and retrieving their metadata.

*   **Contract File:** `contracts/optimized/CampaignRegistry.sol`

### Constructor

```solidity
constructor(address initialOwner)
```

*   `initialOwner`: Initial owner of the contract, with administrative privileges.

### Functions

#### `initializeContracts`

```solidity
function initializeContracts(address _factory, address _nft) external onlyOwner
```

*   **Description:** Initializes the addresses of the core `OptimizedCampaignFactory` and `UniversalCampaignNFT` contracts. This function can only be called once.
*   **Parameters:**
    *   `_factory`: Address of the `OptimizedCampaignFactory` contract.
    *   `_nft`: Address of the `UniversalCampaignNFT` contract.

#### `registerCampaign`

```solidity
function registerCampaign(
    address _campaign,
    address _creator,
    uint256 _goal,
    address _token,
    string memory _uri
) external
```

*   **Description:** Registers a new campaign in the registry. This function can only be called by the `OptimizedCampaignFactory`.
*   **Parameters:**
    *   `_campaign`: Address of the `Campaign` contract.
    *   `_creator`: Address of the campaign creator.
    *   `_goal`: The funding goal of the campaign.
    *   `_token`: The token accepted by the campaign (address(0) for ETH).
    *   `_uri`: The metadata URI for the campaign.

#### `isCampaign`

```solidity
function isCampaign(address _campaign) external view returns (bool)
```

*   **Description:** Checks if a given address is a valid registered campaign.
*   **Parameters:**
    *   `_campaign`: The address to check.
*   **Returns:** `true` if the address is a valid campaign, `false` otherwise.

#### `getDeployedCampaigns`

```solidity
function getDeployedCampaigns() external view returns (address[] memory)
```

*   **Description:** Returns an array of all registered campaign addresses.
*   **Returns:** An array of `Campaign` contract addresses.

#### `getCampaignInfo`

```solidity
function getCampaignInfo(address _campaign) external view returns (CampaignInfo memory)
```

*   **Description:** Retrieves detailed information about a specific campaign.
*   **Parameters:**
    *   `_campaign`: The address of the campaign.
*   **Returns:** A `CampaignInfo` struct containing the campaign's creator, goal, token, URI, and creation timestamp.

#### `getCampaignCount`

```solidity
function getCampaignCount() external view returns (uint256)
```

*   **Description:** Returns the total number of campaigns registered in the registry.
*   **Returns:** The total count of campaigns.

### Events

#### `ContractsInitialized`

```solidity
event ContractsInitialized(address indexed factory, address indexed nft)
```

*   **Description:** Emitted when the factory and NFT contract addresses are successfully initialized.

#### `CampaignRegistered`

```solidity
event CampaignRegistered(address indexed campaign, address indexed creator)
```

*   **Description:** Emitted when a new campaign is successfully registered in the registry.

### Data Structures

#### `CampaignInfo`

```solidity
struct CampaignInfo {
    address creator;
    uint256 goal;
    address token;
    string uri;
    uint256 createdAt;
}
```

*   **Description:** Stores detailed information about a campaign.
*   **Fields:**
    *   `creator`: Address of the campaign creator.
    *   `goal`: Funding target amount.
    *   `token`: Address of the accepted token (address(0) for ETH).
    *   `uri`: URI pointing to campaign metadata.
    *   `createdAt`: Timestamp of campaign creation.

### ABI

The ABI for `CampaignRegistry` can be found at `contracts/artifacts/contracts/optimized/CampaignRegistry.sol/CampaignRegistry.json`.

---
