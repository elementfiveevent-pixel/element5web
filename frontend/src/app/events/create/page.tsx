"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Calendar, MapPin,
  Users, Tag, Info, Eye, Send, Loader2, PlusCircle, X
} from "lucide-react";
import SupabaseUpload from "@/components/ui/SupabaseUpload";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1 – basics
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  registrationEndDate: string;

  // Step 2 – venue
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  mapsLink: string;

  // Step 3 – capacity & tickets
  maxCapacity: string;
  isPaid: boolean;
  price: string;
  audiencePrice: string;
  artistPrice: string;
  upiVpa: string;
  upiId: string;
  upiQrUrl: string;
  artistQrUrl: string;
  audienceQrUrl: string;

  // Step 4 – media
  flyerUrl: string;
  sponsors: { name: string; logo: string }[];

  // Step 5 – details
  termsConditions: string;
  customFields: { label: string; type: string; required: boolean }[];
}

const CATEGORIES = [
  "STAGEVERSE", "FESTIVAL", "WORKSHOP", "MEETUP",
  "NETWORKING", "AWARDS", "PRIVATE", "EXHIBITION", "COMMUNITY",
];

const STEPS = [
  { id: 1, label: "Basics",   icon: <Info size={15} /> },
  { id: 2, label: "Venue",    icon: <MapPin size={15} /> },
  { id: 3, label: "Tickets",  icon: <Tag size={15} /> },
  { id: 4, label: "Media",    icon: <Eye size={15} /> },
  { id: 5, label: "Details",  icon: <Users size={15} /> },
  { id: 6, label: "Publish",  icon: <Send size={15} /> },
];

