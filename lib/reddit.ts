/**
 * Reddit API integration for fetching reviews/comments about AI tools
 * Uses Reddit's public JSON API (no auth required for reading)
 */

export interface RedditPost {
  author: string;
  content: string;
  permalink: string;
  upvotes: number;
  subreddit?: string;
  created_utc?: number;
}

/**
 * Search Reddit for posts/comments about a tool
 * Searches in relevant tax/accounting subreddits
 */
export async function fetchRedditReviews(
  toolName: string,
  options: {
    limit?: number;
    subreddits?: string[];
  } = {}
): Promise<RedditPost[]> {
  const { limit = 10, subreddits = ['taxpros', 'accounting', 'CPA', 'tax', 'taxpreparation'] } = options;

  const results: RedditPost[] = [];

  // Search each subreddit
  for (const subreddit of subreddits) {
    try {
      // Reddit search API: https://www.reddit.com/r/{subreddit}/search.json?q={query}&restrict_sr=1
      const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(toolName)}&restrict_sr=1&limit=${limit}&sort=relevance`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'TaxProExchange/1.0 (AI Tools Review Aggregator)',
        },
      });

      if (!response.ok) {
        console.warn(`Reddit search failed for r/${subreddit}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data?.children || [];
      
      console.log(`    r/${subreddit}: Found ${posts.length} posts from search`);

      let postsProcessedForComments = 0;
      const maxCommentFetches = 3; // Limit comment fetching to avoid too many requests

      for (const post of posts) {
        const postData = post.data;
        
        // Extract meaningful content (selftext or title+selftext)
        const postContent = postData.selftext || postData.title || '';
        const postPermalink = `https://reddit.com${postData.permalink}`;
        
        // Check if tool name appears in post title/selftext
        const postContentLower = postContent.toLowerCase();
        const toolNameLower = toolName.toLowerCase();
        const postMatches = postContentLower.includes(toolNameLower);

        // If post matches, add it
        if (postMatches && postContent && postContent.length >= 20 && postContent !== '[removed]' && postContent !== '[deleted]') {
          results.push({
            author: postData.author || 'Unknown',
            content: postContent.slice(0, 500),
            permalink: postPermalink,
            upvotes: postData.ups || 0,
            subreddit: postData.subreddit,
            created_utc: postData.created_utc,
          });
        }

        // Also fetch comments from matching posts to find mentions in comment threads
        // Limit to avoid too many requests and rate limiting
        if (postMatches && postsProcessedForComments < maxCommentFetches) {
          postsProcessedForComments++;
          try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit comment fetching
            const comments = await fetchRedditPostComments(postPermalink);
            let commentMatches = 0;
            for (const comment of comments) {
              const commentContentLower = comment.content.toLowerCase();
              // Check if tool name appears in comment
              if (commentContentLower.includes(toolNameLower) && comment.content.length >= 20) {
                // Only add if not already in results (avoid duplicates)
                const isDuplicate = results.some(r => r.permalink === comment.permalink);
                if (!isDuplicate) {
                  results.push(comment);
                  commentMatches++;
                }
              }
            }
            if (commentMatches > 0) {
              console.log(`    r/${subreddit}: Found ${commentMatches} matching comments in post`);
            }
          } catch (error) {
            // Continue if comment fetching fails for this post
            console.warn(`    Warning: Could not fetch comments from ${postPermalink}`);
          }
        }
      }

      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching Reddit reviews from r/${subreddit}:`, error);
      // Continue with other subreddits
    }
  }

  // Sort by upvotes (highest first)
  results.sort((a, b) => b.upvotes - a.upvotes);

  // Remove duplicates based on permalink
  const seen = new Set<string>();
  const uniqueResults = results.filter(post => {
    if (seen.has(post.permalink)) {
      return false;
    }
    seen.add(post.permalink);
    return true;
  });

  return uniqueResults.slice(0, limit);
}

/**
 * Get comments from a specific Reddit post
 */
export async function fetchRedditPostComments(postUrl: string): Promise<RedditPost[]> {
  try {
    // Convert Reddit post URL to API endpoint
    // e.g., https://reddit.com/r/taxpros/comments/abc123/title -> https://reddit.com/r/taxpros/comments/abc123.json
    const apiUrl = postUrl.replace(/\/$/, '') + '.json';

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'TaxProExchange/1.0 (AI Tools Review Aggregator)',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch Reddit comments: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const comments: RedditPost[] = [];

    // Reddit API returns [post_data, comments_data]
    const commentsData = data[1]?.data?.children || [];

    const extractComments = (children: any[], depth = 0): void => {
      for (const item of children) {
        const commentData = item.data;
        
        if (commentData.body && commentData.body !== '[removed]' && commentData.body !== '[deleted]') {
          comments.push({
            author: commentData.author || 'Unknown',
            content: commentData.body.slice(0, 500),
            permalink: `https://reddit.com${commentData.permalink}`,
            upvotes: commentData.ups || 0,
            created_utc: commentData.created_utc,
          });
        }

        // Recurse into replies
        if (commentData.replies && typeof commentData.replies === 'object' && commentData.replies.data) {
          extractComments(commentData.replies.data.children, depth + 1);
        }
      }
    };

    extractComments(commentsData);

    // Sort by upvotes
    comments.sort((a, b) => b.upvotes - a.upvotes);

    return comments.slice(0, 20); // Limit to top 20 comments
  } catch (error) {
    console.error('Error fetching Reddit comments:', error);
    return [];
  }
}

