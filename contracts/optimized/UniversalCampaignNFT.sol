// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../token/ERC721/ERC721.sol";
import "../token/ERC721/extensions/ERC721URIStorage.sol";
import "../utils/Ownable.sol";
import "../utils/Counters.sol";
import "./CampaignRegistry.sol";

/**
 * @title Universal Campaign NFT Contract
 * @notice Registry-based ERC721 contract for minting NFTs across all campaigns
 * @dev Uses registry pattern to validate campaigns from any factory
 */
contract UniversalCampaignNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    // Token ID counter
    Counters.Counter private _tokenIdCounter;
    
    // Registry for campaign validation
    CampaignRegistry public registry;
    
    // Mapping to track which campaign each NFT belongs to
    mapping(uint256 => address) public campaignForTokenId;
    
    // Mapping to track donation amounts for each NFT
    mapping(uint256 => uint256) public donationAmountForTokenId;
    
    // Mapping to track total donations per campaign
    mapping(address => uint256) public totalDonationsPerCampaign;
    
    // Mapping to track NFTs per campaign
    mapping(address => uint256[]) public nftsByCampaign;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Events
    event NFTMinted(
        uint256 indexed tokenId, 
        address indexed donor, 
        address indexed campaign,
        uint256 donationAmount
    );
    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    
    /**
     * @notice Constructor
     * @param _registry Address of the campaign registry
     * @param baseUri Base URI for NFT metadata
     * @param initialOwner Initial contract owner address
     */
    constructor(
        address _registry,
        string memory baseUri,
        address initialOwner
    ) ERC721("UniversalCampaignNFT", "UCNFT") Ownable(initialOwner) {
        require(_registry != address(0), "Invalid registry address");
        registry = CampaignRegistry(_registry);
        _baseTokenURI = baseUri;
    }
    
    /**
     * @notice Mints a new NFT to a donor (legacy interface for ICampaignNFT compatibility)
     * @param _donor Address of the donor receiving the NFT
     * @param _campaignAddress Address of the campaign (should match msg.sender)
     * @return uint256 The ID of the newly minted token
     */
    function mint(address _donor, address _campaignAddress) external returns (uint256) {
        // Only valid campaigns can mint NFTs
        require(
            registry.isCampaign(msg.sender),
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
        
        // Store campaign information (legacy interface doesn't provide donation amount)
        campaignForTokenId[tokenId] = msg.sender;
        donationAmountForTokenId[tokenId] = 0; // Unknown amount for legacy calls
        
        // Update campaign statistics
        nftsByCampaign[msg.sender].push(tokenId);
        
        emit NFTMinted(tokenId, _donor, msg.sender, 0);
        
        return tokenId;
    }
    
    /**
     * @notice Mints a new NFT to a donor with donation amount tracking
     * @param _donor Address of the donor receiving the NFT
     * @param _donationAmount Amount donated (for metadata/tracking)
     * @return uint256 The ID of the newly minted token
     */
    function mintWithAmount(
        address _donor,
        uint256 _donationAmount
    ) external returns (uint256) {
        // Only valid campaigns can mint NFTs
        require(
            registry.isCampaign(msg.sender),
            "Caller is not a valid campaign"
        );
        
        // Generate new token ID
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint token to donor
        _safeMint(_donor, tokenId);
        
        // Store campaign and donation information
        campaignForTokenId[tokenId] = msg.sender;
        donationAmountForTokenId[tokenId] = _donationAmount;
        
        // Update campaign statistics
        totalDonationsPerCampaign[msg.sender] += _donationAmount;
        nftsByCampaign[msg.sender].push(tokenId);
        
        emit NFTMinted(tokenId, _donor, msg.sender, _donationAmount);
        
        return tokenId;
    }
    
    /**
     * @notice Batch mint NFTs for multiple donors
     * @param _donors Array of donor addresses
     * @param _donationAmounts Array of donation amounts
     * @return uint256[] Array of minted token IDs
     */
    function mintBatch(
        address[] memory _donors,
        uint256[] memory _donationAmounts
    ) external returns (uint256[] memory) {
        require(
            registry.isCampaign(msg.sender),
            "Caller is not a valid campaign"
        );
        require(_donors.length == _donationAmounts.length, "Array length mismatch");
        require(_donors.length > 0, "Empty arrays");
        
        uint256[] memory tokenIds = new uint256[](_donors.length);
        
        for (uint256 i = 0; i < _donors.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(_donors[i], tokenId);
            
            campaignForTokenId[tokenId] = msg.sender;
            donationAmountForTokenId[tokenId] = _donationAmounts[i];
            totalDonationsPerCampaign[msg.sender] += _donationAmounts[i];
            nftsByCampaign[msg.sender].push(tokenId);
            
            tokenIds[i] = tokenId;
            
            emit NFTMinted(tokenId, _donors[i], msg.sender, _donationAmounts[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @notice Updates the registry address (owner only)
     * @param _newRegistry New registry contract address
     */
    function updateRegistry(address _newRegistry) external onlyOwner {
        require(_newRegistry != address(0), "Invalid registry address");
        address oldRegistry = address(registry);
        registry = CampaignRegistry(_newRegistry);
        emit RegistryUpdated(oldRegistry, _newRegistry);
    }
    
    /**
     * @notice Sets the base URI for all token metadata
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @notice Gets NFT IDs for a specific campaign
     * @param _campaign Campaign address
     * @return uint256[] Array of NFT token IDs
     */
    function getNFTsByCampaign(address _campaign) external view returns (uint256[] memory) {
        return nftsByCampaign[_campaign];
    }
    
    /**
     * @notice Gets donation information for a token
     * @param _tokenId Token ID
     * @return campaign Campaign address
     * @return donationAmount Amount donated
     */
    function getDonationInfo(uint256 _tokenId) external view returns (address campaign, uint256 donationAmount) {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        return (campaignForTokenId[_tokenId], donationAmountForTokenId[_tokenId]);
    }
    
    /**
     * @notice Gets total donations for a campaign
     * @param _campaign Campaign address
     * @return uint256 Total donation amount
     */
    function getTotalDonationsForCampaign(address _campaign) external view returns (uint256) {
        return totalDonationsPerCampaign[_campaign];
    }
    
    /**
     * @notice Gets the total number of NFTs minted
     * @return uint256 Total NFT count
     */
    function getTotalNFTs() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @notice Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @notice Generate token URI with campaign-specific metadata
     * @param tokenId Token ID
     * @return string Token URI
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        
        string memory baseURI = _baseURI();
        if (bytes(baseURI).length == 0) {
            return "";
        }
        
        // Include campaign address and donation amount in metadata path
        address campaign = campaignForTokenId[tokenId];
        return string(abi.encodePacked(
            baseURI,
            "campaign/",
            _addressToString(campaign),
            "/token/",
            _toString(tokenId)
        ));
    }
    
    /**
     * @notice Convert address to string
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
    
    /**
     * @notice Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    // Required overrides
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}