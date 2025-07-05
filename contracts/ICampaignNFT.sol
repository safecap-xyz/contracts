// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICampaignNFT Interface
 * @notice Interface for the CampaignNFT contract
 */
interface ICampaignNFT {
    /**
     * @notice Mints a new NFT to the donor, representing their donation to a campaign
     * @param _donor Address of the donor receiving the NFT
     * @param _campaignAddress Address of the campaign that received the donation
     * @return uint256 The token ID of the newly minted NFT
     */
    function mint(address _donor, address _campaignAddress) external returns (uint256);
    
    /**
     * @notice Gets the campaign address associated with a specific token ID
     * @param _tokenId The ID of the NFT
     * @return address The address of the campaign this NFT was minted for
     */
    function campaignForTokenId(uint256 _tokenId) external view returns (address);
}