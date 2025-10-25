"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action to logout a user
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("jwt");
  redirect("/");
}
