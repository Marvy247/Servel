import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Project ID is required' },
      { status: 400 }
    )
  }

  // Mock test coverage data
  const coverageData = {
    total: 92,
    files: [
      {
        path: 'contracts/Token.sol',
        coverage: 95,
        lines: {
          total: 120,
          covered: 114,
          missed: 6
        }
      },
      {
        path: 'contracts/Vault.sol',
        coverage: 89,
        lines: {
          total: 85,
          covered: 76,
          missed: 9
        }
      }
    ]
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  return NextResponse.json(coverageData, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
