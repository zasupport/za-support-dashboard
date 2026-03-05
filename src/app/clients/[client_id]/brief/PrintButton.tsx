'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors print:hidden"
    >
      Print / Save PDF
    </button>
  );
}
