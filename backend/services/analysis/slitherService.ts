import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { SlitherAnalysisResult, SlitherConfig, BatchSlitherConfig } from './types'

export class SlitherService {
  private static readonly DEFAULT_ARGS = [
    '--json -',
    '--exclude-dependencies'
  ]

  static async analyze(config: SlitherConfig): Promise<SlitherAnalysisResult> {
    return (await this.analyzeBatch({
      targets: [config.target],
      rootPath: config.rootPath,
      commonOptions: {
        excludeInheritance: config.excludeInheritance,
        excludeAssembly: config.excludeAssembly,
        filterPaths: config.filterPaths
      }
    }))[0]
  }

  static async analyzeBatch(config: BatchSlitherConfig): Promise<SlitherAnalysisResult[]> {
    try {
      // Process all targets
      const results: SlitherAnalysisResult[] = []
      
      for (const target of config.targets) {
        try {
          // Resolve and verify contract file exists
          const targetPath = config.rootPath 
            ? resolve(join(config.rootPath, target))
            : resolve(target)
            
          if (!existsSync(targetPath)) {
            results.push({
              success: false,
              errors: ['Contract file not found'],
              warnings: [],
              informational: [],
              lowIssues: [],
              mediumIssues: [],
              highIssues: [],
              jsonReport: { 
                error: `File not found: ${targetPath}`,
                target: targetPath 
              },
              markdownReport: `# Analysis Failed\n\nFile not found: ${targetPath}`
            })
            continue
          }

          // Run slither with configured options
          const args = this.buildSlitherArgs({
            target: targetPath,
            rootPath: config.rootPath,
            ...config.commonOptions
          })
          const command = `slither ${args.join(' ')}`
          
          console.log(`Executing: ${command}`)

          const output = execSync(command, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'] // Capture stdout and stderr
          }).toString()

          if (!output) {
            // Try to get stderr if stdout is empty
            try {
              const errorOutput = execSync(command, {
                encoding: 'utf-8',
                stdio: ['ignore', 'ignore', 'pipe'] // Only capture stderr
              }).toString()
              throw new Error(`Slither analysis failed: ${errorOutput || 'No output from slither'}`)
            } catch (err) {
              throw new Error(`Slither execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          }

          // Parse and format results
          let jsonResult
          try {
            jsonResult = JSON.parse(output)
          } catch (parseError) {
            throw new Error(`Failed to parse Slither output: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
          }
          const hasCriticalErrors = jsonResult.errors && jsonResult.errors.some((e: {type?: string; severity?: string}) => 
            e.type === 'error' || e.severity === 'error'
          );
          const categorized = this.categorizeIssues(jsonResult);
          results.push({
            success: !hasCriticalErrors,
            ...categorized,
            jsonReport: jsonResult,
            markdownReport: this.generateMarkdownReport(jsonResult),
          })
        } catch (error) {
          let errorMessage = 'Unknown error during analysis';
          if (error instanceof Error) {
            if (error.message.includes('command not found')) {
              errorMessage = 'Slither not installed - please install slither-analyzer';
            } else if (error.message.includes('No such file')) {
              errorMessage = `Contract file not found: ${target}`;
            } else {
              const stderrMatch = error.message.match(/Slither error: (.*)/);
              errorMessage = stderrMatch ? stderrMatch[1] : error.message;
            }
          }
          console.error(`Slither analysis failed for ${target}:`, error)
          results.push({
            success: false,
            errors: [errorMessage],
            warnings: [],
            informational: [],
            lowIssues: [],
            mediumIssues: [],
            highIssues: [],
            jsonReport: {},
            markdownReport: '',
          })
        }
      }
      
      return results
    } catch (error) {
      const results: SlitherAnalysisResult[] = []
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        // Extract more detailed error message from stderr if available
        const stderrMatch = error.message.match(/Slither error: (.*)/)
        errorMessage = stderrMatch ? stderrMatch[1] : error.message
      }
      console.error(`Slither analysis failed:`, error)
      results.push({
        success: false,
        errors: [errorMessage],
        warnings: [],
        informational: [],
        lowIssues: [],
        mediumIssues: [],
        highIssues: [],
        jsonReport: {},
        markdownReport: '',
      })
      return results
    }
  }

  private static buildSlitherArgs(config: SlitherConfig & { target: string }): string[] {
    const args = [...this.DEFAULT_ARGS]
    if (config.excludeInheritance) args.push('--exclude-inheritance')
    if (config.excludeAssembly) args.push('--exclude-assembly')
    if (config.filterPaths) args.push(`--filter-paths ${config.filterPaths.join(',')}`)
    args.push(config.target)
    return args
  }

