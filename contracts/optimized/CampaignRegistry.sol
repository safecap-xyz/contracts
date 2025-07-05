// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../utils/Ownable.sol";

/**
 * @title Campaign Registry
 * @notice Registry contract to manage relationships between factory, NFT, and campaigns
 * @dev Eliminates circular dependency by providing a central registry pattern
 */
contract CampaignRegistry is Ownable {
    // Core contract addresses
    address public factoryAddress;
    address public nftContractAddress;
    
    // Campaign validation
    mapping(address => bool) public validCampaigns;
    address[] private deployedCampaigns;
    
    // Campaign metadata
    mapping(address => CampaignInfo) public campaignInfo;
    
    struct CampaignInfo {
        address creator;
        uint256 goal;
        address token;
        string uri;
        uint256 createdAt;
    }
    
    // Events
    event ContractsInitialized(address indexed factory, address indexed nft);
    event CampaignRegistered(address indexed campaign, address indexed creator);
    
    /**
     * @notice Constructor
     * @param initialOwner Initial contract owner address
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Initialize core contract addresses (can only be called once)
     * @param _factory Address of the campaign factory
     * @param _nft Address of the NFT contract
     */
    function initializeContracts(address _factory, address _nft) external onlyOwner {
        require(factoryAddress == address(0), "Already initialized");
        require(_factory != address(0) && _nft != address(0), "Invalid addresses");
        
        factoryAddress = _factory;
        nftContractAddress = _nft;
        
        emit ContractsInitialized(_factory, _nft);
    }
    
    /**
     * @notice Register a new campaign (only callable by factory)
     * @param _campaign Address of the campaign contract
     * @param _creator Campaign creator address
     * @param _goal Campaign funding goal
     * @param _token Token address (address(0) for ETH)
     * @param _uri Campaign metadata URI
     */
    function registerCampaign(
        address _campaign,
        address _creator,
        uint256 _goal,
        address _token,
        string memory _uri
    ) external {
        require(msg.sender == factoryAddress, "Only factory can register");
        require(!validCampaigns[_campaign], "Campaign already registered");
        
        validCampaigns[_campaign] = true;
        deployedCampaigns.push(_campaign);
        
        campaignInfo[_campaign] = CampaignInfo({
            creator: _creator,
            goal: _goal,
            token: _token,
            uri: _uri,
            createdAt: block.timestamp
        });
        
        emit CampaignRegistered(_campaign, _creator);
    }
    
    /**
     * @notice Check if an address is a valid campaign
     * @param _campaign Address to check
     * @return bool True if valid campaign
     */
    function isCampaign(address _campaign) external view returns (bool) {
        return validCampaigns[_campaign];
    }
    
    /**
     * @notice Get all deployed campaign addresses
     * @return address[] Array of campaign addresses
     */
    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }
    
    /**
     * @notice Get campaign information
     * @param _campaign Campaign address
     * @return CampaignInfo Campaign information struct
     */
    function getCampaignInfo(address _campaign) external view returns (CampaignInfo memory) {
        require(validCampaigns[_campaign], "Invalid campaign");
        return campaignInfo[_campaign];
    }
    
    /**
     * @notice Get number of deployed campaigns
     * @return uint256 Total number of campaigns
     */
    function getCampaignCount() external view returns (uint256) {
        return deployedCampaigns.length;
    }
}