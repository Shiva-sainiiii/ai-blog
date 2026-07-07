import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-6">
      <p className="font-display text-6xl text-signal/40">404</p>
      <p className="font-display text-2xl">This page doesn't exist</p>
      <p className="text-parchment/50 max-w-sm">
        The post or page you're looking for may have been moved or deleted.
      </p>
      <Link to="/" className="btn-signal mt-2">
        Back to homepage
      </Link>
    </div>
  );
}
