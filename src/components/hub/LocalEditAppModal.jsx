import React, { useState } from 'react';
import { X, Save, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';

/**
 * Inline edit-app modal used inside CustomizePanel.
 * Unlike EditAppModal it does NOT persist immediately — it calls `onStage`
 * with the partial diff so the parent can batch the change behind Save Changes.
 */
export default function LocalEditAppModal({ app, sections, onClose, onStage }) {
  useBodyScrollLock(true);
  const [formData, setFormData] = useState({
    name: app.name,
    url: app.url,
    description: app.description || '',
    section_id: app.section_id,
    icon_url: app.icon_url || '',
    is_new: app.is_new || false,
    open_in_new_tab: app.open_in_new_tab || false,
    is_global: app.is_global || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.section_id) return;
    // Stage the change (parent will persist on Save Changes)
    onStage(app.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/30 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-md rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-4 md:p-8 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Edit App</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 italic">
          Changes are saved when you click "Save Changes" on the main panel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">App Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1.5 bg-white/60 border-gray-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="url" className="text-gray-700 font-medium">URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="mt-1.5 bg-white/60 border-gray-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5 bg-white/60 border-gray-200 h-20"
            />
          </div>

          <div>
            <Label htmlFor="section" className="text-gray-700 font-medium">Section</Label>
            <Select
              value={formData.section_id}
              onValueChange={(value) => setFormData({ ...formData, section_id: value })}
              required
            >
              <SelectTrigger className="mt-1.5 bg-white/60 border-gray-200">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}{section.id.startsWith('__new_') ? ' (new)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="icon_url" className="text-gray-700 font-medium">Icon URL</Label>
            <Input
              id="icon_url"
              value={formData.icon_url}
              onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              className="mt-1.5 bg-white/60 border-gray-200"
            />
          </div>

          <div>
            <Label className="text-gray-700 font-medium mb-2 block">Options</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_new: !formData.is_new })}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.is_new ? 'border-[#f1889b] bg-[#f1889b]/10' : 'border-gray-200 bg-white/60 hover:border-gray-300'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${formData.is_new ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-700 text-center">New Badge</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, open_in_new_tab: !formData.open_in_new_tab })}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.open_in_new_tab ? 'border-[#f1889b] bg-[#f1889b]/10' : 'border-gray-200 bg-white/60 hover:border-gray-300'
                }`}
              >
                <ExternalLink className={`w-5 h-5 ${formData.open_in_new_tab ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-700 text-center">New Tab</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_global: !formData.is_global })}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.is_global ? 'border-[#f1889b] bg-[#f1889b]/10' : 'border-gray-200 bg-white/60 hover:border-gray-300'
                }`}
              >
                <Globe className={`w-5 h-5 ${formData.is_global ? 'text-[#f1889b]' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-700 text-center">Global</span>
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}