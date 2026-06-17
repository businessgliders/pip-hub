import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import BugReportChat from "@/components/inbox/BugReportChat";

// Standalone "Report a Bug" page. Opens the bug-report live chat immediately
// (as if the + button was pressed). Reached via /reportbug and the
// bugs.pilatesinpinkstudio.com domain.
export default function ReportBug() {
  const [currentUser, setCurrentUser] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div
      className="app-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8 45%, #f9a8d4)" }}
    >
      <div className="text-center px-6">
        <h1 className="text-2xl font-bold text-pink-900/90">Report a Bug</h1>
        <p className="mt-1 text-sm text-pink-700/70">We'll escalate it for you right away.</p>
      </div>

      <BugReportChat
        currentUser={currentUser}
        accent="#db2777"
        open={open}
        onOpenChange={setOpen}
        hideFloatingButton
      />
    </div>
  );
}