'use client';

import Link from 'next/link';
import Script from 'next/script';
import { structuredData } from '../lib/structuredData';
import { ArrowLeft, Zap, RefreshCw, CreditCard, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DeliveryReturns() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="breadcrumbs-delivery"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData.generateBreadcrumb([
              { name: 'Home', url: 'https://www.tezai.com.tr' },
              { name: 'Delivery & Refunds', url: 'https://www.tezai.com.tr/delivery-returns' },
            ])
          ),
        }}
      />

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
          <h1 className="text-3xl font-bold text-gray-900">Delivery & Refund Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">

          {/* Quick Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Quick Summary</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Zap className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Instant Delivery</h3>
                  <p className="text-gray-600 text-sm">Credits are added to your account immediately after payment</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <RefreshCw className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Auto Refund on Failure</h3>
                  <p className="text-gray-600 text-sm">Credits are automatically refunded if analysis fails</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800">Never Expires</h3>
                  <p className="text-gray-600 text-sm">Your credits never expire - use them anytime</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">

            {/* Delivery */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                1. Delivery
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI is a digital service. There is no physical delivery involved.
                </p>

                <h3 className="text-lg font-semibold mb-2">How It Works:</h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>After successful payment, credits are <strong>instantly added</strong> to your account</li>
                  <li>You will receive a confirmation email with your receipt</li>
                  <li>Credits are immediately available for use</li>
                  <li>Our service is available 24/7</li>
                </ul>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> If credits do not appear within 5 minutes after payment, please contact us at kemalyavaas@outlook.com
                  </p>
                </div>
              </div>
            </section>

            {/* Credit System */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                2. Credit System
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p className="mb-4">
                  TezAI uses a credit-based system. You purchase credits and use them for various services:
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Service</th>
                        <th className="text-right py-2">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Citation Formatting</td>
                        <td className="text-right">1 credit</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Abstract Generation</td>
                        <td className="text-right">3 credits</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Thesis Analysis (Short)</td>
                        <td className="text-right">10 credits</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Thesis Analysis (Medium)</td>
                        <td className="text-right">25 credits</td>
                      </tr>
                      <tr>
                        <td className="py-2">Thesis Analysis (Long)</td>
                        <td className="text-right">50 credits</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p><strong>Credits never expire.</strong> Use them whenever you need.</p>
              </div>
            </section>

            {/* Refund Policy */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-purple-600" />
                3. Refund Policy
              </h2>
              <div className="prose max-w-none text-gray-700">

                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Automatic Credit Refunds
                </h3>
                <p className="mb-4">
                  If an analysis fails due to a technical issue on our end, credits are <strong>automatically refunded</strong> to your account. No action required from you.
                </p>

                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  When Monetary Refunds Are Available
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Credits have <strong>not been used</strong> at all</li>
                  <li>Request is made within <strong>14 days</strong> of purchase</li>
                  <li>Technical issues prevent you from using the service</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  When Refunds Are Not Available
                </h3>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>Credits have been partially or fully used</li>
                  <li>More than 14 days have passed since purchase</li>
                  <li>Issues caused by user error (wrong file format, etc.)</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3">How to Request a Refund</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Email us at <strong>kemalyavaas@outlook.com</strong></li>
                  <li>Include your registered email and payment date</li>
                  <li>Describe the reason for your refund request</li>
                  <li>We will respond within <strong>3 business days</strong></li>
                  <li>Approved refunds are processed within <strong>7-10 business days</strong></li>
                </ol>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                4. Contact Us
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  For questions about delivery, credits, or refunds:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Email:</strong> kemalyavaas@outlook.com</p>
                  <p><strong>Response Time:</strong> Within 24-48 hours</p>
                </div>
              </div>
            </section>

          </div>

          {/* Back Navigation */}
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
