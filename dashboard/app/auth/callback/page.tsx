"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const confirmEmailSession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const nextPath = getSafeNextPath(searchParams);

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        router.replace(error ? "/login" : nextPath);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      router.replace(session ? nextPath : "/login");
    };

    confirmEmailSession();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Confirming your account...
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Redirecting you back into Orchestra Project.
        </p>
      </div>
    </main>
  );
}
