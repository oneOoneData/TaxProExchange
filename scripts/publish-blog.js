#!/usr/bin/env node

/**
 * Blog Publishing Pipeline
 * 
 * Usage: node scripts/publish-blog.js <slug>
 * 
 * Steps:
 *   1. Reads the blog post from content/ai/<slug>.md
 *   2. Generates hero image via FAL (flux/dev)
 *   3. Downloads and saves to public/images/ (jpg)
 *   4. Git add, commit, push → Vercel auto-deploys
 *   5. Waits for deploy to complete
 *   6. Posts to Facebook with image
 *   7. Force-re-scrapes the OG URL on Facebook
 *   8. Logs results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content', 'ai');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images');
const FACEBOOK_CONFIG = path.resolve(process.env.HOME, '.openclaw', 'workspace', '.facebook-config.json');

// Colors for output
const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(step, msg) {
  console.log(`${C.blue}${C.bold}[${step}]${C.reset} ${msg}`);
}

function success(msg) {
  console.log(`${C.green}${C.bold}✅ ${msg}${C.reset}`);
}

function warn(msg) {
  console.log(`${C.yellow}${C.bold}⚠️  ${msg}${C.reset}`);
}

function fail(msg) {
  console.log(`${C.red}${C.bold}❌ ${msg}${C.reset}`);
  process.exit(1);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) fail('Usage: node scripts/publish-blog.js <slug>');
  
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) fail(`Blog post not found: ${mdPath}`);
  
  log('1/7', `Reading blog: ${slug}.md`);
  const frontmatter = parseFrontmatter(fs.readFileSync(mdPath, 'utf8'));
  const title = frontmatter.title || slug;
  const description = frontmatter.description || '';
  const imageFilename = `${slug}.jpg`;
  const imagePath = path.join(IMAGES_DIR, imageFilename);
  const imageUrl = `https://taxproexchange.com/images/${imageFilename}`;
  const articleUrl = `https://taxproexchange.com/insights/${slug}`;
  
  success(`"${title}"`);
  
  // Step 2: Generate hero image
  log('2/7', 'Generating hero image via FAL...');
  const imagePrompt = generateImagePrompt(title, description);
  const falResult = await generateFalImage(imagePrompt);
  if (!falResult) warn('Image generation failed, will publish without image');
  else success('Hero image generated');
  
  // Step 3: Download and save as JPG
  if (falResult) {
    log('3/7', 'Downloading and converting image...');
    await downloadAndSaveImage(falResult, imagePath);
    
    // Update frontmatter previewImage
    let mdContent = fs.readFileSync(mdPath, 'utf8');
    mdContent = mdContent.replace(/previewImage:.*/, `previewImage: "/images/${imageFilename}"`);
    fs.writeFileSync(mdPath, mdContent);
    success(`Image saved: /images/${imageFilename}`);
  }
  
  // Step 4: Git commit and push
  log('4/7', 'Committing and pushing to GitHub...');
  const tokenPath = path.resolve(process.env.HOME, '.openclaw', 'workspace', '.env.local');
  const token = extractToken(tokenPath, 'GITHUB_TOKEN');
  if (token) {
    execSync(`git add content/ai/${slug}.md public/images/${imageFilename}`, { cwd: PROJECT_ROOT });
    execSync(`git commit -m "Publish blog: ${title}"`, { cwd: PROJECT_ROOT });
    execSync(`git push "https://${token}@github.com/oneOoneData/TaxProExchange.git" main`, { cwd: PROJECT_ROOT });
    success('Pushed to GitHub, Vercel auto-deploying...');
  } else {
    warn('No GITHUB_TOKEN in .env.local, skipping push');
  }
  
  // Step 5: Wait for Vercel deploy
  log('5/7', 'Waiting for Vercel deploy...');
  const vercelToken = fs.existsSync(path.resolve(process.env.HOME, '.openclaw', 'workspace', '.vercel.env'))
    ? extractToken(path.resolve(process.env.HOME, '.openclaw', 'workspace', '.vercel.env'), 'VERCEL_TOKEN')
    : null;
  
  if (vercelToken) {
    await waitForVercelDeploy(vercelToken, 240);
    success('Vercel deploy complete');
  } else {
    warn('No VERCEL_TOKEN, skipping deploy wait');
  }
  
  // Step 6: Post to Facebook with image
  log('6/7', 'Posting to Facebook with image...');
  const fbResult = await postToFacebook(imageUrl, articleUrl, title, description);
  if (fbResult) success(`Facebook post created: ${fbResult}`);
  else warn('Facebook post failed');
  
  // Step 7: Force re-scrape
  if (fbResult) {
    log('7/7', 'Force-scraping OG tags on Facebook...');
    await forceScrapeFacebook(articleUrl);
    success('Article ready for sharing');
  }
  
  console.log(`\n${C.green}${C.bold}🎉 Blog published successfully!${C.reset}`);
  console.log(`   Article: ${articleUrl}`);
  console.log(`   Image:   ${imageUrl}`);
  if (fbResult) console.log(`   FB Post: https://facebook.com/${fbResult}`);
}

