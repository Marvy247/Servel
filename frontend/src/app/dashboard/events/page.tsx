'use client'

import EventLogViewer from '../../../components/dashboard/EventLogViewer'
import { useWeb3 } from '../../../providers/web3'

export default function EventsPage() {
  const { provider } = useWeb3()

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-gray-100">Contract Events</h1>
      {provider ? (
        <EventLogViewer />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Connect your wallet to view events</p>
        </div>
      )}
    </div>
  )
}
