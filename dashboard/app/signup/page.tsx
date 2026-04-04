"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const nextPath = getSafeNextPath(searchParams);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) router.push(nextPath);
    };

    loadSession();
  }, [nextPath, router]);

  const signup = async () => {
    if (!email.trim() || !password.trim()) return;

    setAuthMessage("");
    setAuthError("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          nextPath
        )}`,
      },
    });

    if (error) {
      setAuthError("Failed to sign up. Please try again.");
      return;
    }

    if (data.session) {
      router.push(nextPath);
      return;
    }

    setAuthMessage("Check your email to confirm your account.");
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sign up</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create your Orchestra Project account.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
          />
        </div>

        {authMessage && (
          <p className="mt-4 text-sm font-medium text-green-700">
            {authMessage}
          </p>
        )}

        {authError && (
          <p className="mt-4 text-sm font-medium text-red-600">{authError}</p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Link
            href={nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            Log in instead
          </Link>
          <button
            onClick={signup}
            disabled={!email.trim() || !password.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign up
          </button>
        </div>
      </div>
    </main>
  );
}
