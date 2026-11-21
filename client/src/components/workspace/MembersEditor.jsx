import { Plus, X } from 'lucide-react';

export function MembersEditor({ meta, onMetaChange }) {
  const members = meta.members?.length ? meta.members : [{ name: '', nim: '' }];
  const update = (next) => onMetaChange({ ...meta, members: next });
  const change = (index, key, value) => update(members.map((m, i) => (i === index ? { ...m, [key]: value } : m)));

  return (
    <div className="mt-3">
      <span className="mb-1 block text-[10px] font-medium text-ink-500">Anggota (cover)</span>
      <div className="space-y-1.5">
        {members.map((member, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <input
              value={member.name}
              placeholder={`Nama anggota ${index + 1}`}
              maxLength={120}
              onChange={(event) => change(index, 'name', event.target.value)}
              className="field-input h-8 min-w-0 flex-1 px-2 text-[12px]"
            />
            <input
              value={member.nim}
              placeholder="NIM"
              maxLength={40}
              onChange={(event) => change(index, 'nim', event.target.value)}
              className="field-input h-8 w-24 px-2 text-[12px]"
            />
            <button
              type="button"
              disabled={members.length === 1}
              onClick={() => update(members.filter((_, i) => i !== index))}
              className="rounded p-1 text-ink-400 hover:bg-slate-100 hover:text-ink-700 disabled:opacity-30"
              aria-label="Hapus anggota"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => update([...members, { name: '', nim: '' }])}
        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Tambah anggota
      </button>
    </div>
  );
}
