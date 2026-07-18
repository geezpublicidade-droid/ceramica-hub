"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticateAction(formData: FormData) {
  const role = formData.get("role") as string;
  const loginPath = formData.get("loginPath") as string;
  const callbackUrl = formData.get("callbackUrl") as string;

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      role,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`${loginPath}?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}
