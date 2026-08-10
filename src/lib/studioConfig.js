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