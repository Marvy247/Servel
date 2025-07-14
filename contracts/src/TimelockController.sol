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

    // Additional utility functions can be added here
    function getMinDelay() public view override returns (uint256) {
        return super.getMinDelay();
    }

    function getTimestamp(bytes32 id) public view override returns (uint256) {
        return super.getTimestamp(id);
    }

    function isOperation(bytes32 id) public view override returns (bool) {
        return super.isOperation(id);
    }

    function isOperationPending(bytes32 id) public view override returns (bool) {
        return super.isOperationPending(id);
    }

    function isOperationReady(bytes32 id) public view override returns (bool) {
        return super.isOperationReady(id);
    }

    function isOperationDone(bytes32 id) public view override returns (bool) {
        return super.isOperationDone(id);
    }
}