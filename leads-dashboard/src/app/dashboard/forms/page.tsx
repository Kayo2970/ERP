'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Eye, 
  Copy, 
  CheckCircle2, 
  X, 
  Edit2, 
  ShieldAlert, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  getForms, 
  addForm, 
  updateForm, 
  deleteForm, 
  getSubmissions, 
  isSlugUnique,
  PublicFormItem, 
  FormField,
  FormSubmissionItem 
} from '@/lib/local-data';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

export default function FormsBuilderPage() {
  const [forms, setForms] = useState<PublicFormItem[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmissionItem[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Modals & Active Edit
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<PublicFormItem | null>(null);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);

  // Form Creator State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [committee, setCommittee] = useState('Senior Student Leadership');
  const [fields, setFields] = useState<FormField[]>([
    { id: 'field_1', label: 'Full Name', type: 'text', required: true },
    { id: 'field_2', label: 'University Email', type: 'email', required: true }
  ]);

  // Selected Form for submissions view
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Notification States
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const refreshData = () => {
      const loadedForms = getForms();
      setForms(loadedForms);
      setSubmissions(getSubmissions());
    };
    refreshData();

    const loadedForms = getForms();
    if (loadedForms.length > 0) {
      setSelectedFormId(loadedForms[0].id);
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener('leads-data-sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('leads-data-sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenCreate = () => {
    setTitle('');
    setSlug('');
    setDescription('');
    setCommittee(user?.committee === 'All Committees' ? 'Senior Student Leadership' : user?.committee || 'Senior Student Leadership');
    setFields([
      { id: 'f_1', label: 'Full Name', type: 'text', required: true },
      { id: 'f_2', label: 'University Email', type: 'email', required: true }
    ]);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (form: PublicFormItem) => {
    setEditingForm(form);
    setTitle(form.title);
    setSlug(form.slug);
    setDescription(form.description);
    setCommittee(form.committee);
    setFields(form.fields);
    setFormError('');
  };

  const addField = () => {
    setFields([...fields, { id: 'field_' + Date.now(), label: 'New Question / Field', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    setFields(updated);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !slug.trim()) {
      setFormError('Form Title and Public URL Slug are required.');
      return;
    }

    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    if (editingForm) {
      if (!isSlugUnique(formattedSlug, editingForm.id)) {
        setFormError(`The slug "${formattedSlug}" is already taken by another form. Choose a unique slug.`);
        return;
      }
      updateForm(editingForm.id, {
        title,
        slug: formattedSlug,
        description,
        committee,
        fields,
      }, user?.name || 'User');
      triggerNotification('Public form updated successfully.');
      setEditingForm(null);
    } else {
      if (!isSlugUnique(formattedSlug)) {
        setFormError(`The slug "${formattedSlug}" is already taken by another form. Choose a unique slug.`);
        return;
      }
      addForm({
        title,
        slug: formattedSlug,
        description,
        committee,
        fields,
        createdBy: user?.name || 'User',
        status: 'active'
      });
      triggerNotification('New dynamic public form created successfully.');
      setIsCreateModalOpen(false);
    }

    const updated = getForms();
    setForms(updated);
  };

  const handleConfirmDelete = () => {
    if (!deletingFormId) return;
    deleteForm(deletingFormId, user?.name || 'User');
    setDeletingFormId(null);
    const updated = getForms();
    setForms(updated);
    if (selectedFormId === deletingFormId && updated.length > 0) {
      setSelectedFormId(updated[0].id);
    }
    triggerNotification('Public form deleted.');
  };

  const handleCopyLink = (formSlug: string) => {
    const linkUrl = `${window.location.origin}/forms/${formSlug}`;
    navigator.clipboard.writeText(linkUrl);
    setCopiedSlug(formSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // PRD Gating: Super User (Tier 1) and Core Committee (Tier 5)
  const canBuild = user && (user.tier === 1 || user.tier === 5);

  const selectedForm = forms.find(f => f.id === selectedFormId) || forms[0];
  const selectedSubmissions = selectedForm ? submissions.filter(s => s.formId === selectedForm.id || s.slug === selectedForm.slug) : [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Alert Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Public Forms & Registration Builder</h1>
          <p className="text-xs text-theme-text-secondary">Generate responsive, shareable student registration and survey links</p>
        </div>
        {canBuild ? (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Build New Form
          </button>
        ) : (
          <span className="text-xs text-theme-text-secondary italic">
            Form creation permissions: Super User (Tier 1) & Core Committee (Tier 5)
          </span>
        )}
      </div>

      {/* Forms and Responses Layout */}
      {forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No public forms configured"
          description="Create custom registration forms for conferences, hackathons, and symposiums."
          actionLabel={canBuild ? "Build New Form" : undefined}
          onAction={canBuild ? handleOpenCreate : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Forms List */}
          <div className="glass-panel rounded-2xl p-6 lg:col-span-1 space-y-4 flex flex-col">
            <h3 className="text-sm font-bold text-theme-text-primary uppercase tracking-wider">
              Published Forms ({forms.length})
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {forms.map(form => {
                const isSelected = selectedForm?.id === form.id;
                const formSubs = submissions.filter(s => s.formId === form.id || s.slug === form.slug);

                return (
                  <div
                    key={form.id}
                    onClick={() => setSelectedFormId(form.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 text-xs ${
                      isSelected
                        ? 'bg-accent/10 border-accent/40 shadow-sm'
                        : 'bg-theme-border/10 border-theme-border/20 hover:bg-theme-border/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-theme-text-primary text-xs leading-snug">{form.title}</h4>
                          {form.isSample && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/20">
                              Sample
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-theme-text-secondary mt-0.5 font-mono">/forms/{form.slug}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                        {formSubs.length} responses
                      </span>
                    </div>

                    <p className="text-[11px] text-theme-text-secondary line-clamp-1">
                      {form.description || `${form.fields.length} question fields`}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-theme-border/20 text-[11px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(form.slug);
                        }}
                        className="text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedSlug === form.slug ? 'Copied Link!' : 'Copy Link'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/forms/${form.slug}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-theme-border/30 rounded text-theme-text-secondary hover:text-theme-text-primary"
                          title="Open Public Form View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {canBuild && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(form);
                              }}
                              className="p-1 hover:bg-theme-border/30 rounded text-theme-text-secondary hover:text-accent cursor-pointer"
                              title="Edit Form"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingFormId(form.id);
                              }}
                              className="p-1 hover:bg-danger/10 rounded text-danger cursor-pointer"
                              title="Delete Form"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submissions & Form Preview Inspector */}
          <div className="glass-panel rounded-2xl p-6 lg:col-span-2 space-y-5">
            {selectedForm ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-theme-border/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-theme-text-primary">{selectedForm.title}</h3>
                      {selectedForm.isSample && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
                          Sample Dataset
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-text-secondary mt-0.5">
                      Public URL: <code className="text-accent font-mono">/forms/{selectedForm.slug}</code> &middot; Created by {selectedForm.createdBy}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyLink(selectedForm.slug)}
                    className="px-3 py-1.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedSlug === selectedForm.slug ? 'Copied!' : 'Share Public Link'}
                  </button>
                </div>

                {/* Submissions Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-theme-text-primary uppercase tracking-wider">
                    Received Submissions ({selectedSubmissions.length})
                  </h4>

                  {selectedSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-theme-text-secondary text-xs bg-theme-border/5 rounded-xl border border-theme-border/20">
                      No student responses submitted yet for this form link.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                            <th className="pb-3 font-semibold">Timestamp</th>
                            {selectedForm.fields.map(f => (
                              <th key={f.id} className="pb-3 font-semibold">{f.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme-border/20">
                          {selectedSubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-theme-border/10 transition-all text-xs">
                              <td className="py-3 pr-2 text-theme-text-secondary whitespace-nowrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {sub.submittedAt}
                                </span>
                              </td>
                              {selectedForm.fields.map(f => (
                                <td key={f.id} className="py-3 pr-3 text-theme-text-primary max-w-xs truncate">
                                  {String(sub.data[f.id] || sub.data[f.label] || '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-theme-text-secondary text-xs">
                Select a published form from the left panel to inspect responses.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Create / Edit Form Modal */}
      {(isCreateModalOpen || editingForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingForm ? 'Edit Public Form' : 'Build New Public Form'}
              </h2>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingForm(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-danger/10 border border-danger/25 rounded-xl text-danger text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Form Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AI Hackathon Registration 2026"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Public Link Slug * (/forms/[slug])</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ai-hackathon-2026"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Description / Respondent Instructions</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain event agenda, eligibility, and deadline details..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Dynamic Field Builder */}
              <div className="space-y-3 pt-2 border-t border-theme-border/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider">
                    Form Questions & Field Schema ({fields.length})
                  </h4>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-2.5 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </button>
                </div>

                <div className="space-y-2.5">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          required
                          value={field.label}
                          onChange={(e) => updateField(idx, 'label', e.target.value)}
                          placeholder="Question Label"
                          className="w-full px-3 py-1.5 bg-theme-background/40 border border-theme-border/30 rounded-lg text-theme-text-primary text-xs"
                        />
                      </div>
                      
                      <div className="w-32">
                        <select
                          value={field.type}
                          onChange={(e) => updateField(idx, 'type', e.target.value)}
                          className="w-full px-2 py-1.5 bg-theme-background/40 border border-theme-border/30 rounded-lg text-theme-text-primary text-xs"
                        >
                          <option value="text">Short Text</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="textarea">Paragraph</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1 text-[11px] text-theme-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(idx, 'required', e.target.checked)}
                          className="accent-accent"
                        />
                        Required
                      </label>

                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        disabled={fields.length <= 1}
                        className="p-1.5 hover:bg-danger/10 rounded-lg text-danger transition-all cursor-pointer disabled:opacity-30"
                        title="Remove Question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                {editingForm ? 'Save Form Changes' : 'Publish Shareable Form Link'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingFormId)}
        title="Delete Public Form"
        message="Are you sure you want to delete this public form? The public link will become unreachable and any responses associated will be archived."
        confirmLabel="Delete Form"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingFormId(null)}
      />

    </div>
  );
}
