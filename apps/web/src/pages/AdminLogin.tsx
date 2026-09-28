import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { loginInputSchema } from "@verdant/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, login } from "../api/client";

export function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string; password: string }>({ resolver: zodResolver(loginInputSchema) });

  async function submit(values: { email: string; password: string }) {
    setError("");
    try {
      await login(values);
      navigate("/admin", { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to sign in.");
    }
  }

  return (
    <main className="login-page" id="main">
      <section className="login-brand">
        <a href="/" className="brand"><span className="brand-mark">V</span><span>Verdant House</span></a>
        <div><p>House operations</p><h1>Keep every stay<br />on solid ground.</h1><span>Secure access for approved house staff.</span></div>
        <small>Resident details are private. Access is logged and sessions expire automatically.</small>
      </section>
      <section className="login-panel">
        <a href="/" className="back-link"><ArrowLeft aria-hidden="true" /> Public site</a>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <span className="login-icon"><LockKeyhole aria-hidden="true" /></span>
          <h2>Welcome back</h2>
          <p>Sign in with your house administrator account.</p>
          <label className="field"><span>Email</span><input type="email" autoComplete="username" {...register("email")} autoFocus aria-invalid={!!errors.email} />{errors.email && <small className="field-error">{errors.email.message}</small>}</label>
          <label className="field"><span>Password</span><input type="password" autoComplete="current-password" {...register("password")} aria-invalid={!!errors.password} />{errors.password && <small className="field-error">{errors.password.message}</small>}</label>
          {error && <div className="form-alert" role="alert">{error}</div>}
          <button className="button primary wide" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"} <ArrowRight aria-hidden="true" /></button>
        </form>
      </section>
    </main>
  );
}
