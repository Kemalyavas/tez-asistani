"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthLinkCatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only act when not already on the confirm page
    if (pathname === "/auth/confirm") return;

    const search = window.location.search || "";
    const hash = window.location.hash || "";

    // PKCE/OTP style (?code=...)
    if (search.includes("code=")) {
      router.replace(`/auth/confirm${search}`);
      return;
    }

    // Hash token styles (#access_token=..., #token_hash=..., #type=signup)
    if (hash.includes("access_token") || hash.includes("token_hash") || hash.includes("type=")) {
      // Keep the full hash so the confirm page can process it
      router.replace(`/auth/confirm${hash}`);
      return;
    }
  }, [pathname, router]);

  return null;
}
