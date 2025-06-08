import React from 'react';

interface HeaderProps {
  userEmail: string | null;
  onPricingClick: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userEmail, onPricingClick, onLoginClick, onLogoutClick }) => {
  return (
    <header className="w-full max-w-5xl my-8 sm:my-12 text-center px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-3xl sm:text-5xl font-extrabold order-2 sm:order-1">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600">
            Boongle Image Generator
          </span>
        </h1>
        <div className="flex items-center gap-3 order-1 sm:order-2">
          <button
            onClick={onPricingClick}
            className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-sky-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-400 transition-colors duration-150 text-sm sm:text-base"
            aria-label="View pricing plans"
          >
            Pricing
          </button>
          {userEmail ? (
            <>
              <span className="text-slate-300 text-xs sm:text-sm hidden md:inline" title={userEmail}>
                {userEmail.length > 20 ? `${userEmail.substring(0,18)}...` : userEmail}
              </span>
              <button
                onClick={onLogoutClick}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-red-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-400 transition-colors duration-150 text-sm sm:text-base"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-400 transition-colors duration-150 text-sm sm:text-base"
              aria-label="Login or Register"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>
      <p className="text-slate-400 text-lg">
        Craft stunning visuals with the power of Gemini AI.
      </p>
    </header>
  );
};
