'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  ArrowLeft,
  FileText,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  bio?: string;
  university?: string;
  department?: string;
  thesis_count?: number;
  subscription_status?: string;
}

export default function ProfileContent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/auth');
          return;
        }

        setUser(user);

        // Kullanıcı profil bilgilerini al
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          username: profileData?.username || user.email?.split('@')[0] || '',
          full_name: profileData?.full_name || '',
          avatar_url: profileData?.avatar_url || '',
          created_at: user.created_at || '',
          updated_at: profileData?.updated_at || '',
          bio: profileData?.bio || '',
          university: profileData?.university || '',
          department: profileData?.department || '',
          thesis_count: profileData?.thesis_count || 0,
          subscription_status: profileData?.subscription_status || 'free'
        };

        setProfile(userProfile);
        setEditForm({
          username: userProfile.username || '',
          full_name: userProfile.full_name || ''
        });

      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Profil bilgileri alınamadı');
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [supabase, router]);

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: editForm.username,
          full_name: editForm.full_name,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      setProfile({
        ...profile,
        ...editForm,
        updated_at: new Date().toISOString()
      });

      setEditing(false);
      toast.success('Profil başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken hata oluştu: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });

      if (error) {
        throw error;
      }

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      toast.success('Şifre başarıyla değiştirildi!');
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error('Şifre değiştirilirken hata oluştu: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil bulunamadı</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Ana Sayfaya Dön</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
            <div className="w-32"></div> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol Sidebar - Profil Özeti */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{profile.full_name || profile.username}</h2>
                <p className="text-gray-600">{profile.email}</p>
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Shield className="h-3 w-3 mr-1" />
                  {profile.subscription_status === 'premium' ? 'Premium' : 'Ücretsiz'} Üye
                </div>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">İstatistikler</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Analiz Edilen Tez</span>
                  </div>
                  <span className="font-semibold text-gray-900">{profile.thesis_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Üyelik Tarihi</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Son Güncelleme</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {profile.updated_at 
                      ? new Date(profile.updated_at).toLocaleDateString('tr-TR')
                      : 'Hiç'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ İçerik - Profil Detayları */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profil Bilgileri */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Profil Bilgileri</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Düzenle</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          username: profile.username || '',
                          full_name: profile.full_name || ''
                        });
                      }}
                      className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>İptal</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Adı
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{profile.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Soyad
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-gray-50 rounded-lg">{profile.full_name || 'Belirtilmemiş'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-600">{profile.email}</p>
                </div>
              </div>
            </div>

            {/* Şifre Değiştirme */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Şifre Değiştir</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Yeni şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yeni Şifre Tekrar
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Yeni şifrenizi tekrar girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordForm.new_password || !passwordForm.confirm_password}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {changingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
