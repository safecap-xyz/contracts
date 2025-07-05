// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./token/ERC721/ERC721.sol";
import "./token/ERC721/extensions/ERC721URIStorage.sol";
import "./utils/Ownable.sol";
import "./utils/Counters.sol";
import "./ICampaignFactory.sol";

/**
 * @title Campaign NFT Contract
 * @notice ERC721 contract for minting NFTs representing donations to campaigns
 */
contract CampaignNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Address of the campaign factory to verify campaign addresses
    address public campaignFactoryAddress;
    
    // Mapping to track which campaign each NFT belongs to
    mapping(uint256 => address) public campaignForTokenId;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed donor, address indexed campaign);
    
    /**
     * @notice Constructor
     * @param _factoryAddress Address of the campaign factory
     * @param baseUri Base URI for NFT metadata
     * @param initialOwner Initial contract owner address
     */
    constructor(
        address _factoryAddress,
        string memory baseUri,
        address initialOwner
    ) ERC721("CampaignDonationNFT", "CDNFT") Ownable(initialOwner) {
        require(_factoryAddress != address(0), "Invalid factory address");
        campaignFactoryAddress = _factoryAddress;
        _baseTokenURI = baseUri;
    }
    
    /**
     * @notice Mints a new NFT to a donor
     * @param _donor Address of the donor receiving the NFT
     * @param _campaignAddress Address of the campaign this donation is for
     * @return uint256 The ID of the newly minted token
     */
    function mint(
        address _donor,
        address _campaignAddress
    ) external returns (uint256) {
        // Only campaigns created by the factory can mint NFTs
        require(
            ICampaignFactory(campaignFactoryAddress).checkIsCampaign(msg.sender),
            "Caller is not a valid campaign"
        );
        
        // Verify that the campaign address matches the caller
        require(
            _campaignAddress == msg.sender,
            "Campaign address mismatch"
        );
        
        // Generate new token ID
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint token to donor
        _safeMint(_donor, tokenId);
        
        // Store which campaign this NFT belongs to
        campaignForTokenId[tokenId] = _campaignAddress;
        
        emit NFTMinted(tokenId, _donor, _campaignAddress);
        
        return tokenId;
    }
    
    /**
     * @notice Sets the base URI for all token metadata
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    // Add this function to CampaignNFT.sol
/**
 * @notice Updates the campaign factory address
 * @param _newFactoryAddress New address of the campaign factory
 */
function updateFactoryAddress(address _newFactoryAddress) external onlyOwner {
    require(_newFactoryAddress != address(0), "Invalid factory address");
    campaignFactoryAddress = _newFactoryAddress;
}
    
    /**
     * @notice Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    // Required overrides from ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // The following functions are overrides required by Solidity
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}