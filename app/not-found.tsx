import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-black text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-neon mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-neon text-black font-semibold rounded-lg hover:bg-neon/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