// --- Helper functions below ---

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  match[1].split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) data[key.trim()] = rest.join(':').trim().replace(/^"(.*)"$/, '$1');
  });
  return data;
}

function generateImagePrompt(title, description) {
  return `Professional tax accounting themed image for article "${title}". Clean modern office setting, warm lighting, professional atmosphere, cool blue and warm amber color palette, cinematic, slightly aerial perspective. No text in image.`;
}

async function generateFalImage(prompt) {
  try {
    const FAL_KEY = process.env.FAL_KEY || extractToken(
      path.resolve(process.env.HOME, '.openclaw', 'workspace', '.env.local'), 'FAL_KEY'
    );
    if (!FAL_KEY) return null;
    
    const fetch = (await import('node-fetch')).default;
    const resp = await fetch('https://queue.fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, num_images: 1, enable_safety_checker: false }),
    });
    const data = await resp.json();
    if (data.images?.[0]?.url) return data.images[0].url;
    return null;
  } catch (e) {
    console.error('FAL error:', e.message);
    return null;
  }
}

async function downloadAndSaveImage(url, savePath) {
  const fetch = (await import('node-fetch')).default;
  const resp = await fetch(url);
  const buffer = await resp.buffer();
  
  // Convert to JPG using sharp if available
  try {
    const sharp = require('sharp');
    const jpgBuf = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
    fs.writeFileSync(savePath, jpgBuf);
  } catch {
    // Fallback: save as-is (will be PNG, serve with jpg extension)
    fs.writeFileSync(savePath, buffer);
  }
}

async function postToFacebook(imageUrl, articleUrl, title, description) {
  try {
    const config = JSON.parse(fs.readFileSync(FACEBOOK_CONFIG, 'utf8'));
    const fetch = (await import('node-fetch')).default;
    
    // Get fresh page token from the stored user token
    const userTokenPath = path.resolve(process.env.HOME, '.openclaw', 'workspace', '.env.local');
    const userToken = extractToken(userTokenPath, 'FACEBOOK_USER_TOKEN_LONG_LIVED');
    if (!userToken) { warn('No Facebook token found'); return null; }
    
    // Exchange for page token
    const accountsResp = await fetch('https://graph.facebook.com/v19.0/me/accounts?access_token=' + encodeURIComponent(userToken));
    const accounts = await accountsResp.json();
    if (accounts.error) { warn('FB token error: ' + accounts.error.message); return null; }
    
    const page = accounts.data.find(a => a.id === config.page_id);
    if (!page) { warn('Page not found in accounts'); return null; }
    const pageToken = page.access_token;
    
    // Post photo with message
    const form = new URLSearchParams();
    form.append('url', imageUrl);
    form.append('message', `${title}\n\n${description.substring(0, 200)}\n\n${articleUrl}`);
    form.append('access_token', pageToken);
    
    const postResp = await fetch(`https://graph.facebook.com/v19.0/${config.page_id}/photos`, {
      method: 'POST',
      body: form
    });
    const postData = await postResp.json();
    
    if (postData.error) { warn('FB post error: ' + postData.error.message); return null; }
    return `${config.page_id}_${postData.id}`;
    
  } catch (e) {
    warn('Facebook post error: ' + e.message);
    return null;
  }
}

async function forceScrapeFacebook(url) {
  try {
    const vercelToken = extractToken(
      path.resolve(process.env.HOME, '.openclaw', 'workspace', '.vercel.env'), 'VERCEL_TOKEN'
    );
    const fetch = (await import('node-fetch')).default;
    
    // Get a page token for the scrape
    const config = JSON.parse(fs.readFileSync(FACEBOOK_CONFIG, 'utf8'));
    const userToken = extractToken(
      path.resolve(process.env.HOME, '.openclaw', 'workspace', '.env.local'), 'FACEBOOK_USER_TOKEN_LONG_LIVED'
    );
    const accountsResp = await fetch('https://graph.facebook.com/v19.0/me/accounts?access_token=' + encodeURIComponent(userToken));
    const accounts = await accountsResp.json();
    const pageToken = accounts.data.find(a => a.id === config.page_id)?.access_token;
    
    if (pageToken) {
      await fetch(`https://graph.facebook.com/v19.0/?id=${encodeURIComponent(url)}&scrape=true&access_token=${encodeURIComponent(pageToken)}`);
    }
  } catch (e) {
    // Scrape failure is non-critical
  }
}

async function waitForVercelDeploy(token, timeoutSec) {
  const fetch = (await import('node-fetch')).default;
  for (let i = 0; i < Math.ceil(timeoutSec / 15); i++) {
    await new Promise(r => setTimeout(r, 15000));
    const resp = await fetch('https://api.vercel.com/v6/deployments?limit=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    const state = data.deployments?.[0]?.state;
    if (state === 'READY' || state === 'ERROR') return state;
  }
  return 'TIMEOUT';
}

function extractToken(filePath, key) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').replace(/\0/g, '');
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return match ? match[1].trim() : null;
  } catch { return null; }
}

main();
