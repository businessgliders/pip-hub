// Config for each spoke board: entity name, statuses (kanban columns),
// per-status color theme, and how to render a card. Parent owns all of this;
// the MasterKanban components stay presentation-only.

const THEME = {
  // intake
  new:         { col: "from-pink-100 to-pink-50 border-pink-200",     head: "bg-pink-200/60 border-pink-300/60" },
  // working
  in_progress: { col: "from-amber-100 to-amber-50 border-amber-200",  head: "bg-amber-200/60 border-amber-300/60" },
  contacted:   { col: "from-amber-100 to-amber-50 border-amber-200",  head: "bg-amber-200/60 border-amber-300/60" },
  reviewing:   { col: "from-amber-100 to-amber-50 border-amber-200",  head: "bg-amber-200/60 border-amber-300/60" },
  waiting:     { col: "from-blue-100 to-blue-50 border-blue-200",     head: "bg-blue-200/60 border-blue-300/60" },
  quoted:      { col: "from-blue-100 to-blue-50 border-blue-200",     head: "bg-blue-200/60 border-blue-300/60" },
  negotiating: { col: "from-blue-100 to-blue-50 border-blue-200",     head: "bg-blue-200/60 border-blue-300/60" },
  // won
  resolved:    { col: "from-green-100 to-green-50 border-green-200",  head: "bg-green-200/60 border-green-300/60" },
  booked:      { col: "from-green-100 to-green-50 border-green-200",  head: "bg-green-200/60 border-green-300/60" },
  active:      { col: "from-green-100 to-green-50 border-green-200",  head: "bg-green-200/60 border-green-300/60" },
  // lost
  lost:        { col: "from-slate-100 to-slate-50 border-slate-200",  head: "bg-slate-200/60 border-slate-300/60" },
  declined:    { col: "from-slate-100 to-slate-50 border-slate-200",  head: "bg-slate-200/60 border-slate-300/60" },
};

const LABELS = {
  new: "New", in_progress: "In Progress", waiting: "Waiting", resolved: "Resolved",
  contacted: "Contacted", quoted: "Quoted", booked: "Booked", lost: "Lost",
  reviewing: "Reviewing", negotiating: "Negotiating", active: "Active", declined: "Declined",
};

export const BOARD_CONFIGS = {
  support: {
    title: "Support",
    entityName: "SupportTicket",
    statuses: ["new", "in_progress", "waiting", "resolved"],
    closedStatuses: ["resolved"],
  },
  events: {
    title: "Events",
    entityName: "EventLead",
    statuses: ["new", "contacted", "quoted", "booked", "lost"],
    closedStatuses: ["booked", "lost"],
  },
  partner: {
    title: "Partner",
    entityName: "PartnerInquiry",
    statuses: ["new", "reviewing", "negotiating", "active", "declined"],
    closedStatuses: ["active", "declined"],
  },
};

export const getTheme = (status) =>
  THEME[status] || { col: "from-slate-100 to-slate-50 border-slate-200", head: "bg-slate-200/60" };

export const statusLabel = (status) => LABELS[status] || status;