"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Scan, Keyboard, ArrowLeft, CheckCircle, XCircle, 
  Users, Ticket, Clock, ShieldAlert, Shield, 
  RotateCw, Camera, CameraOff, Loader2, ListFilter
} from "lucide-react";
import confetti from "canvas-confetti";

interface EventItem {
  id: string;
  title: string;
  startDate: string;
  location?: { venueName: string; city: string };
}

interface ScanStats {
  total: number;
  checkedIn: number;
  remaining: number;
}

interface ScanLog {
  id: string;
  attendee: string;
  action: "CHECK_IN" | "CHECK_OUT" | "REJECT";
  time: string;
}

export default function TicketScannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [eventsLoading, setEventsLoading] = useState(true);

  const [scanMode, setScanMode] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; attendee?: string } | null>(null);
  
  const [manualCode, setManualCode] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  
  const [stats, setStats] = useState<ScanStats>({ total: 0, checkedIn: 0, remaining: 0 });
  const [logs, setLogs] = useState<ScanLog[]>([]);
  
  const html5QrCodeRef = useRef<any>(null);

  // Authenticate user
  useEffect(() => {
    if (!loading && (!user || !["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role))) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch events on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setEventsLoading(true);
        // Attempt to fetch organizer events
        const res = await api.get("/events/organizer/my-events");
        if (Array.isArray(res)) {
          setEvents(res);
          if (res.length > 0) setSelectedEventId(res[0].id);
        } else {
          // Fallback to public events list
          const publicEvents = await api.get("/events");
          if (publicEvents?.data && Array.isArray(publicEvents.data)) {
            setEvents(publicEvents.data);
            if (publicEvents.data.length > 0) setSelectedEventId(publicEvents.data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load events", err);
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [user]);

  // Fetch event stats when selected event changes
  const fetchEventStats = useCallback(async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await api.get(`/events/${eventId}/analytics`);
      if (res) {
        setStats({
          total: res.totalTickets ?? 0,
          checkedIn: res.checkedIn ?? 0,
          remaining: res.notCheckedIn ?? 0,
        });
      }
    } catch (err) {
      console.warn("Could not load event stats, using client logs count", err);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventStats(selectedEventId);
    }
  }, [selectedEventId, fetchEventStats]);

  // Handle Scanning via html5-qrcode
  const startCamera = async () => {
    try {
      setIsScannerActive(true);
      setScanResult(null);

      // Dynamically load html5-qrcode on browser side
      const { Html5Qrcode } = await import("html5-qrcode");
      
      // Delay slightly to ensure element with ID qr-reader-container is mounted
      setTimeout(async () => {
        try {
          const scanner = new Html5Qrcode("qr-reader-container");
          html5QrCodeRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            async (decodedText) => {
              // Throttle multiple detections
              await handleCodeVerification(decodedText);
            },
            () => {
              // Verbose scan failure callback can be ignored
            }
          );
        } catch (err) {
          console.error("Failed to start scanner instance", err);
          setIsScannerActive(false);
        }
      }, 300);

    } catch (err) {
      console.error("Failed to load html5-qrcode", err);
      setIsScannerActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop cleanup warning:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        stopCamera();
      }
    };
  }, []);

  // Handle verification logic
  const handleCodeVerification = async (code: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScanResult(null);

    const path = scanMode === "CHECK_IN" ? "/events/tickets/checkin" : "/events/tickets/checkout";

    try {
      const res = await api.post(path, {
        qrCode: code,
        deviceFingerprint: "element5-web-scanner-2026",
      });

      if (res?.success) {
        const attendeeName = res.attendee || "Attendee";
        setScanResult({
          success: true,
          message: scanMode === "CHECK_IN" ? `Successfully checked in!` : `Successfully checked out!`,
          attendee: attendeeName,
        });

        // Trigger confetti on success check-in
        if (scanMode === "CHECK_IN") {
          confetti({ particleCount: 60, spread: 45, colors: ["#FFDE4D", "#D80032"] });
        }

        // Add to scan logs
        setLogs(prev => [
          {
            id: `log-${Date.now()}`,
            attendee: attendeeName,
            action: scanMode,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);

        // Refresh database stats
        if (selectedEventId) {
          fetchEventStats(selectedEventId);
        }
      } else {
        setScanResult({
          success: false,
          message: res?.message || "Failed to process ticket validation",
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || "Invalid ticket verification request",
      });
      setLogs(prev => [
        {
          id: `log-${Date.now()}`,
          attendee: code.substring(0, 8) + "...",
          action: "REJECT",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } finally {
      setIsProcessing(false);
      // Automatically clear scan result status after 4 seconds
      setTimeout(() => setScanResult(null), 4000);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setIsManualSubmitting(true);
    await handleCodeVerification(manualCode.trim());
    setManualCode("");
    setIsManualSubmitting(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" />
        <span className="font-display font-black uppercase text-xl">Loading Scanner...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Title */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push(user.role === "SUPER_ADMIN" ? "/admin" : "/events/organizer")}
            className="flex items-center gap-1.5 border-2 border-[#121212] bg-[#FAF8F5] px-3.5 py-1.5 rounded font-black text-xs uppercase shadow-brutal hover:bg-gray-100 transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <span className="brutal-sticker text-xs bg-yellow-festival rotate-[-2deg]">
            SECURE ENTRY MODULE
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter">
            TICKET <span className="text-red-stage">GATEWAY</span>
          </h1>
          <p className="font-space text-sm sm:text-base font-bold text-gray-700 max-w-xl">
            Real-time validation engine. Switch modes below to scan barcodes or register check-out logs.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-3 border-[#121212] bg-white p-4 rounded shadow-brutal">
          
          {/* Select Event */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block flex items-center gap-1">
              <ListFilter size={12} /> Target Event
            </label>
            {eventsLoading ? (
              <div className="p-2.5 bg-gray-100 text-xs font-space font-bold animate-pulse">Loading active stages...</div>
            ) : (
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-2 border-2 border-[#121212] rounded bg-[#FAF8F5] font-space font-bold focus:outline-none"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block flex items-center gap-1">
              <Shield size={12} /> Scanner Mode
            </label>
            <div className="grid grid-cols-2 border-2 border-[#121212] rounded overflow-hidden">
              <button 
                onClick={() => setScanMode("CHECK_IN")}
                className={`py-2 text-xs font-black uppercase transition-all ${scanMode === "CHECK_IN" ? "bg-[#121212] text-white" : "bg-[#FAF8F5] text-[#121212]"}`}
              >
                Check-In (Entry)
              </button>
              <button 
                onClick={() => setScanMode("CHECK_OUT")}
                className={`py-2 text-xs font-black uppercase transition-all ${scanMode === "CHECK_OUT" ? "bg-red-stage text-white" : "bg-[#FAF8F5] text-[#121212]"}`}
              >
                Check-Out (Exit)
              </button>
            </div>
          </div>

        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 rounded text-center shadow-brutal flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase">Checked In</span>
            <span className="text-3xl font-display font-black text-green-600 mt-1">{stats.checkedIn}</span>
          </div>
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 rounded text-center shadow-brutal flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase">Inside Venue</span>
            <span className="text-3xl font-display font-black text-yellow-festival mt-1">{stats.remaining}</span>
          </div>
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 rounded text-center shadow-brutal flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase">Total Issued</span>
            <span className="text-3xl font-display font-black text-blue-600 mt-1">{stats.total}</span>
          </div>
        </div>

        {/* Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Scanner Viewport (Camera or Manual) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="border-3 border-[#121212] bg-[#121212] rounded-lg overflow-hidden shadow-brutal-white relative min-h-[300px] flex flex-col items-center justify-center text-white">
              
              {isScannerActive ? (
                <div id="qr-reader-container" className="w-full h-full max-w-[400px] p-2 bg-black" />
              ) : (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto border border-white/20">
                    <Camera size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg uppercase tracking-tight">Camera Inactive</h3>
                    <p className="font-space text-xs text-gray-400 mt-1">Activate the scanner to verify attendee QR codes automatically</p>
                  </div>
                  <button 
                    onClick={startCamera}
                    className="bg-yellow-festival text-[#121212] border-2 border-[#121212] px-6 py-2.5 rounded font-black text-xs uppercase tracking-wider shadow-brutal shadow-brutal-hover"
                  >
                    Start Scanner
                  </button>
                </div>
              )}

              {/* Status Alert Overlay */}
              {scanResult && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${scanResult.success ? "bg-green-600/95" : "bg-red-stage/95"} transition-all`}>
                  {scanResult.success ? (
                    <CheckCircle size={56} className="text-white animate-bounce" />
                  ) : (
                    <XCircle size={56} className="text-white" />
                  )}
                  <h3 className="font-display font-black text-2xl uppercase mt-4 text-white">
                    {scanResult.success ? "TICKET VERIFIED" : "SCAN REJECTED"}
                  </h3>
                  <p className="font-space text-sm font-bold text-white/90 mt-2 max-w-xs leading-relaxed">
                    {scanResult.message}
                  </p>
                  {scanResult.attendee && (
                    <span className="brutal-tape text-xs mt-3 bg-white text-[#121212]">
                      👤 {scanResult.attendee}
                    </span>
                  )}
                </div>
              )}

              {/* Loader overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-[#121212]/90 flex flex-col items-center justify-center">
                  <Loader2 size={36} className="animate-spin text-yellow-festival" />
                  <span className="font-space text-xs font-bold uppercase mt-2 tracking-widest text-yellow-festival">processing payload...</span>
                </div>
              )}
            </div>

            {/* Stop Camera Trigger */}
            {isScannerActive && (
              <button 
                onClick={stopCamera}
                className="w-full border-3 border-[#121212] bg-white py-3 rounded font-black text-xs uppercase tracking-wide shadow-brutal hover:bg-gray-100 flex items-center justify-center gap-2"
              >
                <CameraOff size={16} /> Disable Camera Stream
              </button>
            )}

            {/* Manual Code Form */}
            <div className="border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal space-y-3">
              <h3 className="font-display font-bold text-sm uppercase flex items-center gap-1.5">
                <Keyboard size={16} /> Manual Code Override
              </h3>
              <form onSubmit={handleManualVerify} className="flex gap-2">
                <input 
                  type="text" 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Paste or type ticket uuid / hash..."
                  className="flex-1 p-2.5 border-2 border-[#121212] bg-white rounded font-space text-xs font-bold placeholder-gray-400 focus:outline-none"
                />
                <button 
                  type="submit" 
                  disabled={isManualSubmitting || !manualCode.trim()}
                  className="bg-[#121212] text-white border-2 border-[#121212] px-4 font-black text-xs uppercase rounded disabled:opacity-50 flex items-center gap-1"
                >
                  {isManualSubmitting ? <Loader2 size={12} className="animate-spin" /> : "Verify"}
                </button>
              </form>
            </div>

          </div>

          {/* Logs Feed */}
          <div className="lg:col-span-5 space-y-4">
            <div className="border-3 border-[#121212] bg-white p-5 rounded shadow-brutal flex flex-col h-full min-h-[380px]">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#121212]/10">
                <h3 className="font-display font-black text-sm uppercase flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-red-stage" /> Activity Log
                </h3>
                <button 
                  onClick={() => setLogs([])}
                  className="text-[9px] font-black uppercase text-gray-400 hover:text-red-stage"
                >
                  Clear Feed
                </button>
              </div>

              {/* Logs List */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 max-h-[340px] pr-1 font-space text-xs font-bold">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400 space-y-2">
                    <RotateCw size={24} className="animate-spin" />
                    <span className="uppercase text-[9px] tracking-wider block font-bold">Waiting for scanned packets...</span>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`flex items-center justify-between p-2.5 border-2 rounded ${
                        log.action === "CHECK_IN" ? "bg-green-50 border-green-300" :
                        log.action === "CHECK_OUT" ? "bg-orange-50 border-orange-300" :
                        "bg-red-50 border-red-300"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="block truncate font-black">{log.attendee}</span>
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest">{log.action} LOGGED</span>
                      </div>
                      <span className="text-[9px] text-gray-500 ml-2 whitespace-nowrap">{log.time}</span>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
