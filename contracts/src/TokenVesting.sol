// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TokenVesting is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable cliff;
    uint256 public immutable duration;
    uint256 public released;

    event TokensReleased(address beneficiary, uint256 amount);

    constructor(
        IERC20 _token,
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration
    ) Ownable(msg.sender) {
        require(address(_token) != address(0), "Invalid token address");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_cliff <= _duration, "Cliff > duration");
        require(_duration > 0, "Duration must be > 0");

        token = _token;
        beneficiary = _beneficiary;
        start = _start;
        cliff = _start + _cliff;
        duration = _duration;
    }

    function release() external nonReentrant {
        uint256 unreleased = releasableAmount();
        require(unreleased > 0, "No tokens to release");

        released += unreleased;
        require(token.transfer(beneficiary, unreleased), "Transfer failed");
        
        emit TokensReleased(beneficiary, unreleased);
    }

    function releasableAmount() public view returns (uint256) {
        return vestedAmount() - released;
    }

    function vestedAmount() public view returns (uint256) {
        uint256 currentBalance = token.balanceOf(address(this));
        uint256 totalBalance = currentBalance + released;

        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= start + duration) {
            return totalBalance;
        } else {
            return (totalBalance * (block.timestamp - start)) / duration;
        }
    }

    // Emergency function to recover other ERC20 tokens accidentally sent
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(token), "Cannot withdraw vesting token");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}