import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";

const TUTORIAL_KEY = "pip_inbox_tutorial_seen_v1";

const STEPS = [
  {
    title: "Three Inboxes in One",
    description:
      "Switch between Support, Events, and Influencer inboxes from the top bar. Each is color-coded and shows its own open count, so every team stays in their lane.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/576b34a7b_generated_image.png",
  },
  {
    title: "Status Side Panel",
    description:
      "The vertical rail on the left filters conversations by status — Open, In Progress, Waiting, Resolved, Closed — plus a quick toggle to view Archived tickets.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/8cdfb4546_generated_image.png",
  },
  {
    title: "Conversation Panel",
    description:
      "Every form submission lands here as a conversation. Search, scan previews, and click any row to open the full thread. Unread items are highlighted.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/910e47db4_generated_image.png",
  },
  {
    title: "Email Panel",
    description:
      "Read the whole email thread as chat bubbles — incoming on the left, your replies on the right. Reply right from the composer with AI assist and templates.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/48ddd0cfa_generated_image.png",
  },
  {
    title: "Detail Panel",
    description:
      "The right panel holds contact info, labels, the assignee, internal notes, and a full activity log of every status change — all in one place.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/93636e13e_generated_image.png",
  },
  {
    title: "Dark & Light Mode",
    description:
      "Tap the sun/moon toggle in the header to switch between light and dark themes. Your preference is remembered across sessions.",
    image: "https://media.base44.com/images/public/69841af9c747b033a60780f2/8fd7d5e75_generated_image.png",
  },
];

export function hasSeenInboxTutorial() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export default function InboxTutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // ignore storage errors
    }
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={finish} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-white/60 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Skip / close */}
        <button
          onClick={finish}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-zinc-500 dark:text-zinc-300 transition-colors"
          title="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Screenshot */}
        <div className="relative h-56 sm:h-64 bg-gradient-to-br from-pink-50 to-rose-100 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={current.image}
              src={current.image}
              alt={current.title}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-[11px] font-medium uppercase tracking-wide text-pink-500 dark:text-pink-400 mb-1">
            Step {step + 1} of {STEPS.length}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{current.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{current.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-pink-500" : "w-1.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={finish}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-xl gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
              <Button
                onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
                className="rounded-xl gap-1 bg-pink-500 hover:bg-pink-600 text-white"
              >
                {isLast ? (
                  <>
                    Get started <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}