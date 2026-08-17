'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, Eye, Copy, CheckCircle2, ChevronDown, ChevronUp, X } from 'lucide-react';

interface FormField {
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea';
  required: boolean;
}

interface CustomForm {
  id: string;
  title: string;
  slug: string;
  fields: FormField[];
  createdAt: string;
}

interface FormSubmission {
  id: string;
  formSlug: string;
  submittedAt: string;
  data: Record<string, string>;
}

export default function FormsBuilderPage() {
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Form Creator State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState<FormField[]>([
    { label: 'Full Name', type: 'text', required: true },
    { label: 'Email Address', type: 'email', required: true }
  ]);

  // Selected Form for submissions view
  const [selectedFormSlug, setSelectedFormSlug] = useState<string | null>(null);

  // Notification States
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Load Forms
    const savedForms = localStorage.getItem('leads_custom_forms');
    if (savedForms) {
      setForms(JSON.parse(savedForms));
    } else {
      const defaultForm: CustomForm = {
        id: 'f_default',
        title: 'Event Attendance & Feedback Form',
        slug: 'event-feedback',
        fields: [
          { label: 'Full Name', type: 'text', required: true },
          { label: 'Email Address', type: 'email', required: true },
          { label: 'Suggestions / Comments', type: 'textarea', required: false }
        ],
        createdAt: '2026-08-16'
      };
      localStorage.setItem('leads_custom_forms', JSON.stringify([defaultForm]));
      setForms([defaultForm]);
    }

    // Load Submissions
    const savedSubmissions = localStorage.getItem('leads_form_submissions');
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    } else {
      const defaultSubmissions: FormSubmission[] = [
        { id: 'sub_1', formSlug: 'event-feedback', submittedAt: '2026-08-17', data: { 'Full Name': 'Gurutejas C', 'Email Address': 'gurutejas.c@msruas.ac.in', 'Suggestions / Comments': 'Everything was well structured.' } },
        { id: 'sub_2', formSlug: 'event-feedback', submittedAt: '2026-08-17', data: { 'Full Name': 'Kunal Bhadauria', 'Email Address': 'kunal.bhadauria@msruas.ac.in', 'Suggestions / Comments': 'Catering check was excellent!' } }
      ];
      localStorage.setItem('leads_form_submissions', JSON.stringify(defaultSubmissions));
      setSubmissions(defaultSubmissions);
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const addField = () => {
    setFields([...fields, { label: 'New Field', type: 'text', required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof FormField, value: any) => {
    const updated = fields.map((f, i) => i === index ? { ...f, [key]: value } : f);
    setFields(updated);
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug) return;

    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    const newForm: CustomForm = {
      id: 'form_' + Date.now(),
      title,
      slug: formattedSlug,
      fields,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedForms = [...forms, newForm];
    localStorage.setItem('leads_custom_forms', JSON.stringify(updatedForms));
    setForms(updatedForms);

    // Reset Form
    setTitle('');
    setSlug('');
    setFields([
      { label: 'Full Name', type: 'text', required: true },
      { label: 'Email Address', type: 'email', required: true }
    ]);
    triggerNotification('Dynamic public form created successfully.');
  };

  const handleCopyLink = (formSlug: string) => {
    const linkUrl = `${window.location.origin}/forms/${formSlug}`;
    navigator.clipboard.writeText(linkUrl);
    setCopiedSlug(formSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const canBuild = user && (user.tier <= 3 || user.tier === 5); // Tiers 1-3 & 5 can create forms
  const selectedForm = forms.find(f => f.slug === selectedFormSlug);
  const selectedSubmissions = submissions.filter(s => s.formSlug === selectedFormSlug);

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Alert Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-xl font-bold text-theme-text-primary">Public Forms Builder</h1>
        <p className="text-xs text-theme-text-secondary">Build custom feedback, registrations, or survey forms, share links, and audit responses</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Form Creator Section (Only for Tiers 1-3 & 5) */}
        <div className="glass-panel rounded-2xl p-6 xl:col-span-1 space-y-4 h-fit">
          <div>
            <h3 className="text-base font-semibold text-theme-text-primary">Create Public Form</h3>
            <p className="text-xs text-theme-text-secondary">Define form schema and target slug link</p>
          </div>

          {canBuild ? (
            <form onSubmit={handleCreateForm} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Form Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Workshop Registration"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">URL Slug Link</label>
                <div className="flex items-center bg-theme-background/30 border border-theme-card-border rounded-xl px-3 py-1">
                  <span className="text-[10px] text-theme-text-secondary border-r border-theme-border/30 pr-2 mr-2 select-none">/forms/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="workshop-registration"
                    className="w-full bg-transparent border-0 p-1 focus:outline-none text-theme-text-primary placeholder-theme-text-secondary"
                  />
                </div>
              </div>

              {/* Dynamic Fields Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[10px] text-theme-text-secondary uppercase tracking-wider">Form Fields Setup</label>
                  <button
                    type="button"
                    onClick={addField}
                    className="px-2 py-1 bg-accent/20 hover:bg-accent text-accent hover:text-white text-[10px] font-bold rounded-md transition-all cursor-pointer"
                  >
                    Add Field
                  </button>
                </div>

                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {fields.map((field, index) => (
                    <div key={index} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-2 relative">
                      {index > 1 && (
                        <button
                          type="button"
                          onClick={() => removeField(index)}
                          className="absolute top-2 right-2 text-danger hover:bg-danger/10 p-1 rounded-md"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-theme-text-secondary">Field Label</label>
                        <input
                          type="text"
                          required
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          className="w-full px-2 py-1.5 bg-theme-background/50 border border-theme-card-border rounded-lg text-theme-text-primary text-[11px] focus:outline-none focus:border-accent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-theme-text-secondary">Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, 'type', e.target.value)}
                            className="w-full px-2 py-1 bg-theme-background/50 border border-theme-card-border rounded-lg text-theme-text-primary text-[10px]"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="number">Number</option>
                            <option value="textarea">Paragraph</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 pt-4">
                          <input
                            type="checkbox"
                            id={`req-${index}`}
                            checked={field.required}
                            onChange={(e) => updateField(index, 'required', e.target.checked)}
                            className="cursor-pointer"
                          />
                          <label htmlFor={`req-${index}`} className="text-[10px] text-theme-text-secondary cursor-pointer">Required</label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Create Dynamic Form
              </button>
            </form>
          ) : (
            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-theme-text-secondary text-xs leading-relaxed">
              Only Super Users or Core Committee members can create custom public forms. Logs and submissions remain readable.
            </div>
          )}
        </div>

        {/* Right Column: Custom forms table and responses audit */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Active Forms Grid */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-theme-text-primary">Published Dynamic Forms</h3>
              <p className="text-xs text-theme-text-secondary">Links and responses status metrics for active forms</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                    <th className="pb-3.5 font-semibold">Form Title</th>
                    <th className="pb-3.5 font-semibold">Slug Path</th>
                    <th className="pb-3.5 font-semibold text-center">Submissions</th>
                    <th className="pb-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20 text-xs">
                  {forms.map(form => {
                    const count = submissions.filter(s => s.formSlug === form.slug).length;
                    return (
                      <tr key={form.id} className="hover:bg-theme-border/10 transition-all">
                        <td className="py-4 pr-2 font-medium text-theme-text-primary">{form.title}</td>
                        <td className="py-4 pr-2 text-theme-text-secondary font-mono">/forms/{form.slug}</td>
                        <td className="py-4 pr-2 text-center text-theme-text-primary font-bold">{count}</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleCopyLink(form.slug)}
                              className="p-1.5 bg-theme-border/30 hover:bg-theme-border/50 rounded-md transition-all text-theme-text-secondary hover:text-theme-text-primary cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-theme-card-border"
                              title="Copy Public link Url"
                            >
                              {copiedSlug === form.slug ? (
                                <span className="text-success flex items-center gap-0.5">Copied <CheckCircle2 className="h-3 w-3" /></span>
                              ) : (
                                <span className="flex items-center gap-0.5">Link <Copy className="h-3 w-3" /></span>
                              )}
                            </button>

                            <button
                              onClick={() => setSelectedFormSlug(selectedFormSlug === form.slug ? null : form.slug)}
                              className="p-1.5 bg-accent/20 hover:bg-accent rounded-md transition-all text-accent hover:text-white cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Audit Responses"
                            >
                              Audit {selectedFormSlug === form.slug ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submissions Detail Grid */}
          {selectedFormSlug && selectedForm && (
            <div className="glass-panel rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-theme-text-primary">Response Audits: {selectedForm.title}</h3>
                  <p className="text-xs text-theme-text-secondary">Showing {selectedSubmissions.length} submitted responses</p>
                </div>
                <button
                  onClick={() => setSelectedFormSlug(null)}
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-theme-border/30 text-theme-text-secondary transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedSubmissions.length === 0 ? (
                <div className="text-center py-8 text-theme-text-secondary text-xs">
                  No responses recorded for this dynamic form yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="text-theme-text-secondary border-b border-theme-border/30">
                        <th className="pb-2 font-medium">Date</th>
                        {selectedForm.fields.map(field => (
                          <th key={field.label} className="pb-2 font-medium">{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/20 text-theme-text-secondary">
                      {selectedSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-theme-border/10 transition-all">
                          <td className="py-2.5 font-medium text-theme-text-primary">{sub.submittedAt}</td>
                          {selectedForm.fields.map(field => (
                            <td key={field.label} className="py-2.5 max-w-xs truncate" title={sub.data[field.label] || '-'}>
                              {sub.data[field.label] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
