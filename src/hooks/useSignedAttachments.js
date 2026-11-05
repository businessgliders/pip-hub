import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Resolves each attachment to a viewable `href`: public `url` as-is, private
// `file_uri` via a short-lived signed URL.
export default function useSignedAttachments(attachments) {
  const [resolved, setResolved] = useState([]);

  useEffect(() => {
    const list = attachments || [];
    let cancelled = false;
    Promise.all(
      list.map(async (a) => {
        if (a.url) return { ...a, href: a.url };
        if (!a.file_uri) return { ...a, href: "" };
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: a.file_uri, expires_in: 3600 });
        return { ...a, href: signed_url };
      })
    ).then((r) => { if (!cancelled) setResolved(r); });
    return () => { cancelled = true; };
  }, [attachments]);

  return resolved;
}