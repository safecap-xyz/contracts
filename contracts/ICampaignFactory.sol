// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICampaignFactory Interface
 * @notice Interface for the CampaignFactory contract
 */
interface ICampaignFactory {
    /**
     * @notice Checks if an address is a campaign deployed by this factory
     * @param _addr The address to check
     * @return bool True if the address is a deployed campaign
     */
    function checkIsCampaign(address _addr) external view returns (bool);

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
    ) external returns (address);

    /**
     * @notice Gets all deployed campaign addresses
     * @return address[] Array of campaign addresses
     */
    function getDeployedCampaigns() external view returns (address[] memory);
}