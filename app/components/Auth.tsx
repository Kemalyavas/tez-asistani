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
      toast.error('Email is required');
      return false;
    }

    // For password reset, only email is required
    if (isForgotPassword) {
      return true;
    }

    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }

    if (isSignUp) {
      if (!formData.username) {
        toast.error('Username is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
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
          `Too many attempts! Try again in ${rateLimitCheck.remainingTime} minutes.`,
          { duration: 5000 }
        );
      } else {
  toast.error('Too many attempts! Please try again later.');
      }
      return;
    }
    
    setLoading(true);
    
    try {
      if (isForgotPassword) {
  // Password reset flow
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          console.error('Reset password error:', error);
          recordAttempt(formData.email, 'reset', false);
          toast.error('An error occurred while sending the email');
          throw error;
        }

        recordAttempt(formData.email, 'reset', true);
  toast.success('Password reset link has been sent to your email!');
        setIsForgotPassword(false);
        setFormData({ email: '', password: '', confirmPassword: '', username: '' });
        return;
      }

      if (isSignUp) {
        // Sign up flow with email verification
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
          // Inspect Supabase error messages
          if (error.message.includes('already') || 
              error.message.includes('exists') || 
              error.message.includes('registered') ||
              error.message.includes('duplicate')) {
            toast.error('This email address is already in use');
          } else {
            toast.error(error.message);
          }
          throw error;
        }

        // If email confirmation is required, Supabase will not create a session
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Sign up successful! Please verify your account via the link sent to your email.');
        } else {
          toast.success('Sign up successful!');
        }
        
  // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          username: ''
        });
        
  // Switch to sign-in mode
        setIsSignUp(false);
      } else {
  // Sign-in flow
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
              toast.error(`Incorrect email or password. ${remainingAttempts - 1} attempts remaining.`);
            } else {
              toast.error('Incorrect email or password. Too many failed attempts may temporarily lock your account.');
            }
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please verify your email address');
          } else {
            toast.error(error.message);
          }
          throw error;
        }
        
        recordAttempt(formData.email, 'auth', true);
  toast.success('Signed in successfully!');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
  // Show error toast only for unexpected cases
      if (!error.message.includes('already') && !error.message.includes('Invalid')) {
  toast.error('Something went wrong. Please try again.');
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
  email: formData.email, // Keep email
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
              Go Back
            </button>
            <h3 className="text-xl font-semibold text-gray-900">
              Password Reset
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Enter your email address and we’ll send you a password reset link.
            </p>
          </div>
        )}

        {/* Rate Limiting Warning */}
        {!isSignUp && !isForgotPassword && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Notice:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• 5 failed attempts will lock the account for 30 minutes</li>
                  <li>• Password reset: 3 requests per hour limit</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
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

  {/* Username (sign up only) */}
        {isSignUp && !isForgotPassword && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="input-modern"
              placeholder="username"
            />
          </div>
        )}

  {/* Password (except reset mode) */}
        {!isForgotPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
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

  {/* Confirm Password (sign up only) */}
        {isSignUp && !isForgotPassword && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
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
          {loading ? 'Loading...' : (
            isForgotPassword ? 'Send Reset Link' :
            isSignUp ? 'Sign Up' : 'Sign In'
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
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
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
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}