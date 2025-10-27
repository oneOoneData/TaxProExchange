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

const contentDirectory = path.join(process.cwd(), 'content/ai');

export function getAllPosts(): BlogPost[] {
  try {
    const filenames = fs.readdirSync(contentDirectory);
    const posts = filenames
      .filter(name => name.endsWith('.md') && !name.startsWith('DRAFT-'))
      .map(filename => {
        const filePath = path.join(contentDirectory, filename);
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
    const filePath = path.join(contentDirectory, `${slug}.md`);
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
    const filenames = fs.readdirSync(contentDirectory);
    return filenames
      .filter(name => name.endsWith('.md') && !name.startsWith('DRAFT-'))
      .map(name => name.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error reading blog slugs:', error);
    return [];
  }
}

