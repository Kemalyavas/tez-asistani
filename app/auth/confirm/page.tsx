"use client";
import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ConfirmEmailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Confirming your email…");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1) If the link contains a `code` query param (PKCE/OTP-style), exchange it for a session first
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        if (code) {
          const { data: codeData, error: codeError } = await (supabase.auth as any).exchangeCodeForSession(code);
          if (codeError) {
            setStatus("error");
            setMessage(`Code exchange error: ${codeError.message}`);
            toast.error(`Code exchange error: ${codeError.message}`);
            router.replace("/auth");
            return;
          }
          // Clean the query from the URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setStatus("success");
          setMessage("Email confirmed. You will be redirected to the homepage in 3 seconds.");
          toast.success("Email confirmed! Welcome.");
          timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // 2) Supabase may also include tokens in the URL hash after clicking the email link
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          setStatus("error");
          setMessage(`Session error: ${error.message}`);
          toast.error(`Session error: ${error.message}`);
          router.replace("/auth");
          return;
        }

        // If no session yet, attempt to parse and set from URL hash
        if (!data.session) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          const type = hashParams.get("type");
          const token_hash = hashParams.get("token_hash");

          // 2a) Access/refresh tokens present
          if (type === "signup" && access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) {
              setStatus("error");
              setMessage(`Session error: ${sessionError.message}`);
              toast.error(`Session error: ${sessionError.message}`);
              router.replace("/auth");
              return;
            }
            // Clean the hash from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus("success");
            setMessage("Email confirmed. You will be redirected to the homepage in 3 seconds.");
            toast.success("Email confirmed! Welcome.");
            timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
            return;
          }

          // 2b) Token-hash style (older links or email_change)
          if (token_hash && type) {
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              type: type as any,
              token_hash,
            } as any);
            if (verifyError) {
              setStatus("error");
              setMessage(`Verification error: ${verifyError.message}`);
              toast.error(`Verification error: ${verifyError.message}`);
              router.replace("/auth");
              return;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus("success");
            setMessage("Email confirmed. You will be redirected to the homepage in 3 seconds.");
            toast.success("Email confirmed! Welcome.");
            timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
            return;
          }
        }

        // If we already have a session, great
        if (data.session) {
          setStatus("success");
          setMessage("Email confirmed. You will be redirected to the homepage in 3 seconds.");
          toast.success("Email confirmed! Welcome.");
          timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // Fallback
        setStatus("error");
        setMessage("Invalid confirmation link. Please sign in.");
        toast.error("Invalid confirmation link. Please sign in.");
        router.replace("/auth");
      } catch (e: any) {
        setStatus("error");
        setMessage("Unexpected error during confirmation.");
        toast.error("Unexpected error during confirmation.");
        router.replace("/auth");
      }
    };

    run();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow rounded-lg p-6 max-w-md w-full text-center">
        <p className="text-sm text-gray-600">{message}</p>
        {status === "success" && (
          <p className="mt-2 text-xs text-gray-500">
            If you are not redirected, <a className="text-blue-600 hover:underline" href="/">click here</a>.
          </p>
        )}
      </div>
    </div>
  );
}
