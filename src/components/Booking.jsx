import { useEffect, useMemo, useRef, useState } from 'react';
import { clinic } from '../data/clinic';
import { services } from '../data/services';
import { dentists } from '../data/dentists';
import { carriers } from '../data/insurance';
import bookingAdapter from '../lib/bookingAdapter';
import { useBooking } from '../lib/BookingContext';
import { track } from '../lib/track';

/**
 * Three-step booking form.
 *
 * Deliberate constraints:
 *  - No diagnostic questions. The form asks who you are and when you can come in.
 *    It does not ask what hurts, and it must never start to.
 *  - No PHI persisted client-side. Nothing here is written to localStorage,
 *    sessionStorage, a cookie or the URL. State lives in memory and is handed to the
 *    adapter once, on submit.
 *  - No blocking alerts. Validation is inline, tied to each field with
 *    aria-describedby, and the step will not advance until it passes.
 *  - The phone fallback is visible at every step, not just when something fails.
 */

const STEPS = ['Treatment', 'Time', 'Details'];

export default function Booking() {
  const { prefill } = useBooking();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    serviceId: '',
    dentistId: '',
    slot: null,
    name: '',
    phone: '',
    email: '',
    patientType: '',
    carrier: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const stepHeadingRef = useRef(null);

  // Seed from whichever section sent the visitor here.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      serviceId: prefill.serviceId || f.serviceId,
      dentistId: prefill.dentistId || f.dentistId,
      note: prefill.note || f.note,
    }));
  }, [prefill]);

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  };

  function validate(which) {
    const e = {};
    if (which === 0) {
      if (!form.serviceId) e.serviceId = 'Choose what you are coming in for.';
    }
    if (which === 1) {
      if (!form.slot) e.slot = 'Choose a day and a time.';
    }
    if (which === 2) {
      if (!form.name.trim()) e.name = 'We need a name for the appointment.';
      if (!form.phone.trim()) e.phone = 'We need a phone number in case we have to move the slot.';
      else if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'That does not look like a full phone number.';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = 'Check the email address.';
      if (!form.patientType) e.patientType = 'Let us know if you have been here before.';
    }
    return e;
  }

  function next() {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Move focus to the first thing that failed. No alert, no scroll jump.
      const firstKey = Object.keys(e)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }
    track('form_step_complete', { step: step + 1, stepName: STEPS[step] });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate(2);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`field-${Object.keys(e)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await bookingAdapter.submit(form);
      setResult(res);
      if (res.ok) {
        track('booking_submitted', {
          service: form.serviceId,
          dentist: form.dentistId || 'any',
          patientType: form.patientType,
        });
      }
    } catch {
      setResult({ ok: false, error: 'Something went wrong sending that.' });
    } finally {
      setSubmitting(false);
    }
  }

  // Move focus to the new step heading so keyboard and screen reader users follow.
  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [step]);

  if (result?.ok) {
    return (
      <BookingShell>
        <Confirmation result={result} form={form} />
      </BookingShell>
    );
  }

  return (
    <BookingShell>
      <form onSubmit={submit} noValidate className="mt-10">
        <Progress step={step} />

        <h3
          ref={stepHeadingRef}
          tabIndex={-1}
          className="mt-8 font-display text-[22px] text-white outline-none md:text-[26px]"
        >
          {step === 0 && 'What are you coming in for?'}
          {step === 1 && 'When suits you?'}
          {step === 2 && 'How do we reach you?'}
        </h3>

        <div className="mt-7">
          {step === 0 && <StepTreatment form={form} set={set} errors={errors} />}
          {step === 1 && <StepTime form={form} set={set} errors={errors} />}
          {step === 2 && <StepDetails form={form} set={set} errors={errors} />}
        </div>

        {result && !result.ok && (
          <p role="alert" className="mt-6 rounded-soft bg-white/15 p-4 text-[14px] text-white">
            {result.error} Nothing was booked. Call{' '}
            <a href={clinic.phone.href} className="underline underline-offset-4">
              {clinic.phone.display}
            </a>{' '}
            and we will sort it out.
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn border border-white/35 text-white hover:bg-white/10"
            >
              Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="btn-onaccent">
              Continue
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-onaccent disabled:opacity-60">
              {submitting ? 'Sending…' : 'Request this appointment'}
            </button>
          )}

          <p className="text-[14px] text-white/75">
            Prefer to talk?{' '}
            <a
              href={clinic.phone.href}
              onClick={() => track('call_click', { source: 'booking_form' })}
              className="font-display text-white underline underline-offset-4"
            >
              Call {clinic.phone.display}
            </a>
          </p>
        </div>

        <p className="mt-6 max-w-[64ch] text-[12px] leading-relaxed text-white/60">
          We ask for a name, a phone number and when you can come in. Please do not
          describe symptoms or medical history here — we will go through that with you in
          the room. This form does not store anything on your device.
        </p>
      </form>
    </BookingShell>
  );
}

function BookingShell({ children }) {
  return (
    <section id="booking" className="section bg-accent text-white">
      <div className="shell">
        <p className="eyebrow text-white/60">Booking</p>
        <h2 className="display-lg mt-5 max-w-[16ch] text-white">Book an appointment.</h2>
        {children}
      </div>
    </section>
  );
}

function Progress({ step }) {
  return (
    <ol className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const state = i < step ? 'done' : i === step ? 'current' : 'todo';
        return (
          <li
            key={label}
            aria-current={state === 'current' ? 'step' : undefined}
            className="flex items-center gap-2.5"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-display text-[12px] ${
                state === 'todo' ? 'bg-white/20 text-white/70' : 'bg-white text-accent'
              }`}
            >
              {i + 1}
            </span>
            <span className={`font-display text-[14px] ${state === 'todo' ? 'text-white/55' : 'text-white'}`}>
              {label}
            </span>
            {state === 'done' && <span className="sr-only">(complete)</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Step 1 ─────────────────────────────────────────────────────────────── */

function StepTreatment({ form, set, errors }) {
  return (
    <div className="space-y-8">
      <Field
        id="field-serviceId"
        label="Treatment"
        error={errors.serviceId}
        render={(props) => (
          <div {...props} role="radiogroup" aria-label="Treatment" className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <Choice
                key={s.id}
                name="service"
                checked={form.serviceId === s.id}
                onChange={() => set({ serviceId: s.id })}
                title={s.name}
                sub={`${s.duration} · ${s.price}`}
              />
            ))}
          </div>
        )}
      />

      <Field
        id="field-dentistId"
        label="Preferred dentist"
        hint="Optional. Leave it on “No preference” and we will book the first slot available."
        render={(props) => (
          <div {...props} role="radiogroup" aria-label="Preferred dentist" className="grid gap-2 sm:grid-cols-2">
            <Choice
              name="dentist"
              checked={form.dentistId === ''}
              onChange={() => set({ dentistId: '' })}
              title="No preference"
              sub="Soonest available"
            />
            {dentists.map((d) => (
              <Choice
                key={d.id}
                name="dentist"
                checked={form.dentistId === d.id}
                onChange={() => set({ dentistId: d.id })}
                title={d.name}
                sub={d.specialism}
              />
            ))}
          </div>
        )}
      />
    </div>
  );
}

