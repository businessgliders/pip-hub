import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * gmailInboundCapture — connector webhook handler for the 'gmail' mailbox event.
 *
 * Called by the Base44 platform (NOT Google directly) when new mail arrives.
 * For each new message it:
 *   1. Fetches full content from the Gmail API
 *   2. Matches it to an existing Thread (by gmail_thread_id, then by [Ticket #N]
 *      in the subject, then by sender email)
 *   3. Records an inbound EmailMessage (idempotent on gmail_message_id)
 *   4. Bumps the thread's last_activity_at / snippet and marks it unread
 *
 * NOTE: Do NOT add custom auth — the platform authenticates this call.
 */

function getHeader(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function parseEmail(raw) {
  // "Jane Doe <jane@x.com>" -> { name, email }
  const m = (raw || '').match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: '', email: (raw || '').trim().toLowerCase() };
}

function decodeBase64Url(data) {
  if (!data) return '';
  const norm = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return decodeURIComponent(escape(atob(norm)));
  } catch (_) {
    try { return atob(norm); } catch (_) { return ''; }
  }
}

// Strip the trailing "Kenko AI / Kenko" signature block that support@gokenko.com
// appends to its replies. Handles both plain-text and HTML bodies.
function stripKenkoSignature(str = '', isHtml = false) {
  if (!str) return str;
  if (isHtml) {
    // Remove "Kenko AI" / "Kenko" sitting in their own block(s), tolerating tags/breaks between/around them.
    return str.replace(/(?:<[^>]+>|\s|&nbsp;)*Kenko\s*AI(?:<[^>]+>|\s|&nbsp;)*Kenko(?:<[^>]+>|\s|&nbsp;)*$/i, '').trimEnd();
  }
  return str.replace(/\s*Kenko\s*AI\s*[\r\n]+\s*Kenko\s*$/i, '').trimEnd();
}

