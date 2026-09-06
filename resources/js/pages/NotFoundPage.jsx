import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
      <span className="text-5xl font-serif font-extrabold text-burgundy-700 mb-3">404</span>
      <h2 className="text-xl font-bold text-charcoal-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-charcoal-600 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Return to Home
        </Button>
      </Link>
    </div>
  );
}
