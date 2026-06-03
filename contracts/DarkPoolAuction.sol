// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

// ─────────────────────────────────────────────────────────────
//  DarkPool Protocol — Blind Auction + CDR Access Control
//  Story CDR Hackathon 2026
//  Features:
//   - Blind auction with CDR-encrypted bids
//   - License NFT minted for winner
//   - Royalty streaming on NFT resale (Feature 2)
//   - Multi-seller bundle support (Feature 3)
// ─────────────────────────────────────────────────────────────

contract DarkPoolAuction {

    // ── Structs ──────────────────────────────────────────────

    struct Listing {
        address   seller;
        bytes32   vaultId;
        string    metadataURI;
        uint256   reservePrice;
        uint256   deadline;
        bool      settled;
        address   winner;
        uint256   winningBid;
        uint256   licenseTokenId;
        uint256   royaltyBps;      // royalty in basis points e.g. 500 = 5%
    }

    struct Bid {
        address bidder;
        bytes32 bidVaultId;
        uint256 deposit;
        bool    revealed;
        uint256 revealedAmount;
    }

    struct BundleSeller {
        address seller;
        bytes32 vaultId;
        uint256 shareBps;   // share of revenue in basis points e.g. 3000 = 30%
    }

    // ── State ────────────────────────────────────────────────

    uint256 public nextListingId = 1;
    uint256 public nextLicenseId = 1;

    mapping(uint256 => Listing)      public listings;
    mapping(uint256 => Bid[])        public bids;
    mapping(uint256 => mapping(address => uint256)) public bidderIndex;

    // Bundle support
    mapping(uint256 => BundleSeller[]) public bundleSellers;
    mapping(uint256 => bool)           public isBundle;

    // License NFT registry
    mapping(uint256 => address)  public licenseOwner;
    mapping(uint256 => bytes32)  public licenseVault;
    mapping(uint256 => uint256)  public licenseListing;

    // ── Events ───────────────────────────────────────────────

    event Listed(uint256 indexed listingId, address indexed seller, bytes32 vaultId, uint256 deadline);
    event BundleListed(uint256 indexed listingId, uint256 sellerCount, uint256 deadline);
    event BidPlaced(uint256 indexed listingId, address indexed bidder, bytes32 bidVaultId);
    event BidRevealed(uint256 indexed listingId, address indexed bidder, uint256 amount);
    event Settled(uint256 indexed listingId, address indexed winner, uint256 amount, uint256 licenseTokenId);
    event Refunded(uint256 indexed listingId, address indexed bidder, uint256 amount);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed seller, uint256 amount);
    event LicenseTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 price);

    // ── Errors ───────────────────────────────────────────────

    error AuctionNotFound();
    error AuctionStillOpen();
    error AuctionClosed();
    error AuctionAlreadySettled();
    error BelowReserve();
    error AlreadyBid();
    error NotBidder();
    error AlreadyRevealed();
    error TransferFailed();
    error NotLicenseOwner();
    error InvalidShares();

    // ─────────────────────────────────────────────────────────
    //  SELLER: List a single dataset
    // ─────────────────────────────────────────────────────────

    function list(
        bytes32 vaultId,
        string calldata metadataURI,
        uint256 reservePrice,
        uint256 duration,
        uint256 royaltyBps
    ) external returns (uint256 listingId) {
        require(royaltyBps <= 3000, "Max 30% royalty");
        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller:         msg.sender,
            vaultId:        vaultId,
            metadataURI:    metadataURI,
            reservePrice:   reservePrice,
            deadline:       block.timestamp + duration,
            settled:        false,
            winner:         address(0),
            winningBid:     0,
            licenseTokenId: 0,
            royaltyBps:     royaltyBps
        });
        emit Listed(listingId, msg.sender, vaultId, block.timestamp + duration);
    }

    // ─────────────────────────────────────────────────────────
    //  FEATURE 3: Multi-seller bundle listing
    // ─────────────────────────────────────────────────────────

    function listBundle(
        BundleSeller[] calldata sellers,
        string calldata metadataURI,
        uint256 reservePrice,
        uint256 duration,
        uint256 royaltyBps
    ) external returns (uint256 listingId) {
        require(royaltyBps <= 3000, "Max 30% royalty");
        require(sellers.length >= 2, "Need at least 2 sellers");

        // Verify shares add up to 10000 bps (100%)
        uint256 totalShares = 0;
        for (uint256 i = 0; i < sellers.length; i++) {
            totalShares += sellers[i].shareBps;
        }
        if (totalShares != 10000) revert InvalidShares();

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller:         msg.sender,
            vaultId:        sellers[0].vaultId,
            metadataURI:    metadataURI,
            reservePrice:   reservePrice,
            deadline:       block.timestamp + duration,
            settled:        false,
            winner:         address(0),
            winningBid:     0,
            licenseTokenId: 0,
            royaltyBps:     royaltyBps
        });

        isBundle[listingId] = true;
        for (uint256 i = 0; i < sellers.length; i++) {
            bundleSellers[listingId].push(sellers[i]);
        }

        emit BundleListed(listingId, sellers.length, block.timestamp + duration);
    }

    // ─────────────────────────────────────────────────────────
    //  BUYER: Place a blind bid
    // ─────────────────────────────────────────────────────────

    function placeBid(uint256 listingId, bytes32 bidVaultId) external payable {
        Listing storage l = listings[listingId];
        if (l.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp > l.deadline) revert AuctionClosed();
        if (bidderIndex[listingId][msg.sender] != 0) revert AlreadyBid();
        if (msg.value < l.reservePrice) revert BelowReserve();

        bids[listingId].push(Bid({
            bidder:         msg.sender,
            bidVaultId:     bidVaultId,
            deposit:        msg.value,
            revealed:       false,
            revealedAmount: 0
        }));
        bidderIndex[listingId][msg.sender] = bids[listingId].length;
        emit BidPlaced(listingId, msg.sender, bidVaultId);
    }

    // ─────────────────────────────────────────────────────────
    //  REVEAL PHASE
    // ─────────────────────────────────────────────────────────

    function revealBid(uint256 listingId, uint256 amount) external {
        Listing storage l = listings[listingId];
        if (l.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp <= l.deadline) revert AuctionStillOpen();
        if (l.settled) revert AuctionAlreadySettled();

        uint256 idx = bidderIndex[listingId][msg.sender];
        if (idx == 0) revert NotBidder();

        Bid storage b = bids[listingId][idx - 1];
        if (b.revealed) revert AlreadyRevealed();

        b.revealedAmount = amount > b.deposit ? b.deposit : amount;
        b.revealed = true;
        emit BidRevealed(listingId, msg.sender, b.revealedAmount);
    }

    // ─────────────────────────────────────────────────────────
    //  SETTLEMENT
    // ─────────────────────────────────────────────────────────

    function settle(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (l.seller == address(0)) revert AuctionNotFound();
        if (block.timestamp <= l.deadline) revert AuctionStillOpen();
        if (l.settled) revert AuctionAlreadySettled();

        l.settled = true;

        Bid[] storage bs = bids[listingId];
        address winner;
        uint256 topBid;

        for (uint256 i = 0; i < bs.length; i++) {
            if (bs[i].revealed && bs[i].revealedAmount > topBid) {
                topBid = bs[i].revealedAmount;
                winner = bs[i].bidder;
            }
        }

        if (winner == address(0) || topBid < l.reservePrice) {
            for (uint256 i = 0; i < bs.length; i++) {
                _refund(bs[i].bidder, bs[i].deposit);
                emit Refunded(listingId, bs[i].bidder, bs[i].deposit);
            }
            return;
        }

        // Mint license NFT
        uint256 tokenId = nextLicenseId++;
        licenseOwner[tokenId]  = winner;
        licenseVault[tokenId]  = l.vaultId;
        licenseListing[tokenId] = listingId;
        l.winner         = winner;
        l.winningBid     = topBid;
        l.licenseTokenId = tokenId;

        // Pay seller(s)
        if (isBundle[listingId]) {
            // Split revenue across bundle sellers
            BundleSeller[] storage sellers = bundleSellers[listingId];
            for (uint256 i = 0; i < sellers.length; i++) {
                uint256 share = (topBid * sellers[i].shareBps) / 10000;
                _refund(sellers[i].seller, share);
            }
        } else {
            _refund(l.seller, topBid);
        }

        // Refund losers
        for (uint256 i = 0; i < bs.length; i++) {
            if (bs[i].bidder == winner) {
                uint256 excess = bs[i].deposit - topBid;
                if (excess > 0) _refund(winner, excess);
            } else {
                _refund(bs[i].bidder, bs[i].deposit);
                emit Refunded(listingId, bs[i].bidder, bs[i].deposit);
            }
        }

        emit Settled(listingId, winner, topBid, tokenId);
    }

    // ─────────────────────────────────────────────────────────
    //  FEATURE 2: License NFT resale with royalty streaming
    // ─────────────────────────────────────────────────────────

    function resellLicense(uint256 tokenId, address buyer) external payable {
        if (licenseOwner[tokenId] != msg.sender) revert NotLicenseOwner();
        require(msg.value > 0, "Must send payment");

        uint256 listingId = licenseListing[tokenId];
        Listing storage l = listings[listingId];

        // Pay royalty to original seller
        uint256 royalty = (msg.value * l.royaltyBps) / 10000;
        if (royalty > 0) {
            if (isBundle[listingId]) {
                BundleSeller[] storage sellers = bundleSellers[listingId];
                for (uint256 i = 0; i < sellers.length; i++) {
                    uint256 share = (royalty * sellers[i].shareBps) / 10000;
                    _refund(sellers[i].seller, share);
                }
            } else {
                _refund(l.seller, royalty);
                emit RoyaltyPaid(tokenId, l.seller, royalty);
            }
        }

        // Pay seller the rest
        uint256 sellerProceeds = msg.value - royalty;
        _refund(msg.sender, sellerProceeds);

        // Transfer license
        emit LicenseTransferred(tokenId, msg.sender, buyer, msg.value);
        licenseOwner[tokenId] = buyer;
    }

    // ─────────────────────────────────────────────────────────
    //  CDR READ CONDITION
    // ─────────────────────────────────────────────────────────

    function checkReadCondition(
        address caller,
        bytes calldata conditionData,
        bytes calldata
    ) external view returns (bool) {
        uint256 listingId = abi.decode(conditionData, (uint256));
        Listing storage l = listings[listingId];
        if (!l.settled) return false;
        return caller == l.winner;
    }

    // ─────────────────────────────────────────────────────────
    //  VIEW HELPERS
    // ─────────────────────────────────────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getBidCount(uint256 listingId) external view returns (uint256) {
        return bids[listingId].length;
    }

    function getBundleSellers(uint256 listingId) external view returns (BundleSeller[] memory) {
        return bundleSellers[listingId];
    }

    // ── Internal ─────────────────────────────────────────────

    function _refund(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}