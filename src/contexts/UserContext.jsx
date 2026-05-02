import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const UserContext = createContext(null);
const STORAGE_KEY = 'tcf_beta_code';

export function UserProvider({ children }) {
  const [betaCode, setBetaCodeState] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsReonboarding, setNeedsReonboarding] = useState(false);

  const loadUserProfile = useCallback(async (code) => {
    if (!code) { setIsLoading(false); return; }
    // DEV-MODE : pas de Supabase, accès direct
    if (code === 'DEV-MODE') { setIsLoading(false); return; }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('beta_testers')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !data) {
      // Code invalide ou supprimé : nettoyer
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('tcf_beta_profile');
      setBetaCodeState(null);
      setUserProfile(null);
      setNeedsOnboarding(false);
      setNeedsReonboarding(false);
      setIsLoading(false);
      return;
    }

    setUserProfile(data);

    const hasCompletedOnboarding = !!data.onboarding_completed_at;
    // nclc_cible est le marqueur qui indique que le nouvel onboarding (6 questions) a été complété
    const hasNewFields = data.nclc_cible !== null && data.nclc_cible !== undefined;

    if (!hasCompletedOnboarding) {
      setNeedsOnboarding(true);
      setNeedsReonboarding(false);
    } else if (!hasNewFields) {
      // Ancien onboarding 3 questions fait, nouvelles questions manquantes
      setNeedsOnboarding(false);
      setNeedsReonboarding(true);
    } else {
      setNeedsOnboarding(false);
      setNeedsReonboarding(false);
    }

    setIsLoading(false);
  }, []);

  // Chargement initial depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBetaCodeState(stored);
      loadUserProfile(stored);
    } else {
      setIsLoading(false);
    }
  }, [loadUserProfile]);

  const setBetaCode = useCallback((code) => {
    if (code) {
      localStorage.setItem(STORAGE_KEY, code);
      setBetaCodeState(code);
      loadUserProfile(code);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('tcf_beta_profile');
      setBetaCodeState(null);
      setUserProfile(null);
      setNeedsOnboarding(false);
      setNeedsReonboarding(false);
    }
  }, [loadUserProfile]);

  const logout = useCallback(() => setBetaCode(null), [setBetaCode]);

  const refreshProfile = useCallback(async () => {
    if (betaCode) await loadUserProfile(betaCode);
  }, [betaCode, loadUserProfile]);

  return (
    <UserContext.Provider value={{
      betaCode,
      userProfile,
      isLoading,
      needsOnboarding,
      needsReonboarding,
      setBetaCode,
      logout,
      refreshProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
