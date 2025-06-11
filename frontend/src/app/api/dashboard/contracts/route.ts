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

  // Mock contracts data
  const contracts = [
    {
      name: 'Token',
      address: '0x123...456',
      compiler: '0.8.20',
      verified: true,
      size: '2.5 KB',
      functions: 12,
      lastDeployed: new Date(Date.now() - 86400000).toISOString()
    },
    {
      name: 'Vault',
      address: '0x789...012',
      compiler: '0.8.19',
      verified: true,
      size: '4.2 KB',
      functions: 18,
      lastDeployed: new Date(Date.now() - 172800000).toISOString()
    },
    {
      name: 'Governance',
      address: '0x345...678',
      compiler: '0.8.18',
      verified: false,
      size: '5.7 KB',
      functions: 24,
      lastDeployed: new Date(Date.now() - 259200000).toISOString()
    }
  ]

  await new Promise(resolve => setTimeout(resolve, 500))

  return NextResponse.json(contracts, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
