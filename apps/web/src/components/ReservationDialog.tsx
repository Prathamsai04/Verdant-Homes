import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { reservationInputSchema, type RoomDto } from "@verdant/shared";
import { ApiError, submitReservation } from "../api/client";

interface Props {
  open: boolean;
  rooms: RoomDto[];
  initialRoomId?: string | undefined;
  onClose: () => void;
}

export function ReservationDialog({ open, rooms, initialRoomId, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<{ reference: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(reservationInputSchema),
    defaultValues: { roomTypeId: initialRoomId ?? "", stayMonths: 3, consent: false, website: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog?.open) {
      setValue("roomTypeId", initialRoomId ?? "");
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [initialRoomId, open, setValue]);

  function close() {
    dialogRef.current?.close();
    setStep(1);
    setResult(null);
    setSubmitError("");
    reset({ roomTypeId: initialRoomId ?? "", stayMonths: 3, consent: false, website: "" });
    onClose();
  }

  async function next() {
    const fields = step === 1 ? ["roomTypeId", "moveInDate", "stayMonths"] : ["fullName", "email", "phone"];
    if (await trigger(fields)) setStep((value) => value + 1);
  }

  async function submit(values: any) {
    setSubmitError("");
    try {
      setResult(await submitReservation(values));
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "We could not send your enquiry. Please call or try again.");
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <dialog ref={dialogRef} className="reservation-dialog" onCancel={(event) => { event.preventDefault(); close(); }} onClose={onClose} aria-labelledby="reservation-title">
      <div className="dialog-shell">
        <button className="icon-button dialog-close" type="button" onClick={close} aria-label="Close reservation enquiry">
          <X aria-hidden="true" />
        </button>
        {result ? (
          <div className="success-state" role="status">
            <span className="success-mark"><Check aria-hidden="true" /></span>
            <p className="step-count">Enquiry received</p>
            <h2 id="reservation-title">We’ll take it from here.</h2>
            <p>{result.message}</p>
            <div className="reference"><span>Your reference</span><strong>{result.reference}</strong></div>
            <p className="fine-print">This is an enquiry, not a confirmed booking. Keep the reference handy when we call.</p>
            <button className="button primary" type="button" onClick={close}>Back to the house</button>
          </div>
        ) : (
          <>
            <div className="dialog-heading">
              <p className="step-count">Step {step} of 3</p>
              <h2 id="reservation-title">{step === 1 ? "Start with the room." : step === 2 ? "How can we reach you?" : "One last check."}</h2>
              <p>{step === 1 ? "Availability is indicative until our team confirms your stay." : step === 2 ? "We normally respond within one business day." : "Tell us anything that would help us prepare."}</p>
            </div>
            <div className="progress" aria-label={`Step ${step} of 3`}><span style={{ width: `${(step / 3) * 100}%` }} /></div>
            <form onSubmit={handleSubmit(submit)} noValidate>
              {step === 1 && (
                <div className="form-grid">
                  <label className="field full">
                    <span>Preferred room</span>
                    <select {...register("roomTypeId")} aria-invalid={!!errors.roomTypeId}>
                      <option value="">Choose a room</option>
                      {rooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.availableUnits > 0 ? `${room.availableUnits} open` : "waitlist"}</option>)}
                    </select>
                    {errors.roomTypeId && <small className="field-error">{String(errors.roomTypeId.message)}</small>}
                  </label>
                  <label className="field">
                    <span>Preferred move-in</span>
                    <input type="date" min={minDate} {...register("moveInDate")} aria-invalid={!!errors.moveInDate} />
                    {errors.moveInDate && <small className="field-error">{String(errors.moveInDate.message)}</small>}
                  </label>
                  <label className="field">
                    <span>Expected stay</span>
                    <select {...register("stayMonths", { valueAsNumber: true })}>
                      {[1, 2, 3, 6, 9, 12].map((months) => <option key={months} value={months}>{months} {months === 1 ? "month" : "months"}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {step === 2 && (
                <div className="form-grid">
                  <label className="field full"><span>Full name</span><input autoComplete="name" {...register("fullName")} aria-invalid={!!errors.fullName} />{errors.fullName && <small className="field-error">{String(errors.fullName.message)}</small>}</label>
                  <label className="field"><span>Email</span><input type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} />{errors.email && <small className="field-error">{String(errors.email.message)}</small>}</label>
                  <label className="field"><span>Phone</span><input type="tel" autoComplete="tel" {...register("phone")} aria-invalid={!!errors.phone} />{errors.phone && <small className="field-error">{String(errors.phone.message)}</small>}</label>
                  <label className="field full"><span>Occupation <em>optional</em></span><input {...register("occupation")} placeholder="For example, software engineer or student" /></label>
                </div>
              )}
              {step === 3 && (
                <div className="form-grid">
                  <label className="field full"><span>Anything we should know? <em>optional</em></span><textarea rows={4} {...register("message")} placeholder="Questions, accessibility needs, visit preferences…" /></label>
                  <label className="check-field full"><input type="checkbox" {...register("consent")} /><span>I agree that Verdant House may contact me about this enquiry. I understand this does not confirm a booking.</span></label>
                  {errors.consent && <small className="field-error full">{String(errors.consent.message)}</small>}
                  <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
                </div>
              )}
              {submitError && <div className="form-alert" role="alert">{submitError}</div>}
              <div className="dialog-actions">
                {step > 1 && <button className="button quiet" type="button" onClick={() => setStep((value) => value - 1)}><ArrowLeft aria-hidden="true" /> Back</button>}
                {step < 3 ? <button className="button primary" type="button" onClick={() => void next()}>Continue <ArrowRight aria-hidden="true" /></button> : <button className="button primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send enquiry"} <ArrowRight aria-hidden="true" /></button>}
              </div>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
