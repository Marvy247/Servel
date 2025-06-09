import { DeploymentArtifact } from '../../types';

export class DeploymentTracker {
  private deployments: Map<string, DeploymentArtifact[]> = new Map();

  trackDeployment(network: string, artifact: DeploymentArtifact): void {
    if (!this.deployments.has(network)) {
      this.deployments.set(network, []);
    }
    this.deployments.get(network)?.push(artifact);
  }

  getDeployments(network: string): DeploymentArtifact[] {
    return this.deployments.get(network) || [];
  }

  getAllDeployments(): Record<string, DeploymentArtifact[]> {
    return Object.fromEntries(this.deployments);
  }
}
