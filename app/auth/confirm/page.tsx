"use client";
import { useEffect, useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ConfirmEmailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("E-postanız doğrulanıyor…");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Bağlantıda `code` query param'ı varsa (PKCE/OTP) önce session'a çevir
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        if (code) {
          const { error: codeError } = await (supabase.auth as any).exchangeCodeForSession(code);
          if (codeError) {
            console.error("[confirm] code exchange error:", codeError);
            setStatus("error");
            setMessage("Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapmayı deneyin.");
            toast.error("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
            router.replace("/auth");
            return;
          }
          // Query'yi URL'den temizle
          window.history.replaceState({}, document.title, window.location.pathname);
          setStatus("success");
          setMessage("E-postanız doğrulandı. 3 saniye içinde ana sayfaya yönlendirileceksiniz.");
          toast.success("E-postanız doğrulandı! Hoş geldiniz.");
          timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // 2) Token'lar URL hash'inde de gelebilir
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("[confirm] session error:", error);
          setStatus("error");
          setMessage("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
          toast.error("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
          router.replace("/auth");
          return;
        }

        // Henüz session yoksa URL hash'inden ayrıştırıp kurmayı dene
        if (!data.session) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          const type = hashParams.get("type");
          const token_hash = hashParams.get("token_hash");

          // 2a) access/refresh token mevcut
          if (type === "signup" && access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) {
              console.error("[confirm] setSession error:", sessionError);
              setStatus("error");
              setMessage("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
              toast.error("Oturum doğrulanamadı. Lütfen tekrar giriş yapın.");
              router.replace("/auth");
              return;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus("success");
            setMessage("E-postanız doğrulandı. 3 saniye içinde ana sayfaya yönlendirileceksiniz.");
            toast.success("E-postanız doğrulandı! Hoş geldiniz.");
            timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
            return;
          }

          // 2b) token_hash tipi (eski bağlantılar veya email_change)
          if (token_hash && type) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              type: type as any,
              token_hash,
            } as any);
            if (verifyError) {
              console.error("[confirm] verifyOtp error:", verifyError);
              setStatus("error");
              setMessage("Doğrulama başarısız. Lütfen tekrar deneyin.");
              toast.error("Doğrulama başarısız. Lütfen tekrar deneyin.");
              router.replace("/auth");
              return;
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus("success");
            setMessage("E-postanız doğrulandı. 3 saniye içinde ana sayfaya yönlendirileceksiniz.");
            toast.success("E-postanız doğrulandı! Hoş geldiniz.");
            timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
            return;
          }
        }

        // Zaten session varsa
        if (data.session) {
          setStatus("success");
          setMessage("E-postanız doğrulandı. 3 saniye içinde ana sayfaya yönlendirileceksiniz.");
          toast.success("E-postanız doğrulandı! Hoş geldiniz.");
          timeoutRef.current = window.setTimeout(() => router.replace("/"), 3000);
          return;
        }

        // Hiçbiri tutmadıysa
        setStatus("error");
        setMessage("Geçersiz doğrulama bağlantısı. Lütfen giriş yapın.");
        toast.error("Geçersiz doğrulama bağlantısı. Lütfen giriş yapın.");
        router.replace("/auth");
      } catch (e: any) {
        console.error("[confirm] unexpected error:", e);
        setStatus("error");
        setMessage("Doğrulama sırasında beklenmedik bir hata oluştu.");
        toast.error("Doğrulama sırasında beklenmedik bir hata oluştu.");
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
            Yönlendirilmediyseniz <a className="text-primary-600 hover:underline" href="/">buraya tıklayın</a>.
          </p>
        )}
      </div>
    </div>
  );
}
