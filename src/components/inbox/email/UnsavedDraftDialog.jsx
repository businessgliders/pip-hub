import { FileEdit, X } from 'lucide-react';

export default function UnsavedDraftDialog({ open, onSaveAndClose, onDiscard, onCancel }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(91, 33, 50, 0.45)', backdropFilter: 'blur(6px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-neutral-900 border border-pink-200/50 dark:border-white/15"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-pink-100/60 dark:border-white/10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-gradient-to-br from-pink-200 to-rose-300">
            <FileEdit className="w-5 h-5 text-rose-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold leading-tight text-pink-900 dark:text-white">Unsaved draft</h3>
            <p className="text-sm mt-1 leading-relaxed text-pink-700/70 dark:text-white/60">
              You have unsaved changes in your reply. Would you like to save it as a draft before closing?
            </p>
          </div>
          <button onClick={onCancel} className="p-1 rounded-full hover:bg-pink-50 dark:hover:bg-white/10 transition-colors flex-shrink-0">
            <X className="w-4 h-4 text-pink-400" />
          </button>
        </div>
        <div className="px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={onDiscard}
            className="px-4 py-2 rounded-xl text-sm font-medium text-pink-700/70 dark:text-white/60 hover:bg-pink-50 dark:hover:bg-white/10 transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onSaveAndClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md"
          >
            Save draft & close
          </button>
        </div>
      </div>
    </div>
  );
}