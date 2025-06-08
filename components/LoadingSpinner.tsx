
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="my-12 flex flex-col items-center justify-center text-center" aria-label="Loading content">
      <div className="w-16 h-16 border-4 border-dashed border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-xl font-semibold text-sky-300">Conjuring pixels...</p>
      <p className="text-sm text-slate-400">Your masterpiece is being crafted by the AI.</p>
    </div>
  );
};
