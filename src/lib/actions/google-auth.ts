"use server";

import { cookies } from "next/headers";
import { signIn, GOOGLE_AREA_COOKIE, type GoogleLoginArea } from "@/auth";

export async function signInWithGoogleAction(area: GoogleLoginArea, callbackUrl?: string) {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_AREA_COOKIE, area, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  await signIn("google", { redirectTo: callbackUrl });
}
