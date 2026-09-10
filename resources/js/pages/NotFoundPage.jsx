import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto px-4">
      <span className="text-6xl font-serif font-extrabold gradient-text mb-3">404</span>
      <h2 className="text-2xl font-serif font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-400 mb-8">
        The page you are looking for does not exist, has expired, or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home} size="lg" className="shadow-lg shadow-magenta-500/25">
          Return to Home
        </Button>
      </Link>
    </div>
  );
}
