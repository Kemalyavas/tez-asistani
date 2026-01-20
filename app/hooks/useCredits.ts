'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CREDIT_COSTS, getCreditCost } from '../lib/pricing';

// ============================================================================
// Types
// ============================================================================
export interface UserCredits {
  credits: number;
  totalPurchased: number;
  totalUsed: number;
  thesisCount: number;
  abstractsCount: number;
  citationsCount: number;
}

export interface CreditCheckResult {
  allowed: boolean;
  currentCredits: number;
  requiredCredits: number;
  shortfall: number;
  reason?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  actionType?: string;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Cache Management
// ============================================================================
interface CacheData {
  user: any | null;
  credits: UserCredits | null;
  timestamp: number;
}

const CACHE_KEY = 'tezai_credits_cache';
const CACHE_DURATION = 30000; // 30 seconds

let globalCache: CacheData = { user: null, credits: null, timestamp: 0 };

const saveToStorage = (data: CacheData) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Storage save failed:', error);
    }
  }
};

const loadFromStorage = (): CacheData | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored) as CacheData;
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    } catch (error) {
      console.warn('Storage load failed:', error);
    }
  }
  return null;
};

const clearCache = () => {
  globalCache = { user: null, credits: null, timestamp: 0 };
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
};

// ============================================================================
// Hook
// ============================================================================
export function useCredits() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<UserCredits>({
    credits: 0,
    totalPurchased: 0,
    totalUsed: 0,
    thesisCount: 0,
    abstractsCount: 0,
    citationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Fetch user credits data
  const fetchCredits = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = loadFromStorage();
        if (cached && cached.credits) {
          globalCache = cached;
          setUser(cached.user);
          setCredits(cached.credits);
          setLoading(false);
          return;
        }
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        clearCache();
        setUser(null);
        setCredits({
          credits: 0,
          totalPurchased: 0,
          totalUsed: 0,
          thesisCount: 0,
          abstractsCount: 0,
          citationsCount: 0
        });
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('Could not load profile');
        setLoading(false);
        return;
      }

      const userCredits: UserCredits = {
        credits: profile?.credits || 0,
        totalPurchased: profile?.total_credits_purchased || 0,
        totalUsed: profile?.total_credits_used || 0,
        thesisCount: profile?.thesis_analyses_count || 0,
        abstractsCount: profile?.abstracts_count || 0,
        citationsCount: profile?.citations_count || 0
      };

      const newCache: CacheData = {
        user: authUser,
        credits: userCredits,
        timestamp: Date.now()
      };
      
      globalCache = newCache;
      saveToStorage(newCache);
      
      setUser(authUser);
      setCredits(userCredits);
      setError(null);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initialize on mount
  useEffect(() => {
    fetchCredits();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchCredits(true);
      } else if (event === 'SIGNED_OUT') {
        clearCache();
        setUser(null);
        setCredits({
          credits: 0,
          totalPurchased: 0,
          totalUsed: 0,
          thesisCount: 0,
          abstractsCount: 0,
          citationsCount: 0
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchCredits, supabase.auth]);

  // Check if user has enough credits for an action
  const checkCredits = useCallback((actionType: string): CreditCheckResult => {
    const required = getCreditCost(actionType);
    const current = credits.credits;
    const shortfall = Math.max(0, required - current);

    if (!user) {
      return {
        allowed: false,
        currentCredits: 0,
        requiredCredits: required,
        shortfall: required,
        reason: 'Please sign in to continue'
      };
    }

    if (current < required) {
      return {
        allowed: false,
        currentCredits: current,
        requiredCredits: required,
        shortfall,
        reason: `You need ${required} credits for this action. You have ${current} credits.`
      };
    }

    return {
      allowed: true,
      currentCredits: current,
      requiredCredits: required,
      shortfall: 0
    };
  }, [user, credits.credits]);

  // Use credits for an action (calls server API)
  const useCreditsForAction = useCallback(async (
    actionType: string,
    description?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const check = checkCredits(actionType);
    if (!check.allowed) {
      return { success: false, error: check.reason };
    }

    try {
      // Call Supabase function to deduct credits
      const { data, error: rpcError } = await supabase.rpc('use_credits', {
        p_user_id: user.id,
        p_amount: check.requiredCredits,
        p_action_type: actionType,
        p_description: description || CREDIT_COSTS[actionType]?.description || actionType
      });

      if (rpcError) {
        console.error('Credit deduction error:', rpcError);
        return { success: false, error: 'Failed to process credits' };
      }

      const result = data?.[0];
      
      if (!result?.success) {
        return { success: false, error: result?.error_message || 'Credit deduction failed' };
      }

      // Update local state
      const newCredits = {
        ...credits,
        credits: result.new_balance,
        totalUsed: credits.totalUsed + check.requiredCredits
      };

      // Update specific counters
      if (actionType.startsWith('thesis')) {
        newCredits.thesisCount += 1;
      } else if (actionType === 'abstract_generate') {
        newCredits.abstractsCount += 1;
      } else if (actionType === 'citation_format') {
        newCredits.citationsCount += 1;
      }

      setCredits(newCredits);
      
      // Update cache
      const newCache: CacheData = {
        user,
        credits: newCredits,
        timestamp: Date.now()
      };
      globalCache = newCache;
      saveToStorage(newCache);

      return { success: true, newBalance: result.new_balance };
    } catch (err) {
      console.error('Error using credits:', err);
      return { success: false, error: 'An error occurred' };
    }
  }, [user, credits, checkCredits, supabase]);

  // Add credits (after purchase - usually called by server)
  const addCredits = useCallback(async (amount: number, bonus: number = 0) => {
    // This is typically handled server-side after payment verification
    // Just refresh the credits after a purchase
    await fetchCredits(true);
  }, [fetchCredits]);

  // Get recent transactions
  const getTransactions = useCallback(async (limit: number = 10): Promise<Transaction[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return (data || []).map(t => ({
        id: t.id,
        amount: t.amount,
        balanceAfter: t.balance_after,
        transactionType: t.transaction_type,
        actionType: t.action_type,
        description: t.description,
        createdAt: t.created_at
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }, [user, supabase]);

  // Force refresh credits from server
  const refresh = useCallback(() => {
    clearCache();
    setLoading(true);
    return fetchCredits(true);
  }, [fetchCredits]);

  return {
    // State
    user,
    credits,
    loading,
    error,
    
    // Actions
    checkCredits,
    useCreditsForAction,
    addCredits,
    getTransactions,
    refresh,
    
    // Convenience getters
    currentCredits: credits.credits,
    isAuthenticated: !!user
  };
}

export default useCredits;
