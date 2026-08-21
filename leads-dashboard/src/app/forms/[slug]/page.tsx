'use client';

import React, { useState, useEffect, use } from 'react';
import { CheckCircle2, ChevronLeft, Send, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { getForms, addSubmission, syncWithServer, PublicFormItem } from '@/lib/local-data';
import { TermsModal } from '@/components/terms-modal';

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [form, setForm] = useState<PublicFormItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyForm = (matchedForm: PublicFormItem | undefined) => {
      if (cancelled) return;
      if (!matchedForm) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setForm(matchedForm);
      const initialData: Record<string, any> = {};
      matchedForm.fields.forEach(f => {
        initialData[f.id] = '';
      });
      setFormData(initialData);
      setLoading(false);
    };

    const localMatch = getForms().find(f => f.slug.toLowerCase() === slug.toLowerCase());
    if (localMatch) {
      // Already cached in this browser (e.g. staff previewing right after
      // building it) — show it immediately, no need to wait on the network.
      applyForm(localMatch);
      return;
    }

    // A real respondent filling this out from a shared link has never logged
    // into the dashboard in this browser, so localStorage starts completely
    // empty — reading it alone would always report "Form Not Found" for a
    // real, live form. Sync with the server first so the actual form list is
    // available before deciding the slug doesn't exist.
    syncWithServer().then(() => {
      if (cancelled) return;
      applyForm(getForms().find(f => f.slug.toLowerCase() === slug.toLowerCase()));
    });

    return () => { cancelled = true; };
  }, [slug]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Honeypot spam protection: if bot filled hidden field, simulate success but drop
    if (honeypot.trim() !== '') {
      setIsSubmitted(true);
      return;
    }

    addSubmission({
      formId: form.id,
      slug: form.slug,
      data: formData,
    });

    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-slate-400 text-xs animate-pulse">Loading form details...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center space-y-5 border border-white/10 shadow-2xl">
          <div className="h-14 w-14 bg-amber-500/15 rounded-2xl flex items-center justify-center border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-white">Form Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The public form at <code className="text-amber-400 font-mono">/forms/{slug}</code> does not exist, has expired, or the link has changed.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Return to Portal Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 py-12">
      
      {isSubmitted ? (
        // Submission Success View
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center space-y-6 border border-emerald-500/30 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 bg-emerald-500/15 rounded-full flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Response Recorded!</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thank you for your submission. Your details have been securely recorded for <strong>{form?.title}</strong>.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 w-full text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              Return to MSRUAS LEADS
            </Link>
          </div>
        </div>
      ) : (
        // Public Form Fill View (Clean light/dark responsive card)
        <div className="w-full max-w-xl rounded-3xl p-8 flex flex-col space-y-6 relative overflow-hidden bg-slate-800/80 backdrop-blur-md border border-slate-700/80 shadow-2xl">
          
          {/* Top Banner Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"></div>

          {/* Form Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-10 w-10 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{form?.title}</h1>
              <p className="text-[11px] text-slate-400 mt-1">{form?.description || 'Please complete the requested information below.'}</p>
              {form?.eventName && (
                <p className="text-[10px] text-blue-400 font-semibold mt-1">For event: {form.eventName}</p>
              )}
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
            
            {/* Honeypot field (hidden from human users for spam bot mitigation) */}
            <input
              type="text"
              name="website_url_hp"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            {form?.fields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="block font-medium text-slate-300">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>

                {field.type === 'scale' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2" role="radiogroup" aria-label={field.label}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <label
                          key={n}
                          className={`flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer text-sm font-bold transition-all ${
                            Number(formData[field.id]) === n
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-blue-500/60'
                          }`}
                        >
                          <input
                            type="radio"
                            name={field.id}
                            value={n}
                            required={field.required}
                            checked={Number(formData[field.id]) === n}
                            onChange={() => handleInputChange(field.id, n)}
                            className="sr-only"
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                      <span>1 = Low</span>
                      <span>5 = High</span>
                    </div>
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    rows={3}
                    placeholder="Enter your response..."
                    className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                  >
                    <option value="">Select an option...</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs"
                  />
                )}
              </div>
            ))}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Send className="h-4 w-4" />
                Submit Registration
              </button>
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 pt-2">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Encrypted & Verified &bull; LEADS Next Gen MSRUAS</span>
            </div>
          </form>
        </div>
      )}

      {/* Footer Info */}
      <footer className="mt-8 text-center text-[11px] text-slate-400 space-y-1 max-w-lg px-4 pb-6">
        <p>
          By visiting or using this portal, you agree to our{' '}
          <button
            type="button"
            onClick={() => setIsTermsOpen(true)}
            className="font-semibold text-sky-400 underline hover:text-sky-300 transition-colors cursor-pointer"
          >
            Terms & Conditions
          </button>.
        </p>
        <p className="text-[10px]">
          All Intellectual Property, Copyrights & Development Licensing belong exclusively to <strong>Kayomarz Pavri</strong>.
        </p>
        <p className="text-[10px] opacity-75">&copy; 2026 LEADS Next Gen Centre &middot; MSRUAS Internal Operations Portal</p>
      </footer>

      {/* Terms & Conditions Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
