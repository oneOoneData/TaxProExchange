'use client';

import { useState } from 'react';

export default function AddCALocationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const addLocation = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/add-location-ca', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ ${data.message || 'Success!'}`);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Add California Location
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to add California to your profile locations so you can see California events.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <button
            onClick={addLocation}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add California Location'}
          </button>
          
          {result && (
            <div className={`text-center text-sm ${result.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