function extractBodies(payload) {
  let html = '';
  let text = '';
  const walk = (part) => {
    if (!part) return;
    const mime = part.mimeType || '';
    if (mime === 'text/html' && part.body?.data) html += decodeBase64Url(part.body.data);
    else if (mime === 'text/plain' && part.body?.data) text += decodeBase64Url(part.body.data);
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  };
  walk(payload);
  return { html, text };
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;

    const messageIds = body?.data?.new_message_ids ?? [];
    if (!messageIds.length) {
      return Response.json({ success: true, processed: 0, note: 'no new messages' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    let processed = 0;
    const results = [];

    for (const messageId of messageIds) {
      // Idempotency: skip if we already stored this gmail_message_id
      const existing = await db.EmailMessage.filter({ gmail_message_id: messageId }, '-created_date', 1);
      if (existing.length) { results.push({ messageId, skipped: 'duplicate' }); continue; }

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        { headers: authHeader }
      );
      if (!res.ok) { results.push({ messageId, skipped: 'fetch_failed' }); continue; }
      const msg = await res.json();

      const headers = msg.payload?.headers || [];
      const labelIds = msg.labelIds || [];
      // Only ingest inbound mail (skip our own sent copies)
      if (labelIds.includes('SENT')) { results.push({ messageId, skipped: 'sent_copy' }); continue; }

      const from = parseEmail(getHeader(headers, 'From'));
      // Safety net: if a message is from one of our own outbound aliases, it's an
      // outbound reply (not a customer message) and must be recorded as such even
      // if it lacks the SENT label.
      const OUR_ALIASES = ['support@pilatesinpinkstudio.com', 'events@pilatesinpinkstudio.com', 'influencer@pilatesinpinkstudio.com'];
      const direction = OUR_ALIASES.includes(from.email) ? 'outbound' : 'inbound';
      const subject = getHeader(headers, 'Subject');
      const rfcMessageId = getHeader(headers, 'Message-ID');
      const inReplyTo = getHeader(headers, 'In-Reply-To');
      const references = getHeader(headers, 'References');
      const { html, text } = extractBodies(msg.payload);
      const snippet = (msg.snippet || text || html.replace(/<[^>]+>/g, '')).slice(0, 200);
      const gmailThreadId = msg.threadId || '';

      // --- Match to a thread ---
      // We only attach inbound mail when we can confidently tie it to a thread:
      //   1) exact Gmail thread id (a genuine reply within the same conversation)
      //   2) an explicit [Ticket #N] or [Request #N] tag in the subject.
      // The old "match by sender email" fallback was removed — it caused brand-new
      // submissions to absorb unrelated mail from the same person (e.g. an old
      // events email getting mapped onto a fresh support ticket).
      let thread = null;
      // 1) by gmail_thread_id
      if (gmailThreadId) {
        const byGtid = await db.Thread.filter({ gmail_thread_id: gmailThreadId }, '-last_activity_at', 1);
        if (byGtid.length) thread = byGtid[0];
      }
      // 2) by [Ticket #N] / [Request #N] tag in subject
      if (!thread) {
        const tag = subject.match(/\[(?:Ticket|Request)\s*#(\d+)\]/i);
        if (tag) {
          const byTicket = await db.Thread.filter({ ticket_number: Number(tag[1]) }, '-last_activity_at', 1);
          if (byTicket.length) thread = byTicket[0];
        }
      }

      // --- Bug escalation replies ---
      // Bug escalation emails live in their own Gmail thread. Match inbound mail
      // to a BugReport by gmail_thread_id, then by a [Bug #N] tag in the subject,
      // and append it to the report's replies array.
      if (!thread) {
        let bug = null;
        if (gmailThreadId) {
          const byGtid = await db.BugReport.filter({ gmail_thread_id: gmailThreadId }, '-created_date', 1);
          if (byGtid.length) bug = byGtid[0];
        }
        if (!bug) {
          const bugTag = subject.match(/\[Bug\s*#(\d+)\]/i);
          if (bugTag) {
            const byNum = await db.BugReport.filter({ bug_number: Number(bugTag[1]) }, '-created_date', 1);
            if (byNum.length) bug = byNum[0];
          }
        }
        if (bug) {
          const nowIso = new Date().toISOString();
          // Strip the "Kenko AI / Kenko" signature from gokenko support replies.
          const isKenko = from.email === 'support@gokenko.com';
          const replyHtml = isKenko ? stripKenkoSignature(html, true) : html;
          const replyText = isKenko ? stripKenkoSignature(text, false) : text;
          const replySnippet = isKenko ? stripKenkoSignature(snippet, false) : snippet;
          const reply = {
            direction,
            from_email: from.email,
            from_name: from.name,
            subject,
            body_html: replyHtml,
            body_text: replyText,
            snippet: replySnippet,
            rfc_message_id: rfcMessageId,
            gmail_message_id: messageId,
            in_reply_to: inReplyTo,
            references,
            sent_at: nowIso,
          };
          await db.BugReport.update(bug.id, {
            replies: [...(bug.replies || []), reply],
            gmail_thread_id: bug.gmail_thread_id || gmailThreadId,
            // An inbound reply means the conversation is active — move it out of
            // "New" into "In Progress" (don't touch Resolved/Closed).
            ...(direction === 'inbound' && (bug.status || 'New') === 'New' ? { status: 'In Progress' } : {}),
          });

          // Notify staff of inbound bug-escalation replies so they appear in the
          // notification bell (fan out to all admins — bug reports have no assignee).
          if (direction === 'inbound') {
            try {
              const bugTag = bug.bug_number != null ? `B${Math.round(bug.bug_number)} ` : '';
              const admins = await db.User.filter({ role: 'admin' });
              const recipients = admins.map((u) => u.email).filter(Boolean);
              await Promise.all(
                recipients.map((rEmail) => db.Notification.create({
                  type: 'bug',
                  title: `New reply on ${bugTag}${bug.title || 'bug report'}`.trim(),
                  body: `${from.name || from.email}: ${snippet}`.slice(0, 160),
                  source_app: 'support',
                  thread_id: bug.id,
                  is_read: false,
                  recipient_email: rEmail,
                }))
              );
            } catch (_) { /* non-fatal */ }
          }

          processed++;
          results.push({ messageId, bug_id: bug.id });
          continue;
        }
      }

      if (!thread) { results.push({ messageId, skipped: 'no_matching_thread', from: from.email }); continue; }

      const nowIso = new Date().toISOString();
      await db.EmailMessage.create({
        ticket_id: thread.id,
        gmail_thread_id: gmailThreadId,
        gmail_message_id: messageId,
        rfc_message_id: rfcMessageId,
        in_reply_to: inReplyTo,
        references,
        direction,
        from_email: from.email,
        from_name: from.name,
        to_email: thread.contact_email,
        subject,
        body_html: html,
        body_text: text,
        snippet,
        sent_at: nowIso,
        send_status: direction === 'outbound' ? 'sent' : 'received',
      });

      await db.Thread.update(thread.id, {
        last_activity_at: nowIso,
        snippet,
        // Our own outbound replies shouldn't mark the thread unread or re-open it.
        ...(direction === 'inbound' ? { is_read: false } : {}),
        gmail_thread_id: thread.gmail_thread_id || gmailThreadId,
        ...(direction === 'inbound' && (thread.status === 'resolved' || thread.status === 'closed') ? { status: 'open' } : {}),
      });

      // Notify staff of inbound replies so they appear in the notification bell.
      // Notify the assignee if one is set, otherwise fan out to all admin staff.
      if (direction === 'inbound') {
        try {
          const tag = thread.ticket_number ? `#${thread.ticket_number} ` : '';
          const notif = {
            type: 'reply',
            title: `New reply from ${thread.contact_name || from.email}`,
            body: `${tag}${snippet}`.slice(0, 160),
            thread_id: thread.id,
            source_app: thread.source_app,
            is_read: false,
          };
          let recipients = [];
          if (thread.assignee_email) {
            recipients = [thread.assignee_email];
          } else {
            const admins = await db.User.filter({ role: 'admin' });
            recipients = admins.map((u) => u.email).filter(Boolean);
          }
          await Promise.all(
            recipients.map((rEmail) => db.Notification.create({ ...notif, recipient_email: rEmail }))
          );
        } catch (_) { /* non-fatal */ }
      }

      processed++;
      results.push({ messageId, thread_id: thread.id });
    }

    return Response.json({ success: true, processed, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});