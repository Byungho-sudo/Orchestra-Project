"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getSafeNextPath } from "@/lib/auth-redirect";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const nextPath = getSafeNextPath(searchParams);
  const resetSuccess = searchParams.get("reset") === "success";
  const accountDeleted = searchParams.get("account-deleted") === "success";

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) router.push(nextPath);
    };

    loadSession();
  }, [nextPath, router]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) return;

    setAuthError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError("Failed to log in. Please check your credentials.");
      return;
    }

    router.push(nextPath);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to your Orchestra Project account.
        </p>

        {resetSuccess && (
          <p className="mt-4 text-sm font-medium text-green-700">
            Your password has been reset. You can log in now.
          </p>
        )}

        {accountDeleted && (
          <p className="mt-4 text-sm font-medium text-green-700">
            Your account has been deleted successfully.
          </p>
        )}

        <form onSubmit={login}>
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

          {authError && (
            <p className="mt-4 text-sm font-medium text-red-600">{authError}</p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <div className="space-y-1">
              <Link
                href={nextPath === "/" ? "/signup" : `/signup?next=${encodeURIComponent(nextPath)}`}
                className="block text-sm font-medium text-indigo-600 hover:underline"
              >
                Create account
              </Link>
              <Link
                href="/forgot-password"
                className="block text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={!email.trim() || !password.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
