import { Web3Provider } from '../../providers/web3';
import Header from '../../components/dashboard/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Web3Provider>
      <div className="min-h-screen">
        {/* Background image with dark overlay */}
        <div className="fixed inset-0 -z-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/backgroundblue.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Header and main content */}
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

      </div>
    </Web3Provider>
  );
}
