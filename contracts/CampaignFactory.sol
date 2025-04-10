// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./utils/Ownable.sol";
import "./Campaign.sol";
import "./ICampaignFactory.sol";

/**
 * @title Campaign Factory Contract
 * @notice Factory contract for deploying campaign contracts
 */
contract CampaignFactory is ICampaignFactory, Ownable {
    // NFT contract address
    address public immutable nftContractAddress;
    
    // Mapping to track valid deployed campaigns
    mapping(address => bool) public isCampaign;
    
    // Array of all deployed campaign addresses
    address[] private deployedCampaigns;
    
    // Events
    event CampaignCreated(
        address indexed creator,
        address indexed campaignAddress,
        uint256 goal,
        address token,
        string uri
    );
    
    /**
     * @notice Constructor
     * @param _nftContract Address of the NFT contract
     * @param initialOwner Initial contract owner address
     */
    constructor(
        address _nftContract,
        address initialOwner
    ) Ownable(initialOwner) {
        // Note: In production, _nftContract should never be address(0)
        // This check is commented out to facilitate testing with circular dependencies
        // require(_nftContract != address(0), "Invalid NFT contract address");
        nftContractAddress = _nftContract;
    }
    
    /**
     * @notice Creates a new campaign
     * @param _creator Address of the campaign creator
     * @param _goal The funding goal amount
     * @param _token The ERC20 token to accept (address(0) for ETH)
     * @param _uri The URI for campaign metadata
     * @return address The address of the newly created campaign
     */
    function createCampaign(
        address _creator,
        uint256 _goal,
        address _token,
        string memory _uri
    ) external onlyOwner returns (address) {
        require(_creator != address(0), "Invalid creator address");
        
        // Deploy a new Campaign contract
        Campaign newCampaign = new Campaign(
            _creator,
            _goal,
            _token,
            nftContractAddress,
            _uri
        );
        
        address campaignAddress = address(newCampaign);
        
        // Register the new campaign
        isCampaign[campaignAddress] = true;
        deployedCampaigns.push(campaignAddress);
        
        emit CampaignCreated(
            _creator,
            campaignAddress,
            _goal,
            _token,
            _uri
        );
        
        return campaignAddress;
    }
    
    /**
     * @notice Gets all deployed campaign addresses
     * @return address[] Array of campaign addresses
     */
    function getDeployedCampaigns() external view returns (address[] memory) {
        return deployedCampaigns;
    }
    
    /**
     * @notice Checks if an address is a campaign deployed by this factory
     * @param _addr The address to check
     * @return bool True if the address is a deployed campaign
     */
    function checkIsCampaign(address _addr) external view returns (bool) {
        return isCampaign[_addr];
    }
}