// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../utils/Ownable.sol";
import "../Campaign.sol";
import "./CampaignRegistry.sol";

/**
 * @title Optimized Campaign Factory
 * @notice Permissionless factory for deploying campaigns with registry integration
 * @dev Eliminates onlyOwner restriction and uses registry for validation
 */
contract OptimizedCampaignFactory is Ownable {
    // Registry contract for managing relationships
    CampaignRegistry public immutable registry;
    
    // Campaign creation fee (optional anti-spam measure)
    uint256 public campaignCreationFee;
    
    // Campaign creation statistics
    uint256 public totalCampaignsCreated;
    mapping(address => uint256) public campaignsByCreator;
    
    // Events
    event CampaignCreated(
        address indexed creator,
        address indexed campaignAddress,
        uint256 goal,
        address token,
        string uri
    );
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    
    /**
     * @notice Constructor
     * @param _registry Address of the campaign registry
     * @param initialOwner Initial contract owner address
     */
    constructor(
        address _registry,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_registry != address(0), "Invalid registry address");
        registry = CampaignRegistry(_registry);
    }
    
    /**
     * @notice Creates a new campaign (permissionless)
     * @param _goal The funding goal amount
     * @param _token The ERC20 token to accept (address(0) for ETH)
     * @param _uri The URI for campaign metadata
     * @return address The address of the newly created campaign
     */
    function createCampaign(
        uint256 _goal,
        address _token,
        string memory _uri
    ) external payable returns (address) {
        require(_goal > 0, "Goal must be greater than 0");
        require(msg.value >= campaignCreationFee, "Insufficient creation fee");
        
        // Use msg.sender as creator (permissionless)
        address creator = msg.sender;
        
        // Get NFT contract address from registry
        address nftContract = registry.nftContractAddress();
        require(nftContract != address(0), "NFT contract not set in registry");
        
        // Deploy a new Campaign contract
        Campaign newCampaign = new Campaign(
            creator,
            _goal,
            _token,
            nftContract,
            _uri
        );
        
        address campaignAddress = address(newCampaign);
        
        // Register the campaign in the registry
        registry.registerCampaign(
            campaignAddress,
            creator,
            _goal,
            _token,
            _uri
        );
        
        // Update statistics
        totalCampaignsCreated++;
        campaignsByCreator[creator]++;
        
        emit CampaignCreated(
            creator,
            campaignAddress,
            _goal,
            _token,
            _uri
        );
        
        return campaignAddress;
    }
    
    /**
     * @notice Creates multiple campaigns in a single transaction (batch operation)
     * @param _goals Array of funding goals
     * @param _tokens Array of token addresses
     * @param _uris Array of campaign URIs
     * @return address[] Array of created campaign addresses
     */
    function createCampaignsBatch(
        uint256[] memory _goals,
        address[] memory _tokens,
        string[] memory _uris
    ) external payable returns (address[] memory) {
        require(
            _goals.length == _tokens.length && _tokens.length == _uris.length,
            "Array length mismatch"
        );
        require(_goals.length > 0, "Empty arrays");
        require(msg.value >= campaignCreationFee * _goals.length, "Insufficient fee for batch");
        
        address[] memory createdCampaigns = new address[](_goals.length);
        
        for (uint256 i = 0; i < _goals.length; i++) {
            require(_goals[i] > 0, "Goal must be greater than 0");
            
            address nftContract = registry.nftContractAddress();
            require(nftContract != address(0), "NFT contract not set in registry");
            
            Campaign newCampaign = new Campaign(
                msg.sender,
                _goals[i],
                _tokens[i],
                nftContract,
                _uris[i]
            );
            
            address campaignAddress = address(newCampaign);
            createdCampaigns[i] = campaignAddress;
            
            registry.registerCampaign(
                campaignAddress,
                msg.sender,
                _goals[i],
                _tokens[i],
                _uris[i]
            );
            
            emit CampaignCreated(
                msg.sender,
                campaignAddress,
                _goals[i],
                _tokens[i],
                _uris[i]
            );
        }
        
        totalCampaignsCreated += _goals.length;
        campaignsByCreator[msg.sender] += _goals.length;
        
        return createdCampaigns;
    }
    
    /**
     * @notice Sets the campaign creation fee (owner only)
     * @param _fee New fee amount in wei
     */
    function setCreationFee(uint256 _fee) external onlyOwner {
        uint256 oldFee = campaignCreationFee;
        campaignCreationFee = _fee;
        emit CreationFeeUpdated(oldFee, _fee);
    }
    
    /**
     * @notice Withdraws collected fees (owner only)
     * @param _to Address to receive the fees
     */
    function withdrawFees(address payable _to) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        _to.transfer(balance);
    }
    
    /**
     * @notice Gets all deployed campaign addresses from registry
     * @return address[] Array of campaign addresses
     */
    function getDeployedCampaigns() external view returns (address[] memory) {
        return registry.getDeployedCampaigns();
    }
    
    /**
     * @notice Checks if an address is a valid campaign
     * @param _addr The address to check
     * @return bool True if the address is a deployed campaign
     */
    function checkIsCampaign(address _addr) external view returns (bool) {
        return registry.isCampaign(_addr);
    }
    
    /**
     * @notice Gets campaigns created by a specific address
     * @param _creator Creator address
     * @return uint256 Number of campaigns created by the address
     */
    function getCampaignsByCreator(address _creator) external view returns (uint256) {
        return campaignsByCreator[_creator];
    }
}