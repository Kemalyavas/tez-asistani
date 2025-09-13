"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ConfirmEmailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Confirming your email…");

  useEffect(() => {
    const run = async () => {
      try {
        // Supabase will include tokens in the URL hash after clicking the email link
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
            setMessage("Email confirmed. Redirecting…");
            toast.success("Email confirmed! Welcome.");
            router.replace("/");
            return;
          }
        }

        // If we already have a session, great
        if (data.session) {
          setStatus("success");
          setMessage("Email confirmed. Redirecting…");
          toast.success("Email confirmed! Welcome.");
          router.replace("/");
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
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow rounded-lg p-6 max-w-md w-full text-center">
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
