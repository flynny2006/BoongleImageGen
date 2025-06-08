
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
import { AuthModal } from './components/AuthModal'; // New Auth modal
import { generateImagesAPI, GeneratedImageData } from './services/geminiService';
import type { GeneratedImage, Plan, UserProfileData } from './types';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [currentImages, setCurrentImages] = useState<GeneratedImage[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [appLoading, setAppLoading] = useState<boolean>(true);


  const fetchUserProfile = useCallback(async (userId: string, userEmail?: string) => {
    setError(null);
    if (!userId) {
        setUserProfile(null);
        setAppLoading(false);
        return;
    }

    setAppLoading(true);
    try {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // If profile doesn't exist (e.g. RLS or just created), it might return an error.
        // The trigger should create it. If not, this is an issue.
        console.warn('Error fetching profile or profile not yet available:', profileError.message);
        // Attempt to create a default one if really needed, but trigger should handle this.
        // For now, let's assume the trigger works. If it's a 'not found' type error,
        // it implies an issue with the trigger or a delay.
         if (profileError.code === 'PGRST116') { // Resource not found
            // This might happen if trigger is slow or failed.
            // Let's provide a default local state to allow UI to function somewhat,
            // but this is not ideal.
            console.error("User profile not found. This might indicate an issue with profile creation trigger.");
            setUserProfile({
                id: userId,
                email: userEmail || null,
                active_plan: 'FREE',
                free_generations_left: 5,
                last_free_reset_date: new Date().toISOString().split('T')[0],
                pro_generations_left: 175,
                last_pro_reset_month_year: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            });
            setError("Could not load your profile. Some features might be limited. Please try refreshing.");
            setAppLoading(false);
            return;
        }
        throw profileError;
      }
      
      if (data) {
        let profileData = { ...data, email: userEmail || data.email }; // Ensure email from session is used if available
        
        // Check and reset generations if needed
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
            // Proceed with stale data, show error?
          } else if (updatedData) {
            profileData = { ...updatedData, email: userEmail || updatedData.email };
          }
        }
        setUserProfile(profileData);
      } else {
        // Should not happen if trigger works and RLS is correct
        setUserProfile(null); 
        console.error("No profile data returned and no error for user:", userId);
        setError("Failed to load your user profile. Please try again.");
      }
    } catch (err: any) {
      console.error('Error in fetchUserProfile:', err);
      setUserProfile(null);
      setError(err.message || 'Failed to load user data.');
    } finally {
      setAppLoading(false);
    }
  }, []);

  useEffect(() => {
    setAppLoading(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id, currentSession.user.email);
      } else {
        setUserProfile(null); // No user, so no profile
        setAppLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          await fetchUserProfile(newSession.user.id, newSession.user.email);
           if (_event === 'SIGNED_IN') setIsAuthModalOpen(false); // Close auth modal on successful sign in
        } else {
          setUserProfile(null);
        }
        if (_event === 'SIGNED_OUT') {
           setUserProfile(null); // Clear profile on sign out
           setCurrentImages(null); // Clear images on sign out
           setPrompt(''); // Clear prompt
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);


  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase().slice(0, 50);
  };
  
  const getGenerationsLeft = useCallback((): number | 'Unlimited' => {
    if (!userProfile) return 0; // Or handle as appropriate when no profile (e.g. logged out)
    if (userProfile.active_plan === 'PREMIUM') return 'Unlimited';
    if (userProfile.active_plan === 'PRO') return userProfile.pro_generations_left;
    return userProfile.free_generations_left; // FREE plan
  }, [userProfile]);


  const handleGenerateImage = useCallback(async () => {
    if (!session || !userProfile) {
      setError('You must be logged in to generate images.');
      setIsAuthModalOpen(true);
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

        // Update generations count in Supabase
        if (currentGenerationsLeft !== 'Unlimited' && userProfile) {
            let updatedCountField = {};
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
                // Refetch or update local profile state
                await fetchUserProfile(userProfile.id, userProfile.email || undefined); 
            }
        }
      } else {
        setError('Failed to generate image(s). No image data received.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsLoading(false);
    }
  }, [prompt, session, userProfile, getGenerationsLeft, fetchUserProfile]);

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
    // For PREMIUM, generationsLeft will be 'Unlimited' handled by getGenerationsLeft

    setIsLoading(true); // Indicate loading for plan change
    try {
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update(newProfileData)
            .eq('id', userProfile.id);

        if (updateError) throw updateError;
        await fetchUserProfile(userProfile.id, userProfile.email || undefined); // Refresh profile
        setIsPricingModalOpen(false);
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
    // Auth listener will handle setting session and userProfile to null
    setIsLoading(false);
  };
  
  const generationsLeftValue = getGenerationsLeft();
  const isGenerationDisabled = !session || (generationsLeftValue !== 'Unlimited' && generationsLeftValue <= 0);
  
  const getGenerationsText = () => {
    if (appLoading && !userProfile) return "Loading user data...";
    if (!session || !userProfile) return "Log in to see your generations.";
    
    const plan = userProfile.active_plan;
    // Use generationsLeftValue directly here if it's always up-to-date for this render cycle
    // or call getGenerationsLeft() again if it needs to be fresh relative to other state changes
    // within this render function before this is called.
    // For simplicity and consistency with previous use, calling it again is fine or using the stored one.
    const gensLeft = getGenerationsLeft(); // Or use generationsLeftValue if appropriate contextually

    if (plan === 'PREMIUM') return "Unlimited Generations";
    if (typeof gensLeft === 'number') {
      const cycle = plan === 'FREE' ? 'today' : 'this month';
      return `${gensLeft} generation${gensLeft !== 1 ? 's' : ''} left ${cycle}`;
    }
    return "";
  };
  
  useEffect(() => {
    if (isAuthModalOpen || isPricingModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isAuthModalOpen, isPricingModalOpen]);


  if (appLoading && !session) { // Show a general loading screen on initial app load before session is determined
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
      />
      
      <div className="w-full max-w-3xl text-center mb-6">
       {session && userProfile && (
         <p className="text-sky-300 text-lg font-medium">
           Current Plan: <span className="font-bold text-white">{userProfile.active_plan}</span>
         </p>
        )}
        <p className="text-slate-400">{getGenerationsText()}</p>
      </div>

      <main className="w-full max-w-3xl flex flex-col items-center flex-grow">
        <PromptForm
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleGenerateImage}
          isLoading={isLoading}
          isGenerationDisabled={isGenerationDisabled || !session} // Also disable if not logged in
          isLoggedIn={!!session}
        />
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
        
        {!session && !isLoading && !appLoading && (
            <div className="my-8 text-center p-6 bg-slate-800/70 rounded-lg shadow-xl">
                <h3 className="text-2xl font-semibold text-sky-300 mb-3">Welcome to Boongle!</h3>
                <p className="text-slate-300 mb-4">Please log in or create an account to start generating amazing images.</p>
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
            // fetchUserProfile will be called by onAuthStateChange listener
            // setIsAuthModalOpen(false); // Can be closed by listener too
          }}
        />
      )}
    </div>
  );
};

export default App;
