import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp } from 'lucide-react';
import AnalyticsContent from './AnalyticsContent';
import ReportsChatPanel from './ReportsChatPanel';

// Split-view modal: Analytics (with AI summary) on the left, a live chat that
// answers questions about all end-of-day data on the right. Stacks on mobile.
export default function ReportsInsightsModal({ open, onClose, reports = [] }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <TrendingUp className="w-5 h-5 text-[#f1889b]" />
            End of Day Insights
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Left: analytics + AI summary */}
          <div className="lg:w-1/2 min-h-0 overflow-y-auto p-5">
            <AnalyticsContent reports={reports} />
          </div>

          {/* Right: live chat */}
          <div className="lg:w-1/2 min-h-0 flex flex-col p-5 bg-gradient-to-br from-[#fbe0e2]/20 to-white">
            <ReportsChatPanel reports={reports} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}