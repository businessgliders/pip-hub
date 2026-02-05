import React from 'react';
import { Trash2, Edit, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPanel({ apps, sections, onDeleteApp, onClose }) {
  const getSection = (sectionId) => sections.find(s => s.id === sectionId);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/20 backdrop-blur-sm p-6">
      <div className="max-w-4xl mx-auto mt-20 mb-20">
        <div className="rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">Manage Apps</h2>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Close Admin
            </Button>
          </div>

          <div className="space-y-3">
            {apps.map((app) => (
              <div
                key={app.id}
                className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-md bg-white/60 border border-white/80 hover:bg-white/80 transition-colors group"
              >
                <GripVertical className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f1889b]/20 to-[#f7b1bd]/20 border border-[#f1889b]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={app.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-gradient-to-br from-[#f1889b] to-[#f7b1bd]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{app.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{app.url}</p>
                  <p className="text-xs text-[#f1889b] mt-0.5">{getSection(app.section_id)?.name}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-red-50"
                    onClick={() => onDeleteApp(app.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}