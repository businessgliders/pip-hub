import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  X, ChevronLeft, ChevronRight, Check, Loader2,
  Phone, Mail, Users, Star, Share2, Package, FileText, PenLine, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import LineItemsInput from './LineItemsInput';

const LOCATIONS = ['Brampton / HQ', 'Downtown', 'North York', 'Mississauga'];

const STEPS = [
  { id: 'datetime', label: 'Shift', icon: Calendar },
  { id: 'communication', label: 'Communication', icon: Phone },
  { id: 'social', label: 'Social Media', icon: Share2 },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'sign', label: 'Sign Off', icon: PenLine },
];

const initial = {
  shift_date: new Date().toISOString().slice(0, 10),
  shift_time: new Date().toTimeString().slice(0, 5),
  location: 'Brampton / HQ',
  calls_handled: '',
  total_emails: '',
  total_walk_ins: '',
  leads_converted: '',
  conversion_notes: '',
  reviews_solicited: '',
  posted_social_media: false,
  content_planned: '',
  low_inventory_items: '',
  low_inventory_none: false,
  incidents_list: [],
  feedback_list: [],
  general_notes: '',
  signature: '',
  admin_name: '',
};

export default function EndShiftModal({ onClose, defaultSignature = '', onViewReports }) {
  useBodyScrollLock(true);
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ ...initial, signature: defaultSignature });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key, value) => setData(prev => {
    const next = { ...prev, [key]: value };
    // Front Desk Admin Name drives the Signature field in real time
    if (key === 'admin_name') next.signature = value;
    return next;
  });
  const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v));
  const hasNum = (v) => v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));

  const isStepValid = useMemo(() => {
    switch (STEPS[step].id) {
      case 'datetime':
        return !!data.shift_date && !!data.shift_time && data.location.trim().length > 0;
      case 'communication':
        return hasNum(data.calls_handled) && hasNum(data.total_emails) &&
          hasNum(data.total_walk_ins) && hasNum(data.leads_converted) &&
          hasNum(data.reviews_solicited);
      case 'social':
        return data.content_planned.trim().length > 0;
      case 'inventory':
        return data.low_inventory_none || data.low_inventory_items.trim().length > 0;
      case 'notes':
        return data.general_notes.trim().length > 0;
      case 'sign':
        return data.signature.trim().length > 1 && data.admin_name.trim().length > 1;
      default: return true;
    }
  }, [step, data]);

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        calls_handled: num(data.calls_handled),
        total_emails: num(data.total_emails),
        total_walk_ins: num(data.total_walk_ins),
        leads_converted: num(data.leads_converted),
        reviews_solicited: num(data.reviews_solicited),
      };
      await base44.entities.ShiftReport.create(payload);
      // Fire-and-await email; don't block UI if it fails
      try {
        await base44.functions.invoke('sendEndOfDayReport', { report: payload });
      } catch (e) {
        console.error('Email send failed', e);
      }
      setSubmitted(true);
      setTimeout(() => onClose(), 1800);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => setData({ ...initial, signature: defaultSignature });

  const progress = ((step + 1) / STEPS.length) * 100;
  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-5 pt-5 pb-3 border-b border-gray-100 bg-gradient-to-br from-[#fbe0e2] to-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f1889b] to-[#f7b1bd] flex items-center justify-center text-white shadow-sm">
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 leading-tight">End of Day</h2>
                <p className="text-xs text-gray-500">{STEPS[step].label} · Step {step + 1} of {STEPS.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onViewReports && (
                <button
                  onClick={onViewReports}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white text-gray-600 hover:text-[#f1889b] font-medium border border-gray-200"
                  title="View past reports"
                >
                  View reports
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[step].id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {STEPS[step].id === 'datetime' && (
                <>
                  <Field label="Date" required>
                    <Input
                      type="date"
                      value={data.shift_date}
                      onChange={(e) => update('shift_date', e.target.value)}
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                  <Field label="Time" required>
                    <Input
                      type="time"
                      value={data.shift_time}
                      onChange={(e) => update('shift_time', e.target.value)}
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                  <Field label="Location" required hint="Defaults to Brampton / HQ.">
                    <Select value={data.location} onValueChange={(value) => update('location', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}

              {STEPS[step].id === 'communication' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatField icon={Phone} label="Calls handled" required value={data.calls_handled} onChange={(v) => update('calls_handled', v)} />
                    <StatField icon={Mail} label="Total emails" required value={data.total_emails} onChange={(v) => update('total_emails', v)} />
                    <StatField icon={Users} label="Walk-ins" required value={data.total_walk_ins} onChange={(v) => update('total_walk_ins', v)} />
                    <StatField icon={Check} label="Leads converted" required value={data.leads_converted} onChange={(v) => update('leads_converted', v)} />
                  </div>
                  <Field label="Reasons why a lead did not want to convert" hint="Type NA if you had no walk-ins/calls.">
                    <Textarea
                      value={data.conversion_notes}
                      onChange={(e) => update('conversion_notes', e.target.value)}
                      placeholder="e.g. Price hesitation, schedule conflict, NA"
                      className="min-h-[80px]"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                  <StatField icon={Star} label="Reviews solicited" required value={data.reviews_solicited} onChange={(v) => update('reviews_solicited', v)} fullWidth />
                </>
              )}

              {STEPS[step].id === 'social' && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">Posted on social media today?</div>
                      <div className="text-xs text-gray-500 mt-0.5">Stories, reels, or posts</div>
                    </div>
                    <Switch
                      checked={data.posted_social_media}
                      onCheckedChange={(v) => update('posted_social_media', v)}
                    />
                  </div>
                  <Field label="How much content has been planned?" required>
                    <Textarea
                      value={data.content_planned}
                      onChange={(e) => update('content_planned', e.target.value)}
                      placeholder="e.g. 5 reels for next week, 3 stories drafted"
                      className="min-h-[100px]"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                </>
              )}

              {STEPS[step].id === 'inventory' && (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">No low inventory items</div>
                      <div className="text-xs text-gray-500 mt-0.5">Everything is in stock</div>
                    </div>
                    <Switch
                      checked={data.low_inventory_none}
                      onCheckedChange={(v) => {
                        update('low_inventory_none', v);
                        if (v) update('low_inventory_items', '');
                      }}
                    />
                  </div>
                  {!data.low_inventory_none && (
                    <Field
                      label="Items that won't last 3 days"
                      required
                      hint="Socks, Water, Soap, Detergent, Toilet Rolls, Garbage Bags, Paper Towels (Kitchen & Reformer), Coffee, Tea, Sugar"
                    >
                      <Textarea
                        value={data.low_inventory_items}
                        onChange={(e) => update('low_inventory_items', e.target.value)}
                        placeholder="List low-stock items here"
                        className="min-h-[140px]"
                        style={{ fontSize: '16px' }}
                      />
                    </Field>
                  )}
                </>
              )}

              {STEPS[step].id === 'notes' && (
                <>
                  <Field label="Any incidents to report?" hint="Add each incident as its own line item.">
                    <LineItemsInput
                      items={data.incidents_list}
                      onChange={(v) => update('incidents_list', v)}
                      placeholder="Describe an incident"
                    />
                  </Field>
                  <Field label="Client feedback / improvement ideas" hint="Add each piece of feedback as its own line item.">
                    <LineItemsInput
                      items={data.feedback_list}
                      onChange={(v) => update('feedback_list', v)}
                      placeholder="Add feedback or an idea"
                    />
                  </Field>
                  <Field label="General notes about the shift" required>
                    <Textarea
                      value={data.general_notes}
                      onChange={(e) => update('general_notes', e.target.value)}
                      placeholder="Anything else worth noting"
                      className="min-h-[90px]"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                </>
              )}

              {STEPS[step].id === 'sign' && (
                <>
                  <Field label="Front Desk Admin Name" required hint="Name of the front desk admin overseeing this shift.">
                    <Input
                      value={data.admin_name}
                      onChange={(e) => update('admin_name', e.target.value)}
                      placeholder="Admin name"
                      style={{ fontSize: '16px' }}
                    />
                  </Field>
                  <Field label="Your Signature" required hint="Auto-filled from the Front Desk Admin Name above.">
                    <Input
                      value={data.signature}
                      onChange={(e) => update('signature', e.target.value)}
                      placeholder="Your full name"
                      className="font-[cursive] text-lg italic"
                      style={{ fontSize: '18px' }}
                    />
                  </Field>
                  <div className="rounded-2xl bg-gradient-to-br from-[#fbe0e2] to-white border border-[#f1889b]/20 p-4">
                    <div className="text-xs font-semibold text-[#f1889b] uppercase tracking-wide mb-2">Quick summary</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <SummaryItem label="Date" value={`${data.shift_date} ${data.shift_time}`} />
                      <SummaryItem label="Calls" value={num(data.calls_handled)} />
                      <SummaryItem label="Emails" value={num(data.total_emails)} />
                      <SummaryItem label="Walk-ins" value={num(data.total_walk_ins)} />
                      <SummaryItem label="Converted" value={num(data.leads_converted)} />
                      <SummaryItem label="Reviews" value={num(data.reviews_solicited)} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset form
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0 || submitting}
            className="rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              disabled={!isStepValid}
              className="rounded-xl bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] text-white hover:opacity-90"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid || submitting || submitted}
              className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 min-w-[140px]"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…</>
              ) : submitted ? (
                <><Check className="w-4 h-4 mr-1.5" /> Submitted!</>
              ) : (
                <>Submit Shift</>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <Label className="text-sm text-gray-700 font-medium">
        {label}{required && <span className="text-[#f1889b] ml-0.5">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">{hint}</p>}
    </div>
  );
}

function StatField({ icon: Icon, label, value, onChange, fullWidth, required }) {
  return (
    <div className={`p-3 rounded-2xl bg-gray-50 border border-gray-100 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-[#f1889b]" />
        <span className="text-xs font-medium text-gray-600">
          {label}{required && <span className="text-[#f1889b] ml-0.5">*</span>}
        </span>
      </div>
      <Input
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="bg-white text-lg font-semibold border-gray-200 h-10"
        style={{ fontSize: '16px' }}
      />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-white/60 rounded-lg px-2.5 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}