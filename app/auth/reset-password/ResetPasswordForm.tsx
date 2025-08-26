'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ hash: '', search: '' });
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Client-side'da çalıştığımızdan emin olalım
    if (typeof window === 'undefined') return;

    // Debug info'yu ayarla
    setDebugInfo({
      hash: window.location.hash,
      search: window.location.search
    });

    // Supabase auth callback'ini işle
    const handleAuthCallback = async () => {
      try {
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        
        // Supabase'in auth callback sistemi ile session'u al
        const { data, error } = await supabase.auth.getSession();
        console.log('Current session check:', { data, error });

        if (error) {
          console.error('Session error:', error);
          toast.error(`Session hatası: ${error.message}`);
          router.push('/auth');
          return;
        }

        // Session varsa, bu bir başarılı password reset callback'i
        if (data.session && data.session.user) {
          console.log('Valid session found:', data.session.user.email);
          toast.success('Yeni şifrenizi belirleyebilirsiniz');
          return;
        }

        // Session yoksa, URL'deki fragment'leri kontrol et
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error_code = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('URL Hash params:', { 
          accessToken: accessToken ? 'present' : 'missing', 
          refreshToken: refreshToken ? 'present' : 'missing', 
          type, 
          error: error_code, 
          errorDescription 
        });

        // URL'de hata varsa
        if (error_code) {
          console.error('URL contains error:', error_code, errorDescription);
          toast.error(`Hata: ${errorDescription || error_code}`);
          router.push('/auth');
          return;
        }

        // Recovery token'ları varsa session'u ayarla
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Setting session with recovery tokens...');
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session set error:', sessionError);
            toast.error(`Session hatası: ${sessionError.message}`);
            router.push('/auth');
            return;
          }

          console.log('Session set successfully:', sessionData);
          toast.success('Yeni şifrenizi belirleyebilirsiniz');
          
          // URL'den token'ları temizle (güvenlik için)
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // Hiçbir valid token bulunamadı
          console.log('No valid tokens found');
          toast.error('Geçersiz şifre sıfırlama linki');
          router.push('/auth');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error(`Beklenmeyen hata: ${error}`);
        router.push('/auth');
      }
    };

    handleAuthCallback();
  }, [supabase, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalı');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Önce session'ın geçerli olup olmadığını kontrol et
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error('Geçersiz oturum. Lütfen şifre sıfırlama linkini tekrar kullanın.');
        router.push('/auth');
        return;
      }

      console.log('Current session:', sessionData.session);

      const { data, error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        console.error('Password update error:', error);
        toast.error(`Şifre güncellenirken hata: ${error.message}`);
        throw error;
      }

      console.log('Password updated successfully:', data);
      toast.success('Şifreniz başarıyla güncellendi! Yeni şifrenizle giriş yapabilirsiniz.');
      
      // Session'ı temizle ve giriş sayfasına yönlendir
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link 
            href="/auth" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Giriş sayfasına dön
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Yeni Şifre Belirleyin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Güvenli bir şifre seçin ve onaylayın
          </p>
          
          {/* Debug Info - sadece development için */}
          {process.env.NODE_ENV === 'development' && debugInfo.hash && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Hash: {debugInfo.hash}</p>
              <p>Search: {debugInfo.search}</p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input-modern pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              En az 6 karakter olmalı
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Tekrar
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input-modern pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Şifrenizi güncelledikten sonra yeni şifrenizle giriş yapabilirsiniz.</p>
        </div>
      </div>
    </div>
  );
}
