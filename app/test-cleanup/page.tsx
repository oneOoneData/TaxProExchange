export default function TestCleanupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Cleanup Page</h1>
        <p className="text-gray-600">If you can see this, the routing is working.</p>
        <div className="mt-8">
          <button 
            onClick={() => {
              fetch('/api/debug/cleanup-orphaned-profiles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              })
              .then(res => res.json())
              .then(data => {
                alert(JSON.stringify(data, null, 2));
              })
              .catch(err => {
                alert('Error: ' + err.message);
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test API Call
          </button>
        </div>
      </div>
    </div>
  );
}
