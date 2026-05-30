/**
 * FAL Video Generation with Proper Job Polling
 * Handles asynchronous video generation with completion polling
 * 
 * Usage:
 *   const { generateVideo } = require('./lib/fal-video-generate');
 *   const result = await generateVideo({
 *     prompt: 'Two professionals...',
 *     duration: 6,
 *     aspectRatio: '9:16'
 *   });
 *   console.log(result.videoUrl); // Direct URL, no manual work
 */

const fetch = require('node-fetch');

/**
 * Generate video using FAL with proper job polling
 * Waits for completion automatically
 */
async function generateVideo({
  prompt,
  duration = 5,
  aspectRatio = '9:16',
  model = 'fal-ai/minimax/video-01-live',
  maxWaitSeconds = 300 // 5 minute timeout
}) {
  try {
    if (!prompt) throw new Error('Prompt is required');
    
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      throw new Error('FAL_API_KEY not found in environment');
    }

    console.log(`🎬 Starting video generation...`);
    console.log(`   Model: ${model}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Aspect: ${aspectRatio}`);

    // Step 1: Submit job
    const submitUrl = `https://api.fal.ai/queue/${model}/submit`;
    
    const submitBody = {
      prompt: prompt,
      duration: duration,
      aspect_ratio: aspectRatio,
      enable_safety_checker: true
    };

    console.log(`📤 Submitting job to FAL...`);

    const submitResponse = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submitBody)
    });

    if (!submitResponse.ok) {
      throw new Error(`FAL submit failed: ${submitResponse.statusText}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      throw new Error('No request_id returned from FAL');
    }

    console.log(`✅ Job submitted. Request ID: ${requestId}`);
    console.log(`⏳ Polling for completion (max ${maxWaitSeconds}s)...`);

    // Step 2: Poll for completion
    const statusUrl = `https://api.fal.ai/queue/${model}/${requestId}`;
    const startTime = Date.now();
    const pollIntervalMs = 2000; // Poll every 2 seconds

    let completed = false;
    let videoUrl = null;
    let pollCount = 0;

    while (!completed) {
      // Check timeout
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      if (elapsedSeconds > maxWaitSeconds) {
        throw new Error(`Video generation timeout after ${maxWaitSeconds}s`);
      }

      // Poll status
      pollCount++;
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${apiKey}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`FAL status check failed: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        completed = true;
        
        // Extract video URL from output
        if (statusData.output && statusData.output.video) {
          videoUrl = statusData.output.video.url || statusData.output.video;
        }

        if (!videoUrl) {
          console.warn('⚠️ No video URL in output:', statusData.output);
          throw new Error('Video generated but no URL found in output');
        }

        console.log(`✅ Video generation complete!`);
        console.log(`📊 Polled ${pollCount} times over ${elapsedSeconds.toFixed(1)}s`);
        break;
      } else if (statusData.status === 'failed') {
        throw new Error(`FAL video generation failed: ${statusData.error || 'Unknown error'}`);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      process.stdout.write(`.`);
    }

    return {
      success: true,
      videoUrl: videoUrl,
      requestId: requestId,
      model: model,
      duration: duration,
      aspectRatio: aspectRatio,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Video generation failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateVideo
};
