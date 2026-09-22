import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function IndexPage() {
  const session = await auth();
  redirect(session?.user ? "/home" : "/login");
}
