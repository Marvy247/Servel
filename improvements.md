# TODO - Contract Deployment MVP Improvements (Incremental)

[done] 1. Guided Deployment Wizard
- Design and implement a step-by-step wizard UI for contract deployment.
- Include artifact selection, environment/network selection, deployment progress, verification, and testing steps.
- Add progress indicators and clear instructions for each step.

## 2. Auto-detect Deployed Contract Addresses
- Implement backend logic to capture deployed contract addresses automatically.
- Update frontend to pre-fill verification forms with detected addresses.
- Reduce manual input and errors.

## 3. Real-time Deployment Logs and Status Updates
- Stream deployment logs from backend to frontend in real-time.
- Display detailed status and error messages during deployment.
- Allow users to monitor deployment progress live.

## 4. Environment and Network Selection
- Add UI controls for selecting deployment environment (production, staging, development).
- Support multiple blockchain networks with easy switching.
- Persist user preferences for environment and network.

## 5. GitHub / VCS Integration
- Link deployments to GitHub commits and branches.
- Display commit info and links in deployment history.
- Enable triggering deployments from GitHub actions or webhooks.

## 6. Gas Usage Estimation and Optimization Tips
- Estimate gas costs before deployment.
- Provide optimization suggestions to reduce gas usage.
- Display gas usage stats in deployment summary.

## 7. Notifications and Alerts
- Notify users of deployment success, failure, or issues.
- Support email, in-app, or webhook notifications.
- Allow users to configure notification preferences.

## 8. Rollback and Redeploy Options
- Enable easy rollback to previous contract versions.
- Provide redeploy options for failed or problematic deployments.
- Track rollback history in deployment dashboard.

## 9. User Authentication and Role-based Access Control
- Implement user login and authentication.
- Define roles and permissions for deployment actions.
- Secure deployment endpoints and UI accordingly.

## 10. Dashboard Widget for Deployment Status
- Add a dashboard widget showing quick deployment status overview.
- Include success rates, recent deployments, and alerts.
- Allow quick access to deployment actions from the widget.

## 11. Detailed Error Messages and Troubleshooting Guidance
- Provide clear, actionable error messages on deployment failures.
- Include troubleshooting tips and links to documentation.
- Help users resolve common deployment issues quickly.