const INITIAL: FormData = {
  title: "", description: "", category: "STAGEVERSE",
  startDate: "", startTime: "19:00", endDate: "", endTime: "22:00",
  registrationEndDate: "",
  venueName: "", venueAddress: "", city: "", state: "", mapsLink: "",
  maxCapacity: "200", isPaid: false, price: "0", audiencePrice: "0", artistPrice: "0", upiVpa: "", upiId: "", upiQrUrl: "", artistQrUrl: "", audienceQrUrl: "",
  flyerUrl: "",
  sponsors: [],
  termsConditions: "", customFields: [],
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full border-3 border-[#121212] flex items-center justify-center font-display font-black text-xs transition-all ${
                  done   ? "bg-green-500 text-white shadow-brutal"
                  : active ? "bg-yellow-festival text-[#121212] shadow-brutal"
                  : "bg-white text-[#121212]/40"
                }`}
              >
                {done ? <Check size={14} /> : step.icon}
              </div>
              <span className={`mt-1 font-display font-black text-[9px] uppercase tracking-wider hidden sm:block ${active ? "text-[#121212]" : "text-[#121212]/40"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 sm:mb-5 ${done ? "bg-green-500" : "bg-[#121212]/15"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-display font-black text-xs uppercase tracking-wider text-[#121212]/60 flex items-center gap-1">
        {label} {required && <span className="text-red-stage">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-[#121212]/30 focus:outline-none focus:border-yellow-festival transition-colors";
const selectCls = "w-full px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none focus:border-yellow-festival";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<{ id: string; slug: string; title: string } | null>(null);

  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorLogo, setNewSponsorLogo] = useState("");

  const set = (key: keyof FormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // Merge date + time into ISO string
  const toISO = (date: string, time: string) =>
    date && time ? `${date}T${time}:00` : date ? `${date}T00:00:00` : "";

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      let finalSponsors = form.sponsors || [];
      if (newSponsorName.trim() && newSponsorLogo) {
        finalSponsors = [...finalSponsors, { name: newSponsorName.trim(), logo: newSponsorLogo }];
      }

      const payload = {
        title:               form.title.trim(),
        description:         form.description.trim() || undefined,
        category:            form.category,
        startDate:           toISO(form.startDate, form.startTime),
        endDate:             form.endDate ? toISO(form.endDate, form.endTime) : undefined,
        registrationEndDate: form.registrationEndDate ? toISO(form.registrationEndDate, "23:59") : undefined,
        venueName:           form.venueName.trim(),
        venueAddress:        form.venueAddress.trim(),
        city:                form.city.trim(),
        state:               form.state.trim(),
        mapsLink:            form.mapsLink.trim() || undefined,
        maxCapacity:         parseInt(form.maxCapacity) || 200,
        isPaid:              form.isPaid,
        price:               form.isPaid ? parseFloat(form.price) || 0 : 0,
        audiencePrice:       form.isPaid ? parseFloat(form.audiencePrice) || 0 : 0,
        artistPrice:         form.isPaid ? parseFloat(form.artistPrice) || 0 : 0,
        upiVpa:              form.upiVpa.trim() || undefined,
        upiId:               form.upiVpa.trim() || undefined,
        upiQrUrl:            form.upiQrUrl || undefined,
        artistQrUrl:         form.artistQrUrl || undefined,
        audienceQrUrl:       form.audienceQrUrl || undefined,
        flyerUrl:            form.flyerUrl || undefined,
        termsConditions:     form.termsConditions.trim() || undefined,
        customFields:        form.customFields.filter((field) => field.label.trim()),
        sponsors:            finalSponsors,
      };
      const result = await api.post("/events", payload);
      setCreatedEvent({ id: result.id, slug: result.slug, title: result.title });
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const addCustomField = () => {
    set("customFields", [...form.customFields, { label: "", type: "text", required: false }]);
  };
  const removeCustomField = (i: number) => {
    set("customFields", form.customFields.filter((_, idx) => idx !== i));
  };
  const updateCustomField = (i: number, key: string, val: any) => {
    const updated = form.customFields.map((f, idx) => idx === i ? { ...f, [key]: val } : f);
    set("customFields", updated);
  };

  const canNext: Record<number, boolean> = {
    1: !!form.title.trim() && !!form.category && !!form.startDate,
    2: !!form.venueName.trim() && !!form.venueAddress.trim() && !!form.city.trim() && !!form.state.trim(),
    3: !form.isPaid || (!!form.audiencePrice && parseFloat(form.audiencePrice) >= 0 && !!form.artistPrice && parseFloat(form.artistPrice) >= 0),
    4: true,
    5: true,
    6: true,
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (createdEvent) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center px-6">
        <div className="max-w-md w-full border-3 border-[#121212] bg-white rounded shadow-brutal p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-green-500 border-3 border-[#121212] rounded-full flex items-center justify-center mx-auto shadow-brutal">
            <Check size={28} className="text-white" />
          </div>
          <div className="space-y-2">
            <span className="brutal-tape text-xs">EVENT LIVE</span>
            <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-2">
              {createdEvent.title}
            </h2>
            <p className="font-space text-sm text-[#121212]/60 font-bold">
              Your event has been published and is now accepting registrations.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href={`/events/${createdEvent.slug}`}
              className="w-full bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black uppercase text-sm py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              VIEW EVENT PAGE
            </Link>
            <Link
              href="/events/organizer"
              className="w-full border-2 border-[#121212] text-[#121212] font-black uppercase text-sm py-3 rounded hover:bg-[#121212]/5 transition-colors"
            >
              GO TO ORGANIZER DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline text-[#121212]/60">
          <ArrowLeft size={15} /> EVENTS
        </Link>

        {/* Header */}
        <div className="space-y-1">
          <span className="brutal-tape text-xs uppercase select-none">ORGANIZER TOOLS</span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl uppercase tracking-tighter mt-2">
            CREATE <span className="text-red-stage">EVENT</span>
          </h1>
        </div>

        {/* Step bar */}
        <StepBar current={step} />

        {/* Card */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal overflow-hidden">

          {/* Step header */}
          <div className="bg-[#121212] text-[#FAF8F5] px-6 py-4 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-yellow-festival text-[#121212] flex items-center justify-center font-display font-black text-xs">
              {step}
            </span>
            <span className="font-display font-black text-base uppercase tracking-wide">
              {STEPS[step - 1].label}
            </span>
            <span className="ml-auto text-[#FAF8F5]/40 font-space text-xs">
              {step} / {STEPS.length}
            </span>
          </div>

          {/* Step body */}
          <div className="p-6 space-y-5">

            {/* ── STEP 1: Basics ─────────────────────────────────────────── */}
            {step === 1 && (
              <>
                <Field label="Event Title" required>
                  <input className={inputCls} placeholder="e.g. StageVerse 4.0: Rajkot Edition"
                    value={form.title} onChange={(e) => set("title", e.target.value)} />
                </Field>

                <Field label="Description">
                  <textarea className={`${inputCls} resize-none`} rows={4}
                    placeholder="Tell people what to expect at your event…"
                    value={form.description} onChange={(e) => set("description", e.target.value)} />
                </Field>

                <Field label="Category" required>
                  <select className={selectCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Start Date" required>
                    <input type="date" className={inputCls}
                      value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                  </Field>
                  <Field label="Start Time">
                    <input type="time" className={inputCls}
                      value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="End Date">
                    <input type="date" className={inputCls}
                      value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                  </Field>
                  <Field label="End Time">
                    <input type="time" className={inputCls}
                      value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                  </Field>
                </div>

                <Field label="Registration Closes On">
                  <input type="date" className={inputCls}
                    value={form.registrationEndDate} onChange={(e) => set("registrationEndDate", e.target.value)} />
                </Field>
              </>
            )}

            {/* ── STEP 2: Venue ──────────────────────────────────────────── */}
            {step === 2 && (
              <>
                <Field label="Venue Name" required>
                  <input className={inputCls} placeholder="e.g. The Brutalist Box"
                    value={form.venueName} onChange={(e) => set("venueName", e.target.value)} />
                </Field>

                <Field label="Full Address" required>
                  <textarea className={`${inputCls} resize-none`} rows={2}
                    placeholder="Street address, landmark…"
                    value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" required>
                    <input className={inputCls} placeholder="e.g. Ahmedabad"
                      value={form.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                  <Field label="State" required>
                    <input className={inputCls} placeholder="e.g. Gujarat"
                      value={form.state} onChange={(e) => set("state", e.target.value)} />
                  </Field>
                </div>

                <Field label="Google Maps Link">
                  <input className={inputCls} placeholder="https://maps.google.com/…"
                    value={form.mapsLink} onChange={(e) => set("mapsLink", e.target.value)} />
                </Field>
              </>
            )}

            {/* ── STEP 3: Capacity & Tickets ─────────────────────────────── */}
            {step === 3 && (
              <>
                <Field label="Maximum Capacity">
                  <input type="number" min={1} className={inputCls} placeholder="200"
                    value={form.maxCapacity} onChange={(e) => set("maxCapacity", e.target.value)} />
                </Field>

                <div className="border-3 border-[#121212] bg-white rounded p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-black text-sm uppercase">Paid Event</span>
                      <p className="font-space text-xs text-[#121212]/50 font-bold mt-0.5">
                        Toggle if attendees pay to register
                      </p>
                    </div>
                    <button
                      onClick={() => { set("isPaid", !form.isPaid); if (form.isPaid) set("price", "0"); }}
                      className={`w-12 h-6 rounded-full border-2 border-[#121212] transition-colors relative ${form.isPaid ? "bg-yellow-festival" : "bg-[#121212]/10"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-[#121212] rounded-full transition-all ${form.isPaid ? "left-[26px]" : "left-0.5"}`} />
                    </button>
                  </div>

                  {form.isPaid && (
                    <div className="space-y-4 pt-2 border-t border-[#121212]/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Audience Ticket Price (₹)" required>
                          <input type="number" min={0} className={inputCls} placeholder="299"
                            value={form.audiencePrice} onChange={(e) => {
                              set("audiencePrice", e.target.value);
                              set("price", e.target.value);
                            }} />
                        </Field>
                        <Field label="Artist / Performer Price (₹)" required>
                          <input type="number" min={0} className={inputCls} placeholder="499"
                            value={form.artistPrice} onChange={(e) => set("artistPrice", e.target.value)} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="UPI VPA ID (for payment)" required>
                          <input className={inputCls} placeholder="event@upi"
                            value={form.upiVpa} onChange={(e) => {
                              set("upiVpa", e.target.value);
                              set("upiId", e.target.value);
                            }} />
                        </Field>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Audience QR Code (Optional)">
                          <SupabaseUpload
                            folder="element5/qrs"
                            accept="image/*"
                            label="UPLOAD AUDIENCE QR"
                            maxSizeMB={5}
                            onUploadSuccess={(r) => {
                              set("audienceQrUrl", r.secure_url);
                              set("upiQrUrl", r.secure_url);
                            }}
                          />
                          {form.audienceQrUrl && <p className="text-xs text-green-600 font-bold mt-1">✓ Audience QR Code Uploaded</p>}
                        </Field>
                        
                        <Field label="Artist QR Code (Optional)">
                          <SupabaseUpload
                            folder="element5/qrs"
                            accept="image/*"
                            label="UPLOAD ARTIST QR"
                            maxSizeMB={5}
                            onUploadSuccess={(r) => set("artistQrUrl", r.secure_url)}
                          />
                          {form.artistQrUrl && <p className="text-xs text-green-600 font-bold mt-1">✓ Artist QR Code Uploaded</p>}
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 4: Media ──────────────────────────────────────────── */}
            {step === 4 && (
              <>
                <Field label="Event Flyer / Banner">
                  <SupabaseUpload
                    folder="element5/flyers"
                    accept="image/*"
                    label="UPLOAD EVENT FLYER"
                    maxSizeMB={10}
                    onUploadSuccess={(r) => set("flyerUrl", r.secure_url)}
                  />
                </Field>

                {form.flyerUrl && (
                  <div className="border-3 border-[#121212] rounded overflow-hidden">
                    <img src={form.flyerUrl} alt="Flyer preview" className="w-full max-h-64 object-cover" />
                    <div className="bg-[#121212] text-[#FAF8F5] px-4 py-2 flex items-center justify-between">
                      <span className="font-space text-xs font-bold truncate">{form.flyerUrl.split("/").pop()}</span>
                      <button onClick={() => set("flyerUrl", "")} className="text-red-stage hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {!form.flyerUrl && (
                  <div className="border-3 border-dashed border-[#121212]/20 bg-white rounded p-6 text-center">
                    <p className="font-space text-sm text-[#121212]/40 font-bold">No flyer uploaded — event will show a default banner</p>
                  </div>
                )}

                <div className="border-t-3 border-[#121212]/10 pt-6 space-y-4">
                  <div>
                    <h4 className="font-display font-black text-sm uppercase">Sponsor's Logos</h4>
                    <p className="font-space text-xs text-[#121212]/50 font-bold">Add logos of event sponsors to rotate below the header banner.</p>
                  </div>

                  {/* Add sponsor controls */}
                  <div className="border-2 border-[#121212] bg-white p-4 rounded space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Sponsor Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Red Bull"
                          className="w-full px-3 py-2.5 border-2 border-[#121212] bg-white rounded font-space font-bold text-xs focus:outline-none"
                          value={newSponsorName}
                          onChange={(e) => setNewSponsorName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Logo Upload</label>
                        <SupabaseUpload
                          folder="element5/sponsors"
                          accept="image/*"
                          label={newSponsorLogo ? "RE-UPLOAD LOGO" : "UPLOAD LOGO"}
                          maxSizeMB={5}
                          onUploadSuccess={(r) => setNewSponsorLogo(r.secure_url)}
                        />
                        {newSponsorLogo && (
                          <p className="text-[10px] text-green-600 font-bold mt-1">✓ Logo uploaded successfully</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!newSponsorName.trim() || !newSponsorLogo}
                      onClick={() => {
                        set("sponsors", [...form.sponsors, { name: newSponsorName, logo: newSponsorLogo }]);
                        setNewSponsorName("");
                        setNewSponsorLogo("");
                      }}
                      className="w-full bg-[#121212] text-white border-2 border-[#121212] font-display font-black text-[10px] uppercase py-2 rounded disabled:opacity-50 hover:bg-[#121212]/80 cursor-pointer"
                    >
                      + ADD SPONSOR
                    </button>
                  </div>

                  {/* Listed sponsors */}
                  {form.sponsors.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {form.sponsors.map((sp, idx) => (
                        <div key={idx} className="border-2 border-[#121212] bg-white p-3 rounded relative shadow-brutal-sm flex flex-col items-center text-center">
                          <button
                            type="button"
                            onClick={() => set("sponsors", form.sponsors.filter((_, i) => i !== idx))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 border border-[#121212] bg-red-stage text-white rounded-full flex items-center justify-center font-black text-[8px] hover:bg-red-700 cursor-pointer animate-fade-in"
                          >
                            ✕
                          </button>
                          <div className="w-12 h-12 flex items-center justify-center border border-[#121212]/10 rounded overflow-hidden p-1 bg-gray-50">
                            <img src={sp.logo} alt={sp.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <span className="font-space font-black text-[9px] uppercase tracking-tight mt-1.5 truncate max-w-full">
                            {sp.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 5: Details ────────────────────────────────────────── */}
            {step === 5 && (
              <>
                <Field label="Terms & Conditions">
                  <textarea className={`${inputCls} resize-none`} rows={4}
                    placeholder="Entry rules, age restrictions, refund policy…"
                    value={form.termsConditions} onChange={(e) => set("termsConditions", e.target.value)} />
                </Field>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-display font-black text-sm uppercase">Custom Registration Fields</span>
                      <p className="font-space text-xs text-[#121212]/50 font-bold">Extra info to collect at registration</p>
                    </div>
                    <button onClick={addCustomField} className="flex items-center gap-1.5 bg-[#121212] text-[#FAF8F5] font-black text-[10px] uppercase px-3 py-1.5 rounded">
                      <PlusCircle size={12} /> ADD FIELD
                    </button>
                  </div>

                  {form.customFields.map((cf, i) => (
                    <div key={i} className="border-2 border-[#121212] bg-white rounded p-4 grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <input className="w-full px-3 py-2 border-2 border-[#121212] rounded font-space font-bold text-sm focus:outline-none"
                          placeholder="Field label" value={cf.label}
                          onChange={(e) => updateCustomField(i, "label", e.target.value)} />
                      </div>
                      <div className="col-span-4">
                        <select className="w-full px-3 py-2 border-2 border-[#121212] rounded font-display font-bold text-sm focus:outline-none"
                          value={cf.type} onChange={(e) => updateCustomField(i, "type", e.target.value)}>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 justify-center">
                        <input type="checkbox" checked={cf.required} onChange={(e) => updateCustomField(i, "required", e.target.checked)}
                          className="w-4 h-4 accent-red-stage" />
                        <span className="font-space font-black text-[10px] uppercase">Req</span>
                      </div>
                      <button onClick={() => removeCustomField(i)} className="col-span-1 text-red-stage hover:text-red-700 flex items-center justify-center">
                        <X size={15} />
                      </button>
                    </div>
                  ))}

                  {form.customFields.length === 0 && (
                    <div className="border-2 border-dashed border-[#121212]/20 rounded p-4 text-center">
                      <p className="font-space text-xs font-bold text-[#121212]/30 uppercase">No custom fields added</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 6: Preview & Publish ──────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-6">
                {/* Summary card */}
                <div className="border-3 border-[#121212] bg-white rounded overflow-hidden shadow-brutal">
                  {form.flyerUrl ? (
                    <img src={form.flyerUrl} alt="Flyer" className="w-full h-44 object-cover border-b-3 border-[#121212]" />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-[#121212] to-[#2a2a2a] flex items-center justify-center border-b-3 border-[#121212]">
                      <span className="font-display font-black text-6xl text-white/10">E5</span>
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-black text-[9px] uppercase bg-red-stage text-white px-2 py-0.5 rounded">{form.category}</span>
                        <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight mt-1">{form.title || "Untitled Event"}</h3>
                      </div>
                      <span className="font-black text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded flex-shrink-0 mt-1">WILL PUBLISH</span>
                    </div>
                    {form.description && <p className="font-space text-sm text-[#121212]/60 font-bold line-clamp-2">{form.description}</p>}
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-bold font-space text-[#121212]/60 pt-2 border-t border-[#121212]/10">
                      <span className="flex items-center gap-1.5"><Calendar size={11} className="text-red-stage" />{form.startDate} {form.startTime}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={11} className="text-red-stage" />{form.venueName || "—"}, {form.city}</span>
                      <span className="flex items-center gap-1.5"><Users size={11} className="text-red-stage" />Cap: {form.maxCapacity}</span>
                      <span className="flex items-center gap-1.5"><Tag size={11} className="text-red-stage" />{form.isPaid ? `Aud: ₹${form.audiencePrice} / Art: ₹${form.artistPrice}` : "FREE"}</span>
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="border-2 border-red-stage bg-red-50 p-4 rounded flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-stage flex-shrink-0 mt-0.5" />
                    <p className="font-space font-bold text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-yellow-festival text-[#121212] border-3 border-[#121212] font-black uppercase text-base py-4 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 size={18} className="animate-spin" /> PUBLISHING…</> : <><Send size={18} /> PUBLISH EVENT</>}
                </button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="border-t-3 border-[#121212] bg-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 border-2 border-[#121212] font-black text-xs uppercase px-5 py-2.5 rounded hover:bg-[#121212]/5 disabled:opacity-30 transition-all"
            >
              <ArrowLeft size={14} /> BACK
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                disabled={!canNext[step]}
                className="flex items-center gap-2 bg-[#121212] text-[#FAF8F5] border-2 border-[#121212] font-black text-xs uppercase px-5 py-2.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40 transition-all"
              >
                NEXT <ArrowRight size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
