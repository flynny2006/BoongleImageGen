export type Plan = 'FREE' | 'PRO' | 'PREMIUM';

export interface PlanDetails {
  name: Plan;
  price?: string;
  features: string[];
  claimCode?: string;
  generations?: number | 'Unlimited';
  resetCycle?: 'daily' | 'monthly';
}

export interface GeneratedImage {
  id: string;
  base64Data: string;
  prompt: string;
  fileName: string;
  mimeType: string; // e.g., "image/jpeg" or "image/png"
}

// Represents the structure in the Supabase 'user_profiles' table
export interface UserProfileData {
  id: string; // User's auth ID (matches auth.users.id)
  email?: string | null; // User's email, can be null
  active_plan: Plan;
  free_generations_left: number;
  last_free_reset_date: string; // YYYY-MM-DD
  pro_generations_left: number;
  last_pro_reset_month_year: string; // YYYY-MM
  updated_at?: string; // ISO timestamp string
}

export type AuthMode = 'login' | 'register';
