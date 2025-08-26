'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tez Asistanı
            </span>
          </Link>
          
          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Özellikler
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Nasıl Çalışır
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Fiyatlandırma
            </button>
            <button 
              onClick={() => scrollToSection('app')}
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Uygulama
            </button>
            <Link 
              href="/privacy-policy" 
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
            >
              Gizlilik
            </Link>
            
            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/profile"
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-300 group"
                >
                  <User className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-300"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/auth" 
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                <LogIn className="h-4 w-4" />
                <span>Giriş Yap</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-left text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2"
              >
                Özellikler
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-left text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2"
              >
                Nasıl Çalışır
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-left text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2"
              >
                Fiyatlandırma
              </button>
              <button 
                onClick={() => scrollToSection('app')}
                className="text-left text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2"
              >
                Uygulama
              </button>
              <Link 
                href="/privacy-policy" 
                className="text-left text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Gizlilik
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="border-t pt-4">
                {user ? (
                  <>
                    <Link 
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-300 py-2"
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left text-red-600 hover:bg-red-50 font-medium transition-colors duration-300 py-2"
                    >
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-blue-600 hover:bg-blue-50 font-medium transition-colors duration-300 py-2"
                  >
                    Giriş Yap / Kayıt Ol
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}