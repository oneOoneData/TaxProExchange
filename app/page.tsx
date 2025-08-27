'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';

export default function Page() {
  const [email, setEmail] = useState('');
  const [roleInterest, setRoleInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          roleInterest,
          notes,
          source: 'landing_page'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubmitted(true);
        // Redirect to confirmation page
        window.location.href = data.redirectUrl;
      } else {
        console.error('Failed to join waitlist:', response.status);
        alert('Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TX</span>
                </div>
              </div>
              <div className="ml-3">
                <span className="text-xl font-semibold text-slate-900">TaxProExchange</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">How It Works</a>
                <a href="#about" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">About</a>
                <a href="/join" className="hover:text-slate-900">Join</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-slate-50 to-slate-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl"
                >
                  <span className="block">Find the Perfect</span>
                  <span className="block text-blue-600">Tax Professional</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-3 text-base text-slate-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                >
                  Connect with verified tax professionals, CPAs, and enrolled agents. 
                  Get expert help for your tax needs, business accounting, and financial planning.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                >
                  <div className="rounded-md shadow">
                    <a
                      href="#join-form"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Join now to get on the waitlist
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#how-it-works"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      Learn More
                    </a>
                  </div>
                </motion.div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-blue-400 to-blue-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl font-bold mb-4">📊</div>
              <p className="text-xl font-semibold">Professional Network</p>
              <p className="text-blue-100">Trusted by thousands</p>
            </div>
          </div>
        </div>
      </div>

      {/* Join Form Section */}
      <div id="join-form" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
            >
              Join the Waitlist
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-4 text-lg text-slate-600"
            >
              Be among the first to access our professional network when we launch.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-slate-50 rounded-lg p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="roleInterest" className="block text-sm font-medium text-slate-700 mb-2">
                  I'm interested in joining as a:
                </label>
                <select
                  id="roleInterest"
                  value={roleInterest}
                  onChange={(e) => setRoleInterest(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select your role</option>
                  <option value="tax_professional">Tax Professional (CPA, EA, etc.)</option>
                  <option value="business_owner">Business Owner</option>
                  <option value="individual">Individual Taxpayer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us more about what you're looking for..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
            >
              Why Choose TaxProExchange?
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🔍",
                title: "Verified Professionals",
                description: "All professionals are verified and licensed. No more guessing about credentials."
              },
              {
                icon: "📍",
                title: "Local & Remote Options",
                description: "Find professionals in your area or work remotely with experts nationwide."
              },
              {
                icon: "💼",
                title: "Specialized Expertise",
                description: "Match with professionals who specialize in your specific tax situation."
              },
              {
                icon: "⭐",
                title: "Transparent Reviews",
                description: "See real feedback from other clients to make informed decisions."
              },
              {
                icon: "🔒",
                title: "Secure Communication",
                description: "Built-in messaging and file sharing with enterprise-grade security."
              },
              {
                icon: "📱",
                title: "Easy to Use",
                description: "Simple interface to find, connect, and work with tax professionals."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
            >
              How It Works
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Search & Filter",
                description: "Use our advanced search to find professionals by location, specialization, and availability."
              },
              {
                step: "2",
                title: "Review & Connect",
                description: "Read profiles, reviews, and credentials. Send a message to start the conversation."
              },
              {
                step: "3",
                title: "Work Together",
                description: "Collaborate securely through our platform. Share documents and track progress."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-8"
          >
            Made for Tax Pros, by Tax Pros
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-slate-600 mb-8"
          >
            TaxProExchange was built by tax professionals who understand the challenges of finding 
            the right expertise and building trust with clients. We're creating a platform that 
            makes it easier for everyone to connect with qualified professionals.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <a
              href="#join-form"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Join the Waitlist
            </a>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center mr-3">
                  <span className="text-slate-900 font-bold text-sm">TX</span>
                </div>
                <span className="text-xl font-semibold">TaxProExchange</span>
              </div>
              <p className="text-slate-400 mb-4">
                Connecting tax professionals with clients who need their expertise. 
                Building trust through transparency and verification.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase mb-4">
                Platform
              </h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-400 hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white">How It Works</a></li>
                <li><a href="#about" className="text-slate-400 hover:text-white">About</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 tracking-wider uppercase mb-4">
                Connect
              </h3>
              <ul className="space-y-2">
                <li><a href="#join-form" className="text-slate-400 hover:text-white">Join Waitlist</a></li>
                <li><a href="/join" className="text-slate-400 hover:text-white">Professional Signup</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400">
              © 2024 TaxProExchange. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
