'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { executeRecaptcha } from '@/lib/recaptcha';

export default function SuggestEventPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    locationCity: '',
    locationState: '',
    eventUrl: '',
    organizer: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const router = useRouter();

  // Helper function to format date for HTML input
  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns yyyy-MM-dd format
    } catch {
      return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUrlScrape = async () => {
    if (!formData.eventUrl.trim()) {
      setScrapeError('Please enter a URL first');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);

    try {
      const response = await fetch('/api/extract-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.eventUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        const scrapedData = result.data;

        // Update form with extracted data
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          description: result.description || prev.description,
          startDate: result.startsAt ? formatDateForInput(result.startsAt) : prev.startDate,
          endDate: result.endsAt ? formatDateForInput(result.endsAt) : prev.endDate,
          locationCity: result.city || prev.locationCity,
          locationState: result.state || prev.locationState,
          organizer: result.organizer || prev.organizer,
        }));
      } else {
        const error = await response.json();
        setScrapeError(error.error || 'Failed to extract event data');
      }
    } catch (error) {
      console.error('Error extracting URL:', error);
      setScrapeError('Failed to extract event data');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Execute reCAPTCHA before submitting
      let recaptchaToken = '';
      try {
        recaptchaToken = await executeRecaptcha('suggest_event');
      } catch (recaptchaError) {
        console.error('reCAPTCHA error:', recaptchaError);
        // Continue without reCAPTCHA if it fails to load
      }

      const response = await fetch('/api/events/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Reset form
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          locationCity: '',
          locationState: '',
          eventUrl: '',
          organizer: '',
          additionalInfo: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting event suggestion:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Suggest an Event</h1>
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
          >
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Suggest an Event
            </h2>
            <p className="text-slate-600">
              Just provide the conference URL and we&rsquo;ll automatically extract the details for you!
              Our team will review and add it to our curated list.
            </p>
          </div>

          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-green-600 mr-3">✅</div>
                <div>
                  <h3 className="text-green-800 font-medium">Thank you!</h3>
                  <p className="text-green-700 text-sm">
                    Your event suggestion has been submitted. We&rsquo;ll review it and add it to our list if it&rsquo;s a good fit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">❌</div>
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <p className="text-red-700 text-sm">
                    There was an error submitting your suggestion. Please try again.
                  </p>
                </div>
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
            
            {/* Event URL - Primary input */}
            <div>
              <label htmlFor="eventUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Conference URL *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="eventUrl"
                  name="eventUrl"
                  required
                  value={formData.eventUrl}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://example.com/conference-2024"
                />
                <button
                  type="button"
                  onClick={handleUrlScrape}
                  disabled={isScraping || !formData.eventUrl.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScraping ? '🔄 Scraping...' : '🔍 Auto-fill'}
                </button>
              </div>
              {scrapeError && (
                <p className="mt-2 text-sm text-red-600">{scrapeError}</p>
              )}
        <p className="mt-1 text-sm text-gray-500">
          We&rsquo;ll automatically extract the event details from this URL. Please review data for accuracy.
        </p>
            </div>

            {/* Event Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Annual Tax Conference 2026"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Event Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe the event, topics covered, speakers, etc."
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="locationCity" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="locationCity"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Las Vegas"
                />
              </div>
              <div>
                <label htmlFor="locationState" className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <select
                  id="locationState"
                  name="locationState"
                  value={formData.locationState}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a state</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                  <option value="DC">Washington DC</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>
            </div>


            {/* Organizer */}
            <div>
              <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-2">
                Organizer/Host *
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                required
                value={formData.organizer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., AICPA, State CPA Society, etc."
              />
            </div>


            {/* Additional Information */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                value={formData.additionalInfo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Any additional details, special requirements, or notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event Suggestion'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
