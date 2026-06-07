/**
 * Per-status theme classes for the spoke's MasterKanbanBoard columns.
 * Moved out of the deleted KanbanColumn so the Master component stays generic.
 */
export const COLUMN_COLOR_CLASSES = {
  // Status columns
  'New':                 'from-pink-400/20 to-pink-300/20 border-pink-300/40',
  'In Conversations':    'from-yellow-400/20 to-amber-300/20 border-amber-300/40',
  'Waiting for Payment': 'from-orange-400/20 to-amber-300/20 border-orange-300/40',
  'Confirmed':           'from-blue-400/20 to-sky-300/20 border-sky-300/40',
  'Hosted':              'from-violet-400/20 to-purple-300/20 border-purple-300/40',
  'Closed':              'from-slate-400/20 to-gray-300/20 border-gray-300/40',
  // Category columns
  'Birthday':                 'from-pink-400/20 to-rose-300/20 border-rose-300/40',
  'Bridal Shower':            'from-fuchsia-400/20 to-pink-300/20 border-pink-300/40',
  'Bachelorette Party':       'from-purple-400/20 to-fuchsia-300/20 border-fuchsia-300/40',
  'Corporate Wellness Event': 'from-indigo-400/20 to-blue-300/20 border-blue-300/40',
  'Private Class':            'from-teal-400/20 to-cyan-300/20 border-cyan-300/40',
  'Other':                    'from-slate-400/20 to-gray-300/20 border-gray-300/40',
};

export const COLUMN_HEADER_CLASSES = {
  'New':                 'bg-pink-500/30 border-pink-400/40',
  'In Conversations':    'bg-amber-500/30 border-amber-400/40',
  'Waiting for Payment': 'bg-orange-500/30 border-orange-400/40',
  'Confirmed':           'bg-sky-500/30 border-sky-400/40',
  'Hosted':              'bg-purple-500/30 border-purple-400/40',
  'Closed':              'bg-gray-500/30 border-gray-400/40',
  'Birthday':                 'bg-rose-500/30 border-rose-400/40',
  'Bridal Shower':            'bg-pink-500/30 border-pink-400/40',
  'Bachelorette Party':       'bg-fuchsia-500/30 border-fuchsia-400/40',
  'Corporate Wellness Event': 'bg-blue-500/30 border-blue-400/40',
  'Private Class':            'bg-teal-500/30 border-teal-400/40',
  'Other':                    'bg-gray-500/30 border-gray-400/40',
};

export const DEFAULT_COLOR = 'from-white/20 to-white/10 border-white/30';
export const DEFAULT_HEADER = 'bg-white/30 border-white/40';