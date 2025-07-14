// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is Ownable {
    struct Listing {
        address seller;
        uint256 price;
    }

    // NFT contract address => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    event Listed(address indexed nftContract, uint256 indexed tokenId, address seller, uint256 price);
    event Sale(address indexed nftContract, uint256 indexed tokenId, address buyer, uint256 price);
    event Cancelled(address indexed nftContract, uint256 indexed tokenId);

    constructor() Ownable(msg.sender) {}  // Initialize Ownable with msg.sender

    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not owner");
        require(price > 0, "Price must be > 0");

        listings[nftContract][tokenId] = Listing(msg.sender, price);
        emit Listed(nftContract, tokenId, msg.sender, price);
    }

    function buyItem(address nftContract, uint256 tokenId) external payable {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.price > 0, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == listing.seller, "Seller no longer owner");

        // Transfer payment to seller
        payable(listing.seller).transfer(listing.price);

        // Transfer NFT to buyer
        nft.transferFrom(listing.seller, msg.sender, tokenId);

        // Remove listing
        delete listings[nftContract][tokenId];

        emit Sale(nftContract, tokenId, msg.sender, listing.price);
    }

    function cancelListing(address nftContract, uint256 tokenId) external {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.seller == msg.sender, "Not seller");

        delete listings[nftContract][tokenId];
        emit Cancelled(nftContract, tokenId);
    }
}