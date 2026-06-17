import React, { useState, useRef, useEffect } from "react";
import { LifeBuoy, X, Send, Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

const URGENCY_OPTIONS = [
  { value: "Low", label: "🟢 Low — whenever you can" },
  { value: "Soon", label: "🟡 Soon — this week" },
  { value: "High", label: "🟠 High — today" },
  { value: "Critical", label: "🔴 Critical — blocking work" },
];

const PLATFORM_OPTIONS = ["Website", "Support Portal", "Mobile", "Email", "Other"];

const EMPTY = {
  description: "",
  client_name: "",
  booking_info: "",
  platform: "",
  urgency: "Soon",
  image_urls: [],
};

/**
 * Floating live-chat style bug reporter (bottom-right). Walks the user through
 * a guided set of questions and emails the report via the sendBugReport function.
 */
export default function BugReportChat({ currentUser, accent = "#b67651", open: controlledOpen, onOpenChange, hideFloatingButton = false, onSubmitted }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v) => { if (isControlled) onOpenChange?.(v); else setInternalOpen(v); };
  const [step, setStep] = useState("describe");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [bookingInput, setBookingInput] = useState("");
  const [data, setData] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const pushAssistant = (content) => setMessages((p) => [...p, { role: "assistant", content }]);
  const pushUser = (content) => setMessages((p) => [...p, { role: "user", content }]);

  useEffect(() => {
    if (open && messages.length === 0) {
      pushAssistant("Hey! 👋 I'll help you escalate this. What went wrong? Describe the bug in as much detail as you can.");
    }
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, step]);

  // While the chat bubble is open, lock the page so it can't be scrolled up
  // behind the widget (especially when the mobile keyboard / text input opens).
  useEffect(() => {
    if (!open) return;
    const docEl = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    const wasLocked = docEl.classList.contains("app-locked");
    docEl.classList.add("app-locked");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      if (!wasLocked) docEl.classList.remove("app-locked");
    };
  }, [open]);

  const resetAll = () => {
    setStep("describe");
    setMessages([]);
    setInput("");
    setClientNameInput("");
    setBookingInput("");
    setData(EMPTY);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (step === "done") setTimeout(resetAll, 300);
  };

  const submitDescribe = () => {
    const text = input.trim();
    if (!text) return;
    pushUser(text);
    setData((d) => ({ ...d, description: text }));
    setInput("");
    setStep("clientName");
    setTimeout(() => pushAssistant("Got it. Which client is this about? (or skip if not client-specific)"), 250);
  };

  const submitClientName = (skip = false) => {
    const name = clientNameInput.trim();
    pushUser(skip || !name ? "Skip" : name);
    setData((d) => ({ ...d, client_name: skip ? "" : name }));
    setClientNameInput("");
    setStep("bookingInfo");
    setTimeout(() => pushAssistant("Is there a specific booking date & time of concern? (or skip)"), 200);
  };

  const submitBookingInfo = (skip = false) => {
    const info = bookingInput.trim();
    pushUser(skip || !info ? "Skip" : info);
    setData((d) => ({ ...d, booking_info: skip ? "" : info }));
    setBookingInput("");
    setStep("platform");
    setTimeout(() => pushAssistant("Where is this happening?"), 200);
  };

  const pickPlatform = (p) => {
    pushUser(p);
    setData((d) => ({ ...d, platform: p }));
    setStep("urgency");
    setTimeout(() => pushAssistant("How urgent is this?"), 200);
  };

  const pickUrgency = (u) => {
    pushUser(URGENCY_OPTIONS.find((o) => o.value === u)?.label || u);
    setData((d) => ({ ...d, urgency: u }));
    setStep("images");
    setTimeout(() => pushAssistant("Want to attach any screenshots? You can add a few, or skip."), 200);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    const uploaded = [];
    for (const file of files) {
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        if (res?.file_url) uploaded.push(res.file_url);
      } catch (err) {
        setError(`Upload failed: ${err.message}`);
      }
    }
    setData((d) => ({ ...d, image_urls: [...d.image_urls, ...uploaded] }));
    if (uploaded.length) pushUser(`📎 Attached ${uploaded.length} file${uploaded.length === 1 ? "" : "s"}`);
    setUploading(false);
    e.target.value = "";
  };

  const finishImages = () => {
    setStep("review");
    setTimeout(() => pushAssistant("Here's the summary. Ready to send?"), 200);
  };

  const submitReport = async () => {
    setStep("sending");
    setError(null);
    try {
      const res = await base44.functions.invoke("sendBugReport", {
        description: data.description,
        client_name: data.client_name,
        booking_info: data.booking_info,
        platform: data.platform,
        urgency: data.urgency,
        image_urls: data.image_urls,
        rep_name: currentUser?.full_name,
      });
      if (res?.data?.success) {
        // Also surface the bug as a thread in the Support inbox (status: "bug").
        const reporterEmail = currentUser?.email || "bug-reporter@pilatesinpinkstudio.com";
        const reporterName = currentUser?.full_name || "Bug Reporter";
        const num = res.data.bug_number;
        await base44.entities.Thread.create({
          source_app: "support",
          contact_email: reporterEmail,
          contact_name: reporterName,
          status: "bug",
          ticket_type: "bug",
          subject: `Bug #${num}: ${data.description.slice(0, 60)}`,
          snippet: data.description.slice(0, 120),
          last_activity_at: new Date().toISOString(),
          form_data: {
            inquiry_type: "Bug Report",
            description: data.description,
            client_name: data.client_name,
            booking_info: data.booking_info,
            platform: data.platform,
            urgency: data.urgency,
            image_urls: data.image_urls,
            bug_number: num,
            reported_by: reporterName,
          },
        }).catch(() => {});
        pushAssistant(
          res.data.email_sent
            ? `✅ Sent! Escalated as Bug #${num}. Thanks — we're on it.`
            : `✅ Recorded as Bug #${num}, but the escalation email couldn't be sent.`
        );
        setStep("done");
        // Notify the parent (Inbox) so it can route to the Bugs view and
        // highlight + open the newly created bug ticket.
        onSubmitted?.(num);
      } else {
        throw new Error(res?.data?.error || "Failed to send");
      }
    } catch (err) {
      setError(err.message);
      setStep("review");
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && !hideFloatingButton && (
        <button
          onClick={() => setOpen(true)}
          title="Report a bug"
          className="fixed bottom-20 lg:bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <LifeBuoy className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 lg:bottom-5 right-5 z-50 w-[min(92vw,380px)] h-[min(70vh,560px)] lg:h-[min(80vh,560px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2.5 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
            <LifeBuoy className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Report an Issue</p>
              <p className="text-[11px] opacity-80 leading-tight">We'll escalate it for you</p>
            </div>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "text-white" : "bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-100"
                  }`}
                  style={m.role === "user" ? { background: accent } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {step === "sending" && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
          </div>

          {/* Input / quick-reply area */}
          <div className="border-t border-black/10 dark:border-white/10 p-3 bg-white dark:bg-neutral-900">
            {step === "describe" && (
              <ComposerRow value={input} onChange={setInput} onSend={submitDescribe} accent={accent} placeholder="Describe the bug…" />
            )}

            {step === "clientName" && (
              <div className="space-y-2">
                <ComposerRow value={clientNameInput} onChange={setClientNameInput} onSend={() => submitClientName(false)} accent={accent} placeholder="Client name…" />
                <button onClick={() => submitClientName(true)} className="text-xs text-muted-foreground hover:underline">Skip</button>
              </div>
            )}

            {step === "bookingInfo" && (
              <div className="space-y-2">
                <ComposerRow value={bookingInput} onChange={setBookingInput} onSend={() => submitBookingInfo(false)} accent={accent} placeholder="Booking date & time…" />
                <button onClick={() => submitBookingInfo(true)} className="text-xs text-muted-foreground hover:underline">Skip</button>
              </div>
            )}

            {step === "platform" && (
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <QuickReply key={p} onClick={() => pickPlatform(p)} accent={accent}>{p}</QuickReply>
                ))}
              </div>
            )}

            {step === "urgency" && (
              <div className="flex flex-col gap-2">
                {URGENCY_OPTIONS.map((o) => (
                  <QuickReply key={o.value} onClick={() => pickUrgency(o.value)} accent={accent} block>{o.label}</QuickReply>
                ))}
              </div>
            )}

            {step === "images" && (
              <div className="space-y-2">
                {data.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.image_urls.map((url) => (
                      <img key={url} src={url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-dashed cursor-pointer text-sm text-muted-foreground hover:bg-muted transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Attach
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  <Button size="sm" onClick={finishImages} style={{ background: accent }} className="text-white">
                    {data.image_urls.length ? "Next" : "Skip"}
                  </Button>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  <p><b>Issue:</b> {data.description}</p>
                  {data.client_name && <p><b>Client:</b> {data.client_name}</p>}
                  {data.booking_info && <p><b>Booking:</b> {data.booking_info}</p>}
                  <p><b>Where:</b> {data.platform || "—"}</p>
                  <p><b>Urgency:</b> {data.urgency}</p>
                  {data.image_urls.length > 0 && <p><b>Attachments:</b> {data.image_urls.length}</p>}
                </div>
                <Button onClick={submitReport} className="w-full gap-2 text-white" style={{ background: accent }}>
                  <Send className="w-4 h-4" /> Send Report
                </Button>
              </div>
            )}

            {step === "done" && (
              <Button onClick={handleClose} variant="outline" className="w-full gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> Done
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ComposerRow({ value, onChange, onSend, accent, placeholder }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-center gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoFocus />
      <Button type="submit" size="icon" disabled={!value.trim()} style={{ background: accent }} className="text-white shrink-0">
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}

function QuickReply({ children, onClick, accent, block }) {
  return (
    <button
      onClick={onClick}
      className={`${block ? "w-full text-left" : ""} px-3 py-1.5 rounded-full text-sm font-medium border transition-colors hover:text-white`}
      style={{ borderColor: accent, color: accent }}
      onMouseEnter={(e) => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = accent; }}
    >
      {children}
    </button>
  );
}