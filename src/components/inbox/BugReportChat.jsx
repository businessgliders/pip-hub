import React, { useState, useRef, useEffect } from "react";
import { LifeBuoy, X, Send, Loader2, CheckCircle2, ImagePlus, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { findSimilarBug } from "./bugs/findSimilarBug";

const URGENCY_OPTIONS = [
  { value: "Low", label: "🟢 Low — whenever you can" },
  { value: "Soon", label: "🟡 Soon — this week" },
  { value: "High", label: "🟠 High — today" },
  { value: "Critical", label: "🔴 Critical — blocking work" },
];

const PLATFORM_OPTIONS = ["Website", "Support Portal", "Mobile", "Email", "Other"];

// Capitalize the first letter of the trimmed text (Sentence case).
const sentenceCase = (s = "") => {
  const t = String(s).trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
};

const EMPTY = {
  description: "",
  client_name: "",
  booking_info: "",
  platform: "",
  urgency: "Soon",
  image_urls: [],
  submitter_name: "",
};

/**
 * Floating live-chat style bug reporter (bottom-right). Walks the user through
 * a guided set of questions and emails the report via the sendBugReport function.
 */
export default function BugReportChat({ currentUser, accent = "#b67651", open: controlledOpen, onOpenChange, hideFloatingButton = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v) => { if (isControlled) onOpenChange?.(v); else setInternalOpen(v); };
  const [step, setStep] = useState("describe");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [clientNameInput, setClientNameInput] = useState("");
  const [bookingInput, setBookingInput] = useState("");
  const [submitterInput, setSubmitterInput] = useState("");
  const [data, setData] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  // AI-suggested platform options based on the bug description.
  const [platformOptions, setPlatformOptions] = useState(PLATFORM_OPTIONS);
  const [platformLoading, setPlatformLoading] = useState(false);
  // Duplicate-detection: a similar existing bug + the "new instance" details.
  const [matchedBug, setMatchedBug] = useState(null);
  const [dupCustomerInput, setDupCustomerInput] = useState("");
  const [dupWhenInput, setDupWhenInput] = useState("");
  const [dupCustomer, setDupCustomer] = useState("");
  const [dupWhen, setDupWhen] = useState("");
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
    setSubmitterInput("");
    setData(EMPTY);
    setPlatformOptions(PLATFORM_OPTIONS);
    setPlatformLoading(false);
    setMatchedBug(null);
    setDupCustomerInput("");
    setDupWhenInput("");
    setDupCustomer("");
    setDupWhen("");
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (step === "done") setTimeout(resetAll, 300);
  };

  const submitDescribe = async () => {
    const text = sentenceCase(input);
    if (!text) return;
    pushUser(text);
    setData((d) => ({ ...d, description: text }));
    setInput("");
    // Search existing bugs for the same underlying issue before continuing.
    setStep("searching");
    pushAssistant("Let me check if we already have this one logged…");
    const match = await findSimilarBug(text);
    if (match) {
      setMatchedBug(match);
      setStep("dupConfirm");
      setTimeout(() =>
        pushAssistant(
          `🔁 This looks like the same issue as Bug #${match.bug_number}${match.title ? ` — "${match.title}"` : ""}. ` +
          `Is this a new customer experiencing the same bug?`
        ), 250);
    } else {
      setStep("clientName");
      setTimeout(() => pushAssistant("Got it. Which client is this about? (or skip if not client-specific)"), 250);
    }
  };

  // User said this is NOT the same bug — fall through to the normal new-bug flow.
  const dupReject = () => {
    pushUser("No — it's a different issue");
    setMatchedBug(null);
    setStep("clientName");
    setTimeout(() => pushAssistant("No problem — let's log it as new. Which client is this about? (or skip)"), 200);
  };

  // User confirmed it's the same bug, new customer.
  const dupConfirm = () => {
    pushUser("Yes — same bug, new customer");
    setStep("dupCustomer");
    setTimeout(() => pushAssistant("Which customer is experiencing it this time? (or skip)"), 200);
  };

  const submitDupCustomer = (skip = false) => {
    const name = sentenceCase(dupCustomerInput);
    pushUser(skip || !name ? "Skip" : name);
    setDupCustomer(skip ? "" : name);
    setDupCustomerInput("");
    setStep("dupWhen");
    setTimeout(() => pushAssistant("What date & time did it happen? (or skip)"), 200);
  };

  const submitDupWhen = (skip = false) => {
    const when = sentenceCase(dupWhenInput);
    pushUser(skip || !when ? "Skip" : when);
    setDupWhen(skip ? "" : when);
    setDupWhenInput("");
    setStep("dupReview");
    setTimeout(() => pushAssistant("Ready to add this new instance to the existing bug?"), 200);
  };

  // Post the new instance as a threaded reply on the existing bug (Gmail Re:
  // thread via sendBugReply) AND as an outbound reply in its Thread panel.
  const submitDupUpdate = async () => {
    setStep("sending");
    setError(null);
    try {
      const reporter = data.submitter_name || currentUser?.full_name || currentUser?.email || "Staff";
      const lines = [
        `<p><strong>New instance of this bug reported.</strong></p>`,
        dupCustomer ? `<p><strong>Customer:</strong> ${dupCustomer}</p>` : "",
        dupWhen ? `<p><strong>When:</strong> ${dupWhen}</p>` : "",
        data.description ? `<p><strong>Details:</strong> ${data.description}</p>` : "",
        `<p style="color:#94a3b8;font-size:12px;">Logged by ${reporter}</p>`,
      ].filter(Boolean).join("");

      const res = await base44.functions.invoke("sendBugReply", {
        bug_report_id: matchedBug.id,
        body_html: lines,
        sender_name: reporter,
      });
      if (!res?.data?.success) throw new Error(res?.data?.error || "Failed to update bug");

      // Also drop a reply into the matching bug's Thread panel (if one exists).
      try {
        const threads = await base44.entities.Thread.filter({ ticket_type: "bug" }, "-last_activity_at", 200);
        const thread = threads.find((t) => t.form_data?.bug_number === matchedBug.bug_number);
        if (thread) {
          await base44.entities.EmailMessage.create({
            ticket_id: thread.id,
            direction: "outbound",
            subject: `New instance — Bug #${matchedBug.bug_number}`,
            body_html: lines,
            from_name: reporter,
            sent_by: reporter,
            sent_at: new Date().toISOString(),
            send_status: "sent",
          });
          await base44.entities.Thread.update(thread.id, {
            last_activity_at: new Date().toISOString(),
            snippet: `New instance${dupCustomer ? ` — ${dupCustomer}` : ""}`,
            has_outbound_reply: true,
          }).catch(() => {});
        }
      } catch { /* thread update is best-effort */ }

      pushAssistant(`✅ Added to Bug #${matchedBug.bug_number}. Thanks — we've flagged the new instance.`);
      setStep("done");
    } catch (err) {
      setError(err.message);
      setStep("dupReview");
    }
  };

  const submitClientName = (skip = false) => {
    const name = sentenceCase(clientNameInput);
    pushUser(skip || !name ? "Skip" : name);
    setData((d) => ({ ...d, client_name: skip ? "" : name }));
    setClientNameInput("");
    setStep("bookingInfo");
    setTimeout(() => pushAssistant("Is there a specific booking date & time of concern? (or skip)"), 200);
  };

  // Ask the AI for the most relevant "where is this happening" options given the
  // bug description. Falls back to the static list on any error.
  const fetchPlatformOptions = async (description) => {
    setPlatformLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `A staff member reported this bug: "${description}". Suggest 3-5 short options (1-3 words each) for WHERE this issue is happening — the specific screen, feature, or area of the system involved. Return concise, distinct labels in Sentence case.`,
        response_json_schema: {
          type: "object",
          properties: { options: { type: "array", items: { type: "string" } } },
        },
      });
      const opts = (res?.options || []).map(sentenceCase).filter(Boolean);
      setPlatformOptions(opts.length ? [...opts, "Other"] : PLATFORM_OPTIONS);
    } catch {
      setPlatformOptions(PLATFORM_OPTIONS);
    }
    setPlatformLoading(false);
  };

  const submitBookingInfo = (skip = false) => {
    const info = sentenceCase(bookingInput);
    pushUser(skip || !info ? "Skip" : info);
    setData((d) => ({ ...d, booking_info: skip ? "" : info }));
    setBookingInput("");
    setStep("platform");
    fetchPlatformOptions(data.description);
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
    setStep("submitter");
    setTimeout(() => pushAssistant("Last thing — who is submitting this bug? (your name)"), 200);
  };

  const submitSubmitter = () => {
    const name = sentenceCase(submitterInput);
    if (!name) return;
    pushUser(name);
    setData((d) => ({ ...d, submitter_name: name }));
    setSubmitterInput("");
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
        rep_name: data.submitter_name || currentUser?.full_name,
      });
      if (res?.data?.success) {
        // Also surface the bug as a thread in the Support inbox (status: "bug").
        const reporterEmail = currentUser?.email || "bug-reporter@pilatesinpinkstudio.com";
        const reporterName = data.submitter_name || currentUser?.full_name || "Bug Reporter";
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

      {/* Backdrop blur while open */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={handleClose} />
      )}

      {/* Chat window */}
      {open && (
        <div className={`fixed bottom-20 lg:bottom-5 right-3 lg:right-5 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 animate-chat-in origin-bottom ${expanded ? "w-[min(94vw,640px)] lg:w-[760px] h-[min(88vh,1000px)] lg:h-[min(90vh,1120px)]" : "w-[min(80vw,320px)] lg:w-[380px] h-[min(62vh,500px)] lg:h-[min(80vh,560px)]"}`}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2.5 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
            <LifeBuoy className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Report an Issue</p>
              <p className="text-[11px] opacity-80 leading-tight">We'll escalate it for you</p>
            </div>
            <button
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? "Shrink" : "Expand (XL)"}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
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
            {(step === "sending" || step === "searching") && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> {step === "searching" ? "Checking existing bugs…" : "Sending…"}
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

            {step === "dupConfirm" && (
              <div className="flex flex-col gap-2">
                <QuickReply onClick={dupConfirm} accent={accent} block>✅ Yes — same bug, new customer</QuickReply>
                <QuickReply onClick={dupReject} accent={accent} block>🆕 No — it's a different issue</QuickReply>
              </div>
            )}

            {step === "dupCustomer" && (
              <div className="space-y-2">
                <ComposerRow value={dupCustomerInput} onChange={setDupCustomerInput} onSend={() => submitDupCustomer(false)} accent={accent} placeholder="Customer name…" />
                <button onClick={() => submitDupCustomer(true)} className="text-xs text-muted-foreground hover:underline">Skip</button>
              </div>
            )}

            {step === "dupWhen" && (
              <div className="space-y-2">
                <ComposerRow value={dupWhenInput} onChange={setDupWhenInput} onSend={() => submitDupWhen(false)} accent={accent} placeholder="Date & time…" />
                <button onClick={() => submitDupWhen(true)} className="text-xs text-muted-foreground hover:underline">Skip</button>
              </div>
            )}

            {step === "dupReview" && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  <p><b>Existing:</b> Bug #{matchedBug?.bug_number}{matchedBug?.title ? ` — ${matchedBug.title}` : ""}</p>
                  {dupCustomer && <p><b>New customer:</b> {dupCustomer}</p>}
                  {dupWhen && <p><b>When:</b> {dupWhen}</p>}
                </div>
                <Button onClick={submitDupUpdate} className="w-full gap-2 text-white" style={{ background: accent }}>
                  <RefreshCw className="w-4 h-4" /> Update existing bug
                </Button>
              </div>
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
              platformLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking of relevant options…
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map((p) => (
                    <QuickReply key={p} onClick={() => pickPlatform(p)} accent={accent}>{p}</QuickReply>
                  ))}
                </div>
              )
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

            {step === "submitter" && (
              <ComposerRow value={submitterInput} onChange={setSubmitterInput} onSend={submitSubmitter} accent={accent} placeholder="Your name…" />
            )}

            {step === "review" && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto">
                  <p><b>Issue:</b> {data.description}</p>
                  {data.submitter_name && <p><b>Submitted by:</b> {data.submitter_name}</p>}
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
  // Desktop only: auto-focus so the text box is active on open. On mobile the
  // user taps first (avoids the iOS keyboard popping open + auto-zoom).
  const inputRef = useRef(null);
  useEffect(() => {
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) setTimeout(() => inputRef.current?.focus(), 100);
  }, []);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="flex items-center gap-2">
      <Input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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