import { SlitherService } from '../slitherService'
import { SlitherConfig, BatchSlitherConfig } from '../types'
import { join } from 'path'
import { execSync } from 'child_process'
import fs from 'fs'

jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

describe('SlitherService', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>
  const mockExistsSync = jest.spyOn(fs, 'existsSync')

  beforeEach(() => {
    jest.clearAllMocks()
    mockExistsSync.mockReturnValue(true)
  })

  const testConfig: SlitherConfig = {
    target: 'test.sol',
    rootPath: join(__dirname, '../../../contracts'),
    excludeInheritance: true
  }

  const batchTestConfig: BatchSlitherConfig = {
    targets: ['contract1.sol', 'contract2.sol'],
    rootPath: join(__dirname, '../../../contracts'),
    commonOptions: {
      excludeInheritance: true
    }
  }

  it('should analyze contract successfully', async () => {
    mockExecSync.mockReturnValueOnce(Buffer.from(JSON.stringify({
      detectors: [{
        check: 'unused-return',
        impact: 'Optimization',
        description: 'Unused return value'
      }]
    })))

    const result = await SlitherService.analyze(testConfig)
    expect(result.success).toBe(true)
    expect(result.jsonReport).toBeDefined()
    expect(result.markdownReport).toContain('# Static Analysis Report')
    expect(result.warnings).toEqual(['unused-return'])
  })

  it('should handle analysis errors', async () => {
    mockExecSync.mockImplementationOnce(() => {
      throw new Error('Analysis failed')
    })

    const result = await SlitherService.analyze(testConfig)
    expect(result.success).toBe(false)
    expect(result.errors).toContain('Analysis failed')
  })

  describe('Batch Analysis', () => {
    it('should analyze multiple contracts successfully', async () => {
      mockExecSync
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          detectors: [{
            check: 'unused-return',
            impact: 'Optimization',
            description: 'Unused return value'
          }]
        })))
        .mockReturnValueOnce(Buffer.from(JSON.stringify({
          detectors: [{
            check: 'pragma-version',
            impact: 'Informational',
            description: 'Pragma version'
          }]
        })))

      const results = await SlitherService.analyzeBatch(batchTestConfig)
      expect(results.length).toBe(2)
      expect(results[0].success).toBe(true)
      expect(results[0].warnings).toEqual(['unused-return'])
      expect(results[1].success).toBe(true)
      expect(results[1].informational).toEqual(['pragma-version'])
    })

    it('should handle partial failures in batch analysis', async () => {
      mockExecSync
        .mockImplementation((command: string) => {
          if (command.includes('contract1.sol')) {
            return Buffer.from(JSON.stringify({
              detectors: [{
                check: 'unused-return',
                impact: 'Optimization',
                description: 'Unused return value'
              }]
            }))
          } else if (command.includes('contract2.sol')) {
            return Buffer.from(JSON.stringify({
              detectors: [{
                check: 'pragma-version',
                impact: 'Informational',
                description: 'Pragma version'
              }]
            }))
          } else if (command.includes('invalid.sol')) {
            throw new Error('Analysis failed')
          }
          throw new Error('Unexpected command')
        })

      const results = await SlitherService.analyzeBatch({
        targets: ['contract1.sol', 'contract2.sol', 'invalid.sol'],
        rootPath: join(__dirname, '../../../contracts'),
        commonOptions: {
          excludeInheritance: true
        }
      })
      expect(results.length).toBe(3)
      expect(results[0].success).toBe(true)
      expect(results[0].warnings).toEqual(['unused-return'])
      expect(results[1].success).toBe(true)
      expect(results[1].informational).toEqual(['pragma-version'])
      expect(results[2].success).toBe(false)
      expect(results[2].errors).toContain('Analysis failed')
    })

    it('should handle missing contract files', async () => {
      mockExistsSync.mockImplementation((path: fs.PathLike) => 
        !path.toString().includes('missing.sol')
      )

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('valid.sol')) {
          return Buffer.from(JSON.stringify({
            detectors: []
          }))
        }
        throw new Error('Unexpected command')
      })

      const results = await SlitherService.analyzeBatch({
        targets: ['valid.sol', 'missing.sol'],
        rootPath: join(__dirname, '../../../contracts'),
        commonOptions: {
          excludeInheritance: true
        }
      })
      expect(results.length).toBe(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].errors).toContain('Contract file not found')
    })
  })
})
