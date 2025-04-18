import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mt-4">Page Not Found</h2>
      <p className="text-gray-600 mt-2">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link 
        href="/"
        className="mt-6 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
} 