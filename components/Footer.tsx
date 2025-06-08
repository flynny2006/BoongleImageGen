
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center py-8 mt-auto">
      <p className="text-slate-500 text-sm">
        Powered by <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-400 hover:text-sky-300 hover:underline">Google Gemini</a>.
      </p>
      <p className="text-slate-600 text-xs mt-1">
        Crafted with React, TypeScript, and Tailwind CSS.
      </p>
    </footer>
  );
};
