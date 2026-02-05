import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddAppModal({ sections, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    section_id: '',
    icon_url: '',
    is_new: false,
    open_in_new_tab: false
  });
  const [isFetchingIcon, setIsFetchingIcon] = useState(false);

  const autoFetchFavicon = async (url) => {
    if (!url) return;
    setIsFetchingIcon(true);
    try {
      const domain = new URL(url).origin;
      const faviconUrl = `${domain}/favicon.ico`;
      setFormData(prev => ({ ...prev, icon_url: faviconUrl }));
    } catch (e) {
      console.error('Invalid URL');
    }
    setIsFetchingIcon(false);
  };

  const handleUrlBlur = () => {
    if (formData.url && !formData.icon_url) {
      autoFetchFavicon(formData.url);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.url || !formData.section_id) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl backdrop-blur-xl bg-white/90 border border-white/60 shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Add New App</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-medium">App Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="PiP Partner"
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
              onBlur={handleUrlBlur}
              placeholder="https://partner.pilatesinpinkstudio.com"
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
              placeholder="Partner portal for managing studio partnerships"
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
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="icon_url" className="text-gray-700 font-medium flex items-center gap-2">
              Icon URL
              {isFetchingIcon && <Loader2 className="w-3 h-3 animate-spin text-[#f1889b]" />}
            </Label>
            <Input
              id="icon_url"
              value={formData.icon_url}
              onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
              placeholder="Auto-fetched from URL"
              className="mt-1.5 bg-white/60 border-gray-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_new" className="text-gray-700 font-medium">Show "New" Badge</Label>
            <Switch
              id="is_new"
              checked={formData.is_new}
              onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="open_in_new_tab" className="text-gray-700 font-medium">Open in New Tab</Label>
            <Switch
              id="open_in_new_tab"
              checked={formData.open_in_new_tab}
              onCheckedChange={(checked) => setFormData({ ...formData, open_in_new_tab: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] hover:from-[#f1889b]/90 hover:to-[#f7b1bd]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add App
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}