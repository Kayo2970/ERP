'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  X,
  Search,
  Edit2,
  Trash2,
  ShieldAlert,
  Users,
  Building2,
  Phone,
  Mail,
  Calendar,
  StickyNote,
  ImagePlus,
  ImageOff,
  ExternalLink,
} from 'lucide-react';
import { getGuests, addGuest, updateGuest, deleteGuest, Guest } from '@/lib/local-data';
import { canAccessGuestDirectory } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

const MAX_CARD_SIZE = 10 * 1024 * 1024; // 10 MB

const emptyForm = {
  name: '',
  organization: '',
  designation: '',
  phone: '',
  email: '',
  notes: '',
  metDate: '',
};

export default function GuestDirectoryPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [cardData, setCardData] = useState('');
  const [cardError, setCardError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    const refresh = () => setGuests(getGuests());
    refresh();
    setUserHydrated(true);

    window.addEventListener('leads-data-sync', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('leads-data-sync', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setCardFile(null);
    setCardData('');
    setCardError('');
    setEditingGuest(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (guest: Guest) => {
    setEditingGuest(guest);
    setForm({
      name: guest.name,
      organization: guest.organization || '',
      designation: guest.designation || '',
      phone: guest.phone || '',
      email: guest.email || '',
      notes: guest.notes || '',
      metDate: guest.metDate || '',
    });
    setCardFile(null);
    setCardData('');
    setCardError('');
    setIsModalOpen(true);
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setCardError('');
    if (!selected) {
      setCardFile(null);
      setCardData('');
      return;
    }
    if (selected.size > MAX_CARD_SIZE) {
      setCardError(`Image size (${(selected.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB maximum limit.`);
      setCardFile(null);
      setCardData('');
      return;
    }
    setCardFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCardData(reader.result);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);

    const payload: any = {
      name: form.name.trim(),
      organization: form.organization.trim() || undefined,
      designation: form.designation.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      notes: form.notes.trim() || undefined,
      metDate: form.metDate || undefined,
      metBy: editingGuest?.metBy || user?.name || 'Unknown',
    };

    if (cardData) {
      payload.visitingCardData = cardData;
      payload.visitingCardFileName = cardFile?.name || 'card.jpg';
    }

    try {
      if (editingGuest) {
        updateGuest(editingGuest.id, payload, user?.name || 'Admin');
        triggerToast('success', `Updated guest record for ${payload.name}.`);
      } else {
        addGuest(payload, user?.name || 'Admin');
        triggerToast('success', `Added ${payload.name} to the Guest Directory.`);
      }
      setGuests(getGuests());
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      triggerToast('error', err.message || 'Failed to save guest.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingGuest) return;
    try {
      deleteGuest(deletingGuest.id, user?.name || 'Admin');
      setGuests(getGuests());
      triggerToast('success', `Removed ${deletingGuest.name} from the Guest Directory.`);
    } catch (err: any) {
      triggerToast('error', err.message || 'Failed to remove guest.');
    } finally {
      setDeletingGuest(null);
    }
  };

  const filteredGuests = guests.filter(g => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      (g.organization || '').toLowerCase().includes(q) ||
      (g.designation || '').toLowerCase().includes(q) ||
      (g.email || '').toLowerCase().includes(q) ||
      (g.metBy || '').toLowerCase().includes(q)
    );
  });

  if (!userHydrated) return null;

  if (!canAccessGuestDirectory(user)) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={ShieldAlert}
          title="Access Restricted"
          description="The Guest Directory is available to the Centre Head and Faculty members only."
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Guest Directory</h1>
          <p className="text-xs text-theme-text-secondary">Guests, sponsors, and visitors met at events — sourced from visiting cards. Separate from the Member roster and Guest Invites tool.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Guest
        </button>
      </div>

      {toastMsg && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs animate-in fade-in duration-300 ${
          toastMsg.type === 'success' ? 'bg-success/15 border border-success/20 text-theme-text-primary' : 'bg-danger/15 border border-danger/20 text-theme-text-primary'
        }`}>
          <span>{toastMsg.text}</span>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
        <Search className="h-4.5 w-4.5 text-theme-text-secondary shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name, organization, designation, email, or met by..."
          className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-theme-text-primary placeholder-theme-text-secondary"
        />
        <span className="text-xs font-semibold text-theme-text-primary shrink-0">{filteredGuests.length} guest{filteredGuests.length === 1 ? '' : 's'}</span>
      </div>

      {filteredGuests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guests found"
          description={guests.length === 0 ? 'Add the first guest to start building the directory.' : 'No guests match your search.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGuests.map(guest => (
            <div key={guest.id} className="glass-panel rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-theme-text-primary truncate">{guest.name}</h3>
                  {guest.designation && <p className="text-[11px] text-theme-text-secondary truncate">{guest.designation}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditModal(guest)}
                    className="p-1.5 text-theme-text-secondary hover:text-accent hover:bg-theme-border/20 rounded-lg transition-all cursor-pointer"
                    title="Edit Guest"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingGuest(guest)}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                    title="Remove Guest"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-theme-text-secondary">
                {guest.organization && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{guest.organization}</span>
                  </div>
                )}
                {guest.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{guest.phone}</span>
                  </div>
                )}
                {guest.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                )}
                {guest.metDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>Met on {guest.metDate}{guest.metBy ? ` by ${guest.metBy}` : ''}</span>
                  </div>
                )}
                {guest.notes && (
                  <div className="flex items-start gap-1.5 pt-1">
                    <StickyNote className="h-3 w-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{guest.notes}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-theme-border/20">
                {guest.visitingCardUrl ? (
                  <a
                    href={guest.visitingCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Visiting Card
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] text-theme-text-secondary/70">
                    <ImageOff className="h-3 w-3" />
                    No visiting card on file
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">{editingGuest ? 'Edit Guest' : 'Add Guest to Directory'}</h2>
              <button
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Anjali Rao"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Organization</label>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                    placeholder="e.g. Marketing Director"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="guest@example.com"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Date Met</label>
                <input
                  type="date"
                  value={form.metDate}
                  onChange={e => setForm(f => ({ ...f, metDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Context on how/where you met, follow-up items, etc."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary flex items-center gap-1.5">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Visiting Card {editingGuest?.visitingCardUrl ? '(replace)' : ''}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCardChange}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-white file:text-xs file:font-medium file:cursor-pointer cursor-pointer"
                />
                {cardError && <p className="text-danger text-[11px]">{cardError}</p>}
                {editingGuest?.visitingCardUrl && !cardData && (
                  <p className="text-[11px] text-theme-text-secondary">A visiting card is already on file. Choose a new image to replace it.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-accent hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {isSaving ? 'Saving...' : editingGuest ? 'Save Changes' : 'Add Guest'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingGuest)}
        title="Remove Guest from Directory"
        message={`Are you sure you want to remove ${deletingGuest?.name} from the Guest Directory? This cannot be undone.`}
        confirmLabel="Remove Guest"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingGuest(null)}
      />
    </div>
  );
}
