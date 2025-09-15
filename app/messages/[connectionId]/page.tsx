'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, ChannelList, MessageList, MessageInput, Thread, Window } from 'stream-chat-react';
import Logo from '@/components/Logo';
import UserMenu from '@/components/UserMenu';
import MobileBottomNav from '@/components/MobileBottomNav';

export const dynamic = 'force-dynamic';

interface Connection {
  id: string;
  status: 'pending' | 'accepted' | 'declined';
  requester_profile_id: string;
  recipient_profile_id: string;
  created_at: string;
  stream_channel_id?: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  headline: string;
  firm_name?: string;
  public_email: string;
  avatar_url?: string;
}

interface ConnectionWithProfiles extends Connection {
  requester_profile: Profile;
  recipient_profile: Profile;
}

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [connection, setConnection] = useState<ConnectionWithProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [streamToken, setStreamToken] = useState<string | null>(null);

  const connectionId = params.connectionId as string;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (user && connectionId) {
      fetchConnection();
    }
  }, [isLoaded, user, connectionId, router]);

  // Cleanup Stream Chat client on unmount
  useEffect(() => {
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [chatClient]);

  // Mark messages as read when chat client is ready and user is viewing
  useEffect(() => {
    if (chatClient && connection?.stream_channel_id) {
      const channel = chatClient.channel('messaging', connection.stream_channel_id);
      
      // Watch the channel first, then mark as read
      const initializeChannel = async () => {
        try {
          await channel.watch();
          // Now it's safe to mark as read
          await channel.markRead();
          console.log('Messages marked as read');
        } catch (error) {
          console.error('Error initializing channel:', error);
        }
      };
      
      initializeChannel();
      
      // Set up listener to mark new messages as read when they arrive
      const handleNewMessage = () => {
        channel.markRead().catch(console.error);
      };
      
      channel.on('message.new', handleNewMessage);
      
      return () => {
        channel.off('message.new', handleNewMessage);
      };
    }
  }, [chatClient, connection?.stream_channel_id]);

  // Set up auto-expanding textarea after component mounts
  useEffect(() => {
    if (chatClient && connection?.stream_channel_id) {
      const setupAutoExpandingTextarea = () => {
        const textarea = document.querySelector('.str-chat__textarea') as HTMLTextAreaElement;
        if (textarea) {
          const autoExpand = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
          };
          
          textarea.addEventListener('input', autoExpand);
          textarea.addEventListener('paste', () => setTimeout(autoExpand, 0));
          
          return () => {
            textarea.removeEventListener('input', autoExpand);
            textarea.removeEventListener('paste', () => setTimeout(autoExpand, 0));
          };
        }
      };

      // Set up after a short delay to ensure DOM is ready
      const timeoutId = setTimeout(setupAutoExpandingTextarea, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chatClient, connection?.stream_channel_id]);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stream/connection/${connectionId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection data:', data);
        console.log('Connection status:', data.connection.status);
        console.log('Has stream_channel_id:', !!data.connection.stream_channel_id);
        console.log('Stream channel ID:', data.connection.stream_channel_id);
        setConnection(data.connection);
        setCurrentProfileId(data.currentProfileId);
        
        // Initialize Stream Chat if connection is accepted
        if (data.connection.status === 'accepted') {
          if (data.connection.stream_channel_id) {
            console.log('Connection accepted with channel ID:', data.connection.stream_channel_id);
            await initializeStreamChat(data.currentProfileId);
          } else {
            console.log('Connection accepted but missing Stream channel, creating now...');
            console.log('Connection details:', {
              id: data.connection.id,
              status: data.connection.status,
              stream_channel_id: data.connection.stream_channel_id
            });
            // Automatically create Stream channel for accepted connections
            setCreatingChannel(true);
            try {
              console.log('Starting automatic Stream channel creation...');
              await createStreamChannel(false); // Don't show error alerts for automatic creation
              console.log('Automatic Stream channel creation completed');
            } catch (error) {
              console.error('Automatic Stream channel creation failed:', error);
            } finally {
              setCreatingChannel(false);
            }
          }
        } else {
          console.log('Connection not ready for chat:', {
            status: data.connection.status,
            hasChannel: !!data.connection.stream_channel_id
          });
        }
      } else {
        console.error('Failed to fetch connection');
        // Redirect to messages if connection not found
        router.push('/messages');
      }
    } catch (error) {
      console.error('Error fetching connection:', error);
      router.push('/messages');
    } finally {
      setLoading(false);
    }
  };

  const initializeStreamChat = async (profileId: string) => {
    try {
      console.log('Initializing Stream Chat for profile:', profileId);
      
      // Check if Stream key is available
      if (!process.env.NEXT_PUBLIC_STREAM_KEY) {
        throw new Error('NEXT_PUBLIC_STREAM_KEY is not set');
      }
      
      // Check if client is already connected
      const existingClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!);
      if (existingClient.userID === profileId) {
        console.log('Stream Chat client already connected for this user');
        setChatClient(existingClient);
        return;
      }
      
      // Get Stream token
      const tokenResponse = await fetch('/api/stream/token');
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get Stream token: ${errorText}`);
      }
      const { token } = await tokenResponse.json();
      setStreamToken(token);
      console.log('Stream token received');

      // Initialize Stream Chat client
      const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!);
      await client.connectUser(
        {
          id: profileId,
          name: user?.fullName || 'User',
        },
        token
      );
      
      console.log('Stream Chat client connected');
      setChatClient(client);
    } catch (error) {
      console.error('Error initializing Stream Chat:', error);
    }
  };

  const getOtherProfile = () => {
    if (!connection || !currentProfileId) return null;
    return connection.requester_profile_id === currentProfileId 
      ? connection.recipient_profile 
      : connection.requester_profile;
  };

  const createStreamChannel = async (showErrorAlert = true) => {
    console.log('createStreamChannel called with showErrorAlert:', showErrorAlert);
    console.log('Connection ID from state:', connection?.id);
    console.log('Connection ID from params:', connectionId);
    
    // Use connectionId from URL params instead of state to avoid timing issues
    const idToUse = connection?.id || connectionId;
    console.log('Using connection ID:', idToUse);
    
    try {
      console.log('Making API call to /api/stream/create-channel...');
      const response = await fetch('/api/stream/create-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: idToUse })
      });

      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Stream channel created successfully:', data);
        // Refresh the connection data
        console.log('Refreshing connection data...');
        await fetchConnection();
      } else {
        const error = await response.json();
        console.error('Failed to create Stream channel:', error);
        if (showErrorAlert) {
          alert(`Failed to create Stream channel: ${error.error}\n\nDetails: ${error.details || 'Unknown error'}`);
        } else {
          // For automatic creation, just log the error
          console.error('Automatic Stream channel creation failed:', error);
        }
      }
    } catch (error) {
      console.error('Error creating Stream channel:', error);
      if (showErrorAlert) {
        alert('Error creating Stream channel');
      } else {
        // For automatic creation, just log the error
        console.error('Automatic Stream channel creation failed:', error);
      }
    }
  };

  const testStreamConfig = async () => {
    try {
      const response = await fetch('/api/stream/test-config');
      const data = await response.json();
      console.log('Stream configuration:', data);
      alert(`Stream Configuration:\n\n${JSON.stringify(data.config, null, 2)}\n\nMessage: ${data.message}`);
    } catch (error) {
      console.error('Error testing Stream config:', error);
      alert('Error testing Stream configuration');
    }
  };

  if (!isLoaded || !user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!connection || connection.status !== 'accepted') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Logo />
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <Link href="/search" className="hover:text-slate-900">Search</Link>
              <Link href="/jobs" className="hover:text-slate-900">Jobs</Link>
              <Link href="/messages" className="hover:text-slate-900 font-medium">Messages</Link>
            </nav>
            <UserMenu 
              userName={user.fullName || undefined}
              userEmail={user.primaryEmailAddress?.emailAddress}
            />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Connection Not Found</h3>
          <p className="text-slate-600 mb-4">
            This connection doesn't exist or you don't have permission to access it.
          </p>
          <Link
            href="/messages"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const otherProfile = getOtherProfile();

  return (
    <div
      className="fixed inset-0 flex flex-col bg-white md:relative md:min-h-screen"
      style={{
        // Use true viewport height on mobile browsers
        height: "calc(var(--vh) * 100)",
        touchAction: "manipulation",
      }}
    >
      {/* Header */}
      <header className="shrink-0 border-b p-3 bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-slate-600">
                  {otherProfile?.first_name[0]}{otherProfile?.last_name[0]}
                </span>
              </div>
              <div>
                <h1 className="text-base font-medium text-slate-900">
                  {otherProfile?.first_name} {otherProfile?.last_name}
                </h1>
                <p className="text-slate-600 text-sm">{otherProfile?.headline}</p>
              </div>
            </div>
          </div>
          <UserMenu 
            userName={user.fullName || undefined}
            userEmail={user.primaryEmailAddress?.emailAddress}
          />
        </div>
      </header>

      {/* Messages + Input share the same flex column */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Messages List */}
        <div
          className="
            flex-1 min-h-0 overflow-y-auto overscroll-contain
            px-3 py-2
            pb-[calc(env(safe-area-inset-bottom,0px)+72px)]
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {chatClient && connection.stream_channel_id ? (
            <div className="h-full">
              <style jsx global>{`
                .str-chat {
                  height: 100% !important;
                  overflow: visible !important;
                }
                .str-chat__container {
                  height: 100% !important;
                  overflow: visible !important;
                }
                .str-chat__main-panel {
                  height: 100% !important;
                  display: flex !important;
                  flex-direction: column !important;
                  overflow: visible !important;
                }
                .str-chat__list {
                  flex: 1 !important;
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  -webkit-overflow-scrolling: touch !important;
                  min-height: 0 !important;
                  overscroll-behavior: contain !important;
                }
                /* Hide the Stream Chat input - we'll use our own */
                .str-chat__input-flat {
                  display: none !important;
                }
              `}</style>
              <Chat client={chatClient} theme="str-chat__theme-light">
                <Channel channel={chatClient.channel('messaging', connection.stream_channel_id)}>
                  <Window>
                    <MessageList />
                    {/* Empty MessageInput - we'll use our own below */}
                    <div style={{ display: 'none' }}>
                      <MessageInput />
                    </div>
                  </Window>
                  <Thread />
                </Channel>
              </Chat>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {creatingChannel ? 'Setting Up Chat...' : !connection.stream_channel_id ? 'Chat Not Available' : 'Initializing Chat...'}
                </h3>
                <p className="text-slate-600 mb-4">
                  {creatingChannel 
                    ? 'Creating your messaging channel, please wait...'
                    : !connection.stream_channel_id 
                      ? 'This connection needs to be accepted first to enable messaging.'
                      : 'Setting up your messaging interface...'
                  }
                </p>
                <div className="text-sm text-slate-500">
                  <p>Connection ID: {connection.id}</p>
                  <p>Status: {connection.status}</p>
                  {connection.stream_channel_id && (
                    <p>Stream Channel: {connection.stream_channel_id}</p>
                  )}
                  {!connection.stream_channel_id && connection.status === 'accepted' && !creatingChannel && (
                    <div className="mt-4 space-y-3">
                      <p className="text-amber-600">⚠️ Stream channel not created. Check server logs.</p>
                      <div className="flex gap-2">
                        <button
                          onClick={testStreamConfig}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          Test Stream Config
                        </button>
                        <button
                          onClick={() => createStreamChannel(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Create Stream Channel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input - Our own implementation */}
        {chatClient && connection.stream_channel_id && (
          <form
            className="
              shrink-0
              sticky bottom-0 z-20
              border-t bg-white/95 backdrop-blur
              p-3
              [padding-bottom:calc(env(safe-area-inset-bottom,0px)+12px)]
            "
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const message = formData.get('message') as string;
              if (message.trim()) {
                try {
                  const channel = chatClient.channel('messaging', connection.stream_channel_id);
                  await channel.sendMessage({
                    text: message.trim(),
                  });
                  // Clear the input
                  (e.currentTarget.querySelector('textarea') as HTMLTextAreaElement).value = '';
                  (e.currentTarget.querySelector('textarea') as HTMLTextAreaElement).style.height = 'auto';
                } catch (error) {
                  console.error('Error sending message:', error);
                }
              }
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                name="message"
                className="
                  w-full rounded-xl border p-3 max-h-40
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  resize-none
                "
                rows={1}
                placeholder="Type a message…"
                onInput={(e) => {
                  // Auto-expand textarea
                  const textarea = e.currentTarget;
                  textarea.style.height = 'auto';
                  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
                }}
                onFocus={(e) => {
                  // Nudge into view when mobile keyboard opens
                  e.currentTarget.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }}
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
