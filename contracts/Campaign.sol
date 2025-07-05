// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Define ReentrancyGuard contract directly
contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

// Now import the rest of the required contracts
import "./token/ERC20/utils/SafeERC20.sol";
import "./token/ERC20/IERC20.sol";
import "./ICampaignNFT.sol";

/**
 * @title Campaign Contract
 * @notice Manages a single fundraising campaign with donation and fund claim capabilities
 */
contract Campaign is ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // State variables
    address public immutable creator;
    uint256 public immutable goalAmount;
    uint256 public totalRaised;
    address public immutable acceptedToken; // Use address(0) for ETH
    address public immutable nftContractAddress;
    string public campaignURI;
    bool public fundingActive;
    bool public fundsClaimed;
    
    // Events
    event DonationReceived(address indexed donor, uint256 amount, uint256 newTotalRaised);
    event FundsClaimed(address indexed creator, uint256 amountClaimed);
    event FundingStatusChanged(bool isActive);

    /**
     * @notice Constructor to initialize campaign details
     * @param _creator Address of the campaign creator
     * @param _goal Funding target amount
     * @param _token Address of ERC20 token, or address(0) for ETH
     * @param _nftContract Address of the NFT contract for donation NFTs
     * @param _uri URI pointing to campaign metadata (IPFS)
     */
    constructor(
        address _creator,
        uint256 _goal,
        address _token,
        address _nftContract,
        string memory _uri
    ) {
        require(_creator != address(0), "Invalid creator address");
        require(_goal > 0, "Goal must be greater than zero");
        require(_nftContract != address(0), "Invalid NFT contract address");
        
        creator = _creator;
        goalAmount = _goal;
        acceptedToken = _token;
        nftContractAddress = _nftContract;
        campaignURI = _uri;
        fundingActive = true; // Campaign is active upon creation
    }
    
    /**
     * @notice Enables accepting ETH donations when acceptedToken is address(0)
     */
    receive() external payable {
        require(acceptedToken == address(0), "ETH not accepted, use token");
        require(msg.value > 0, "Donation amount must be greater than 0");
        _processDonation(msg.value);
    }
    
    /**
     * @notice Donates to the campaign using the accepted ERC20 token
     * @param _amount Amount of tokens to donate
     */
    function donate(uint256 _amount) external nonReentrant {
        require(fundingActive, "Campaign is not active");
        require(_amount > 0, "Donation amount must be greater than 0");
        require(acceptedToken != address(0), "Use ETH transfer for donation");
        
        // Transfer tokens from sender to this contract
        IERC20(acceptedToken).safeTransferFrom(msg.sender, address(this), _amount);
        
        _processDonation(_amount);
    }
    
    /**
     * @notice Internal function to process donation logic
     * @param _amount Amount donated
     */
    function _processDonation(uint256 _amount) internal {
        // Update total raised
        totalRaised += _amount;
        
        // Mint an NFT to the donor
        ICampaignNFT(nftContractAddress).mint(msg.sender, address(this));
        
        emit DonationReceived(msg.sender, _amount, totalRaised);
    }
    
    /**
     * @notice Allows the creator to claim funds after reaching the goal
     */
    function claimFunds() external nonReentrant {
        require(msg.sender == creator, "Only creator can claim funds");
        require(!fundsClaimed, "Funds already claimed");
        require(totalRaised >= goalAmount, "Goal not reached");
        
        fundingActive = false;
        fundsClaimed = true;
        
        uint256 amountToTransfer = totalRaised;
        
        // Transfer funds to creator
        if (acceptedToken == address(0)) {
            // Transfer ETH
            (bool success, ) = payable(creator).call{value: amountToTransfer}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20 tokens
            IERC20(acceptedToken).safeTransfer(creator, amountToTransfer);
        }
        
        emit FundsClaimed(creator, amountToTransfer);
    }
    
    /**
     * @notice Toggles the campaign's active status - can only be called by creator
     * @param _isActive New status for the campaign
     */
    function setFundingActive(bool _isActive) external {
        require(msg.sender == creator, "Only creator can change status");
        require(!fundsClaimed, "Campaign funds already claimed");
        
        fundingActive = _isActive;
        emit FundingStatusChanged(_isActive);
    }
    
    /**
     * @notice Updates the campaign metadata URI - can only be called by creator
     * @param _newURI New metadata URI
     */
    function updateCampaignURI(string memory _newURI) external {
        require(msg.sender == creator, "Only creator can update URI");
        campaignURI = _newURI;
    }
}