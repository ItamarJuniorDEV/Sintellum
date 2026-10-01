export class WorkspaceSecurityPolicy {
  private readonly trusted: boolean;
  constructor(trusted: boolean) { this.trusted = trusted; }
  canReadWorkspaceForStaticAnalysis(): boolean { return true; }
  canPersistToProject(): boolean { return this.trusted; }
  canUseLocalAi(explicitlyConfigured = true): boolean { return this.trusted && explicitlyConfigured; }
  canUseCloudAi(explicitlyConfigured = false): boolean { return this.trusted && explicitlyConfigured; }
}
