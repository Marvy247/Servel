interface ContractMetadata {
  name: string;
  description: string;
  constructorParams: { name: string; type: string; description?: string }[];
  icon?: string;
}

const contractsMetadata: ContractMetadata[] = [
  {
    name: "ERC20Token",
    description: "Standard ERC20 token contract",
    constructorParams: [
      { name: "name", type: "string", description: "Token name" },
      { name: "symbol", type: "string", description: "Token symbol" },
      { name: "initialSupply", type: "uint256", description: "Initial token supply" },
    ],
    icon: "/icons/erc20.svg",
  },
  {
    name: "ERC721NFT",
    description: "Standard ERC721 NFT contract",
    constructorParams: [
      { name: "name", type: "string", description: "NFT collection name" },
      { name: "symbol", type: "string", description: "NFT symbol" },
    ],
    icon: "/icons/erc721.svg",
  },
  {
    name: "Governor",
    description: "On-chain governance contract",
    constructorParams: [
      { name: "token", type: "address" },
      { name: "timelock", type: "address" },
    ],
    icon: "/icons/governor.svg",
  },
  {
    name: "Marketplace",
    description: "NFT marketplace contract",
    constructorParams: [],
    icon: "/icons/marketplace.svg",
  },
  {
    name: "MultiSigWallet",
    description: "Multi-signature wallet contract",
    constructorParams: [
      { name: "owners", type: "address[]" },
      { name: "numConfirmationsRequired", type: "uint256" },
    ],
    icon: "/icons/multisig.svg",
  },
  {
    name: "NFTDrop",
    description: "NFT drop contract with max supply and drop period",
    constructorParams: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "maxSupply", type: "uint256" },
      { name: "dropStart", type: "uint256" },
      { name: "dropEnd", type: "uint256" },
    ],
    icon: "/icons/nftdrop.svg",
  },
  {
    name: "TimelockController",
    description: "Governance timelock contract",
    constructorParams: [
      { name: "minDelay", type: "uint256" },
      { name: "proposers", type: "address[]" },
      { name: "executors", type: "address[]" },
      { name: "admin", type: "address" },
    ],
    icon: "/icons/timelock.svg",
  },
  {
    name: "TokenVesting",
    description: "Token vesting contract",
    constructorParams: [
      { name: "token", type: "address" },
      { name: "beneficiary", type: "address" },
      { name: "start", type: "uint256" },
      { name: "cliff", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    icon: "/icons/vesting.svg",
  },
];

export function getContractsMetadata(): ContractMetadata[] {
  return contractsMetadata;
}
