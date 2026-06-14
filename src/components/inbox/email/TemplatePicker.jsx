import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export function fillTemplate(text, vars) {
  if (!text) return '';
  let out = text;
  for (const [k, v] of Object.entries(vars || {})) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), v ?? '');
  }
  return out;
}

export default function TemplatePicker({ thread, currentUser, onSelect }) {
  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-created_date', 100),
  });

  const active = templates.filter((t) => t.is_active !== false);

  const fd = thread.form_data || {};
  const vars = {
    client_name: thread.contact_name || '',
    client_first_name: (thread.contact_name || '').split(' ')[0] || '',
    client_email: thread.contact_email || '',
    client_phone: fd.phone || '',
    inquiry_type: fd.inquiry_type || fd.event_type || '',
    ticket_id: `#${thread.ticket_number || thread.id.slice(-8)}`,
    staff_name: currentUser?.full_name || '',
    staff_first_name: (currentUser?.full_name || '').split(' ')[0] || '',
    staff_email: currentUser?.email || '',
    name: thread.contact_name || '',
    email: thread.contact_email || '',
    event_type: fd.event_type || '',
    event_date: fd.event_date || '',
    status: thread.status || '',
  };

  const groups = active.reduce((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const handleSelect = (t) => {
    onSelect({
      subject: fillTemplate(t.subject, vars),
      body_html: fillTemplate(t.body_html || t.body || '', vars),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all bg-white/70 dark:bg-white/10 border border-pink-200/60 dark:border-white/15 text-pink-700 dark:text-white/80 hover:bg-white">
          <FileText className="w-3.5 h-3.5" /> Templates <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        {active.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center text-muted-foreground">
            No templates yet. Create them in Settings.
          </div>
        ) : (
          Object.entries(groups).map(([cat, list], idx) => (
            <div key={cat}>
              {idx > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs uppercase tracking-wide text-pink-400">{cat}</DropdownMenuLabel>
              {list.map((t) => (
                <DropdownMenuItem key={t.id} onClick={() => handleSelect(t)} className="cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs truncate text-muted-foreground">{t.subject}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}