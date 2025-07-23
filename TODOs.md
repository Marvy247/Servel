# Project TODOs for Contract Deployment Feature

## 1. Contracts
- [done] Add 6 OpenZeppelin-based contracts to `contracts/src/`:
  - ERC20Token.sol (already added)
  - ERC721NFT.sol
  - NFTDrop.sol
  - Marketplace.sol
  - MultiSigWallet.sol
  - TokenVesting.sol
- [done] Ensure OpenZeppelin contracts are installed and properly configured with Foundry.
- [done] Write or adapt contracts with necessary constructor parameters and functionality.

## 2. Backend
- [done] Create a service or configuration file listing available contracts with metadata:
  - Contract name
  - Description
  - Constructor parameters
  - Icon/image (optional)
- [done] Add API endpoints in `backend/routes/dashboard.ts` or a new route file:
  - `GET /contracts` - List available contracts for deployment.
  - `POST /contracts/deploy` - Deploy selected contract with parameters.
- [done] Integrate API endpoints with `DeploymentService` for actual deployment.
- [done] Use `eventListenerService` to stream deployment logs and status updates to frontend.
- [done] Implement notification system for deployment success/failure.

## 3. Frontend
- [done] Create a deployment page similar to thirdweb.com/explore:
  - Display list of available contracts with descriptions and images.
  - Allow users to select a contract and input constructor parameters.
  - Trigger deployment via backend API.
  - Show real-time deployment status and logs.
  - Display deployed contract information and management options (e.g., verify, rollback).
- [done] Use existing hooks and services for API calls and event streaming.
- [done] Ensure responsive and user-friendly UI/UX.

## 4. Testing
- [ ] Write unit tests for all new contracts.
- [ ] Write integration tests for backend API endpoints.
- [ ] Perform UI testing for deployment page:
  - Critical-path testing: contract selection, deployment trigger, status display.
  - Thorough testing: all UI interactions, error handling, edge cases.
- [ ] Conduct end-to-end testing of deployment flow from frontend to blockchain.

## 5. Documentation
- [ ] Update README and project documentation with instructions on contract deployment feature.
- [ ] Document backend API endpoints and frontend usage.
- [ ] Provide examples and troubleshooting tips.

---

This TODO list outlines the comprehensive steps to implement the user contract deployment feature similar to thirdweb's explore page.
