export interface Contract {
  name: string;
  address: string;
  network: string;
  verified: boolean;
  lastDeployed: string;
}

import { DeploymentService } from '../deployment';

export async function getContracts(projectId: string): Promise<Contract[]> {
  const deploymentService = DeploymentService.getInstance();
  const deployments = deploymentService.getTrackedDeployments();

  const contracts: Contract[] = [];

  for (const [network, artifacts] of Object.entries(deployments)) {
    for (const artifact of artifacts) {
      contracts.push({
        name: artifact.contractName || 'Unknown',
        address: artifact.address,
        network: artifact.network,
        verified: false, // DeploymentArtifact does not have verified property
        lastDeployed: artifact.lastDeployed || new Date().toISOString(),
      });
    }
  }

  return contracts;
}
