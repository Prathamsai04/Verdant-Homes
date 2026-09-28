import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Check } from "lucide-react";
import { contactInputSchema, type ContactInput } from "@verdant/shared";
import { ApiError, submitContact } from "../api/client";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>({ resolver: zodResolver(contactInputSchema), defaultValues: { website: "" } });

  async function submit(values: ContactInput) {
    setMessage("");
    try {
      const result = await submitContact(values);
      setMessage(result.message);
      reset();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Unable to send. Please email or call instead.");
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit(submit)} noValidate>
      <div className="form-grid">
        <label className="field"><span>Name</span><input autoComplete="name" {...register("fullName")} aria-invalid={!!errors.fullName} />{errors.fullName && <small className="field-error">{String(errors.fullName.message)}</small>}</label>
        <label className="field"><span>Email</span><input type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />{errors.email && <small className="field-error">{String(errors.email.message)}</small>}</label>
        <label className="field full"><span>Phone <em>optional</em></span><input type="tel" autoComplete="tel" {...register("phone")} /></label>
        <label className="field full"><span>What would you like to know?</span><textarea rows={4} {...register("message")} aria-invalid={!!errors.message} />{errors.message && <small className="field-error">{String(errors.message.message)}</small>}</label>
        <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} {...register("website")} /></label>
      </div>
      <button className="button accent" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send a note"} <ArrowUpRight aria-hidden="true" /></button>
      {message && <p className="contact-result" role="status"><Check aria-hidden="true" />{message}</p>}
    </form>
  );
}
