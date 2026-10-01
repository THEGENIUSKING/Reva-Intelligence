import React, { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export function Login({
  accessDenied = false,
  accessEmail,
  onSignOut,
  vantaEnvironment = "production",
  canSwitchVantaEnvironment = false,
  onSwitchVantaEnvironment,
}) {
  const { signIn, signOut } = useAuthActions();
  const isVantaDevelopment = vantaEnvironment === "development";
  const allowDevSignup = import.meta.env.DEV && isVantaDevelopment && import.meta.env.VITE_REVA_ALLOW_DEV_SIGNUP === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("signIn");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const switchEnvironment = async (environment) => {
    if (!onSwitchVantaEnvironment) return;
    setSending(true);
    try {
      await signOut();
    } catch {
      // Switching reloads the auth provider against the selected Vanta deployment.
    }
    onSwitchVantaEnvironment(environment);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (mode === "signUp" && !/^[^\s@]+@trium\.ng$/i.test(normalizedEmail)) {
      setError("Development accounts require your @trium.ng work email.");
      return;
    }
    if (mode === "signUp" && password.length < 8) {
      setError("Use at least 8 characters for a development password.");
      return;
    }
    if (mode === "signUp" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.set("email", normalizedEmail);
      formData.set("password", password);
      formData.set("flow", mode);
      await signIn("password", formData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const detail = typeof err?.data === "string" ? err.data : message;
      if (/InvalidSecret|Incorrect email or password/i.test(detail)) {
        setError(mode === "signUp"
          ? "A development account may already exist for this email. Switch to Sign in and use its development password."
          : isVantaDevelopment
            ? "Vanta rejected this password. Reva is connected to Vanta Development, which has separate accounts and passwords from Vanta Production."
            : "Vanta rejected this email and password. Check the credentials for your Vanta Production account.");
      } else if (/InvalidAccountId/i.test(detail)) {
        setError(mode === "signUp"
          ? "Vanta Development did not create an account for this email. Check the development signup setting, then try again."
          : `This email has no account in the connected Vanta ${isVantaDevelopment ? "Development" : "Production"} environment. Switch environments or use an account registered there.`);
      } else if (allowDevSignup && /not authorised|not authorized|invitation is invalid|approved/i.test(detail)) {
        setError("Vanta Development rejected this signup before account creation. Confirm the development self-signup setting is active on the connected Vanta Development deployment.");
      } else {
        // ConvexError.data carries intentional backend messages. Keep this
        // detail visible only in local development to make auth failures
        // diagnosable without exposing backend internals to production users.
        const safeDetail = import.meta.env.DEV && typeof detail === "string" && detail && !/^Server Error$/i.test(detail)
          ? detail.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]").slice(0, 220)
          : "";
        setError(safeDetail || (mode === "signUp"
          ? "Vanta Development could not create this account. If you already signed up here, switch to Sign in; otherwise check the connected Vanta Development service."
          : "Vanta could not complete sign-in. Please try again or contact your Vanta administrator."));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-12 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-border bg-surface-container-lowest p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined">insights</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface">Reva</h1>
            <p className="text-sm text-secondary">Trium Idea Intelligence</p>
          </div>
        </div>

          <h2 className="text-2xl font-bold text-on-surface">{mode === "signUp" ? "Create a Reva development account" : "Sign in with Vanta"}</h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          {mode === "signUp"
            ? "Development only. Use a Trium work email and create a password to test Reva without an existing Vanta role."
            : isVantaDevelopment
              ? "Connected to Vanta Development. Production Vanta accounts and passwords are separate; use a development account here or switch the Vanta connection to Production."
              : "Use your Vanta Production account. Reva access is limited to approved Trium accounts."}
        </p>
        {canSwitchVantaEnvironment && (
          <div className="mt-4 rounded-lg border border-border bg-surface-container-low p-3 text-sm">
            <p className="text-secondary">Connected environment: <strong className="text-on-surface">Vanta {isVantaDevelopment ? "Development" : "Production"}</strong></p>
            <button
              type="button"
              disabled={sending}
              onClick={() => void switchEnvironment(isVantaDevelopment ? "production" : "development")}
              className="mt-2 font-semibold text-primary hover:underline disabled:opacity-60"
            >
              Switch to Vanta {isVantaDevelopment ? "Production" : "Development"}
            </button>
          </div>
        )}
        {accessDenied && <div role="alert" className="mt-4 space-y-2 text-sm text-error">
          <p>This Vanta account is missing Trium email or Vanta approval for Reva{accessEmail ? ` (${accessEmail})` : ""}. Contact your Trium administrator if you believe access should be enabled.</p>
          <button type="button" onClick={onSignOut ?? (() => void signOut())} className="font-semibold underline underline-offset-2">Sign out of this Vanta account</button>
        </div>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface" htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="username" required value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="name@trium.ng" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-on-surface" htmlFor="password">{mode === "signUp" ? "Development password" : "Vanta password"}</label>
            <div className="relative mt-1">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signUp" ? "new-password" : "current-password"} required value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface-container-low px-3 pr-16 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 my-auto h-fit text-xs font-semibold text-secondary hover:text-on-surface">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {mode === "signUp" && (
            <div>
              <label className="block text-sm font-semibold text-on-surface" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-border bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <button type="submit" disabled={sending || !email.trim() || !password}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            {sending ? (mode === "signUp" ? "Creating account…" : "Signing in…") : (mode === "signUp" ? "Create development account" : "Sign in")}
          </button>
        </form>
        <p className="mt-4 text-xs leading-5 text-secondary">
          {mode === "signUp"
            ? "Use an email address ending in @trium.ng. Development accounts are separate from Vanta Production."
            : "Need an account or password reset? Use Vanta’s approved invitation and recovery process, or contact your administrator."}
        </p>
        {allowDevSignup && !accessDenied && <button type="button" onClick={() => { setMode(mode === "signUp" ? "signIn" : "signUp"); setError(""); setPassword(""); setConfirmPassword(""); }}
          className="mt-4 text-sm font-semibold text-primary hover:underline">
          {mode === "signUp" ? "I already have a development account" : "Create a development test account"}
        </button>}
      </section>
    </main>
  );
}

export default Login;
