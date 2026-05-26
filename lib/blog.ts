import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  content: string;
  data: {
    title: string;
    description: string;
    date: string;
    author: string;
    authorLinkedIn?: string;
    authorReddit?: string;
    authorTPE?: string;
    authorBio?: string;
    authorImage?: string;
    keywords: string[];
    image?: string;
    imageCaption?: string;
    previewImage?: string;
    category?: string;
    [key: string]: any;
  };
}

const contentRoot = path.join(process.cwd(), 'content');

function getAllMarkdownFiles(): { filePath: string; slug: string }[] {
  const results: { filePath: string; slug: string }[] = [];
  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('DRAFT-')) {
        results.push({ filePath: fullPath, slug: entry.name.replace(/\.md$/, '') });
      }
    }
  };
  walk(contentRoot);
  return results;
}

export function getAllPosts(): BlogPost[] {
  try {
    const files = getAllMarkdownFiles();
    const posts = files
      .map(({ filePath, slug }) => {
        const filename = path.basename(filePath);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        
        return {
          slug: filename.replace(/\.md$/, ''),
          content,
          data: {
            ...data,
            title: data.title || '',
            description: data.description || '',
            date: data.date || new Date().toISOString(),
            author: data.author || '',
            keywords: Array.isArray(data.keywords) ? data.keywords : [],
            image: data.image,
            imageCaption: data.imageCaption,
            previewImage: data.previewImage,
            category: data.category,
            authorLinkedIn: data.authorLinkedIn,
            authorReddit: data.authorReddit,
            authorTPE: data.authorTPE,
            authorBio: data.authorBio,
            authorImage: data.authorImage,
          } as BlogPost['data'],
        };
      })
      .sort((a, b) => {
        return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
      });

    return posts;
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    const allFiles = getAllMarkdownFiles();
    const match = allFiles.find(f => f.slug === slug);
    if (!match) return null;
    const filePath = match.filePath;
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      slug,
      content,
      data: {
        ...data,
        title: data.title || '',
        description: data.description || '',
        date: data.date || new Date().toISOString(),
        author: data.author || '',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        image: data.image,
        imageCaption: data.imageCaption,
        previewImage: data.previewImage,
        category: data.category,
        authorLinkedIn: data.authorLinkedIn,
        authorReddit: data.authorReddit,
        authorTPE: data.authorTPE,
        authorBio: data.authorBio,
        authorImage: data.authorImage,
      } as BlogPost['data'],
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export function getAllSlugs(): string[] {
  try {
    return getAllMarkdownFiles().map(f => f.slug);
  } catch (error) {
    console.error('Error reading blog slugs:', error);
    return [];
  }
}

