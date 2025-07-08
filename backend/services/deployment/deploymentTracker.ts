import { DeploymentArtifact } from '../../types';

export class DeploymentTracker {
  // Map projectId -> Map network -> DeploymentArtifact[]
  private deployments: Map<string, Map<string, DeploymentArtifact[]>> = new Map();

  trackDeployment(projectId: string, network: string, artifact: DeploymentArtifact): void {
    console.log(`Tracking deployment for projectId=${projectId}, network=${network}, contract=${artifact.contractName}, lastDeployed=${artifact.lastDeployed}`);
    if (!this.deployments.has(projectId)) {
      this.deployments.set(projectId, new Map());
    }
    const projectDeployments = this.deployments.get(projectId)!;

    if (!projectDeployments.has(network)) {
      projectDeployments.set(network, []);
    }
    // Check if contract with same address exists, update lastDeployed if newer
    const existing = projectDeployments.get(network) || [];
    const index = existing.findIndex(d => d.address === artifact.address);
    if (index !== -1) {
      // Update lastDeployed if artifact has newer timestamp
      if (artifact.lastDeployed && (!existing[index].lastDeployed || artifact.lastDeployed > existing[index].lastDeployed)) {
        existing[index].lastDeployed = artifact.lastDeployed;
      }
      existing[index] = { ...existing[index], ...artifact };
    } else {
      existing.push(artifact);
    }
    projectDeployments.set(network, existing);
  }

  getDeployments(projectId: string, network: string): DeploymentArtifact[] {
    return this.deployments.get(projectId)?.get(network) || [];
  }

  getAllDeployments(projectId?: string): Record<string, DeploymentArtifact[]> {
    if (projectId) {
      const projectDeployments = this.deployments.get(projectId);
      if (!projectDeployments) return {};
      return Object.fromEntries(projectDeployments);
    }
    // Return all deployments for all projects
    const all: Record<string, DeploymentArtifact[]> = {};
    for (const [projId, networks] of this.deployments.entries()) {
      for (const [network, deployments] of networks.entries()) {
        const key = `${projId}:${network}`;
        all[key] = deployments;
      }
    }
    return all;
  }
}
