'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, AlertTriangle, RefreshCw, HelpCircle, ArrowLeft } from 'lucide-react';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown_error';

  // Error messages mapping
  const errorMessages: Record<string, { title: string; description: string; suggestion: string }> = {
    missing_token: {
      title: 'Payment Session Expired',
      description: 'The payment session has expired or the token is missing.',
      suggestion: 'Please start a new purchase from the pricing page.'
    },
    payment_failed: {
      title: 'Payment Failed',
      description: 'Your payment could not be processed.',
      suggestion: 'Please check your card details and try again.'
    },
    invalid_package: {
      title: 'Invalid Package',
      description: 'The selected credit package is not valid.',
      suggestion: 'Please select a valid package from the pricing page.'
    },
    user_not_found: {
      title: 'User Not Found',
      description: 'We could not find your account.',
      suggestion: 'Please make sure you are logged in and try again.'
    },
    credit_add_failed: {
      title: 'Credit Addition Failed',
      description: 'Payment was successful but credits could not be added.',
      suggestion: 'Please contact support with your payment details.'
    },
    verification_failed: {
      title: 'Verification Failed',
      description: 'We could not verify your payment with the payment provider.',
      suggestion: 'If you were charged, please contact support.'
    },
    server_error: {
      title: 'Server Error',
      description: 'An unexpected error occurred on our servers.',
      suggestion: 'Please try again later or contact support.'
    },
    unknown_error: {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred during payment.',
      suggestion: 'Please try again or contact support if the problem persists.'
    }
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown_error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 mb-4">
            {errorInfo.description}
          </p>

          {/* Suggestion Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 text-left">
                {errorInfo.suggestion}
              </p>
            </div>
          </div>

          {/* Error Code (for support) */}
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">
              Error Code: <code className="font-mono text-gray-700">{error}</code>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
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
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>

            <a
              href="mailto:support@tezai.com"
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center py-2"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          If you believe this is an error, please contact our support team with the error code above.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
