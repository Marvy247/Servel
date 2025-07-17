// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract MyTimelock is TimelockController {
    event TimelockInitialized(
        uint256 minDelay,
        address[] proposers,
        address[] executors,
        address admin
    );

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        emit TimelockInitialized(minDelay, proposers, executors, admin);
    }
}