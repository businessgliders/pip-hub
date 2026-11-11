// Central place for studio-wide configuration values that used to be hardcoded.
// Update these in one spot instead of scattered across components.

// The primary owner account email. Used for owner-only UI, "Front Desk" display,
// and filtering owner-created apps/sections in the Hub.
export const OWNER_EMAIL = 'info@pilatesinpinkstudio.com';

// Exec users who get a "Report" button on the hub home that opens /end-of-day
// (they don't submit shifts like the front desk, but can view/report on them).
export const REPORT_VIEWER_EMAILS = [
  'sahil@pilatesinpinkstudio.com',
  'gurpreen@pilatesinpinkstudio.com',
  'rashmeen@pilatesinpinkstudio.com',
];

// ── Permission switches ──────────────────────────────────────────────────────
// Each User can carry `permissions`: a list of the keys below. Admins set them
// in the PiP Hub Mac app (Permissions panel). A user whose `permissions` was
// never set keeps the defaults below, which match the old hard-coded lists.
export const PERMISSIONS = {
  VIEW_REPORTS: 'view_reports',             // Report button + /end-of-day
  SUBMIT_END_OF_DAY: 'submit_end_of_day',   // pink End of Day button + shift form
  ESCALATION_CONTACT: 'escalation_contact', // "Escalated to" (not "Assigned to") in the Inbox
};

const EXEC_EMAILS = REPORT_VIEWER_EMAILS;

export function defaultPermissions(email = '') {
  const e = String(email).trim().toLowerCase();
  if (e === OWNER_EMAIL) return [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.SUBMIT_END_OF_DAY];
  if (EXEC_EMAILS.includes(e)) return [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.ESCALATION_CONTACT];
  return [];
}

// `person` is a user or staff record with `email` and (optionally) `permissions`.
export function hasPermission(person, key) {
  if (!person) return false;
  const saved = Array.isArray(person.permissions) ? person.permissions : null;
  return (saved ?? defaultPermissions(person.email)).includes(key);
}