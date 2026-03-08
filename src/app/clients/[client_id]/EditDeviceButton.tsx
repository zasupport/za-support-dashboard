'use client';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

const DEVICE_TYPES = [
  { value: 'mac_apple_silicon', label: 'Mac (Apple Silicon)' },
  { value: 'mac_intel',         label: 'Mac (Intel)' },
  { value: 'ipad',              label: 'iPad' },
  { value: 'iphone',            label: 'iPhone' },
  { value: 'router',            label: 'Router / Gateway' },
  { value: 'access_point',      label: 'Access Point' },
  { value: 'switch',            label: 'Network Switch' },
  { value: 'printer_laser',     label: 'Printer (Laser)' },
  { value: 'printer_inkjet',    label: 'Printer (Inkjet)' },
  { value: 'monitor',           label: 'Monitor' },
  { value: 'storage_ssd',       label: 'External SSD' },
  { value: 'storage_hdd',       label: 'External HDD' },
  { value: 'other',             label: 'Other' },
];

interface Device {
  id: string;
  display_name: string;
  device_type: string;
  make: string;
  model: string;
  device_serial?: string;
  purchase_date?: string;
  warranty_expires?: string;
  applecare_expires?: string;
  notes?: string;
}

interface Props {
  device: Device;
  onUpdated: (updated: Partial<Device>) => void;
}

export function EditDeviceButton({ device, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    device_type:      device.device_type,
    make:             device.make,
    model:            device.model,
    display_name:     device.display_name,
    device_serial:    device.device_serial ?? '',
    purchase_date:    device.purchase_date ?? '',
    warranty_expires: device.warranty_expires ?? '',
    applecare_expires: device.applecare_expires ?? '',
    notes:            device.notes ?? '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    if (!form.model || !form.display_name) { setError('Model and display name are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = {
        device_type:  form.device_type,
        make:         form.make || 'Apple',
        model:        form.model,
        display_name: form.display_name,
      };
      if (form.device_serial)      payload.device_serial     = form.device_serial || null;
      if (form.purchase_date)      payload.purchase_date     = form.purchase_date;
      if (form.warranty_expires)   payload.warranty_expires  = form.warranty_expires;
      if (form.applecare_expires)  payload.applecare_expires = form.applecare_expires;
      payload.notes = form.notes || null;

      const res = await fetch(`/api/lifecycle/device/${device.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const j = await res.json(); setError(j.detail || 'Save failed'); return; }
      setOpen(false);
      onUpdated({ ...payload, id: device.id } as Partial<Device>);
    } catch {
      setError('Network error — try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-slate-600 hover:text-teal-400 transition-colors"
        title="Edit device"
      >
        <Pencil size={12} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-600 rounded-lg p-5 w-full max-w-md shadow-xl mx-4">
            <h3 className="text-white font-semibold mb-4 text-sm">Edit Device</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Device type</label>
                <select value={form.device_type} onChange={set('device_type')}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs">
                  {DEVICE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Make</label>
                  <input value={form.make} onChange={set('make')}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Model *</label>
                  <input value={form.model} onChange={set('model')}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Display name *</label>
                <input value={form.display_name} onChange={set('display_name')}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Serial number</label>
                <input value={form.device_serial} onChange={set('device_serial')} placeholder="optional"
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs font-mono" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Purchase date</label>
                  <input type="date" value={form.purchase_date} onChange={set('purchase_date')}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Warranty</label>
                  <input type="date" value={form.warranty_expires} onChange={set('warranty_expires')}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">AppleCare</label>
                  <input type="date" value={form.applecare_expires} onChange={set('applecare_expires')}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1.5 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2.5 py-1.5 text-xs resize-none" />
              </div>
            </div>

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => { setOpen(false); setError(''); }}
                className="text-xs px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="text-xs px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
