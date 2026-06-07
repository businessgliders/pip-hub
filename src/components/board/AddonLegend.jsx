import { GlassWater, PartyPopper, Camera, Music, Layers } from 'lucide-react';

const ADDONS = [
  { name: 'Sparkling Water & Snacks', Icon: GlassWater, color: '#3b82f6' },
  { name: 'Studio Décor Package',     Icon: PartyPopper, color: '#e86c84' },
  { name: 'Photography Add-On',       Icon: Camera, color: '#7c3aed' },
  { name: 'Custom Playlist',          Icon: Music, color: '#10b981' },
  { name: 'Extra Mats & Towels',      Icon: Layers, color: '#f59e0b' },
];

export default function AddonLegend() {
  return (
    <div className="mt-10 mb-2 mx-auto w-fit max-w-full backdrop-blur-md bg-white/40 border border-white/40 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7a4a3a' }}>
        Add-ons
      </span>
      {ADDONS.map(({ name, Icon, color }) => (
        <div key={name} className="flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${color}1f`, border: `1px solid ${color}55` }}
          >
            <Icon className="w-2.5 h-2.5" style={{ color }} />
          </span>
          <span className="text-xs" style={{ color: '#5a3535' }}>{name}</span>
        </div>
      ))}
    </div>
  );
}