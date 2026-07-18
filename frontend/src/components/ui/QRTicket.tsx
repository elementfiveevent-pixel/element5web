"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { QrCode, Download, Share2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface QRTicketProps {
  ticketId: string;
  qrCode: string;
  isUsed: boolean;
  usedAt?: string | null;
  eventTitle: string;
  eventDate?: string;
  venueName?: string;
  venueCity?: string;
  category?: string;
  paymentStatus?: string;
  registrationId?: string;
  totalAmount?: string | number;
  compact?: boolean;
}

export default function QRTicket({
  ticketId,
  qrCode,
  isUsed,
  usedAt,
  eventTitle,
  eventDate,
  venueName,
  venueCity,
  category,
  paymentStatus,
  registrationId,
  totalAmount,
  compact = false,
}: QRTicketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!qrCode) return;
    QRCode.toCanvas(
      canvasRef.current!,
      qrCode,
      {
        width: compact ? 140 : 200,
        margin: 2,
        color: { dark: "#121212", light: "#FAF8F5" },
        errorCorrectionLevel: "H",
      },
      (err) => {
        if (err) console.error("QR render error", err);
      }
    );
    QRCode.toDataURL(qrCode, {
      width: 400,
      margin: 2,
      color: { dark: "#121212", light: "#FAF8F5" },
    }).then(setDataUrl);
  }, [qrCode, compact]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `E5-ticket-${ticketId.slice(0, 8).toUpperCase()}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share && dataUrl) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `E5-ticket-${ticketId.slice(0, 8)}.png`, { type: "image/png" });
      navigator.share({ title: `My ticket for ${eventTitle}`, files: [file] }).catch(() => {});
    }
  };

  const statusConfig = {
    used: { bg: "bg-gray-700 border-gray-600", badge: "bg-gray-600 text-gray-300", label: "CHECKED IN", icon: <CheckCircle size={11} /> },
    valid: { bg: "bg-[#121212] border-green-500/40", badge: "bg-green-500 text-white", label: "VALID", icon: <CheckCircle size={11} /> },
    pending: { bg: "bg-[#121212] border-yellow-festival/40", badge: "bg-yellow-festival text-[#121212]", label: "PENDING APPROVAL", icon: <Clock size={11} /> },
    rejected: { bg: "bg-[#121212] border-red-stage/40", badge: "bg-red-stage text-white", label: "REJECTED", icon: <AlertCircle size={11} /> },
  };

  const statusKey =
    isUsed ? "used"
    : paymentStatus === "PENDING" ? "pending"
    : paymentStatus === "REJECTED" ? "rejected"
    : "valid";

  const status = statusConfig[statusKey];

  return (
    <div
      className={`relative border-3 ${status.bg} rounded overflow-hidden shadow-brutal flex flex-col`}
      style={{ opacity: isUsed ? 0.75 : 1 }}
    >
      {/* Top bar */}
      <div className="bg-[#0F0E0E] px-4 py-2.5 flex items-center justify-between border-b border-[#FAF8F5]/10">
        <div className="flex items-center gap-2">
          <QrCode size={14} className="text-yellow-festival" />
          <span className="font-display font-black text-[10px] uppercase tracking-widest text-[#FAF8F5]">
            E5 ADMISSION TICKET
          </span>
        </div>
        <span className={`flex items-center gap-1 font-black text-[9px] uppercase px-2 py-0.5 rounded ${status.badge}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Ticket body */}
      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-[#FAF8F5] text-[#121212]">
        {/* QR */}
        <div className="flex-shrink-0 border-3 border-[#121212] bg-[#FAF8F5] p-1 rounded flex justify-center max-w-full sm:w-auto">
          <canvas ref={canvasRef} className="block rounded max-w-full" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 w-full space-y-2.5 text-center sm:text-left">
          {category && (
            <span className="inline-block font-black text-[9px] uppercase tracking-wider bg-red-stage text-white px-2 py-0.5 rounded mx-auto sm:mx-0">
              {category}
            </span>
          )}
          <h3 className="font-display font-extrabold text-base leading-tight uppercase tracking-tight line-clamp-2">
            {eventTitle}
          </h3>
          <div className="space-y-1 font-space text-[11px] font-bold text-[#121212]/70 flex flex-col items-center sm:items-start">
            {eventDate && <p>📅 {eventDate}</p>}
            {venueName && <p>📍 {venueName}{venueCity ? `, ${venueCity}` : ""}</p>}
            <p className="font-mono text-[9px] uppercase tracking-wider text-[#121212]/40 pt-1 border-t border-[#121212]/10 w-full">
              REF: {qrCode.slice(0, 16).toUpperCase()}
            </p>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-left">
              <div className="bg-[#121212]/5 border border-[#121212]/10 rounded p-2">
                <span className="text-[9px] font-black uppercase text-[#121212]/40 block">Ticket ID</span>
                <span className="font-mono text-[10px] font-black">{ticketId.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="bg-[#121212]/5 border border-[#121212]/10 rounded p-2">
                <span className="text-[9px] font-black uppercase text-[#121212]/40 block">Amount</span>
                <span className="font-space text-[10px] font-black">
                  {Number(totalAmount) > 0 ? `₹${totalAmount}` : "FREE"}
                </span>
              </div>
            </div>
          )}

          {isUsed && usedAt && (
            <p className="text-[9px] font-black uppercase text-gray-500 mt-1 block">
              Checked in: {new Date(usedAt).toLocaleString("en-IN")}
            </p>
          )}
        </div>
      </div>

      {/* Dashed separator */}
      <div className="border-t-2 border-dashed border-[#121212]/20 mx-4" />

      {/* Actions */}
      {!compact && (
        <div className="bg-[#FAF8F5] px-4 py-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex items-center gap-1.5 bg-[#121212] text-[#FAF8F5] font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-black/80 disabled:opacity-40 transition-colors"
          >
            <Download size={11} /> DOWNLOAD
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 border-2 border-[#121212] text-[#121212] font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-[#121212]/5 transition-colors"
          >
            <Share2 size={11} /> SHARE
          </button>
        </div>
      )}
    </div>
  );
}
