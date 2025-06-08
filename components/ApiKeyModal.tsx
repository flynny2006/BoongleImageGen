
import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApiKey: (apiKey: string) => void;
  currentApiKey: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaveApiKey, currentApiKey }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(currentApiKey || '');
      setMessage(null); // Reset message when modal opens
    }
  }, [isOpen, currentApiKey]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
        setMessage("API Key cannot be empty.");
        return;
    }
    onSaveApiKey(apiKeyInput.trim());
    setMessage("API Key saved successfully!");
    // Optionally close after a delay or let user close
    // setTimeout(() => { onClose(); }, 1500); 
  };

  return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-key-modal-title"
    >
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg ring-1 ring-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 id="api-key-modal-title" className="text-2xl font-bold text-sky-300">
            Set Your Gemini API Key
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close API Key modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-1">
              Gemini API Key
            </label>
            <input
              type="password" // Use password type to obscure the key
              id="apiKey"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-slate-100 placeholder-slate-400"
              placeholder="Enter your Gemini API Key"
            />
             <p className="text-xs text-slate-400 mt-2">
              Your API key is stored locally in your browser's localStorage and is only sent to Google for API requests.
            </p>
          </div>

          {message && <p className={`text-sm mb-4 ${message.includes("successfully") ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all"
            >
              Save API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
