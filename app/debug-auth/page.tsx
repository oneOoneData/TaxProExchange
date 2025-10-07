import { auth } from "@clerk/nextjs/server";

export default async function DebugAuth() {
  const { userId } = await auth();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Auth Info</h1>
        <div className="space-y-2">
          <p className="font-mono">
            <strong>Current Clerk User ID:</strong> {userId || 'Not logged in'}
          </p>
        </div>
      </div>
    </div>
  );
}