  private static categorizeIssues(result: {
    errors?: Array<{type?: string; severity?: string}>;
    detectors?: Array<{
      impact?: string;
      severity?: string;
      check?: string;
      confidence?: string;
      description?: string;
      extra?: {solution?: string}
    }>
  }): Omit<SlitherAnalysisResult, 'success' | 'jsonReport' | 'markdownReport'> {
    const errors = (result.errors || [])
      .filter((e: {type?: string; severity?: string}) => e.type === 'error' || e.severity === 'error')
      .map(e => e.type || e.severity || 'Unknown error') || [];
    
    const warnings = (result.detectors || [])
      .filter((d: {impact?: string; severity?: string}) => d.impact === 'Optimization' || d.severity === 'warning')
      .map(d => d.check || d.description || 'Warning') || [];
    
    const informational = (result.detectors || [])
      .filter((d: {impact?: string; severity?: string}) => d.impact === 'Informational' || d.severity === 'info')
      .map(d => d.check || d.description || 'Informational') || [];
    
    return {
      errors,
      warnings,
      informational,
      lowIssues: (result.detectors || [])
        .filter((d: {impact?: string}) => d.impact === 'Low')
        .map(d => d.check || d.description || 'Low severity issue') || [],
      mediumIssues: (result.detectors || [])
        .filter((d: {impact?: string}) => d.impact === 'Medium')
        .map(d => d.check || d.description || 'Medium severity issue') || [],
      highIssues: (result.detectors || [])
        .filter((d: {impact?: string}) => d.impact === 'High')
        .map(d => d.check || d.description || 'High severity issue') || [],
    }
  }

  private static generateMarkdownReport(result: {
    contract?: string;
    detectors?: Array<{
      check?: string;
      impact?: string;
      confidence?: string;
      description?: string;
      extra?: {
        solution?: string;
        reference?: string;
        lines?: number[];
        file?: string;
        contract?: string;
        function?: string;
        variables?: string[];
      }
    }>
  }): string {
    const detectors = result.detectors || [];
    
    // Group by severity
    const grouped: Record<string, typeof detectors> = {
      High: [],
      Medium: [],
      Low: [],
      Informational: []
    };

    detectors.forEach(d => {
      const severity = d.impact || 'Informational';
      grouped[severity] = grouped[severity] || [];
      grouped[severity].push(d);
    });

    let report = `# Static Analysis Report\n\n` +
      `## Summary\n\n` +
      `- **Contract**: ${result.contract || 'Unknown'}\n` +
      `- **Total Findings**: ${detectors.length}\n` +
      `- **High**: ${grouped.High.length} | ` +
      `**Medium**: ${grouped.Medium.length} | ` +
      `**Low**: ${grouped.Low.length} | ` +
      `**Info**: ${grouped.Informational.length}\n\n`;

    // Add findings by severity
    for (const [severity, findings] of Object.entries(grouped)) {
      if (findings.length === 0) continue;
      
      report += `## ${severity} Severity Findings\n\n`;

      report += findings.map(d => {
        const fileLink = d.extra?.file ? 
          `[${d.extra.file}](${this.getGitHubLink(d.extra.file, d.extra.lines?.[0])})` : 
          'Unknown file';
        
        return `### ${d.check}\n` +
          `**File**: ${fileLink}\n` +
          `**Lines**: ${d.extra?.lines?.join(', ') || 'N/A'}\n` +
          `**Confidence**: ${d.confidence}\n\n` +
          `${d.description}\n\n` +
          `#### Solution\n${d.extra?.solution || 'No solution provided'}\n` +
          (d.extra?.reference ? `[Reference](${d.extra.reference})` : '') + `\n\n`;
      }).join('\n');
    }

    return report;
  }

  private static getGitHubLink(filePath: string, line?: number): string {
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    
    if (!repo) {
      console.warn('GITHUB_REPO environment variable not set');
      return '#';
    }

    // Handle both full URLs and owner/repo format
    let repoUrl = repo.includes('://') ? repo : `https://github.com/${repo}`;
    repoUrl = repoUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Clean file path
    const cleanPath = filePath.replace(/^\//, ''); // Remove leading slash
    
    return `${repoUrl}/blob/${branch}/${cleanPath}` + (line ? `#L${line}` : '');
  }
}
