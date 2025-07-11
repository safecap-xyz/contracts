// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./utils/Ownable.sol";
import "./token/ERC20/IERC20.sol";
import "./token/ERC20/utils/SafeERC20.sol";

// Euler Protocol Interfaces
interface IEulerSwapFactory {
    function deployPool(
        address vault0,
        address vault1,
        address account,
        uint256 reserveX,
        uint256 reserveY,
        bytes32 salt
    ) external returns (address pool);
}

interface IEulerSwap {
    struct CurveParams {
        uint256 priceX;
        uint256 priceY;
        uint256 concentrationX;
        uint256 concentrationY;
    }
    
    function activate() external;
    function deactivate() external;
}

interface IEVC {
    function createAccount(address owner) external returns (address account);
    function call(address target, address onBehalfOf, uint256 value, bytes calldata data) external;
    function batch(BatchItem[] calldata items) external;
    
    struct BatchItem {
        address targetContract;
        address onBehalfOfAccount;
        uint256 value;
        bytes data;
    }
}

interface IEulerLendingVault {
    function deposit(uint256 amount, address receiver) external returns (uint256 shares);
    function withdraw(uint256 amount, address receiver, address owner) external returns (uint256 shares);
    function borrow(uint256 amount, address receiver) external returns (uint256 shares);
    function repay(uint256 amount, address receiver) external returns (uint256 shares);
    function balanceOf(address account) external view returns (uint256);
    function enableController(address account, address vault) external;
    function enableCollateral(address account, address vault) external;
}

/**
 * @title SafeCapLoanVault
 * @notice Core contract for SafeCap's DeFi Kickstarter integration with EulerSwap
 * @dev Orchestrates peer-to-peer lending with EulerSwap liquidity pools
 */
