import { NextResponse } from "next/server";
import { z } from "zod";
import { extractEvent } from "@/lib/eventExtractor";

const Body = z.object({ url: z.string().url() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = Body.parse(body);
    const data = await extractEvent(url);

    // Ensure minimal shape
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error('Error extracting event:', e);
    return NextResponse.json({ error: e.message || "Bad Request" }, { status: 400 });
  }
}
