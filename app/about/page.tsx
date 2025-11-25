'use client'

import Link from 'next/link'
import { ArrowLeft, Target, Users, Shield, Star, Heart, TrendingUp } from 'lucide-react'

export default function AboutPage() {
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
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">About TrustReach.in</h1>
          <p className="text-xl text-gray-600">Empowering informed decisions through authentic reviews</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {/* Mission Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              At TrustReach.in, we believe that every consumer deserves access to honest, authentic reviews from real customers. Our mission is to create a transparent platform where people can share their genuine experiences and make informed decisions about the companies and brands they interact with.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We&apos;re committed to building a community-driven review ecosystem that values authenticity, transparency, and trust above all else.
            </p>
          </section>

          {/* What We Do Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Star className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">What We Do</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              TrustReach.in is a comprehensive review platform that allows users to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Read authentic reviews from verified customers across various industries</li>
              <li>Share their own experiences with companies and brands</li>
              <li>Discover businesses through category-based browsing</li>
              <li>Make informed decisions based on real customer feedback</li>
              <li>Engage with a community of honest reviewers</li>
            </ul>
          </section>

          {/* Our Values Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticity</h3>
                <p className="text-gray-700 leading-relaxed">
                  We prioritize genuine reviews from real customers. Every review on our platform comes from verified users sharing their authentic experiences.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Transparency</h3>
                <p className="text-gray-700 leading-relaxed">
                  We believe in complete transparency. Our platform operates with clear policies, and we&apos;re open about how we collect, use, and protect your data.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust</h3>
                <p className="text-gray-700 leading-relaxed">
                  Trust is the foundation of our platform. We work tirelessly to maintain the integrity of our review system and ensure users can rely on the information they find.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Community</h3>
                <p className="text-gray-700 leading-relaxed">
                  We&apos;re building a community where every voice matters. Your reviews help others make better decisions, creating a cycle of informed choices.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign Up & Verify</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Create an account using your Google account or email. We verify all users to ensure authentic reviews.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Experience</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Write honest reviews about companies you&apos;ve interacted with. Rate them and share your genuine experience to help others.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Discover & Decide</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Browse reviews by category, search for specific companies, and read authentic feedback from real customers to make informed decisions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Trust Us Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">Why Trust Us</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              TrustReach.in is built on principles that ensure the highest quality of reviews:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Verified Reviews:</strong> All reviews come from authenticated users, ensuring authenticity</li>
              <li><strong>No Manipulation:</strong> We have strict policies against fake reviews, paid reviews, and review manipulation</li>
              <li><strong>Fair Moderation:</strong> Our content moderation ensures reviews are genuine, helpful, and respectful</li>
              <li><strong>User Privacy:</strong> We protect your privacy while allowing you to share your experiences</li>
              <li><strong>Transparent Policies:</strong> Clear terms of service and privacy policies that protect both reviewers and readers</li>
            </ul>
          </section>

          {/* Our Commitment Section */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-primary-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">Our Commitment to You</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We are committed to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Maintaining a platform free from fake or fraudulent reviews</li>
              <li>Protecting your personal information and privacy</li>
              <li>Providing a user-friendly experience that makes sharing and discovering reviews easy</li>
              <li>Continuously improving our platform based on user feedback</li>
              <li>Fostering a respectful community where all voices are heard</li>
              <li>Being transparent about our practices and policies</li>
            </ul>
          </section>

          {/* Join Us Section */}
          <section className="mb-12 bg-gradient-to-br from-primary-50 to-secondary-50 p-8 rounded-xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Whether you&apos;re looking to make informed decisions or share your experiences, TrustReach.in is the platform for you. Join thousands of users who are building a more transparent marketplace through authentic reviews.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Start Reading Reviews
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
              >
                Write Your First Review
              </Link>
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Have questions, suggestions, or feedback? We&apos;d love to hear from you!
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Email:</strong> <a href="mailto:support@trustreach.in" className="text-primary-600 hover:text-primary-700 underline">support@trustreach.in</a>
            </p>
            <p className="text-gray-700 leading-relaxed">
              We&apos;re here to help and always appreciate your input in making TrustReach.in better.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

