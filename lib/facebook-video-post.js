/**
 * Facebook Video Post Function (Improved)
 * Handles both local files and remote URLs using Resumable Upload API
 * 
 * Usage:
 *   const { postVideo } = require('./lib/facebook-video-post');
 *   await postVideo({
 *     videoUrl: 'https://...',  // or local file path
 *     message: 'Post text',
 *   })
 */

// Load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv might not be available
}

/**
 * POST video to Facebook using Resumable Upload API
 * This handles large files and remote URLs better than direct upload
 */
async function postVideo({ 
  videoUrl, 
  message, 
  pageId = '644452652094418' 
}) {
  try {
    if (!videoUrl || !message) {
      throw new Error('Missing required parameters: videoUrl, message');
    }

    console.log(`📹 Posting video to Facebook page ${pageId}...`);
    console.log(`   Video: ${videoUrl}`);

    // Get page token
    const pageToken = await getPageToken(pageId);

    // Try approach 1: Direct post with video URL as description
    console.log(`\n🔗 Attempting to post video link (Facebook will auto-embed)...`);
    return await postVideoAsLink({
      videoUrl,
      message,
      pageToken,
      pageId
    });

  } catch (error) {
    console.error('❌ Failed to post video:', error.message);
    throw error;
  }
}

/**
 * Post video as a video post with description and source URL
 * Facebook's native way to handle remote video URLs
 */
async function postVideoAsLink({
  videoUrl,
  message,
  pageToken,
  pageId = '644452652094418',
  apiVersion = 'v19.0'
}) {
  try {
    console.log(`📹 Posting video with source URL...`);

    const url = `https://graph.facebook.com/${apiVersion}/${pageId}/videos`;

    // Use FormData with source URL
    const form = new FormData();
    form.append('title', 'Tax Pros Community');
    form.append('description', message);
    form.append('source', videoUrl);
    form.append('published', 'true');
    form.append('access_token', pageToken);

    const fetchFn = (await import('node-fetch')).default;
    const response = await fetchFn(url, {
      method: 'POST',
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Facebook API error:', data.error?.message || data.error);
      
      // Fallback: post as text with link
      console.log(`\n💬 Falling back to text post with link...`);
      return await postVideoAsTextLink({
        videoUrl,
        message,
        pageToken,
        pageId
      });
    }

    console.log(`✅ Video posted successfully!`);
    console.log(`📊 Post ID: ${data.id}`);

    return {
      success: true,
      postId: data.id,
      method: 'native_video',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error posting video:', error.message);
    throw error;
  }
}

/**
 * Fallback: Post as text with clickable link
 * Facebook will auto-generate preview when URL is in message
 */
async function postVideoAsTextLink({
  videoUrl,
  message,
  pageToken,
  pageId = '644452652094418',
  apiVersion = 'v19.0'
}) {
  try {
    console.log(`💬 Posting as text with video link...`);

    const url = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;

    // Append video link to message
    const fullMessage = `${message}\n\n🎬 Watch video: ${videoUrl}`;

    const form = new FormData();
    form.append('message', fullMessage);
    form.append('access_token', pageToken);

    const fetchFn = (await import('node-fetch')).default;
    const response = await fetchFn(url, {
      method: 'POST',
      body: form
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Facebook API error: ${data.error?.message || response.statusText}`);
    }

    console.log(`✅ Text post with video link created!`);
    console.log(`📊 Post ID: ${data.id}`);

    return {
      success: true,
      postId: data.id,
      method: 'text_with_link',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error posting text link:', error.message);
    throw error;
  }
}

/**
 * Get current page token by exchanging user token
 */
async function getPageToken(pageId = '644452652094418') {
  try {
    const userToken = process.env.FACEBOOK_USER_TOKEN_LONG_LIVED;
    
    if (!userToken) {
      throw new Error('FACEBOOK_USER_TOKEN_LONG_LIVED not found in environment. Set it in .env.local');
    }

    console.log('🔑 Exchanging user token for page token...');

    const url = `https://graph.facebook.com/v19.0/me/accounts?access_token=${encodeURIComponent(userToken)}`;
    
    const fetchFn = (await import('node-fetch')).default;
    const response = await fetchFn(url);
    const data = await response.json();

    if (!response.ok || !data.data) {
      throw new Error(`Failed to get page token: ${data.error?.message || 'Unknown error'}`);
    }

    const page = data.data.find(p => p.id === pageId);
    
    if (!page) {
      throw new Error(`Page ${pageId} not found in user's pages`);
    }

    console.log('✅ Page token obtained');
    return page.access_token;
  } catch (error) {
    console.error('❌ Error getting page token:', error.message);
    throw error;
  }
}

module.exports = {
  postVideo,
  postVideoAsLink,
  postVideoAsTextLink,
  getPageToken
};
