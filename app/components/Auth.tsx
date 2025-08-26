'use client';
import { useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Rate limiting state
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const RATE_LIMITS = {
  AUTH_ATTEMPTS: 5, // Max attempts per window
  AUTH_WINDOW: 15 * 60 * 1000, // 15 minutes
  AUTH_BLOCK: 30 * 60 * 1000, // 30 minutes block
  RESET_ATTEMPTS: 3, // Max password reset attempts
  RESET_WINDOW: 60 * 60 * 1000, // 1 hour
};

export default function AuthComponent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  
  const rateLimitRef = useRef<Map<string, RateLimitState>>(new Map());
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Rate limiting functions
  const getRateLimitKey = (email: string, type: 'auth' | 'reset') => {
    return `${type}_${email.toLowerCase()}`;
  };

  const checkRateLimit = (email: string, type: 'auth' | 'reset'): { allowed: boolean; remainingTime?: number } => {
    const key = getRateLimitKey(email, type);
    const now = Date.now();
    const limits = type === 'auth' ? 
      { attempts: RATE_LIMITS.AUTH_ATTEMPTS, window: RATE_LIMITS.AUTH_WINDOW, block: RATE_LIMITS.AUTH_BLOCK } :
      { attempts: RATE_LIMITS.RESET_ATTEMPTS, window: RATE_LIMITS.RESET_WINDOW, block: 0 };
    
    const current = rateLimitRef.current.get(key);
    
    if (!current) {
      return { allowed: true };
    }
    
    // Check if blocked
    if (current.blockedUntil && current.blockedUntil > now) {
      return { 
        allowed: false, 
        remainingTime: Math.ceil((current.blockedUntil - now) / 1000 / 60) 
      };
    }
    
    // Reset if window expired
    if (now - current.lastAttempt > limits.window) {
      rateLimitRef.current.delete(key);
      return { allowed: true };
    }
    
    // Check attempts
    if (current.attempts >= limits.attempts) {
      const blockedUntil = type === 'auth' ? now + limits.block : undefined;
      rateLimitRef.current.set(key, {
        ...current,
        blockedUntil
      });
      
      return { 
        allowed: false, 
        remainingTime: blockedUntil ? Math.ceil((blockedUntil - now) / 1000 / 60) : undefined
      };
    }
    
    return { allowed: true };
  };

  const recordAttempt = (email: string, type: 'auth' | 'reset', success: boolean = false) => {
    const key = getRateLimitKey(email, type);
    const now = Date.now();
    const current = rateLimitRef.current.get(key);
    
    if (success) {
      // Clear rate limit on successful auth
      rateLimitRef.current.delete(key);
      return;
    }
    
    if (!current) {
      rateLimitRef.current.set(key, {
        attempts: 1,
        lastAttempt: now
      });
    } else {
      rateLimitRef.current.set(key, {
        ...current,
        attempts: current.attempts + 1,
        lastAttempt: now
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error('E-posta adresi gerekli');
      return false;
    }

    // Şifre sıfırlama için sadece e-posta yeterli
    if (isForgotPassword) {
      return true;
    }

    if (!formData.password) {
      toast.error('Şifre gerekli');
      return false;
    }

    if (isSignUp) {
      if (!formData.username) {
        toast.error('Kullanıcı adı gerekli');
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
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Rate limiting check
    const rateLimitType = isForgotPassword ? 'reset' : 'auth';
    const rateLimitCheck = checkRateLimit(formData.email, rateLimitType);
    
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.remainingTime) {
        toast.error(
          `Çok fazla deneme! ${rateLimitCheck.remainingTime} dakika sonra tekrar deneyin.`,
          { duration: 5000 }
        );
      } else {
        toast.error('Çok fazla deneme! Lütfen daha sonra tekrar deneyin.');
      }
      return;
    }
    
    setLoading(true);
    
    try {
      if (isForgotPassword) {
        // Şifre sıfırlama işlemi
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          console.error('Reset password error:', error);
          recordAttempt(formData.email, 'reset', false);
          toast.error('E-posta gönderilirken bir hata oluştu');
          throw error;
        }

        recordAttempt(formData.email, 'reset', true);
        toast.success('Şifre sıfırlama linki e-posta adresinize gönderildi!');
        setIsForgotPassword(false);
        setFormData({ email: '', password: '', confirmPassword: '', username: '' });
        return;
      }

      if (isSignUp) {
        // Kayıt işlemi - Rate limiting daha gevşek
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              display_name: formData.username
            }
          }
        });

        if (error) {
          // Supabase'in kendi hata mesajlarını kontrol et
          if (error.message.includes('already') || 
              error.message.includes('exists') || 
              error.message.includes('registered') ||
              error.message.includes('duplicate')) {
            toast.error('Bu e-posta adresi zaten kullanılıyor');
          } else {
            toast.error(error.message);
          }
          throw error;
        }

        // Eğer user var ama session yok ise, bu duplicate e-posta demektir
        if (data.user && !data.session) {
          toast.error('Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.');
          setIsSignUp(false); // Giriş moduna geç
          return;
        }
        
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Kayıt başarılı! E-posta adresinize gelen linke tıklayarak hesabınızı doğrulayın.');
        } else {
          toast.success('Kayıt başarılı!');
        }
        
        // Formu temizle
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          username: ''
        });
        
        // Giriş moduna geç
        setIsSignUp(false);
      } else {
        // Giriş işlemi
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          recordAttempt(formData.email, 'auth', false);
          
          if (error.message.includes('Invalid') || error.message.includes('incorrect')) {
            const currentState = rateLimitRef.current.get(getRateLimitKey(formData.email, 'auth'));
            const remainingAttempts = RATE_LIMITS.AUTH_ATTEMPTS - (currentState?.attempts || 0);
            
            if (remainingAttempts > 1) {
              toast.error(`E-posta veya şifre hatalı. ${remainingAttempts - 1} deneme hakkınız kaldı.`);
            } else {
              toast.error('E-posta veya şifre hatalı. Çok fazla yanlış deneme yaparsanız hesabınız geçici olarak kilitlenecek.');
            }
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Lütfen e-posta adresinizi doğrulayın');
          } else {
            toast.error(error.message);
          }
          throw error;
        }
        
        recordAttempt(formData.email, 'auth', true);
        toast.success('Giriş başarılı!');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Hata mesajını sadece beklenmedik durumlar için göster
      if (!error.message.includes('already') && !error.message.includes('Invalid')) {
        toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    });
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsSignUp(false);
    setFormData({
      email: formData.email, // E-posta'yı koru
      password: '',
      confirmPassword: '',
      username: ''
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleAuth} className="space-y-6">
        {/* Header */}
        {isForgotPassword && (
          <div className="text-center mb-4">
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </button>
            <h3 className="text-xl font-semibold text-gray-900">
              Şifre Sıfırlama
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              E-posta adresinizi girin, size şifre sıfırlama linki gönderelim.
            </p>
          </div>
        )}

        {/* Rate Limiting Warning */}
        {!isSignUp && !isForgotPassword && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Güvenlik Bilgisi:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• 5 yanlış deneme sonrası hesap 30 dakika kilitlenir</li>
                  <li>• Şifre sıfırlama: saatte 3 istek limiti</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-posta
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="input-modern"
            placeholder="ornek@email.com"
          />
        </div>

        {/* Username (sadece kayıt için) */}
        {isSignUp && !isForgotPassword && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="input-modern"
              placeholder="kullaniciadi"
            />
          </div>
        )}

        {/* Password (şifre sıfırlama hariç) */}
        {!isForgotPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
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
          </div>
        )}

        {/* Confirm Password (sadece kayıt için) */}
        {isSignUp && !isForgotPassword && (
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
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Yükleniyor...' : (
            isForgotPassword ? 'Sıfırlama Linki Gönder' :
            isSignUp ? 'Kayıt Ol' : 'Giriş Yap'
          )}
        </button>

        {/* Navigation Links */}
        {!isForgotPassword && (
          <div className="space-y-3">
            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {isSignUp 
                  ? 'Hesabınız var mı? Giriş yapın' 
                  : 'Hesabınız yok mu? Kayıt olun'
                }
              </button>
            </div>

            {/* Forgot Password (sadece giriş için) */}
            {!isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Şifrenizi mi unuttunuz?
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}