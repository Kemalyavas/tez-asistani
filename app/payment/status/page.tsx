'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Coins, AlertTriangle, ArrowRight, Home, RefreshCw } from 'lucide-react';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') || 'unknown';
  const error = searchParams.get('error');
  const packageName = searchParams.get('package');
  const credits = searchParams.get('credits');
  const balance = searchParams.get('balance');

  const isSuccess = status === 'success';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${isSuccess ? 'from-green-50' : 'from-red-50'} to-white flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {isSuccess ? (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Title */}
          <h1 className={`text-2xl font-bold mb-2 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>

          {/* Status Description */}
          {isSuccess ? (
            <p className="text-gray-600 mb-6">
              Your credits have been added to your account.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              {error || 'Your payment could not be processed.'}
            </p>
          )}

          {/* Success Details */}
          {isSuccess && (
            <div className="space-y-4 mb-6">
              {/* Credits Added */}
              {credits && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <Coins className="h-8 w-8 text-blue-600" />
                    <div>
                      <span className="text-3xl font-bold text-blue-700">+{credits}</span>
                      <span className="text-blue-600 ml-2">credits</span>
                    </div>
                  </div>
                  {packageName && (
                    <p className="text-sm text-blue-600 mt-2">
                      {packageName} Package
                    </p>
                  )}
                </div>
              )}

              {/* New Balance */}
              {balance && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    New Balance: <strong className="text-gray-900">{balance} credits</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {!isSuccess && error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 text-left">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isSuccess ? (
              <>
                <Link
                  href="/"
                  className="w-full btn-primary flex items-center justify-center"
                >
                  Start Analyzing
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>

                <Link
                  href="/profile"
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center"
                >
                  View Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Link>

                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center"
                >
                  <Home className="h-5 w-5 mr-2" />
                  Back to Home
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        {!isSuccess && (
          <p className="text-center text-sm text-gray-500 mt-6">
            If you were charged but did not receive credits, please contact{' '}
            <a href="mailto:support@tezai.com" className="text-blue-600 hover:underline">
              support@tezai.com
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
