
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { ImageDisplayArea } from './components/ImageDisplayArea';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { ApiKeyModal } from './components/ApiKeyModal'; // New API Key modal
import { generateImagesAPI, GeneratedImageData } from './services/geminiService';
import type { GeneratedImage, Plan, UserProfileData } from './types';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [currentImages, setCurrentImages] = useState<GeneratedImage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userApiKey, setUserApiKey] = useState<string | null>(null); // State for user's API key
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false); // State for API key modal

  const [appLoading, setAppLoading] = useState<boolean>(true);


  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string) => {
    setError(null);
    if (!userId) {
        setUserProfile(null);
        setAppLoading(false);
        return;
    }

    // No longer setting appLoading to true here, as initial session check handles it.
    // This function can be called on auth changes or plan updates.
    // setAppLoading(true); 
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Error fetching profile or profile not yet available:', profileError.message);
         if (profileError.code === 'PGRST116') { 
            console.error("User profile not found. This might indicate an issue with profile creation trigger.");
            // Create a temporary local profile to allow basic UI functionality
            const tempProfile: UserProfileData = {
                id: userId,
                email: userEmail || null,
                active_plan: 'FREE',
                free_generations_left: 5,
                last_free_reset_date: new Date().toISOString().split('T')[0],
                pro_generations_left: 175,
                last_pro_reset_month_year: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            };
            setUserProfile(tempProfile);
            setError("Could not load your profile from the server. Using default values. Some features might be limited. Please try refreshing or contacting support if this persists.");
            // setAppLoading(false); // Only if this function is responsible for initial load
            return;
        }
        throw profileError;
      }
      
      if (data) {
        let profileData = { ...data, email: userEmail || data.email }; 
        
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0];
        const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        let updates: Partial<UserProfileData> = {};
        let needsUpdate = false;

        if (profileData.active_plan === 'FREE' && profileData.last_free_reset_date !== todayDateString) {
          updates.free_generations_left = 5;
          updates.last_free_reset_date = todayDateString;
          needsUpdate = true;
        }
        if (profileData.active_plan === 'PRO' && profileData.last_pro_reset_month_year !== currentMonthYear) {
          updates.pro_generations_left = 175;
          updates.last_pro_reset_month_year = currentMonthYear;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { data: updatedData, error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
          if (updateError) {
            console.error('Error updating generations count:', updateError);
          } else if (updatedData) {
            profileData = { ...updatedData, email: userEmail || updatedData.email };
          }
        }
        setUserProfile(profileData);
      } else {
        setUserProfile(null); 
        console.error("No profile data returned and no error for user:", userId);
        setError("Failed to load your user profile. Please try again.");
      }
    } catch (err: any) {
      console.error('Error in fetchUserProfile:', err);
      setUserProfile(null); // Fallback to null profile on error
      setError(err.message || 'Failed to load user data.');
    } finally {
      // setAppLoading(false); // Only if this function controls the main appLoading state
    }
  }, []);

  // Initial load effect for session and API key
  useEffect(() => {
    setAppLoading(true);
    const storedApiKey = localStorage.getItem('geminiApiKey');
    if (storedApiKey) {
      setUserApiKey(storedApiKey);
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id, currentSession.user.email).finally(() => setAppLoading(false));
      } else {
        setUserProfile(null); 
        setAppLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const previousSessionUserId = session?.user?.id;
        setSession(newSession);
        if (newSession?.user) {
          // Fetch profile if user changed or was previously null
          if (newSession.user.id !== previousSessionUserId || !userProfile) {
            await fetchUserProfile(newSession.user.id, newSession.user.email);
          }
           if (_event === 'SIGNED_IN') setIsAuthModalOpen(false);
        } else {
          setUserProfile(null);
        }
        if (_event === 'SIGNED_OUT') {
           setUserProfile(null); 
           setCurrentImages(null); 
           setPrompt('');
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // session and userProfile removed from deps to avoid loops, fetchUserProfile is stable


  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase().slice(0, 50);
  };
  
  const getGenerationsLeft = useCallback((): number | 'Unlimited' => {
    if (!userProfile) return 0;
    if (userProfile.active_plan === 'PREMIUM') return 'Unlimited';
    if (userProfile.active_plan === 'PRO') return userProfile.pro_generations_left;
    return userProfile.free_generations_left; 
  }, [userProfile]);


  const handleGenerateImage = useCallback(async () => {
    if (!session || !userProfile) {
      setError('You must be logged in to generate images.');
      setIsAuthModalOpen(true);
      return;
    }
    if (!userApiKey) {
        setError('Gemini API Key is not set. Please set your API key via the "Set API Key" button in the header.');
        setIsApiKeyModalOpen(true);
        return;
    }
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.');
      return;
    }
    
    const currentGenerationsLeft = getGenerationsLeft();
    if (currentGenerationsLeft !== 'Unlimited' && currentGenerationsLeft <= 0) {
      setError('You have reached your generation limit for this plan.');
      setIsPricingModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentImages(null); 

    const numberOfImagesToGenerate = userProfile.active_plan === 'PREMIUM' ? 2 : 1;

    try {
      // geminiService now gets API key from localStorage
      const imageDatas: GeneratedImageData[] = await generateImagesAPI(prompt, numberOfImagesToGenerate);
      if (imageDatas && imageDatas.length > 0) {
        const newGeneratedImages: GeneratedImage[] = imageDatas.map((imgData, index) => {
          const shortPrompt = prompt.split(' ').slice(0, 5).join('-');
          const timestamp = Date.now();
          const fileName = `boongle-image-${sanitizeFilename(shortPrompt)}-${timestamp}${numberOfImagesToGenerate > 1 ? `-${index + 1}` : ''}.${imgData.mimeType.split('/')[1] || 'jpeg'}`;
          return {
            id: `${timestamp}-${index}`,
            base64Data: imgData.base64Data,
            prompt: prompt,
            fileName: fileName,
            mimeType: imgData.mimeType
          };
        });
        setCurrentImages(newGeneratedImages);

        if (currentGenerationsLeft !== 'Unlimited' && userProfile) {
            let updatedCountField: Partial<UserProfileData> = {};
            if (userProfile.active_plan === 'FREE') {
                updatedCountField = { free_generations_left: userProfile.free_generations_left - 1 };
            } else if (userProfile.active_plan === 'PRO') {
                updatedCountField = { pro_generations_left: userProfile.pro_generations_left - 1 };
            }
            
            if (Object.keys(updatedCountField).length > 0) {
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update(updatedCountField)
                    .eq('id', userProfile.id);

                if (updateError) throw updateError;
                // Refetch profile to get the latest counts
                await fetchUserProfile(userProfile.id, userProfile.email || undefined); 
            }
        }
      } else {
        setError('Failed to generate image(s). No image data received from API.');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during image generation.';
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes("api key")) {
        setIsApiKeyModalOpen(true); // Prompt to check API key if error message suggests it
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, session, userProfile, userApiKey, getGenerationsLeft, fetchUserProfile]);

  const handleDownloadImage = useCallback((imageId: string) => {
    if (currentImages) {
      const imageToDownload = currentImages.find(img => img.id === imageId);
      if (imageToDownload) {
        const link = document.createElement('a');
        link.href = `data:${imageToDownload.mimeType};base64,${imageToDownload.base64Data}`;
        link.download = imageToDownload.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, [currentImages]);

  const handleClaimPlan = useCallback(async (plan: Plan) => {
    if (!session || !userProfile) {
      setError("You need to be logged in to claim a plan.");
      setIsAuthModalOpen(true);
      return;
    }

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const currentMonthYear = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    let newProfileData: Partial<UserProfileData> = { active_plan: plan };
    if (plan === 'FREE') {
        newProfileData.free_generations_left = 5;
        newProfileData.last_free_reset_date = todayDateString;
    } else if (plan === 'PRO') {
        newProfileData.pro_generations_left = 175;
        newProfileData.last_pro_reset_month_year = currentMonthYear;
    }

    setIsLoading(true);
    try {
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(newProfileData)
            .eq('id', userProfile.id);

        if (updateError) throw updateError;
        await fetchUserProfile(userProfile.id, userProfile.email || undefined); 
        setIsPricingModalOpen(false);
        setError(null); // Clear previous errors
    } catch (err: any) {
        console.error("Error claiming plan:", err);
        setError(err.message || "Failed to update your plan.");
    } finally {
        setIsLoading(false);
    }
  }, [session, userProfile, fetchUserProfile]);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
    // Auth listener handles clearing session and userProfile
    setIsLoading(false);
  };

  const handleSaveApiKey = useCallback((apiKey: string) => {
    localStorage.setItem('geminiApiKey', apiKey);
    setUserApiKey(apiKey);
    setError(null); // Clear any previous API key related errors
    // No need to close modal here, ApiKeyModal can handle its message and user can close
  }, []);
  
  const generationsLeftValue = getGenerationsLeft();
  // Generation is disabled if not logged in, no API key, or out of generations
  const isGenerationDisabled = !session || !userApiKey || (generationsLeftValue !== 'Unlimited' && generationsLeftValue <= 0);
  
  const getGenerationsText = () => {
    if (appLoading && !userProfile && !session) return "Loading user data..."; // More specific loading text
    if (!session || !userProfile) return "Log in to see your generations.";
    
    const plan = userProfile.active_plan;
    const gensLeft = getGenerationsLeft(); 

    if (plan === 'PREMIUM') return "Unlimited Generations";
    if (typeof gensLeft === 'number') {
      const cycle = plan === 'FREE' ? 'today' : 'this month';
      return `${gensLeft} generation${gensLeft !== 1 ? 's' : ''} left ${cycle}`;
    }
    return "";
  };
  
  useEffect(() => {
    const anyModalOpen = isAuthModalOpen || isPricingModalOpen || isApiKeyModalOpen;
    if (anyModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isAuthModalOpen, isPricingModalOpen, isApiKeyModalOpen]);


  if (appLoading) { 
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
            <LoadingSpinner />
            <p className="text-xl text-sky-300">Loading Boongle Image Generator...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 selection:bg-cyan-500 selection:text-white">
      <Header
        userEmail={session?.user?.email || null}
        onPricingClick={() => setIsPricingModalOpen(true)}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onSetApiKeyClick={() => setIsApiKeyModalOpen(true)} // Pass handler for API Key modal
      />
      
      <div className="w-full max-w-3xl text-center mb-6">
       {session && userProfile && (
         <p className="text-sky-300 text-lg font-medium">
           Current Plan: <span className="font-bold text-white">{userProfile.active_plan}</span>
         </p>
        )}
        <p className="text-slate-400">{getGenerationsText()}</p>
        {session && !userApiKey && !isLoading && (
            <p className="text-yellow-400 text-sm mt-2">
                Your Gemini API Key is not set. Please <button onClick={() => setIsApiKeyModalOpen(true)} className="underline hover:text-yellow-300">set your API Key</button> to generate images.
            </p>
        )}
      </div>

      <main className="w-full max-w-3xl flex flex-col items-center flex-grow">
        <PromptForm
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleGenerateImage}
          isLoading={isLoading}
          isGenerationDisabled={isGenerationDisabled} 
          isLoggedIn={!!session}
        />
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        
        {!session && !isLoading && ( // Removed !appLoading condition here, appLoading screen handles initial state
            <div className="my-8 text-center p-6 bg-slate-800/70 rounded-lg shadow-xl animate-fadeIn">
                <h3 className="text-2xl font-semibold text-sky-300 mb-3">Welcome to Boongle!</h3>
                <p className="text-slate-300 mb-4">Please log in or create an account to start generating images.</p>
                <p className="text-xs text-slate-400 mb-4">You'll also need to set your own Gemini API key after logging in.</p>
                <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-cyan-500/50"
                >
                    Login / Register
                </button>
            </div>
        )}
        
        <ImageDisplayArea 
          images={currentImages} 
          onDownload={handleDownloadImage}
          isLoading={isLoading}
        />
      </main>
      <Footer />

      {isPricingModalOpen && (
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          onClaimPlan={handleClaimPlan}
          currentPlan={userProfile?.active_plan || 'FREE'}
          isLoggedIn={!!session}
          onLoginPrompt={() => {
            setIsPricingModalOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => {
            // fetchUserProfile is called by onAuthStateChange
            // setIsAuthModalOpen(false); // Modal can be closed by listener or user
          }}
        />
      )}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
          onSaveApiKey={handleSaveApiKey}
          currentApiKey={userApiKey}
        />
      )}
    </div>
  );
};

export default App;
