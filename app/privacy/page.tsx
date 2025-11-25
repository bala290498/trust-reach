'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to TrustReach.in (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">2.1 Information You Provide to Us</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Account Information:</strong> When you create an account, we collect your email address, name, and profile information (if provided through third-party authentication services like Google)</li>
              <li><strong>Review Content:</strong> When you post reviews, we collect the content of your reviews, ratings, and any associated information</li>
              <li><strong>Communications:</strong> If you contact us, we collect your contact information and the content of your communications</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you access our Service, we automatically collect certain information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Usage Data:</strong> Information about how you interact with our Service, including pages visited, time spent, and features used</li>
              <li><strong>Device Information:</strong> Information about your device, including IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to track activity on our Service and hold certain information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>To provide, maintain, and improve our Service</li>
              <li>To authenticate your identity and manage your account</li>
              <li>To display your reviews and ratings on our platform</li>
              <li>To communicate with you about your account, reviews, or our services</li>
              <li>To detect, prevent, and address technical issues and fraudulent activity</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your information in the following situations:
            </p>
            
            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">4.1 Public Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your reviews, ratings, and associated information (such as your display name) are publicly visible on our platform. This information may be indexed by search engines and accessible to anyone who visits our website.
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">4.2 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your information with third-party service providers who perform services on our behalf, such as:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Hosting and cloud storage providers (e.g., Supabase, Vercel)</li>
              <li>Authentication services (e.g., Google OAuth)</li>
              <li>Analytics providers</li>
            </ul>

            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
            </p>

            <h3 className="text-2xl font-semibold text-gray-900 mb-3 mt-6">4.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If we are involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use industry-standard security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your data is stored on secure servers provided by our hosting partners. We retain your information for as long as your account is active or as needed to provide you services, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to track activity on our Service and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Access:</strong> You can request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> You can request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> You can request deletion of your personal information</li>
              <li><strong>Objection:</strong> You can object to certain processing of your personal information</li>
              <li><strong>Data Portability:</strong> You can request a copy of your data in a portable format</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              To exercise these rights, please contact us at <a href="mailto:support@trustreach.in" className="text-primary-600 hover:text-primary-700 underline">support@trustreach.in</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Service may contain links to third-party websites or services that are not owned or controlled by TrustReach.in. We are not responsible for the privacy practices of these third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ from those in your jurisdiction.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are located outside India and choose to provide information to us, please note that we transfer the data to India and process it there. Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Email:</strong> <a href="mailto:support@trustreach.in" className="text-primary-600 hover:text-primary-700 underline">support@trustreach.in</a>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We will respond to your inquiry within a reasonable timeframe.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

