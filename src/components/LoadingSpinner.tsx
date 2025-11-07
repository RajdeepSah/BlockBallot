import React from 'react';
import { Vote } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Vote className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
        <p className="mt-6 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
