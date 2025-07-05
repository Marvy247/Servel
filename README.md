# Servel - Web3 DevInfra-as-a-Service Platform

## Quickstart Guide

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Docker (for local blockchain node)
- Foundry (forge, anvil, cast)

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required environment variables
3. Start Anvil local blockchain node:
   ```bash
   docker build -t servel-anvil devops/
   docker run -p 8545:8545 servel-anvil
   ```
4. Install backend dependencies and start backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. Install frontend dependencies and start frontend server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
6. Open http://localhost:3000 in your browser

## Features Overview
- Smart contract deployment and verification
- Static analysis and fuzz testing integration
- Real-time event streaming and historical queries
- Developer dashboard with contract interaction, event logs, monitoring, and testing
- Wallet connection and network switching (Sepolia & Anvil)
- CI/CD integration with GitHub Actions (basic)
- Quick actions for deploy, verify, and test contracts

## Contribution Guidelines
- Fork the repository and create a feature branch
- Write tests for new features or bug fixes
- Follow existing code style and conventions
- Submit pull requests with clear descriptions

## Roadmap
- DevOps automation and monitoring
- Multi-chain support and team collaboration
- Advanced analytics and gas optimization suggestions
- Improved UI/UX and onboarding flows
- Comprehensive demo and pitch materials

## License
MIT License
