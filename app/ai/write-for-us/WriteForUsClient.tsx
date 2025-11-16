"use client";

import AppNavigation from "@/components/AppNavigation";
import { siteUrl } from "@/lib/seo";
import { useState } from "react";

export default function WriteForUsClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    firm: "",
    title: "",
    topic: "",
    draft_url: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contributors/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitStatus({
        type: "success",
        message: data.message || "Thank you for your submission!",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        firm: "",
        title: "",
        topic: "",
        draft_url: "",
        message: "",
      });
    } catch (error: any) {
      setSubmitStatus({
        type: "error",
        message: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppNavigation />

      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <main className="max-w-4xl mx-auto py-16 px-6">
          {/* Hero Section */}
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4 text-slate-900">
              Write for TaxProExchange
            </h1>
            <p className="text-xl text-slate-700 mb-2">
              Share your practical insights on how AI is transforming tax and accounting.
            </p>
            <p className="text-lg text-slate-600">
              Get featured on our AI Hub and reach professionals nationwide.
            </p>
          </header>

          {/* What You Get */}
          <section className="mb-12 bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold mb-2 text-slate-900">Get recognized as a thought leader.</h2>
            <p className="text-slate-600 mb-6">Contributors receive:</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl">💡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Featured on TaxProExchange AI Hub
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Your article will be published on our growing AI hub, read by tax professionals nationwide.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🧠</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Contributor Badge
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Get a verified &ldquo;AI Contributor&rdquo; badge displayed on your TaxProExchange profile.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🖼️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Social Media Graphics
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Custom shareable graphics and pre-written LinkedIn captions to promote your article.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🔗</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Author Credit & Link to Your Website
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Include a link to your firm or personal site with full SEO benefits.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Content Guidelines */}
          <section className="mb-12 bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Content Guidelines
            </h2>
            <div className="space-y-4 text-slate-700">
              <div className="flex gap-3">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <p>
                  <strong>Practical AI applications</strong> – Real-world tools, workflows, or case studies from your own experience.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <p>
                  <strong>Actionable insights</strong> – Tips or examples tax professionals can apply right away.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <p>
                  <strong>All levels welcome</strong> – You don&rsquo;t need to be an AI expert; just share how AI benefits your work or how you&rsquo;ve started using it.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <p>
                  <strong>Optional deep dives</strong> – If you are technical, we also welcome in-depth explorations of local LLMs, automation, or data security.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-green-600 font-bold text-lg">✓</span>
                <p>
                  <strong>500–2,000 words</strong> – Long enough to be valuable, short enough to stay focused.
                </p>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <p>
                  <strong>No product pitches</strong> – Mentions of tools you use are fine, but avoid sales copy.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-red-600 font-bold text-lg">✗</span>
                <p>
                  <strong>No generic AI hype</strong> – Focus on specifics, not &ldquo;AI will change everything.&rdquo;
                </p>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 items-start">
                <span className="text-blue-600 font-bold text-lg flex-shrink-0">ℹ️</span>
                <p className="text-sm italic">
                  <strong>Strict &ldquo;No AI Slop&rdquo; rule:</strong> Use AI tools responsibly — every article must be human-reviewed and fact-checked.
                </p>
              </div>
            </div>
          </section>

          {/* Submission Form */}
          <section className="bg-white rounded-lg border border-slate-200 p-8">
            <h2 className="text-2xl font-semibold mb-6 text-slate-900">
              Submit Your Article
            </h2>

            {submitStatus.type === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>{submitStatus.message}</p>
                </div>
              </div>
            )}

            {submitStatus.type === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <div className="flex gap-2">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p>{submitStatus.message}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field - hidden via CSS */}
              <input
                type="text"
                name="website_url_verification"
                tabIndex={-1}
                autoComplete="off"
                className="absolute opacity-0 pointer-events-none"
                style={{ position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="firm" className="block text-sm font-medium text-slate-900 mb-2">
                  Firm/Company (optional)
                </label>
                <input
                  type="text"
                  id="firm"
                  name="firm"
                  value={formData.firm}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Tax Solutions"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-900 mb-2">
                  Article Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How I Built a Local LLM for Tax Research"
                />
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-900 mb-2">
                  Topic Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="topic"
                  name="topic"
                  required
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a topic...</option>
                  <option value="automation">Tax Workflow Automation</option>
                  <option value="ai-tools">AI Tools & Software</option>
                  <option value="security">Data Privacy & Security</option>
                  <option value="case-study">Case Study</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="draft_url" className="block text-sm font-medium text-slate-900 mb-2">
                  Draft URL (Google Docs, Notion, etc.)
                </label>
                <input
                  type="url"
                  id="draft_url"
                  name="draft_url"
                  value={formData.draft_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://docs.google.com/..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  Share a link to your draft, or describe it below
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-900 mb-2">
                  Additional Details
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Briefly describe your article idea, expertise, or any questions..."
                />
                <p className="mt-2 text-xs text-slate-500">
                  Submissions are manually reviewed by the TaxProExchange Council.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Submitting..." : "Submit My Article"}
                </button>
                <p className="mt-3 text-sm text-slate-600">
                  You&rsquo;ll receive an email confirmation, and we&rsquo;ll get back to you within 5–7 business days.
                </p>
              </div>
            </form>
          </section>

          {/* FAQ */}
          <section className="mt-12 text-center text-sm text-slate-600">
            <p>
              Questions or partnership ideas? Email us at{" "}
              <a href="mailto:support@taxproexchange.com" className="text-blue-600 hover:underline">
                support@taxproexchange.com
              </a>
            </p>
          </section>
        </main>
      </div>
    </>
  );
}

