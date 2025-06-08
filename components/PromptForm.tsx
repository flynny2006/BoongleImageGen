import React from 'react';

interface PromptFormProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isGenerationDisabled: boolean;
  isLoggedIn: boolean; // New prop
}

// SparklesIcon component (Heroicons)
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L25.5 5.25l-.813 2.846a4.5 4.5 0 0 0-3.09 3.09L18.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L11.25 18.75l.813-2.846a4.5 4.5 0 0 0 3.09-3.09L18.25 12Z" />
  </svg>
);

export const PromptForm: React.FC<PromptFormProps> = ({ prompt, onPromptChange, onSubmit, isLoading, isGenerationDisabled, isLoggedIn }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isDisabled = isLoading || isGenerationDisabled || !prompt.trim() || !isLoggedIn;
  let buttonText = "Generate Image";
  let ariaLabel = "Generate image";

  if (isLoading) {
    buttonText = "Generating...";
    ariaLabel = "Generating image, please wait";
  } else if (!isLoggedIn) {
    buttonText = "Login to Generate";
    ariaLabel = "Login to generate image";
  }


  return (
    <form onSubmit={handleSubmit} className="w-full bg-slate-800/70 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl mb-8 ring-1 ring-slate-700">
      <label htmlFor="prompt" className="block text-lg font-semibold mb-3 text-sky-300">
        Enter your creative prompt:
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="e.g., A mystical forest with glowing mushrooms and a hidden waterfall, cinematic lighting"
        rows={4}
        className="w-full p-4 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-y text-slate-100 placeholder-slate-400 transition-colors duration-150 ease-in-out"
        disabled={isLoading || !isLoggedIn}
        aria-describedby="generation-tip"
      />
      <button
        type="submit"
        disabled={isDisabled}
        className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center group"
        aria-label={ariaLabel}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonText}
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
            {buttonText}
          </>
        )}
      </button>
      <p id="generation-tip" className="text-xs text-slate-500 mt-4 text-center">
        Tip: Be descriptive for best results! Try adding styles like "photorealistic", "impressionist painting", or "sci-fi concept art".
      </p>
    </form>
  );
};
