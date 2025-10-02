import { NextResponse } from "next/server";
import { runValidationBatch } from "@/lib/validateEvents";

export const dynamic = 'force-dynamic';

/**
 * Public endpoint to trigger event validation (for testing)
 */
export async function POST() {
  try {
    console.log("Running manual validation batch...");
    
    const result = await runValidationBatch(50);
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      validated: result.validated,
      publishable: result.publishable,
      errors: result.errors,
      message: `Validation complete: ${result.validated} validated, ${result.publishable} publishable`
    });

  } catch (error) {
    console.error("Error in manual validation:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
