'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineItem {
  id: number;
  description: string;
  qty: number;
  unit_price: number | null;
  line_total: number | null;
  item_type: string;
}

interface Props {
  jobRef: string;
  initialItems: LineItem[];
  isDone: boolean;
}

export function WorkshopLineItems({ jobRef, initialItems, isDone }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [form, setForm] = useState({
    description: '', qty: '1', unit_price: '', item_type: 'labour',
  });

  function set(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/workshop/${jobRef}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          qty: parseInt(form.qty) || 1,
          unit_price: form.unit_price ? parseFloat(form.unit_price) : null,
          item_type: form.item_type,
        }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => [...prev, newItem]);
        setForm({ description: '', qty: '1', unit_price: '', item_type: 'labour' });
        setAdding(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/workshop/${jobRef}/line-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  const total = items.reduce((sum, i) => sum + (i.line_total ?? 0), 0);
  const input = 'bg-slate-700 text-slate-100 text-xs rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-teal-400';

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm">Line Items</CardTitle>
          {!isDone && (
            <button
              onClick={() => setAdding(v => !v)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition-colors"
            >
              <Plus size={11} /> Add
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="text-left px-4 py-2">Description</th>
                <th className="text-right px-4 py-2">Qty</th>
                <th className="text-right px-4 py-2">Unit (R)</th>
                <th className="text-right px-4 py-2">Total (R)</th>
                <th className="text-left px-4 py-2">Type</th>
                {!isDone && <th className="px-4 py-2"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-slate-700/40 last:border-0">
                  <td className="px-4 py-2 text-slate-200">{item.description}</td>
                  <td className="px-4 py-2 text-right text-slate-400">{item.qty}</td>
                  <td className="px-4 py-2 text-right text-slate-400">
                    {item.unit_price != null ? Number(item.unit_price).toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right text-white font-medium">
                    {item.line_total != null ? Number(item.line_total).toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-500 capitalize">{item.item_type}</td>
                  {!isDone && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={deleting === item.id}
                        className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        {deleting === item.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {total > 0 && (
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={3} className="px-4 py-2 text-right text-slate-400 font-medium">Total (incl. VAT estimate)</td>
                  <td className="px-4 py-2 text-right text-teal-400 font-semibold">R {total.toFixed(2)}</td>
                  <td colSpan={isDone ? 1 : 2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        ) : (
          !adding && <p className="text-slate-600 text-xs px-4 py-3">No line items yet.</p>
        )}

        {adding && (
          <form onSubmit={addItem} className="border-t border-slate-700 px-4 py-3 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <input
                  required
                  placeholder="Description *"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className={`${input} w-full`}
                />
              </div>
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={form.qty}
                onChange={e => set('qty', e.target.value)}
                className={`${input} w-full`}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price (R)"
                value={form.unit_price}
                onChange={e => set('unit_price', e.target.value)}
                className={`${input} w-full`}
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={form.item_type} onChange={e => set('item_type', e.target.value)} className={`${input}`}>
                <option value="labour">Labour</option>
                <option value="part">Part</option>
                <option value="service">Service</option>
                <option value="travel">Travel</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-600 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                Add
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-slate-500 hover:text-white">
                Cancel
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
