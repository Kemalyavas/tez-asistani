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
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          toast.error(`Oturum hatası: ${error.message}`);
          router.push('/auth');
          return;
        }

        if (data.session && data.session.user) {
          toast.success('Yeni şifrenizi belirleyebilirsiniz');
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error_code = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error_code) {
          toast.error(`Hata: ${errorDescription || error_code}`);
          router.push('/auth');
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            toast.error(`Oturum hatası: ${sessionError.message}`);
            router.push('/auth');
            return;
          }

          toast.success('Yeni şifrenizi belirleyebilirsiniz');
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          toast.error('Geçersiz şifre sıfırlama bağlantısı');
          router.push('/auth');
        }
      } catch (error) {
        toast.error('Beklenmedik bir hata oluştu');
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
      toast.error('Şifre en az 6 karakter olmalıdır');
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        toast.error('Geçersiz oturum. Lütfen şifre sıfırlama bağlantısını tekrar kullanın.');
        router.push('/auth');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        toast.error(`Şifre güncellenirken hata: ${error.message}`);
        throw error;
      }

      toast.success('Şifreniz güncellendi! Yeni şifrenizle giriş yapabilirsiniz.');

      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error: any) {
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
            ← Giriş Sayfasına Dön
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Yeni Şifre Belirle
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Güvenli bir şifre seçin ve onaylayın
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* Yeni Şifre */}
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
              En az 6 karakter olmalıdır
            </p>
          </div>

          {/* Şifre Onay */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Onayı
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

          {/* Gönder Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <p>Güncelledikten sonra yeni şifrenizle giriş yapabilirsiniz.</p>
        </div>
      </div>
    </div>
  );
}
