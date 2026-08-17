'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronLeft, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

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

export default function PublicFormPage({ params }: { params: { slug: string } }) {
  const [form, setForm] = useState<CustomForm | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Look up form configuration by slug in localStorage
    const savedForms = localStorage.getItem('leads_custom_forms');
    let matchedForm: CustomForm | null = null;
    
    if (savedForms) {
      const parsedForms: CustomForm[] = JSON.parse(savedForms);
      matchedForm = parsedForms.find(f => f.slug === params.slug) || null;
    }

    // Fallback to standard feedback form if not found
    if (!matchedForm) {
      matchedForm = {
        id: 'f_fallback',
        title: 'LEADS General Feedback & Registration',
        slug: params.slug,
        fields: [
          { label: 'Full Name', type: 'text', required: true },
          { label: 'Email Address', type: 'email', required: true },
          { label: 'Feedback & Comments', type: 'textarea', required: false }
        ],
        createdAt: new Date().toISOString().split('T')[0]
      };
    }

    setForm(matchedForm);

    // Initialize formData keys
    const initialData: Record<string, string> = {};
    matchedForm.fields.forEach(f => {
      initialData[f.label] = '';
    });
    setFormData(initialData);
    setLoading(false);
  }, [params.slug]);

  const handleInputChange = (label: string, value: string) => {
    setFormData(prev => ({ ...prev, [label]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Save Submission
    const savedSubmissions = localStorage.getItem('leads_form_submissions');
    const submissions: FormSubmission[] = savedSubmissions ? JSON.parse(savedSubmissions) : [];

    const newSubmission: FormSubmission = {
      id: 'sub_' + Date.now(),
      formSlug: form.slug,
      submittedAt: new Date().toISOString().split('T')[0],
      data: formData
    };

    submissions.push(newSubmission);
    localStorage.setItem('leads_form_submissions', JSON.stringify(submissions));

    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4">
        <div className="text-white text-xs animate-pulse">Loading form details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-theme flex flex-col items-center justify-center p-4">
      
      {isSubmitted ? (
        // Submission Success View
        <div className="glass-panel w-full max-w-md rounded-3xl p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 bg-success/15 rounded-full flex items-center justify-center border border-success/20">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-theme-text-primary">Response Submitted!</h1>
            <p className="text-xs text-theme-text-secondary leading-relaxed">
              Thank you for your response. It has been successfully compiled and recorded for <strong>{form?.title}</strong>.
            </p>
          </div>

          <div className="border-t border-theme-border/20 pt-4 w-full text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-primary-light font-bold transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              Return to LEADS Ops Portal
            </Link>
          </div>
        </div>
      ) : (
        // Form Fill View
        <div className="glass-panel w-full max-w-lg rounded-3xl p-8 flex flex-col space-y-6 relative overflow-hidden">
          
          {/* Accent Glow Top decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-success"></div>

          {/* Form Header */}
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="h-11 w-11 bg-accent/10 border border-accent/15 rounded-xl flex items-center justify-center shadow-lg shadow-accent/10">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-theme-text-primary leading-snug">{form?.title}</h1>
              <p className="text-[10px] text-theme-text-secondary uppercase tracking-wider font-semibold mt-1">LEADS Next Gen Centre &bull; MSRUAS</p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
            {form?.fields.map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="block font-semibold text-theme-text-secondary">
                  {field.label}
                  {field.required && <span className="text-danger ml-1">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={4}
                    value={formData[field.label] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    placeholder={`Enter details...`}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={formData[field.label] || ''}
                    onChange={(e) => handleInputChange(field.label, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3.5 bg-accent hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/15 cursor-pointer mt-6 flex items-center justify-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              Submit Response
            </button>
          </form>

        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-6 text-center text-[10px] text-theme-text-secondary space-y-1 select-none">
        <p>&copy; 2026 LEADS Next Gen Centre, Ramaiah University. All rights reserved.</p>
        <p className="opacity-60">Attitude Development for Sustainability Ops portal integration.</p>
      </div>

    </div>
  );
}
