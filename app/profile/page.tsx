import { Suspense } from 'react';
import ProfileContent from './ProfileContent';

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-blue-600">Profil yükleniyor...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
