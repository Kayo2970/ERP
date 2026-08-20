'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  X, 
  ShieldAlert, 
  CheckCircle, 
  Search, 
  UserMinus, 
  Edit2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Users,
  Award,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Eye,
  CheckSquare,
  Square,
  MinusSquare,
  Layers,
  BookOpen
} from 'lucide-react';
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  bulkUpdateMembers,
  bulkDeleteMembers,
  logAuditEvent,
  Member,
  MemberDivision
} from '@/lib/local-data';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StudentProfileModal } from '@/components/student-profile-modal';
import { canViewFullDirectory, canEditDirectory } from '@/lib/permissions';

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<keyof Member>('tier');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Manual Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [division, setDivision] = useState<MemberDivision>('Training Associate');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');
  
  // Notification Alert State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Bulk Selection & Uniform Actions State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Bulk Edit Form State
  const [bulkDivision, setBulkDivision] = useState<MemberDivision | ''>('');
  const [bulkRole, setBulkRole] = useState('');
  const [bulkBatch, setBulkBatch] = useState('');
  const [applyDivision, setApplyDivision] = useState(true);
  const [applyRole, setApplyRole] = useState(false);
  const [applyBatch, setApplyBatch] = useState(false);

  // Edit Member Form State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDivision, setEditDivision] = useState<MemberDivision>('Training Associate');
  const [editDepartment, setEditDepartment] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editTierOverride, setEditTierOverride] = useState<number>(6);

  useEffect(() => {
    const refreshData = () => {
      setMembers(getMembers());
    };
    refreshData();

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

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const TIER_LABELS = [
    { tier: 1, label: 'Super User' },
    { tier: 2, label: 'Executive Leadership' },
    { tier: 3, label: 'Senior Leadership / Head of Events' },
    { tier: 4, label: 'Advisory Board' },
    { tier: 5, label: 'Core Committee' },
    { tier: 6, label: 'Training Associate' },
    { tier: 7, label: 'Alumni' },
  ];

  const getTierForDivision = (div: MemberDivision, currentTier?: number): number => {
    if (div === 'Advisory Board') return currentTier && currentTier <= 4 ? currentTier : 4;
    if (div === 'Faculty') return currentTier && currentTier <= 4 ? currentTier : 4;
    if (div === 'Core Committee') return 5;
    if (div === 'Training Associate') return 6;
    if (div === 'Alumni') return 7;
    return 6;
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      const calculatedTier = getTierForDivision(division);

      addMember({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role.trim() || (division === 'Alumni' ? 'Alumni Member' : division),
        tier: calculatedTier,
        division,
        department: department.trim() || undefined,
        program: program.trim() || undefined,
        batch: division === 'Alumni' ? batch.trim() : undefined
      });

      setName('');
      setEmail('');
      setRole('');
      setDivision('Training Associate');
      setDepartment('');
      setProgram('');
      setBatch('');
      setIsModalOpen(false);

      setMembers(getMembers());
      triggerSuccess('New member added to roster successfully.');
    } catch (err: any) {
      triggerError(err.message || 'Failed to add member.');
    }
  };

  const startEdit = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditDivision(member.division || 'Training Associate');
    setEditDepartment(member.department || '');
    setEditProgram(member.program || '');
    setEditBatch(member.batch || '');
    setEditTierOverride(member.tier || 6);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;

    const currentMembers = getMembers();
    const emailConflict = currentMembers.some(
      m => m.id !== editingMember.id && m.email.toLowerCase() === editEmail.toLowerCase().trim()
    );
    if (emailConflict) {
      triggerError(`Email ${editEmail} is already assigned to another member.`);
      return;
    }

    // Only the Super User can hand-set an exact access tier, independent of
    // division — everyone else's tier stays auto-derived from division, same
    // as before this control existed.
    const isSuperUser = user?.tier === 1;
    const finalTier = isSuperUser ? editTierOverride : getTierForDivision(editDivision, editingMember.tier);
    const tierChanged = isSuperUser && finalTier !== editingMember.tier;

    updateMember(editingMember.id, {
      name: editName.trim(),
      email: editEmail.toLowerCase().trim(),
      role: editRole.trim() || editDivision,
      tier: finalTier,
      division: editDivision,
      department: editDepartment.trim() || undefined,
      program: editProgram.trim() || undefined,
      batch: editDivision === 'Alumni' ? editBatch.trim() : undefined
    }, user?.name || 'Admin');

    if (tierChanged) {
      logAuditEvent(
        'MEMBER_ACCESS_LEVEL_CHANGED',
        user?.name || 'Admin',
        `Changed ${editName.trim()}'s access tier from ${editingMember.tier} to ${finalTier}`,
        user?.email
      );
    }

    setEditingMember(null);
    setMembers(getMembers());
    triggerSuccess('Member details and division updated.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Email,Division,Role,Department,Program,Batch\n' +
      'John Doe,john.doe@msruas.ac.in,Training Associate,Junior Coordinator,Operations and Logistics,B.Tech Computer Science Engineering,\n' +
      'Jane Smith,jane.smith@msruas.ac.in,Core Committee,Vice President,Executive Council,B.Tech Electronics and Communication,\n' +
      'Dr. Sharath Kumar,sharath.kumar@msruas.ac.in,Advisory Board,Advisory Member,Faculty Advisory,,\n' +
      'Dr. Ajay Rao,ajay.rao@msruas.ac.in,Faculty,Assistant Professor,Faculty Advisory,,\n' +
      'Kayomarz M Pavri,kayomarz.m@msruas.ac.in,Alumni,Alumni Mentor,Design and Social Media,,Class of 2024';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_organization_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          triggerError('CSV file is empty or missing headers.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const emailIndex = headers.indexOf('email');
        const divisionIndex = headers.indexOf('division');
        const roleIndex = headers.indexOf('role');
        const deptIndex = headers.indexOf('department');
        const programIndex = headers.indexOf('program');
        const batchIndex = headers.indexOf('batch');

        if (nameIndex === -1 || emailIndex === -1) {
          triggerError('Invalid CSV headers. Required at minimum: Name, Email');
          return;
        }

        // Track emails seen so far (existing roster + rows already imported this
        // pass) so both cross-roster AND within-file duplicates are caught, while
        // each new row still goes through addMember() so it actually reaches the
        // server — a manual push + single saveMembers() call at the end (the old
        // approach) only ever wrote localStorage, never the server.
        const seenEmails = new Set(getMembers().map(m => m.email.toLowerCase()));
        let importCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
          if (values.length < 2) continue;

          const mName = values[nameIndex];
          const mEmail = values[emailIndex]?.toLowerCase();
          const mDivStr = divisionIndex !== -1 ? values[divisionIndex] : '';
          const mRole = roleIndex !== -1 ? values[roleIndex] : '';
          const mDept = deptIndex !== -1 ? values[deptIndex] : '';
          const mProgram = programIndex !== -1 ? values[programIndex] : '';
          const mBatch = batchIndex !== -1 ? values[batchIndex] : '';

          if (!mName || !mEmail) continue;

          if (seenEmails.has(mEmail)) {
            duplicateCount++;
            continue;
          }

          let mDivision: MemberDivision = 'Training Associate';
          const divLower = mDivStr.toLowerCase();
          const roleLower = mRole.toLowerCase();

          if (divLower.includes('faculty') || roleLower.includes('professor') || roleLower.includes('faculty')) {
            mDivision = 'Faculty';
          } else if (divLower.includes('advisor') || divLower.includes('board')) {
            mDivision = 'Advisory Board';
          } else if (
            divLower.includes('core') ||
            roleLower.startsWith('head') ||
            roleLower.includes('president') ||
            roleLower.includes('secretary') ||
            roleLower.includes('chief coordinator')
          ) {
            mDivision = 'Core Committee';
          } else if (divLower.includes('alumni')) {
            mDivision = 'Alumni';
          } else {
            mDivision = 'Training Associate';
          }

          const mTier = getTierForDivision(mDivision);

          try {
            addMember({
              name: mName,
              email: mEmail,
              role: mRole || mDivision,
              tier: mTier,
              division: mDivision,
              department: mDept || undefined,
              program: mProgram || undefined,
              batch: mDivision === 'Alumni' ? mBatch : undefined
            });
            seenEmails.add(mEmail);
            importCount++;
          } catch {
            duplicateCount++;
          }
        }

        if (importCount > 0) {
          setMembers(getMembers());
          triggerSuccess(`Successfully imported ${importCount} new members. ${duplicateCount > 0 ? `(${duplicateCount} duplicate emails skipped)` : ''}`);
        } else if (duplicateCount > 0) {
          triggerError(`No new members imported. ${duplicateCount} duplicate email addresses found in file.`);
        } else {
          triggerError('No valid member rows found in the CSV.');
        }
      } catch {
        triggerError('Error parsing CSV file. Please verify formatting.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmDelete = () => {
    if (!deletingMember) return;
    try {
      deleteMember(deletingMember.id);
      setMembers(getMembers());
      triggerSuccess(`Removed ${deletingMember.name} from directory.`);
    } catch (err: any) {
      triggerError(err.message || 'Failed to remove member.');
    } finally {
      setDeletingMember(null);
    }
  };

  const toggleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const isAdmin = canEditDirectory(user);
  const canViewRoster = canViewFullDirectory(user);

  // Filter members list based on division tab and search query
  const filteredMembers = members
    .filter(m => {
      if (selectedDivision !== 'ALL' && m.division !== selectedDivision) return false;
      const q = searchQuery.toLowerCase();
      const nameMatch = (m.name || '').toLowerCase().includes(q);
      const emailMatch = (m.email || '').toLowerCase().includes(q);
      const roleMatch = (m.role || '').toLowerCase().includes(q);
      const divMatch = (m.division || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || roleMatch || divMatch;
    })
    .sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Division counts
  const advisoryCount = members.filter(m => m.division === 'Advisory Board').length;
  const coreCount = members.filter(m => m.division === 'Core Committee').length;
  const trainingCount = members.filter(m => m.division === 'Training Associate').length;
  const alumniCount = members.filter(m => m.division === 'Alumni').length;
  const facultyCount = members.filter(m => m.division === 'Faculty').length;

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Checkbox selection helpers
  const paginatedIds = paginatedMembers.map(m => m.id);
  const allPaginatedSelected = paginatedMembers.length > 0 && paginatedMembers.every(m => selectedMemberIds.includes(m.id));
  const somePaginatedSelected = paginatedMembers.some(m => selectedMemberIds.includes(m.id)) && !allPaginatedSelected;

  const toggleSelectAllPage = () => {
    if (allPaginatedSelected) {
      const pageIdSet = new Set(paginatedIds);
      setSelectedMemberIds(prev => prev.filter(id => !pageIdSet.has(id)));
    } else {
      setSelectedMemberIds(prev => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const toggleSelectMember = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    setSelectedMemberIds(filteredMembers.map(m => m.id));
  };

  const handleClearSelection = () => {
    setSelectedMemberIds([]);
  };

  // Bulk Operations Handlers
  const handleBulkMoveDivision = (targetDivision: MemberDivision) => {
    if (selectedMemberIds.length === 0) return;
    try {
      const calculatedTier = getTierForDivision(targetDivision);
      bulkUpdateMembers(
        selectedMemberIds,
        {
          division: targetDivision,
          tier: calculatedTier,
          batch: targetDivision === 'Alumni' ? 'Class of 2025' : undefined
        },
        user?.name || 'Admin'
      );
      setMembers(getMembers());
      triggerSuccess(`Successfully moved ${selectedMemberIds.length} members to ${targetDivision}.`);
      setSelectedMemberIds([]);
    } catch (err: any) {
      triggerError(err.message || 'Failed to update division for selected members.');
    }
  };

  const handleApplyBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) return;

    if (!applyDivision && !applyRole && !applyBatch) {
      triggerError('Please select at least one field to update.');
      return;
    }

    try {
      const updates: Partial<Pick<Member, 'division' | 'role' | 'batch' | 'tier'>> = {};
      if (applyDivision && bulkDivision) {
        updates.division = bulkDivision as MemberDivision;
        updates.tier = getTierForDivision(bulkDivision as MemberDivision);
      }
      if (applyRole && bulkRole.trim()) {
        updates.role = bulkRole.trim();
      }
      if (applyBatch) {
        updates.batch = bulkBatch.trim() || undefined;
      }

      bulkUpdateMembers(selectedMemberIds, updates, user?.name || 'Admin');
      setMembers(getMembers());
      triggerSuccess(`Applied uniform updates to ${selectedMemberIds.length} members.`);
      setIsBulkEditModalOpen(false);
      setSelectedMemberIds([]);
      // Reset form
      setBulkDivision('');
      setBulkRole('');
      setBulkBatch('');
      setApplyDivision(true);
      setApplyRole(false);
      setApplyBatch(false);
    } catch (err: any) {
      triggerError(err.message || 'Failed to apply uniform changes.');
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedMemberIds.length === 0) return;
    const selectedList = members.filter(m => selectedMemberIds.includes(m.id));
    const header = 'Name,Email,Division,Role,Batch';
    const rows = selectedList.map(m => 
      `"${(m.name || '').replace(/"/g, '""')}","${(m.email || '').replace(/"/g, '""')}","${(m.division || '').replace(/"/g, '""')}","${(m.role || '').replace(/"/g, '""')}","${(m.batch || '').replace(/"/g, '""')}"`
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_members_export_${selectedMemberIds.length}_selected.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess(`Exported ${selectedMemberIds.length} members to CSV.`);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedMemberIds.length === 0) return;
    try {
      bulkDeleteMembers(selectedMemberIds, user?.name || 'Admin');
      setMembers(getMembers());
      triggerSuccess(`Removed ${selectedMemberIds.length} members from directory.`);
      setSelectedMemberIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err: any) {
      triggerError(err.message || 'Failed to remove selected members.');
    }
  };

  if (user && !canViewRoster) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">My Profile</h1>
          <p className="text-xs text-theme-text-secondary">The full organization directory is limited to Core Committee, Advisory Board, and Head designations.</p>
        </div>
        <StudentProfileModal
          memberIdOrName={user.id || user.name}
          onClose={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-danger/15 border border-danger/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <ShieldAlert className="h-5 w-5 text-danger shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header section with actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary">Organization Members Directory</h1>
          <p className="text-xs text-theme-text-secondary">Explore center divisions: Advisory Board, Core Committee, Training Associates, and Alumni</p>
        </div>
        
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
              title="Download CSV Template"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
            
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
              title="Upload Filled CSV File"
            >
              <Upload className="h-4 w-4" />
              Upload Roster (CSV)
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          </div>
        )}
      </div>

      {/* Division Category Selector Tabs */}
      <div className="flex flex-wrap gap-2 pt-1 border-b border-theme-border/30 pb-3 text-xs font-semibold">
        <button
          onClick={() => { setSelectedDivision('ALL'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'ALL'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          All Members ({members.length})
        </button>

        <button
          onClick={() => { setSelectedDivision('Advisory Board'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'Advisory Board'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-warning" />
          Advisory Board ({advisoryCount})
        </button>

        <button
          onClick={() => { setSelectedDivision('Faculty'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'Faculty'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
          Faculty ({facultyCount})
        </button>

        <button
          onClick={() => { setSelectedDivision('Core Committee'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'Core Committee'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <Award className="h-3.5 w-3.5 text-accent" />
          Core Committee ({coreCount})
        </button>

        <button
          onClick={() => { setSelectedDivision('Training Associate'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'Training Associate'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5 text-success" />
          Training Associates ({trainingCount})
        </button>

        <button
          onClick={() => { setSelectedDivision('Alumni'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedDivision === 'Alumni'
              ? 'bg-accent text-white shadow-sm'
              : 'bg-theme-border/20 text-theme-text-secondary hover:text-theme-text-primary'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
          Alumni Mentors ({alumniCount})
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Search className="h-4.5 w-4.5 text-theme-text-secondary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search directory by name, email, designation, or division..."
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-theme-text-primary placeholder-theme-text-secondary"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-theme-text-secondary">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-theme-background/40 border border-theme-border/40 rounded-lg text-xs text-theme-text-primary focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="font-semibold text-theme-text-primary">{filteredMembers.length} members</span>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl p-6 overflow-hidden space-y-4">
        <div className="overflow-x-auto">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-theme-text-secondary text-xs">
              No matching members found in the directory.
            </div>
          ) : (
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="text-theme-text-secondary border-b border-theme-border/40 text-xs">
                  <th className="pb-3.5 pl-2 pr-2 w-10 text-center select-none">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="p-1 hover:text-accent transition-colors cursor-pointer"
                      title={allPaginatedSelected ? 'Deselect all on this page' : 'Select all on this page'}
                    >
                      {allPaginatedSelected ? (
                        <CheckSquare className="h-4 w-4 text-accent" />
                      ) : somePaginatedSelected ? (
                        <MinusSquare className="h-4 w-4 text-accent" />
                      ) : (
                        <Square className="h-4 w-4 opacity-50 hover:opacity-100" />
                      )}
                    </button>
                  </th>
                  <th 
                    onClick={() => toggleSort('name')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('email')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Email Address <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('division')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Organization Division <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('role')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Designation / Role <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort('department')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Department <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort('program')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Program <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="pb-3.5 font-semibold text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {paginatedMembers.map(member => {
                  const isSelected = selectedMemberIds.includes(member.id);

                  return (
                    <tr 
                      key={member.id} 
                      onClick={() => toggleSelectMember(member.id)}
                      className={`hover:bg-accent/5 transition-all text-xs cursor-pointer select-none ${
                        isSelected ? 'backdrop-blur-md bg-white/10 dark:bg-white/5 border-l-2 border-l-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : ''
                      }`}
                    >
                      <td className="py-3.5 pl-2 pr-2 text-center" onClick={(e) => toggleSelectMember(member.id, e)}>
                        <button
                          type="button"
                          className="p-1 hover:text-accent transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-accent" />
                          ) : (
                            <Square className="h-4 w-4 text-theme-text-secondary/60 hover:text-accent" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 pr-2 font-bold text-theme-text-primary flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20 shrink-0">
                          <span className="text-[11px] font-bold text-accent">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span>{member.name}</span>
                          {member.batch && (
                            <span className="block text-[10px] text-theme-text-secondary font-normal">{member.batch}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{member.email}</td>
                      <td className="py-3.5 pr-2">
                        <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          member.division === 'Advisory Board' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          member.division === 'Faculty' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                          member.division === 'Core Committee' ? 'bg-accent/15 text-accent border-accent/30' :
                          member.division === 'Alumni' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {member.division}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{member.role}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{member.department || '—'}</td>
                      <td className="py-3.5 pr-2 text-theme-text-secondary">{member.program || '—'}</td>
                      <td className="py-3.5 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={() => setSelectedStudentForProfile(member.id)}
                            className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                            title="View Student Profile & Outcomes"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-[11px] font-semibold hidden sm:inline">Profile</span>
                          </button>
                          
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => startEdit(member)}
                                className="p-1.5 text-theme-text-secondary hover:text-accent hover:bg-theme-border/20 rounded-lg transition-all cursor-pointer"
                                title="Edit Member"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              
                              {member.id !== 'm1' && (
                                <button
                                  onClick={() => setDeletingMember(member)}
                                  className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all cursor-pointer"
                                  title="Remove Member"
                                >
                                  <UserMinus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-theme-border/20 text-xs">
            <span className="text-theme-text-secondary">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-theme-border/30 hover:bg-theme-border/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-theme-text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-theme-border/30 hover:bg-theme-border/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-theme-text-primary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Add Member to Organization</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya.s@msruas.ac.in"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Organization Division</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value as MemberDivision)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Advisory Board">Advisory Board</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Core Committee">Core Committee</option>
                    <option value="Training Associate">Training Associate</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Designation / Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Operations Lead"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Design and Social Media"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Program</label>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {division === 'Alumni' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Graduating Class / Batch</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. Class of 2024"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Add Member to Organization
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Edit Member Details</h2>
              <button 
                onClick={() => setEditingMember(null)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Organization Division</label>
                  <select
                     value={editDivision}
                     onChange={(e) => setEditDivision(e.target.value as MemberDivision)}
                     className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="Advisory Board">Advisory Board</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Core Committee">Core Committee</option>
                    <option value="Training Associate">Training Associate</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Designation / Role</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Design and Social Media"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Program</label>
                  <input
                    type="text"
                    value={editProgram}
                    onChange={(e) => setEditProgram(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {user?.tier === 1 && (
                <div className="space-y-1.5 p-3 bg-warning/5 border border-warning/20 rounded-xl">
                  <label className="flex items-center gap-1.5 font-medium text-warning">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Access Tier (Super User Override)
                  </label>
                  <select
                    value={editTierOverride}
                    onChange={(e) => setEditTierOverride(parseInt(e.target.value, 10))}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-warning/30 rounded-xl text-theme-text-primary focus:outline-none focus:border-warning"
                  >
                    {TIER_LABELS.map(({ tier, label }) => (
                      <option key={tier} value={tier}>Tier {tier} — {label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-theme-text-secondary">
                    Overrides the tier this member's division would normally assign. Takes effect immediately across every module — tasks, events, reimbursement approvals, and any Group Policy targeting by tier.
                  </p>
                </div>
              )}

              {editDivision === 'Alumni' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Graduating Class / Batch</label>
                  <input
                    type="text"
                    value={editBatch}
                    onChange={(e) => setEditBatch(e.target.value)}
                    placeholder="e.g. Class of 2024"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Save Member Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingMember)}
        title="Remove Member from Organization"
        message={`Are you sure you want to remove ${deletingMember?.name} (${deletingMember?.email}) from the LEADS directory?`}
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMember(null)}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        title={`Remove ${selectedMemberIds.length} Members`}
        message={`Are you sure you want to remove all ${selectedMemberIds.length} selected members from the LEADS organization directory? This action cannot be undone.`}
        confirmLabel={`Remove ${selectedMemberIds.length} Members`}
        variant="danger"
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        memberIdOrName={selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
      />

      {/* Floating Bulk Actions Toolbar */}
      {selectedMemberIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl glass-panel backdrop-blur-xl bg-theme-card/60 border border-accent/40 shadow-2xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-accent/20 border border-accent/40 text-accent font-bold rounded-xl text-xs flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span>{selectedMemberIds.length} Selected</span>
            </div>
            {selectedMemberIds.length < filteredMembers.length && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs text-accent hover:underline font-semibold cursor-pointer hidden md:inline"
              >
                Select all {filteredMembers.length} matching members
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkMoveDivision(e.target.value as MemberDivision);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="px-3 py-1.5 bg-theme-background/60 border border-theme-border/50 rounded-xl text-xs font-semibold text-theme-text-primary focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="" disabled>Move Division...</option>
                    <option value="Advisory Board">Advisory Board</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Core Committee">Core Committee</option>
                    <option value="Training Associate">Training Associate</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                  title="Apply uniform standard changes to selected members"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Uniform Bulk Edit
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleBulkExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all border border-theme-border/40 cursor-pointer"
              title="Export selected members to CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export Selected
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                title="Remove selected members"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Delete ({selectedMemberIds.length})
              </button>
            )}

            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-border/20 rounded-xl transition-all cursor-pointer"
              title="Clear Selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Uniform Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-theme-card-border shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-theme-border/30 pb-4">
              <div>
                <h3 className="text-base font-bold text-theme-text-primary flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" />
                  Uniform Standard Change ({selectedMemberIds.length} Members)
                </h3>
                <p className="text-xs text-theme-text-secondary">Apply synchronized updates across all selected members</p>
              </div>
              <button
                onClick={() => setIsBulkEditModalOpen(false)}
                className="p-1.5 text-theme-text-secondary hover:text-theme-text-primary rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkEdit} className="space-y-4 text-xs">
              {/* Division Update */}
              <div className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-semibold text-theme-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyDivision}
                    onChange={(e) => setApplyDivision(e.target.checked)}
                    className="rounded accent-accent h-4 w-4 cursor-pointer"
                  />
                  <span>Change Organization Division</span>
                </label>
                {applyDivision && (
                  <select
                    value={bulkDivision}
                    onChange={(e) => setBulkDivision(e.target.value as MemberDivision)}
                    className="w-full px-3 py-2 bg-theme-background/60 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent font-medium mt-1"
                    required={applyDivision}
                  >
                    <option value="" disabled>Select target division...</option>
                    <option value="Advisory Board">Advisory Board</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Core Committee">Core Committee</option>
                    <option value="Training Associate">Training Associate</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                )}
              </div>

              {/* Designation / Role Update */}
              <div className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-semibold text-theme-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyRole}
                    onChange={(e) => setApplyRole(e.target.checked)}
                    className="rounded accent-accent h-4 w-4 cursor-pointer"
                  />
                  <span>Set Uniform Designation / Role</span>
                </label>
                {applyRole && (
                  <input
                    type="text"
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    placeholder="e.g. Senior Associate, Event Coordinator"
                    className="w-full px-3 py-2 bg-theme-background/60 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent mt-1"
                    required={applyRole}
                  />
                )}
              </div>

              {/* Batch Update */}
              <div className="p-3.5 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-2">
                <label className="flex items-center gap-2 font-semibold text-theme-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyBatch}
                    onChange={(e) => setApplyBatch(e.target.checked)}
                    className="rounded accent-accent h-4 w-4 cursor-pointer"
                  />
                  <span>Set Graduating Class / Batch</span>
                </label>
                {applyBatch && (
                  <input
                    type="text"
                    value={bulkBatch}
                    onChange={(e) => setBulkBatch(e.target.value)}
                    placeholder="e.g. Class of 2025"
                    className="w-full px-3 py-2 bg-theme-background/60 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent mt-1"
                  />
                )}
              </div>

              {/* Selected Members Preview */}
              <div className="space-y-1.5 pt-1">
                <span className="font-semibold text-theme-text-secondary text-[11px]">Selected Members Preview:</span>
                <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1 p-2 bg-theme-background/40 border border-theme-border/20 rounded-xl">
                  {members.filter(m => selectedMemberIds.includes(m.id)).map(m => (
                    <span key={m.id} className="text-[10px] px-2 py-0.5 bg-accent/15 text-theme-text-primary border border-accent/20 rounded-md">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-theme-border/30">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="px-4 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl text-xs shadow-md shadow-accent/15 cursor-pointer"
                >
                  Apply to {selectedMemberIds.length} Members
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
