import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({
    meta: [
      { title: "Sign in or register — InfraCare Bulan" },
      { name: "description", content: "Sign in or create a free InfraCare account to report and track infrastructure issues in Bulan, Sorsogon." },
      { property: "og:title", content: "Sign in — InfraCare Bulan" },
      { property: "og:description", content: "Access your InfraCare Bulan account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });
const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/dashboard" }));
  }, [navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = isSignup ? signupSchema.safeParse(form) : signinSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setBusy(true);
    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: form.fullName.trim() } },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      setBusy(false);
      if (error) return toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
      navigate({ to: "/dashboard" });
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed. Please try again.");
    else if (!r.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-4"><Logo /></div>
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-3xl border bg-card p-8 shadow-soft">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Check your email</h1>
              <p className="mt-3 text-muted-foreground">We sent a confirmation link to <b>{form.email}</b>. Click it to activate your account.</p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setIsSignup(false); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{isSignup ? "Register as a resident of Bulan to start reporting." : "Sign in to report and track issues in Bulan."}</p>
              <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                {isSignup && <Field label="Full name" id="fullName" value={form.fullName} onChange={set("fullName")} error={errors.fullName} />}
                <Field label="Email" id="email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
                <Field label="Password" id="password" type="password" value={form.password} onChange={set("password")} error={errors.password} />
                {isSignup && <Field label="Confirm password" id="confirm" type="password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />}
                <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Register" : "Sign in"}</Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {isSignup ? "Already registered?" : "New to InfraCare?"}{" "}
                <button className="font-semibold text-primary hover:underline" onClick={() => { setIsSignup(!isSignup); setErrors({}); }}>
                  {isSignup ? "Sign in" : "Create an account"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, error, ...props }: { label: string; id: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
