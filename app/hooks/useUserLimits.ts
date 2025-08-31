'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UserUsage {
  thesis_analyses: number;
  abstract_generations: number;
  citation_formats: number;
  subscription_status: 'free' | 'pro' | 'expert';
}

const USAGE_LIMITS = {
  free: {
    thesis_analyses: 1,
    abstract_generations: 1,
    citation_formats: 5
  },
  pro: {
    thesis_analyses: 50,
    abstract_generations: 20,
    citation_formats: 100
  },
  expert: {
    thesis_analyses: -1, // unlimited
    abstract_generations: -1, // unlimited
    citation_formats: -1 // unlimited
  }
};

interface CacheData {
  user: any | null;
  usage: UserUsage | null;
  timestamp: number;
  version: number;
}

let globalCache: CacheData = { user: null, usage: null, timestamp: 0, version: 0 };
const CACHE_KEY = 'tez_asistani_user_cache';
const CACHE_DURATION = 30000; 

// Sadece tarayıcıda çalıştığından emin olmak için kontrol
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

export function useUserLimits() {
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<UserUsage>({
    thesis_analyses: 0,
    abstract_generations: 0,
    citation_formats: 0,
    subscription_status: 'free'
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Bu kod bloğu sadece component tarayıcıda yüklendikten sonra çalışır.
    const initialize = async () => {
      // Önce cache'den yüklemeyi dene
      const cached = loadFromStorage();
      if (cached) {
        globalCache = cached;
        setUser(cached.user);
        setUsage(cached.usage || usage);
      }

      // Supabase'den güncel veriyi çek
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          const emptyCache = { user: null, usage: null, timestamp: Date.now(), version: ++globalCache.version };
          globalCache = emptyCache;
          saveToStorage(emptyCache);
          setUser(null);
          setUsage({ thesis_analyses: 0, abstract_generations: 0, citation_formats: 0, subscription_status: 'free' });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const newUsage = {
          thesis_analyses: profile?.thesis_count || 0,
          abstract_generations: profile?.abstract_count || 0,
          citation_formats: profile?.citation_count || 0,
          subscription_status: profile?.subscription_status || 'free'
        };

        const newCache = { user, usage: newUsage, timestamp: Date.now(), version: ++globalCache.version };
        globalCache = newCache;
        saveToStorage(newCache);
        
        setUser(user);
        setUsage(newUsage);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [supabase]);

  const checkLimit = useCallback((feature: keyof Omit<UserUsage, 'subscription_status'>) => {
    if (!user) return { allowed: false, reason: 'Giriş yapmanız gerekiyor' };
    const limits = USAGE_LIMITS[usage.subscription_status];
    const currentUsage = usage[feature];
    const limit = limits[feature];
    if (limit === -1) return { allowed: true };
    if (currentUsage >= limit) {
      const featureName = feature === 'citation_formats' ? 'kaynak formatlama' : 
                         feature === 'abstract_generations' ? 'özet oluşturma' : 'tez analizi';
      return { 
        allowed: false, 
        reason: `Daha fazla ${featureName} için Pro üyelik alın`,
        currentUsage,
        limit
      };
    }
    return { allowed: true, currentUsage, limit };
  }, [user, usage]);

  const incrementUsage = useCallback(async (feature: keyof Omit<UserUsage, 'subscription_status'>) => {
    if (!user) return false;
    try {
      const fieldMap = {
        thesis_analyses: 'thesis_count',
        abstract_generations: 'abstract_count',
        citation_formats: 'citation_count'
      };
      const newValue = usage[feature] + 1;
      const { error } = await supabase
        .from('profiles')
        .update({ [fieldMap[feature]]: newValue })
        .eq('id', user.id);
      if (error) throw error;
      const newUsage = { ...usage, [feature]: newValue };
      const newCache = { user, usage: newUsage, timestamp: Date.now(), version: ++globalCache.version };
      setUsage(newUsage);
      globalCache = newCache;
      saveToStorage(newCache);
      return true;
    } catch (error) {
      console.error('Error updating usage:', error);
      return false;
    }
  }, [user, usage, supabase]);
  
  const refreshData = useCallback(async () => {
    // Cache'i temizle
    globalCache = { user: null, usage: null, timestamp: 0, version: 0 };
    if(typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    setLoading(true);
    
    // Verileri yeniden çek
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUser(null);
        setUsage({ thesis_analyses: 0, abstract_generations: 0, citation_formats: 0, subscription_status: 'free' });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const newUsage = {
        thesis_analyses: profile?.thesis_count || 0,
        abstract_generations: profile?.abstract_count || 0,
        citation_formats: profile?.citation_count || 0,
        subscription_status: profile?.subscription_status || 'free'
      };

      const newCache = { user, usage: newUsage, timestamp: Date.now(), version: ++globalCache.version };
      globalCache = newCache;
      saveToStorage(newCache);
      
      setUser(user);
      setUsage(newUsage);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    user,
    usage,
    loading,
    checkLimit,
    incrementUsage,
    refreshData,
    limits: USAGE_LIMITS[usage.subscription_status]
  };
}