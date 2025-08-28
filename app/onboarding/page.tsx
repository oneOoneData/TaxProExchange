import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseService } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

export default async function Onboarding() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.emailAddresses?.[0]?.emailAddress ?? null;
  const first = user.firstName ?? null;
  const last = user.lastName ?? null;
  const image = user.imageUrl ?? null;

  const supabase = supabaseService();
  const { error } = await supabase
    .from("profiles")
    .upsert(
      { clerk_id: user.id, email, first_name: first, last_name: last, image_url: image },
      { onConflict: "clerk_id" }
    );

  if (error) {
    // surface the error during dev; avoid silent 500s
    console.error("onboarding upsert error:", error);
    // fallback: go home but don't block login
    redirect("/");
  }

  redirect("/profile/edit");
}