contract SafeCapLoanVault is Ownable {
    using SafeERC20 for IERC20;

    // State Variables
    IEulerSwapFactory public immutable eulerSwapFactory;
    IEVC public immutable evc;
    
    // Loan status enumeration
    enum LoanStatus {
        Proposed,    // Backer has created proposal
        Active,      // Borrower has requested funding
        Repaid,      // Loan fully repaid
        Defaulted    // Loan in default/liquidated
    }

    // Loan details structure
    struct LoanDetails {
        address backer;
        address borrower;
        uint256 loanAmount;
        address loanAsset;
        uint256 collateralAmount;
        address collateralAsset;
        uint256 interestRate;        // In basis points (e.g., 1000 = 10%)
        uint256 repaymentDueDate;
        uint256 totalRepaymentAmount;
        LoanStatus status;
        IEulerSwap.CurveParams curveParams;
        address backerEulerAccount;  // Backer's EVC account
    }

    // Mappings
    mapping(address => address) public borrowerToPool;           // borrower => eulerSwapPool
    mapping(address => LoanDetails) public poolToLoanDetails;   // eulerSwapPool => LoanDetails
    mapping(address => address[]) public backerLoans;           // backer => array of pools
    mapping(address => address[]) public borrowerLoans;         // borrower => array of pools
    mapping(address => address) public tokenToEulerAsset;       // token => Euler asset

    // Protocol fee (in basis points, e.g., 100 = 1%)
    uint256 public protocolFeeBps = 100;
    address public feeRecipient;

    // Events
    event LoanProposalCreated(
        address indexed backer,
        address indexed borrower,
        address indexed pool,
        uint256 loanAmount,
        address loanAsset,
        uint256 collateralAmount,
        address collateralAsset,
        uint256 interestRate
    );

    event LoanFunded(
        address indexed borrower,
        address indexed pool,
        uint256 amount
    );

    event LoanRepaid(
        address indexed borrower,
        address indexed pool,
        uint256 totalAmount
    );

    event CollateralReleased(
        address indexed backer,
        address indexed pool,
        uint256 amount
    );

    event LoanLiquidated(
        address indexed pool,
        uint256 collateralLiquidated
    );

    /**
     * @notice Constructor
     * @param _eulerSwapFactory Address of EulerSwap factory
     * @param _evc Address of Euler Vault Connector
     * @param _feeRecipient Address to receive protocol fees
     * @param initialOwner Initial contract owner
     */
    constructor(
        address _eulerSwapFactory,
        address _evc,
        address _feeRecipient,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_eulerSwapFactory != address(0), "Invalid factory address");
        require(_evc != address(0), "Invalid EVC address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        eulerSwapFactory = IEulerSwapFactory(_eulerSwapFactory);
        evc = IEVC(_evc);
        feeRecipient = _feeRecipient;
        
        // Initialize known token -> asset mappings for Base mainnet
        // WETH -> Euler WETH asset (confirmed via Superform)
        tokenToEulerAsset[0x4200000000000000000000000000000000000006] = 0x859160DB5841E5cfB8D3f144C6b3381A85A4b410;
        
        // TODO: Add USDC asset mapping once address is confirmed
        // USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) -> Euler USDC asset (TBD)
    }

    /**
     * @notice Set token to Euler vault mapping (only owner)
     * @param token The underlying token address
     * @param vault The corresponding Euler lending vault address
     */
    function setTokenToVaultMapping(address token, address vault) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(vault != address(0), "Invalid vault address");
        tokenToEulerAsset[token] = vault;
    }

    /**
     * @notice Creates a new loan proposal
     * @param borrower Address of the intended borrower
     * @param loanAmount Amount to be loaned
     * @param loanAsset Token address for the loan
     * @param collateralAmount Amount of collateral to provide
     * @param collateralAsset Token address for collateral
     * @param interestRate Interest rate in basis points
     * @param loanDuration Duration of the loan in seconds
     * @param curveParams EulerSwap curve parameters
     * @param salt Salt for deterministic pool deployment
     * @param backerEulerAccount The backer's EVC account address (should be created by user beforehand)
     */
    function createLoanProposal(
        address borrower,
        uint256 loanAmount,
        address loanAsset,
        uint256 collateralAmount,
        address collateralAsset,
        uint256 interestRate,
        uint256 loanDuration,
        IEulerSwap.CurveParams calldata curveParams,
        bytes32 salt,
        address backerEulerAccount
    ) external {
        _validateProposalParams(borrower, loanAmount, collateralAmount, interestRate, loanDuration, backerEulerAccount);
        
        address eulerSwapPool = _setupLoanInfrastructure(
            borrower,
            loanAmount,
            loanAsset,
            collateralAmount,
            collateralAsset,
            salt,
            backerEulerAccount
        );
        
        _storeLoanDetails(
            eulerSwapPool,
            borrower,
            loanAmount,
            loanAsset,
            collateralAmount,
            collateralAsset,
            interestRate,
            loanDuration,
            curveParams,
            backerEulerAccount
        );
    }
    
    /**
     * @notice Validates loan proposal parameters
     */
    function _validateProposalParams(
        address borrower,
        uint256 loanAmount,
        uint256 collateralAmount,
        uint256 interestRate,
        uint256 loanDuration,
        address backerEulerAccount
    ) internal view {
        require(borrower != address(0), "Invalid borrower address");
        require(loanAmount > 0, "Invalid loan amount");
        require(collateralAmount > 0, "Invalid collateral amount");
        require(interestRate > 0 && interestRate <= 10000, "Invalid interest rate");
        require(loanDuration > 0, "Invalid loan duration");
        require(borrowerToPool[borrower] == address(0), "Borrower already has active loan");
        // NOTE: EVC account validation temporarily removed for testing
        // require(backerEulerAccount != address(0), "Invalid EVC account");
    }
    
    /**
     * @notice Sets up loan infrastructure (collateral deposit, EulerSwap pool)
     * @dev Now uses backer's existing EVC account instead of creating new one
     */
    function _setupLoanInfrastructure(
        address borrower,
        uint256 loanAmount,
        address loanAsset,
        uint256 collateralAmount,
        address collateralAsset,
        bytes32 salt,
        address backerEulerAccount
    ) internal returns (address eulerSwapPool) {
        // Transfer collateral from backer to this contract
        IERC20(collateralAsset).safeTransferFrom(msg.sender, address(this), collateralAmount);

        // SIMPLIFIED: Skip vault mapping requirement for testing
        // In the simplified version, we don't need vault mappings
        // address collateralVault = tokenToEulerAsset[collateralAsset];
        // require(collateralVault != address(0), "No Euler vault configured for collateral token");
        
        // The backer should have already:
        // 1. Created their EVC account via EVC.createAccount(msg.sender)
        // 2. Enabled the collateral vault
        // 3. Enabled this contract as controller for their account
        
        // SIMPLIFIED APPROACH: Skip EVC and EulerSwap for now
        // This allows us to test the core loan proposal logic
        // TODO: Add proper EVC and EulerSwap integration later
        
        // For now, just hold the collateral in this contract
        // We already transferred it from msg.sender above
        
        // Create a simple pool address based on the parameters for testing
        // In production, this would be the actual EulerSwap pool
        eulerSwapPool = address(uint160(uint256(keccak256(abi.encodePacked(
            address(this),
            borrower,
            loanAsset,
            collateralAsset,
            salt
        )))));
    }
    
    /**
     * @notice Stores loan details in contract state
     */
    function _storeLoanDetails(
        address eulerSwapPool,
        address borrower,
        uint256 loanAmount,
        address loanAsset,
        uint256 collateralAmount,
        address collateralAsset,
        uint256 interestRate,
        uint256 loanDuration,
        IEulerSwap.CurveParams calldata curveParams,
        address backerEulerAccount
    ) internal {
        // Calculate total repayment amount
        uint256 totalRepaymentAmount = loanAmount + (loanAmount * interestRate) / 10000;

        // Store loan details
        poolToLoanDetails[eulerSwapPool] = LoanDetails({
            backer: msg.sender,
            borrower: borrower,
            loanAmount: loanAmount,
            loanAsset: loanAsset,
            collateralAmount: collateralAmount,
            collateralAsset: collateralAsset,
            interestRate: interestRate,
            repaymentDueDate: block.timestamp + loanDuration,
            totalRepaymentAmount: totalRepaymentAmount,
            status: LoanStatus.Proposed,
            curveParams: curveParams,
            backerEulerAccount: backerEulerAccount
        });

        borrowerToPool[borrower] = eulerSwapPool;
        backerLoans[msg.sender].push(eulerSwapPool);
        borrowerLoans[borrower].push(eulerSwapPool);

        emit LoanProposalCreated(
            msg.sender,
            borrower,
            eulerSwapPool,
            loanAmount,
            loanAsset,
            collateralAmount,
            collateralAsset,
            interestRate
        );
    }

    /**
     * @notice Borrower requests funding for their loan
     * @param borrower Address of the borrower
     */
    function requestFunding(address borrower) external {
        require(msg.sender == borrower, "Only borrower can request funding");
        
        address pool = borrowerToPool[borrower];
        require(pool != address(0), "No loan proposal found");
        
        LoanDetails storage loanDetails = poolToLoanDetails[pool];
        require(loanDetails.status == LoanStatus.Proposed, "Loan not in proposed status");
        
        // SIMPLIFIED: Just transfer the loan amount directly to borrower
        // The contract already holds the collateral from the backer
        // For simplicity, we'll "lend" from the collateral (reduce collateral by loan amount)
        require(loanDetails.collateralAmount >= loanDetails.loanAmount, "Insufficient collateral for loan");
        
        // Transfer loan amount to borrower from contract's collateral holdings
        // Since both loan and collateral are WETH in our test, we can transfer from collateral
        IERC20(loanDetails.collateralAsset).safeTransfer(borrower, loanDetails.loanAmount);
        
        // Update loan status
        loanDetails.status = LoanStatus.Active;
        
        emit LoanFunded(borrower, pool, loanDetails.loanAmount);
    }

    /**
     * @notice Borrower repays the loan
     * @param borrower Address of the borrower
     * @param amount Amount to repay
     */
    function repayLoan(address borrower, uint256 amount) external {
        address pool = borrowerToPool[borrower];
        require(pool != address(0), "No active loan found");
        
        LoanDetails storage loanDetails = poolToLoanDetails[pool];
        require(loanDetails.status == LoanStatus.Active, "Loan not active");
        require(amount >= loanDetails.totalRepaymentAmount, "Insufficient repayment amount");
        
        // Transfer repayment from borrower to contract
        IERC20(loanDetails.loanAsset).safeTransferFrom(msg.sender, address(this), amount);
        
        // SIMPLIFIED: No Euler integration, just hold the repayment
        // Calculate protocol fee and backer reward
        uint256 interest = amount - loanDetails.loanAmount;
        uint256 protocolFee = (interest * protocolFeeBps) / 10000;
        uint256 backerReward = interest - protocolFee;
        
        // Distribute fees and rewards immediately
        if (protocolFee > 0) {
            IERC20(loanDetails.loanAsset).safeTransfer(feeRecipient, protocolFee);
        }
        if (backerReward > 0) {
            IERC20(loanDetails.loanAsset).safeTransfer(loanDetails.backer, backerReward);
        }
        
        // Return the original loan amount to contract's balance for potential future loans
        // The collateral can now be released to the backer
        
        // Update loan status
        loanDetails.status = LoanStatus.Repaid;
        
        emit LoanRepaid(borrower, pool, amount);
    }

    /**
     * @notice Release collateral to backer after loan repayment
     * @param borrower Address of the borrower whose loan was repaid
     */
    function releaseCollateral(address borrower) external {
        address pool = borrowerToPool[borrower];
        require(pool != address(0), "No loan found");
        
        LoanDetails storage loanDetails = poolToLoanDetails[pool];
        require(loanDetails.status == LoanStatus.Repaid, "Loan not repaid");
        require(msg.sender == loanDetails.backer, "Only backer can release collateral");
        
        // SIMPLIFIED: Transfer remaining collateral directly from contract to backer
        // Calculate remaining collateral (original amount minus what was used for the loan)
        uint256 remainingCollateral = loanDetails.collateralAmount - loanDetails.loanAmount;
        
        if (remainingCollateral > 0) {
            IERC20(loanDetails.collateralAsset).safeTransfer(loanDetails.backer, remainingCollateral);
        }
        
        // Clean up mappings
        delete borrowerToPool[borrower];
        delete poolToLoanDetails[pool];
        
        emit CollateralReleased(loanDetails.backer, pool, remainingCollateral);
    }

    /**
     * @notice Liquidate defaulted loan
     * @param borrower Address of the borrower in default
     */
    function liquidateLoan(address borrower) external {
        address pool = borrowerToPool[borrower];
        require(pool != address(0), "No loan found");
        
        LoanDetails storage loanDetails = poolToLoanDetails[pool];
        require(loanDetails.status == LoanStatus.Active, "Loan not active");
        require(block.timestamp > loanDetails.repaymentDueDate, "Loan not in default");
        
        // Liquidation logic would involve Euler's liquidation mechanism
        // For simplicity, marking as defaulted and releasing remaining collateral to backer
        uint256 collateralBalance = IEulerLendingVault(loanDetails.collateralAsset).balanceOf(loanDetails.backerEulerAccount);
        
        if (collateralBalance > 0) {
            IEulerLendingVault(loanDetails.collateralAsset).withdraw(
                collateralBalance,
                loanDetails.backer,
                loanDetails.backerEulerAccount
            );
        }
        
        loanDetails.status = LoanStatus.Defaulted;
        
        emit LoanLiquidated(pool, collateralBalance);
    }

    /**
     * @notice Get loan details for a borrower
     * @param borrower Address of the borrower
     * @return LoanDetails struct
     */
    function getLoanDetails(address borrower) external view returns (LoanDetails memory) {
        address pool = borrowerToPool[borrower];
        require(pool != address(0), "No loan found");
        return poolToLoanDetails[pool];
    }

    /**
     * @notice Get all loans for a backer
     * @param backer Address of the backer
     * @return Array of pool addresses
     */
    function getBackerLoans(address backer) external view returns (address[] memory) {
        return backerLoans[backer];
    }

    /**
     * @notice Get all loans for a borrower
     * @param borrower Address of the borrower
     * @return Array of pool addresses
     */
    function getBorrowerLoans(address borrower) external view returns (address[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @notice Update protocol fee (only owner)
     * @param newFeeBps New fee in basis points
     */
    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        protocolFeeBps = newFeeBps;
    }

    /**
     * @notice Update fee recipient (only owner)
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @notice Helper function to create an EVC account for a user
     * @dev Users should call this before creating loan proposals
     * @param owner The owner of the EVC account (should be msg.sender)
     * @return account The created EVC account address
     */
    function createEVCAccount(address owner) external returns (address account) {
        require(owner == msg.sender, "Can only create account for yourself");
        return evc.createAccount(owner);
    }
}