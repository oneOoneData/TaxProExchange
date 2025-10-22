import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the email list file
    const filePath = join(process.cwd(), 'data', '.emaillist.txt');
    const fileContent = readFileSync(filePath, 'utf-8');
    
    // Parse emails (one per line, filter out empty lines)
    const emails = fileContent
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'))
      .map(email => email.toLowerCase()); // Normalize to lowercase
    
    console.log(`📧 Loaded ${emails.length} emails from .emaillist.txt`);
    
    return NextResponse.json({
      success: true,
      emails,
      count: emails.length
    });
    
  } catch (error) {
    console.error('Error reading email list:', error);
    return NextResponse.json(
      { error: 'Failed to read email list' },
      { status: 500 }
    );
  }
}
