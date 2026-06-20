'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  FileText,
  Coins,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isAdmin, isAdminEmail } from '../lib/adminUtils';
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
  // Credit system fields
  credits?: number;
  total_credits_purchased?: number;
  total_credits_used?: number;
  thesis_analyses_count?: number;
  abstracts_count?: number;
  citations_count?: number;
}

interface ThesisAnalysis {
  id: string;
  filename: string;
  status: 'processing' | 'analyzed' | 'failed';
  overall_score: number | null;
  page_count: number;
  word_count: number;
  analysis_type: string;
  credits_used: number;
  created_at: string;
  analyzed_at: string | null;
}

export default function ProfileContent() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<ThesisAnalysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
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
  const [isAdminUser, setIsAdminUser] = useState(false);

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
        setIsAdminUser(isAdmin(user.id) || isAdminEmail(user.email));

  // Fetch user profile information
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
          // Credit system fields
          credits: profileData?.credits || 0,
          total_credits_purchased: profileData?.total_credits_purchased || 0,
          total_credits_used: profileData?.total_credits_used || 0,
          thesis_analyses_count: profileData?.thesis_analyses_count || 0,
          abstracts_count: profileData?.abstracts_count || 0,
          citations_count: profileData?.citations_count || 0
        };

        setProfile(userProfile);
        setEditForm({
          username: userProfile.username || '',
          full_name: userProfile.full_name || ''
        });

        // Fetch recent analyses
        try {
          const { data: analysesData, error: analysesError } = await supabase
            .from('thesis_documents')
            .select('id, filename, status, overall_score, page_count, word_count, analysis_type, credits_used, created_at, analyzed_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          if (!analysesError && analysesData) {
            setRecentAnalyses(analysesData as ThesisAnalysis[]);
          }
        } catch (analysesErr) {
          console.error('Error fetching analyses:', analysesErr);
        } finally {
          setAnalysesLoading(false);
        }

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
  toast.success('Profil güncellendi!');
    } catch (error: any) {
      console.error('Profile update error:', error);
  toast.error('Profil güncellenirken hata: ' + error.message);
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
  toast.error('Yeni şifre en az 6 karakter olmalıdır');
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
  toast.error('Şifre değiştirilirken hata: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const displayCredits = isAdminUser ? '∞' : (profile?.credits ?? 0);

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'K';

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-cool flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600/20 border-t-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-paper-cool flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-ink mb-4">Profil bulunamadı</h1>
          <Link href="/" className="text-primary-700 hover:underline">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile.full_name || profile.username || '');

  const stats = [
    { label: 'Analiz edilen tez', value: profile.thesis_analyses_count ?? 0, topBorder: false },
    { label: 'Oluşturulan özet', value: profile.abstracts_count ?? 0, topBorder: false },
    { label: 'Formatlanan kaynak', value: profile.citations_count ?? 0, topBorder: false },
    { label: 'Satın alınan kredi', value: profile.total_credits_purchased ?? 0, topBorder: true },
    { label: 'Kullanılan kredi', value: profile.total_credits_used ?? 0, topBorder: false },
    {
      label: 'Üyelik tarihi',
      value: new Date(profile.created_at).toLocaleDateString('tr-TR'),
      topBorder: true,
    },
  ];

  return (
    <div className="min-h-screen bg-paper-cool">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <h1 className="font-serif font-medium text-[42px] leading-[1.05] tracking-[-0.02em] text-ink mb-7">
          Profilim
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-[22px] items-start">

          {/* ===== LEFT SIDEBAR ===== */}
          <div className="flex flex-col gap-[18px]">

            {/* Profile card */}
            <div className="bg-white border border-line-cool rounded-2xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6 text-center">
              <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#2a52a8] to-[#14224f] flex items-center justify-center mx-auto mb-[14px]">
                <span className="font-serif text-[34px] font-semibold text-white">{initials}</span>
              </div>
              <h2 className="text-[19px] font-bold text-ink mb-0.5">{profile.full_name || profile.username}</h2>
              <p className="text-[13.5px] text-ink/55 mb-[18px] truncate">{profile.email}</p>

              {/* Credit box */}
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-[22px] w-[22px] text-primary-700" strokeWidth={2} />
                  <span className="font-serif text-[32px] font-semibold text-primary-700 leading-none">{displayCredits}</span>
                </div>
                <p className="text-[13px] text-ink/55 mt-1.5 mb-3.5">Mevcut kredi</p>
                {isAdminUser && (
                  <p className="text-[11px] text-primary-700/70 -mt-2 mb-3">Admin sınırsız</p>
                )}
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 bg-primary-700 text-white text-[13.5px] font-bold px-4 py-[9px] rounded-[9px] transition-colors hover:bg-[#15296b]"
                >
                  <Zap className="h-[14px] w-[14px]" strokeWidth={2.2} />
                  Kredi Satın Al
                </Link>
              </div>
            </div>

            {/* Usage stats */}
            <div className="bg-white border border-line-cool rounded-2xl shadow-[0_16px_36px_-32px_rgba(20,28,55,0.4)] p-6">
              <h3 className="text-[15px] font-bold text-ink mb-4">Kullanım istatistikleri</h3>
              <div className="flex flex-col gap-[13px]">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-between ${s.topBorder ? 'pt-[13px] border-t border-line-cool' : ''}`}
                  >
                    <span className="text-[13.5px] text-ink/60">{s.label}</span>
                    <span className="text-[15px] font-bold text-ink">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT CONTENT ===== */}
          <div className="flex flex-col gap-[18px]">

            {/* Profile information */}
            <div className="bg-white border border-line-cool rounded-2xl shadow-[0_16px_36px_-30px_rgba(20,28,55,0.4)] p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-[19px] font-semibold text-ink">Profil bilgileri</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-[7px] text-[13.5px] font-bold text-primary-700 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-primary-50"
                  >
                    <Edit3 className="h-[15px] w-[15px]" strokeWidth={2} />
                    Düzenle
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 bg-primary-700 text-white text-[13.5px] font-bold px-3.5 py-2 rounded-lg disabled:opacity-50 transition-colors hover:bg-[#15296b]"
                    >
                      <Save className="h-[14px] w-[14px]" strokeWidth={2.2} />
                      {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditForm({
                          username: profile.username || '',
                          full_name: profile.full_name || ''
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-ink/55 px-3 py-2 rounded-lg transition-colors hover:bg-[#f3f4f2]"
                    >
                      <X className="h-[14px] w-[14px]" strokeWidth={2.2} />
                      İptal
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-ink/60 mb-[7px]">
                    Kullanıcı adı
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full border border-line-cool rounded-[9px] px-3 py-2.5 text-[14.5px] text-ink outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-primary-600/15"
                    />
                  ) : (
                    <div className="px-3 py-2.5 bg-[#f6f8f7] rounded-[9px] text-[14.5px] text-ink">{profile.username}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink/60 mb-[7px]">
                    Ad Soyad
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full border border-line-cool rounded-[9px] px-3 py-2.5 text-[14.5px] text-ink outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-primary-600/15"
                    />
                  ) : (
                    <div className="px-3 py-2.5 bg-[#f6f8f7] rounded-[9px] text-[14.5px] text-ink">{profile.full_name || 'Belirtilmemiş'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink/60 mb-[7px]">
                    E-posta
                  </label>
                  <div className="px-3 py-2.5 bg-[#f6f8f7] rounded-[9px] text-[14.5px] text-ink/55">{profile.email}</div>
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white border border-line-cool rounded-2xl shadow-[0_16px_36px_-32px_rgba(20,28,55,0.4)] p-6">
              <h3 className="font-serif text-[19px] font-semibold text-ink mb-[18px]">Şifre değiştir</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-ink/60 mb-[7px]">
                    Yeni şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                      className="w-full border border-line-cool rounded-[9px] pl-3 pr-10 py-2.5 text-[14.5px] text-ink outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-primary-600/15"
                      placeholder="Yeni şifreni gir"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute top-0 right-0 bottom-0 w-10 flex items-center justify-center text-ink/40"
                    >
                      {showPasswords.new ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink/60 mb-[7px]">
                    Yeni şifre (tekrar)
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                      className="w-full border border-line-cool rounded-[9px] pl-3 pr-10 py-2.5 text-[14.5px] text-ink outline-none focus:border-primary-600 focus:ring-[3px] focus:ring-primary-600/15"
                      placeholder="Yeni şifreni tekrar gir"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute top-0 right-0 bottom-0 w-10 flex items-center justify-center text-ink/40"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordForm.new_password || !passwordForm.confirm_password}
                    className="bg-primary-700 text-white text-[14px] font-bold px-[22px] py-[11px] rounded-[9px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#15296b]"
                  >
                    {changingPassword ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent analyses */}
            <div className="bg-white border border-line-cool rounded-2xl shadow-[0_16px_36px_-32px_rgba(20,28,55,0.4)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[19px] font-semibold text-ink">Son analizler</h3>
                {recentAnalyses.length > 0 && (
                  <Link
                    href="/analyses"
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-primary-700 hover:underline"
                  >
                    Tümünü gör
                    <ChevronRight className="h-[14px] w-[14px]" strokeWidth={2.2} />
                  </Link>
                )}
              </div>

              {analysesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-700" />
                </div>
              ) : recentAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-ink/20 mx-auto mb-3" />
                  <p className="text-ink/55 mb-4">Henüz analiz yok</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-primary-700 text-white text-[13.5px] font-bold px-4 py-2.5 rounded-[9px] transition-colors hover:bg-[#15296b]"
                  >
                    <FileText className="h-4 w-4" />
                    İlk Tezini Analiz Et
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentAnalyses.map((analysis) => (
                    <Link
                      key={analysis.id}
                      href={`/analyses/${analysis.id}`}
                      className="flex items-center justify-between gap-3.5 bg-[#f6f8f7] rounded-[11px] px-4 py-3.5 transition-colors hover:bg-paper-cool"
                    >
                      <div className="min-w-0">
                        <div className="text-[14.5px] font-bold text-ink truncate">
                          {analysis.filename}
                        </div>
                        <div className="text-[13px] text-ink/55 mt-0.5">
                          {analysis.page_count} sayfa · {new Date(analysis.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex-none">
                        {analysis.status === 'processing' ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#b45309]">
                            <span className="w-[14px] h-[14px] rounded-full border-2 border-[#e7d3b0] border-t-[#b45309] animate-spin"></span>
                            İşleniyor
                          </span>
                        ) : analysis.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#be123c]">
                            <AlertCircle className="h-[14px] w-[14px]" />
                            Başarısız
                          </span>
                        ) : analysis.overall_score !== null ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold px-[11px] py-[5px] rounded-full"
                            style={{
                              color:
                                analysis.overall_score >= 80 ? '#15803d' :
                                analysis.overall_score >= 60 ? '#a16207' : '#be123c',
                              backgroundColor:
                                analysis.overall_score >= 80 ? '#e7f3ec' :
                                analysis.overall_score >= 60 ? '#f7f0df' : '#fbe9ee',
                            }}
                          >
                            <TrendingUp className="h-[13px] w-[13px]" strokeWidth={2.2} />
                            {analysis.overall_score}/100
                          </span>
                        ) : (
                          <span className="text-[13px] text-ink/40">Puan yok</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
