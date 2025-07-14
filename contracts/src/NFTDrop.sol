// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTDrop is ERC721, Ownable {
    uint256 private _tokenIds;
    uint256 public maxSupply;
    uint256 public dropStart;
    uint256 public dropEnd;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _dropStart,
        uint256 _dropEnd
    ) ERC721(name, symbol) Ownable(msg.sender) {  // Initialize Ownable with msg.sender
        maxSupply = _maxSupply;
        dropStart = _dropStart;
        dropEnd = _dropEnd;
    }

    function mint(address to) public onlyOwner returns (uint256) {
        require(block.timestamp >= dropStart && block.timestamp <= dropEnd, "Drop not active");
        require(_tokenIds < maxSupply, "Max supply reached");
        _tokenIds++;
        _mint(to, _tokenIds);
        return _tokenIds;
    }
}