export interface DeploymentArtifact {
  projectId?: string;
  contractName?: string;
  address: string;
  abi: any[];
  bytecode: string;
  deployedBytecode: string;
  network: string;
  lastDeployed?: string; // ISO timestamp string
}
