'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  EventItem,
  EventPassItem,
  EventPassType,
  EventGuestCategory,
  addEventPass,
} from '@/lib/local-data';
import { useDropTarget } from '@/components/ui/file-dropzone';

interface EventPassBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  selectedEventId: string;
  currentUserName: string;
  currentUserEmail?: string;
  onPassesImported: (count: number) => void;
}

interface ParsedPassRow {
  attendeeName: string;
  guestCategory: EventGuestCategory;
  passType: EventPassType;
  roomOrVenue: string;
  email?: string;
  phone?: string;
  org?: string;
  validity?: string;
  notes?: string;
  isValid: boolean;
  error?: string;
}

const VALID_PASS_TYPES: EventPassType[] = [
  'VIP Pass',
  'Keynote Speaker',
  'Executive Delegate',
  'Student Delegate',
  'Guest Pass',
  'Press / Media',
  'Organizer',
];

const VALID_CATEGORIES: EventGuestCategory[] = [
  'Student',
  'Faculty',
  'VIP Dignitary',
  'Keynote Speaker',
  'Industry Partner',
  'Alumni',
  'Press / Media',
  'Organizer / Crew',
  'Special Guest',
];

export function EventPassBulkModal({
  isOpen,
  onClose,
  events,
  selectedEventId,
  currentUserName,
  currentUserEmail,
  onPassesImported,
}: EventPassBulkModalProps) {
  const [activeEventId, setActiveEventId] = useState(selectedEventId || events[0]?.id || '');
  const [parsedRows, setParsedRows] = useState<ParsedPassRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedEvent = events.find((e) => e.id === activeEventId) || events[0];

  const handleDownloadTemplate = () => {
    if (!selectedEvent) return;

    const formattedDate = selectedEvent.datesTBD
      ? 'Dates TBD'
      : `${selectedEvent.startDate}${selectedEvent.endDate ? ` – ${selectedEvent.endDate}` : ''}`;

    const headers = 'AttendeeName,GuestCategory,PassType,RoomOrVenue,Email,Mobile,Organization,CustomValidity,Notes\n';
    const sample1 = `Dr. Meera Swaminathan,Keynote Speaker,Keynote Speaker,Main Auditorium - VIP Box,meera.s@domain.com,+91 98765 43210,IISc Bangalore,${formattedDate},Invited Speaker\n`;
    const sample2 = `Alex Chen,VIP Dignitary,VIP Pass,Main Auditorium - Front Row,alex.chen@techcorp.com,+91 98450 11223,TechCorp Singapore,${formattedDate},Executive Sponsor\n`;
    const sample3 = `Rohan Sharma,Student,Student Delegate,Seminar Hall A - Room 102,rohan.s@msruas.ac.in,+91 91234 56789,RUAS FET,${formattedDate},Student Project Lead\n`;
    const sample4 = `Priya Nambiar,Faculty,Executive Delegate,Seminar Hall B - Room 204,priya.n@msruas.ac.in,+91 99887 76655,RUAS FMC,${formattedDate},Session Chair`;

    const blob = new Blob([headers + sample1 + sample2 + sample3 + sample4], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `leads_event_passes_${selectedEvent.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvFile = (file: File | undefined) => {
    if (!file) return;
    setErrorMessage('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          setErrorMessage('CSV file is empty or missing data rows.');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''));
        const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('attendee'));
        const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('guesttype'));
        const passIdx = headers.findIndex((h) => h.includes('pass') || h.includes('tier') || h.includes('type'));
        const roomIdx = headers.findIndex((h) => h.includes('room') || h.includes('venue') || h.includes('hall') || h.includes('seat'));
        const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
        const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
        const orgIdx = headers.findIndex((h) => h.includes('org') || h.includes('company') || h.includes('affiliation'));
        const valIdx = headers.findIndex((h) => h.includes('validity') || h.includes('date'));
        const notesIdx = headers.findIndex((h) => h.includes('notes') || h.includes('remark'));

        if (nameIdx === -1) {
          setErrorMessage('Missing required "AttendeeName" column in CSV headers.');
          return;
        }

        const rows: ParsedPassRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
          if (values.length < 1) continue;

          const rawName = values[nameIdx] || '';
          if (!rawName) continue;

          const rawCat = catIdx !== -1 ? values[catIdx] : '';
          const matchedCategory = VALID_CATEGORIES.find(
            (c) => c.toLowerCase() === rawCat.toLowerCase()
          ) || 'Guest Attendee' as any;

          const rawPass = passIdx !== -1 ? values[passIdx] : '';
          const matchedPassType = VALID_PASS_TYPES.find(
            (pt) => pt.toLowerCase() === rawPass.toLowerCase()
          ) || 'Guest Pass';

          const room = (roomIdx !== -1 ? values[roomIdx] : '') || selectedEvent?.location || 'Main Auditorium';
          const email = emailIdx !== -1 ? values[emailIdx] : undefined;
          const phone = phoneIdx !== -1 ? values[phoneIdx] : undefined;
          const org = orgIdx !== -1 ? values[orgIdx] : undefined;
          const validity = valIdx !== -1 ? values[valIdx] : undefined;
          const notes = notesIdx !== -1 ? values[notesIdx] : undefined;

          rows.push({
            attendeeName: rawName,
            guestCategory: matchedCategory,
            passType: matchedPassType,
            roomOrVenue: room,
            email,
            phone,
            org,
            validity,
            notes,
            isValid: true,
          });
        }

        if (rows.length === 0) {
          setErrorMessage('No valid attendee rows found in the CSV.');
          return;
        }

        setParsedRows(rows);
      } catch (err) {
        console.error(err);
        setErrorMessage('Failed to parse CSV file. Please check file format.');
      }
    };
    reader.readAsText(file);
  };

  const { isDragOver, dragHandlers } = useDropTarget((files) => handleCsvFile(files[0]));

  const handleExecuteBulkCreation = async () => {
    if (!selectedEvent || parsedRows.length === 0) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const formattedDate = selectedEvent.datesTBD
        ? 'Dates TBD'
        : `${selectedEvent.startDate}${selectedEvent.endDate ? ` – ${selectedEvent.endDate}` : ''}`;

      let createdCount = 0;

      for (const row of parsedRows) {
        if (!row.isValid) continue;

        addEventPass({
          eventId: selectedEvent.id,
          eventName: selectedEvent.title,
          eventDate: formattedDate,
          eventVenue: selectedEvent.location || 'LEADS Next Gen Centre Auditorium',
          attendeeName: row.attendeeName,
          guestCategory: row.guestCategory,
          roomOrVenue: row.roomOrVenue,
          attendeeEmail: row.email,
          attendeePhone: row.phone,
          attendeeOrg: row.org,
          passType: row.passType,
          accessTier: row.passType === 'VIP Pass' ? 'All Access VIP' : 'General Admission',
          validityDate: row.validity || formattedDate,
          seatOrZone: row.roomOrVenue,
          notes: row.notes,
          issuedBy: currentUserName,
          issuedByEmail: currentUserEmail,
        });

        createdCount++;
      }

      setImportSuccess(`Successfully issued ${createdCount} verified passes for ${selectedEvent.title}!`);
      onPassesImported(createdCount);
      setTimeout(() => {
        onClose();
        setParsedRows([]);
        setImportSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred during bulk pass creation.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 md:p-8 space-y-6 relative border border-slate-200/90 dark:border-white/15 bg-white/95 dark:bg-[#0D1F38]/95 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Bulk Event Pass Issuance (CSV)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Design one pass, download template, and upload your entire attendee list in bulk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {importSuccess && (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{importSuccess}</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
          {/* 1. Target Event Selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Select Event for Bulk Pass Issuance *
            </label>
            <select
              value={activeEventId}
              onChange={(e) => setActiveEventId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-accent text-xs"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Download Template Action */}
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-sky-400 text-xs">Step 1: Download Event Template</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Pre-configured with event dates, room allocation headers, and sample VIP/Speaker tiers.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
            >
              <Download className="h-4 w-4" /> Download CSV Template
            </button>
          </div>

          {/* 3. Dropzone Upload Area */}
          <div
            {...dragHandlers}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-accent bg-accent/15 scale-[1.01]'
                : 'border-slate-300 dark:border-white/15 hover:border-accent/60 bg-slate-50/50 dark:bg-white/5'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                handleCsvFile(e.target.files?.[0]);
                e.target.value = '';
              }}
              accept=".csv"
              className="hidden"
            />
            <Upload className="h-8 w-8 text-accent mb-2 animate-bounce" />
            <div className="font-extrabold text-slate-800 dark:text-white text-xs">
              {isDragOver ? 'Drop CSV file here' : 'Click to Upload or Drag & Drop CSV'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Supports .csv files with AttendeeName, GuestCategory, PassType, RoomOrVenue
            </div>
          </div>

          {/* 4. Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-accent" />
                  Parsed {parsedRows.length} Attendee Records Ready to Issue
                </span>
                <button
                  type="button"
                  onClick={() => setParsedRows([])}
                  className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  Clear Table
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-white/5 text-slate-500 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Attendee</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Pass Tier</th>
                      <th className="py-2 px-3">Room / Venue</th>
                      <th className="py-2 px-3">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {row.attendeeName}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[9.5px] font-bold">
                            {row.guestCategory}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                          {row.passType}
                        </td>
                        <td className="py-2 px-3 text-sky-400 font-semibold">
                          📍 {row.roomOrVenue}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[10px]">
                          {row.email || row.phone || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200/80 dark:border-white/10 pt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isProcessing || parsedRows.length === 0}
            onClick={handleExecuteBulkCreation}
            className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-accent/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Issuing {parsedRows.length} Passes...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Issue {parsedRows.length} Passes in Bulk
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventPassBulkModal;