/* ── Step 2 ─────────────────────────────────────────────────────────────── */

function StepTime({ form, set, errors }) {
  const [days, setDays] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    bookingAdapter
      .getAvailability({ from: new Date(), days: 14, serviceId: form.serviceId, dentistId: form.dentistId })
      .then((d) => {
        if (alive) {
          setDays(d);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [form.serviceId, form.dentistId]);

  const day = days[dayIndex];
  const slots = useMemo(() => day?.slots.filter((s) => s.available) ?? [], [day]);

  return (
    <Field
      id="field-slot"
      label="Day and time"
      error={errors.slot}
      render={(props) => (
        <div {...props}>
          {loading ? (
            <p className="text-[15px] text-white/75">Loading availability…</p>
          ) : (
            <>
              <div
                role="tablist"
                aria-label="Choose a day"
                className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
              >
                {days.map((d, i) => {
                  const date = new Date(d.date);
                  const active = i === dayIndex;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setDayIndex(i)}
                      className={`shrink-0 rounded-soft px-3.5 py-2.5 text-center transition-colors ${
                        active ? 'bg-white text-accent' : 'bg-white/12 text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="block font-display text-[12px] uppercase tracking-[0.1em]">
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      <span className="mt-0.5 block font-display text-[17px]">{date.getDate()}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {slots.map((s) => {
                  const active = form.slot === s.start;
                  return (
                    <button
                      key={s.start}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set({ slot: s.start })}
                      className={`rounded-soft px-2 py-3 font-display text-[14px] transition-colors ${
                        active ? 'bg-white text-accent' : 'bg-white/12 text-white hover:bg-white/20'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}

                {slots.length === 0 && (
                  <p className="col-span-full text-[15px] text-white/75">
                    Nothing free that day. Try another, or call{' '}
                    <a href={clinic.phone.href} className="underline underline-offset-4">
                      {clinic.phone.display}
                    </a>
                    .
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    />
  );
}

/* ── Step 3 ─────────────────────────────────────────────────────────────── */

function StepDetails({ form, set, errors }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Input
        id="field-name"
        label="Full name"
        value={form.name}
        onChange={(v) => set({ name: v })}
        error={errors.name}
        autoComplete="name"
        required
      />
      <Input
        id="field-phone"
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={(v) => set({ phone: v })}
        error={errors.phone}
        autoComplete="tel"
        required
      />
      <Input
        id="field-email"
        label="Email"
        type="email"
        hint="Optional. Used for the confirmation only."
        value={form.email}
        onChange={(v) => set({ email: v })}
        error={errors.email}
        autoComplete="email"
      />

      <Field
        id="field-patientType"
        label="Have you been here before?"
        error={errors.patientType}
        render={(props) => (
          <div {...props} role="radiogroup" aria-label="Have you been here before?" className="grid grid-cols-2 gap-2">
            <Choice
              name="patientType"
              checked={form.patientType === 'new'}
              onChange={() => set({ patientType: 'new' })}
              title="New patient"
            />
            <Choice
              name="patientType"
              checked={form.patientType === 'returning'}
              onChange={() => set({ patientType: 'returning' })}
              title="Been before"
            />
          </div>
        )}
      />

      <div className="md:col-span-1">
        <label htmlFor="field-carrier" className="font-display text-[14px] text-white">
          Insurance carrier
        </label>
        <p className="mt-1 text-[13px] text-white/60">Optional.</p>
        <select
          id="field-carrier"
          value={form.carrier}
          onChange={(e) => set({ carrier: e.target.value })}
          className="mt-2 w-full rounded-soft border border-white/25 bg-white/10 px-4 py-3.5 text-[16px] text-white outline-none focus:border-white"
        >
          <option value="" className="text-ink">
            Select or skip
          </option>
          {carriers.map((c) => (
            <option key={c.name} value={c.name} className="text-ink">
              {c.name}
            </option>
          ))}
          <option value="other" className="text-ink">
            Something else
          </option>
          <option value="none" className="text-ink">
            No insurance
          </option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label htmlFor="field-note" className="font-display text-[14px] text-white">
          Anything we should know about scheduling?
        </label>
        <p className="mt-1 text-[13px] text-white/60">
          Optional — access needs, timing, who you would like to see. Not symptoms.
        </p>
        <textarea
          id="field-note"
          rows={3}
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
          className="mt-2 w-full rounded-soft border border-white/25 bg-white/10 px-4 py-3.5 text-[16px] text-white outline-none placeholder:text-white/45 focus:border-white"
          placeholder="I need a ground-floor room."
        />
      </div>
    </div>
  );
}

/* ── Confirmation ───────────────────────────────────────────────────────── */

function Confirmation({ result, form }) {
  const service = services.find((s) => s.id === form.serviceId);
  const dentist = dentists.find((d) => d.id === form.dentistId);
  const when = form.slot
    ? new Date(form.slot).toLocaleString([], {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="mt-10 max-w-[62ch]" role="status">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
        <svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true" className="text-accent">
          <path
            d="M2 8.5 7 13.5 18 2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h3 className="display-md mt-6 text-white">Request received.</h3>

      <p className="mt-5 text-[16px] leading-relaxed text-white/85">
        We will call you to confirm, usually within one working hour. The slot is held
        until then.
      </p>

      <dl className="mt-8 space-y-3 border-t border-white/25 pt-6 text-[15px]">
        {service && <ConfRow label="Treatment" value={service.name} />}
        {when && <ConfRow label="Requested" value={when} />}
        <ConfRow label="Dentist" value={dentist ? dentist.name : 'No preference'} />
        <ConfRow label="Reference" value={result.reference} />
      </dl>

      {result.warning && (
        <p className="mt-6 rounded-soft bg-white/20 p-4 text-[13px] text-white">
          {result.warning}
        </p>
      )}

      <p className="mt-8 text-[15px] text-white/85">
        Need to change it?{' '}
        <a href={clinic.phone.href} className="font-display text-white underline underline-offset-4">
          Call {clinic.phone.display}
        </a>
      </p>
    </div>
  );
}

function ConfRow({ label, value }) {
  return (
    <div className="flex flex-wrap gap-x-4">
      <dt className="w-32 shrink-0 text-white/60">{label}</dt>
      <dd className="font-display text-white">{value}</dd>
    </div>
  );
}

/* ── Field primitives ───────────────────────────────────────────────────── */

function Field({ id, label, hint, error, render }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;

  return (
    <fieldset>
      <legend className="font-display text-[14px] text-white">{label}</legend>
      {hint && (
        <p id={hintId} className="mt-1 text-[13px] text-white/60">
          {hint}
        </p>
      )}
      <div className="mt-3">
        {render({
          id,
          tabIndex: -1,
          'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined,
        })}
      </div>
      {error && (
        <p id={errId} className="mt-2.5 text-[13px] text-white">
          <span aria-hidden="true">↳ </span>
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Input({ id, label, hint, error, value, onChange, type = 'text', autoComplete, required }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="font-display text-[14px] text-white">
        {label}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-[13px] text-white/60">
          {hint}
        </p>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        className={`mt-2 w-full rounded-soft border bg-white/10 px-4 py-3.5 text-[16px] text-white outline-none transition-colors placeholder:text-white/45 focus:border-white ${
          error ? 'border-white' : 'border-white/25'
        }`}
      />
      {error && (
        <p id={errId} className="mt-2 text-[13px] text-white">
          <span aria-hidden="true">↳ </span>
          {error}
        </p>
      )}
    </div>
  );
}

function Choice({ name, checked, onChange, title, sub }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-soft border p-3.5 transition-colors ${
        checked ? 'border-white bg-white/20' : 'border-white/25 hover:bg-white/10'
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-white"
      />
      <span>
        <span className="block font-display text-[14px] text-white">{title}</span>
        {sub && <span className="mt-0.5 block text-[12px] text-white/65">{sub}</span>}
      </span>
    </label>
  );
}
