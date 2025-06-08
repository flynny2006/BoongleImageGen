import React from 'react';
import type { GeneratedImage } from '../types';

interface ImageDisplayAreaProps {
  images: GeneratedImage[] | null;
  onDownload: (imageId: string) => void;
  isLoading: boolean;
}

// ImageIcon component (Heroicons) - Placeholder when no image
const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

// DownloadIcon component (Heroicons)
const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const ImageDisplayArea: React.FC<ImageDisplayAreaProps> = ({ images, onDownload, isLoading }) => {
  if (isLoading) {
    return null; // Loading spinner is handled in App.tsx
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full max-w-3xl bg-slate-800/70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl ring-1 ring-slate-700 flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[400px]">
        <ImageIcon className="w-24 h-24 text-slate-600 mb-6" />
        <h3 className="text-2xl font-semibold text-slate-400 mb-2">Your Masterpiece Awaits</h3>
        <p className="text-slate-500">Enter a prompt above and click "Generate Image" to see the magic happen!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl animate-fadeIn grid gap-6 mt-8">
      {images.map((image, index) => (
        <div key={image.id} className="bg-slate-800/70 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl ring-1 ring-slate-700">
          <div className="aspect-[auto_512/512] sm:aspect-video md:aspect-[16/9] lg:aspect-[auto_768/512] overflow-hidden rounded-lg mb-6 shadow-inner bg-slate-700">
            <img
              src={`data:${image.mimeType};base64,${image.base64Data}`}
              alt={`${image.prompt}${images.length > 1 ? ` - Variation ${index + 1}` : ''}`}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400 italic truncate flex-1" title={image.prompt}>
              {images.length > 1 ? `Variation ${index + 1} of "` : 'Prompt: "'}
              {image.prompt}"
            </p>
            <button
              onClick={() => onDownload(image.id)}
              className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-green-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-all duration-150 ease-in-out flex items-center justify-center group"
              aria-label={`Download image ${images.length > 1 ? `variation ${index + 1}` : ''}`}
            >
              <DownloadIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
              Download {images.length > 1 && `V${index + 1}`}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};