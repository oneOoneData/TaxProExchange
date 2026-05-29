/**
 * Test script for Facebook video posting
 * Usage: node scripts/test-facebook-video.js
 */

const { postVideo } = require('../lib/facebook-video-post');

async function test() {
  try {
    console.log('🧪 Testing Facebook video posting...');
    console.log('📹 Video URL: https://v3.fal.media/files/rabbit/019e745d-4bb9-75f3-badb-87320da2343d.mp4');
    
    const result = await postVideo({
      videoUrl: 'https://v3.fal.media/files/rabbit/019e745d-4bb9-75f3-badb-87320da2343d.mp4',
      message: 'Who\'s on TaxProExchange? Meet our community of 475 tax professionals. 44% CPAs, 23% EAs (opportunity!), California leads but Sun Belt growing, 62% solo practitioners, peak experience 6-10 years. Read the full breakdown at taxproexchange.com/insights/tax-pros-community-analysis',
      pageId: '644452652094418'
    });

    console.log('✅ Test successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
