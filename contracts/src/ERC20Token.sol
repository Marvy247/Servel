// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimalPlaces
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(initialSupply > 0, "Initial supply must be greater than 0");
        require(decimalPlaces <= 18, "Decimals cannot exceed 18");
        
        _decimals = decimalPlaces;
        _mint(msg.sender, initialSupply * 10 ** decimalPlaces);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}