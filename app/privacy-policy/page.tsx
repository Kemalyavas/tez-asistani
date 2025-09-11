'use client';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Server, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Güvenlik Özeti */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-8">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-green-800">Our Security Commitment</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Lock className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">SSL Encryption</h3>
                  <p className="text-gray-600 text-sm">All your data is encrypted with 256‑bit SSL</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Trash2 className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Automatic Deletion</h3>
                  <p className="text-gray-600 text-sm">Files are automatically deleted after analysis</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Eye className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Zero Sharing</h3>
                  <p className="text-gray-600 text-sm">No data is shared with third parties</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <UserCheck className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">KVKK Compliant</h3>
                  <p className="text-gray-600 text-sm">Compliant with Turkish data protection law</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ana İçerik */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
            
            {/* 1. Toplanan Veriler */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2 text-blue-600" />
                1. What Data Do We Collect?
              </h2>
              <div className="prose max-w-none text-gray-700">
                <h3 className="text-lg font-semibold mb-2">Thesis Files</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Your thesis files in PDF and DOCX format</li>
                  <li>File name and size information</li>
                  <li>Upload date and time</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">User Information</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Email address (for registration)</li>
                  <li>IP address (for security)</li>
                  <li>Browser information (for technical support)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">Analysis Data</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Analysis results and reports</li>
                  <li>Usage statistics</li>
                  <li>Error logs (for troubleshooting)</li>
                </ul>
              </div>
            </section>

            {/* 2. Veri Kullanımı */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. How Do We Use Your Data?</h2>
              <div className="prose max-w-none text-gray-700">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="font-semibold text-blue-800">Single Purpose: Thesis Analysis</p>
                  <p className="text-blue-700 text-sm mt-1">Your thesis files are used solely to provide the analysis service.</p>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">Thesis Files:</h3>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>✅ Compliance check with required format standards</li>
                  <li>✅ Citation and reference formatting</li>
                  <li>✅ AI‑assisted analysis and suggestions</li>
                  <li>❌ AI model training (ABSOLUTELY NOT USED)</li>
                  <li>❌ Sharing with other users</li>
                  <li>❌ Commercial exploitation</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">User Information:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Account management and authentication</li>
                  <li>Providing technical support</li>
                  <li>Service improvement (anonymous statistics)</li>
                  <li>Security measures</li>
                </ul>
              </div>
            </section>

            {/* 3. Veri Güvenliği */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Our Data Security Measures</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3 text-gray-800">Technical Security</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• 256-bit SSL/TLS encryption</li>
                    <li>• Secure server infrastructure</li>
                    <li>• Regular security testing</li>
                    <li>• Firewall protection</li>
                    <li>• Automated backup system</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3 text-gray-800">Access Control</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Limited staff access</li>
                    <li>• Two‑factor authentication</li>
                    <li>• Access log retention</li>
                    <li>• Regular permission reviews</li>
                    <li>• Confidentiality agreements</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Veri Saklama */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Retention Periods</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-800 mb-3">⏱️ Automatic Deletion Policy</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Thesis Files</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">24 hours</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Analysis Results</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">30 days</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-yellow-200 pb-2">
                    <span className="font-medium">Temporary Files</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">1 hour</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Account Information</span>
                    <span className="bg-yellow-200 px-2 py-1 rounded text-sm font-semibold">Until account deletion</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Kullanıcı Hakları */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Rights (Under KVKK)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">📋 Right to Access</h3>
                  <p className="text-sm text-gray-600">You can learn which of your data is processed</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">✏️ Right to Rectification</h3>
                  <p className="text-sm text-gray-600">You can request correction of incorrect information</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🗑️ Right to Erasure</h3>
                  <p className="text-sm text-gray-600">You can request deletion of your data</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🚫 Right to Object</h3>
                  <p className="text-sm text-gray-600">You can object to data processing</p>
                </div>
              </div>
            </section>

            {/* 6. Üçüncü Taraf Hizmetler */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">OpenAI (ChatGPT API)</h3>
                  <p className="text-sm text-gray-600 mb-2">Used for AI analysis. OpenAI's data policy:</p>
                  <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                    <li>Data sent via API is not used for model training</li>
                    <li>Compliant with GDPR and data protection standards</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Supabase (Database)</h3>
                  <p className="text-sm text-gray-600 mb-2">For user accounts and analysis results:</p>
                  <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                    <li>SOC 2 Type II certified</li>
                    <li>GDPR-compliant data processing</li>
                    <li>Secure hosting on Amazon AWS</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. İletişim */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. Contact</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  For questions, requests or complaints about data privacy:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Email:</strong> info@tezasistani.com</p>
                  <p><strong>Address:</strong> Kocaeli/Izmit</p>
                  <p><strong>Data Protection Officer:</strong> Ali Kemal Yavaş</p>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Response Time:</strong> Your requests are answered within 2 weeks at the latest.
                  </p>
                </div>
              </div>
            </section>

  
          </div>

          {/* Alt Navigasyon */}
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
