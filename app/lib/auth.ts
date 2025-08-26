import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  return createClientComponentClient();
};

export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
};

export async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserLimits(userId: string) {
  const supabase = createServerClient();
  
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Ayın başında limitleri sıfırla
  if (userData) {
    const now = new Date();
    const resetDate = new Date(userData.reset_date);
    
    if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
      await supabase
        .from('users')
        .update({ 
          analysis_count: 0,
          reset_date: now.toISOString()
        })
        .eq('id', userId);
        
      userData.analysis_count = 0;
    }
  }

  return userData;
}