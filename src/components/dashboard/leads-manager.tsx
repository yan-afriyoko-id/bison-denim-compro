'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ContactSubmission, Profile, LeadStatus } from '@/types';
import { Mail, MessageCircle, Search, Save, X } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { bulkUpdateLeadStatus, updateLead } from '@/actions/leads.actions';
import { getLeadCompany } from '@/lib/cms';
import { toast } from 'sonner';

const statusStyles: Record<string, string> = {
  new: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  spam: 'bg-red-50 text-red-700 border-red-200',
};

export function LeadsManager({
  initialLeads,
  users,
}: {
  initialLeads: ContactSubmission[];
  users: Profile[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeLead, setActiveLead] = useState<ContactSubmission | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [isPending, startTransition] = useTransition();

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = [lead.name, lead.email, lead.subject ?? '', getLeadCompany(lead) ?? '']
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = !status || lead.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, status]);

  function openLead(lead: ContactSubmission) {
    setActiveLead(lead);
    setNoteDraft(lead.internal_note ?? '');
    setAssignedTo(lead.assigned_to ?? '');
    setLeadStatus(lead.status);
  }

  async function persistLead() {
    if (!activeLead) return;
    const result = await updateLead(activeLead.id, {
      status: leadStatus,
      assigned_to: assignedTo || null,
      internal_note: noteDraft,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const nextLeads = leads.map((lead) =>
      lead.id === activeLead.id
        ? { ...lead, status: leadStatus, assigned_to: assignedTo || null, internal_note: noteDraft }
        : lead
    );
    setLeads(nextLeads);
    setActiveLead(nextLeads.find((lead) => lead.id === activeLead.id) ?? null);
    toast.success('Lead berhasil diperbarui');
  }

  async function handleBulkStatus(nextStatus: LeadStatus) {
    if (selectedIds.length === 0) return;
    const result = await bulkUpdateLeadStatus(selectedIds, nextStatus);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLeads((prev) => prev.map((lead) => (selectedIds.includes(lead.id) ? { ...lead, status: nextStatus } : lead)));
    setSelectedIds([]);
    toast.success('Status lead berhasil diperbarui');
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h1>
            <p className="mt-1 text-sm text-gray-400">Kelola kontak masuk</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
            <label className="relative md:min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, email, subjek, atau company"
                className="w-full rounded-sm border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-900"
              />
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 md:min-w-[180px]"
            >
              <option value="">Semua status</option>
              <option value="new">Baru</option>
              <option value="contacted">Dihubungi</option>
              <option value="resolved">Selesai</option>
              <option value="spam">Spam</option>
            </select>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isPending}
              onClick={() => startTransition(() => void handleBulkStatus('contacted'))}
              className="rounded-sm border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 disabled:opacity-40"
            >
              Tandai Dihubungi
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isPending}
              onClick={() => startTransition(() => void handleBulkStatus('spam'))}
              className="rounded-sm border border-red-200 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-40"
            >
              Tandai Spam
            </button>
          </div>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <MessageCircle className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">Belum ada lead</p>
          <p className="text-xs text-gray-400 mt-1">Lead akan muncul ketika ada pengunjung yang mengirim pesan</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredLeads.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? filteredLeads.map((lead) => lead.id) : [])}
                    className="h-4 w-4 accent-gray-900"
                  />
                </th>
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Kontak</th>
                <th className="px-5 py-3">Subjek</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(lead.id)}
                      onChange={(e) =>
                        setSelectedIds((prev) => (e.target.checked ? [...prev, lead.id] : prev.filter((id) => id !== lead.id)))
                      }
                      className="h-4 w-4 accent-gray-900"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => openLead(lead)} className="text-left">
                      <p className="font-bold text-gray-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">{getLeadCompany(lead) ?? '-'}</p>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{lead.subject ?? '-'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${statusStyles[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{timeAgo(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E1E]/30 p-4">
          <div className="w-full max-w-3xl rounded-sm border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{activeLead.name}</h3>
                <p className="text-xs text-gray-400">{activeLead.email}</p>
              </div>
              <button onClick={() => setActiveLead(null)} className="text-gray-400 hover:text-gray-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Subjek</p>
                  <p className="text-sm text-gray-900">{activeLead.subject ?? '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                  <p className="text-sm text-gray-900">{activeLead.phone ?? '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</p>
                  <p className="text-sm text-gray-900">{getLeadCompany(activeLead) ?? '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Message</p>
                  <div className="rounded-sm border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
                    {activeLead.message}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Status</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  >
                    <option value="new">Baru</option>
                    <option value="contacted">Dihubungi</option>
                    <option value="resolved">Selesai</option>
                    <option value="spam">Spam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Assign To</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name ?? user.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Internal Note</label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={8}
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => startTransition(() => void persistLead())}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-[#1E1E1E] disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
