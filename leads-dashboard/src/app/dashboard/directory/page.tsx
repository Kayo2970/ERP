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
  Eye
} from 'lucide-react';
import { 
  getMembers, 
  saveMembers, 
  addMember, 
  deleteMember, 
  Member,
  MemberDivision
} from '@/lib/local-data';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { StudentProfileModal } from '@/components/student-profile-modal';

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
  const [batch, setBatch] = useState('');
  
  // Notification Alert State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Member Form State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDivision, setEditDivision] = useState<MemberDivision>('Training Associate');
  const [editBatch, setEditBatch] = useState('');

  useEffect(() => {
    setMembers(getMembers());
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
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

  const getTierForDivision = (div: MemberDivision, currentTier?: number): number => {
    if (div === 'Advisory Board') return currentTier && currentTier <= 4 ? currentTier : 4;
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
        batch: division === 'Alumni' ? batch.trim() : undefined
      });

      setName('');
      setEmail('');
      setRole('');
      setDivision('Training Associate');
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
    setEditBatch(member.batch || '');
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

    const calculatedTier = getTierForDivision(editDivision, editingMember.tier);

    const updated = currentMembers.map(m => m.id === editingMember.id ? {
      ...m,
      name: editName.trim(),
      email: editEmail.toLowerCase().trim(),
      role: editRole.trim() || editDivision,
      tier: calculatedTier,
      division: editDivision,
      batch: editDivision === 'Alumni' ? editBatch.trim() : undefined
    } : m);

    saveMembers(updated);
    setEditingMember(null);
    setMembers(getMembers());
    triggerSuccess('Member details and division updated.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Email,Division,Role,Batch\nJohn Doe,john.doe@msruas.ac.in,Training Associate,Junior Coordinator,\nJane Smith,jane.smith@msruas.ac.in,Core Committee,Vice President,\nDr. Sharath Kumar,sharath.kumar@msruas.ac.in,Advisory Board,Advisory Member,\nKayomarz M Pavri,kayomarz.m@msruas.ac.in,Alumni,Alumni Mentor,Class of 2024';
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
        const batchIndex = headers.indexOf('batch');

        if (nameIndex === -1 || emailIndex === -1) {
          triggerError('Invalid CSV headers. Required at minimum: Name, Email');
          return;
        }

        const currentMembers = getMembers();
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
          const mBatch = batchIndex !== -1 ? values[batchIndex] : '';

          if (!mName || !mEmail) continue;

          if (currentMembers.some(m => m.email.toLowerCase() === mEmail)) {
            duplicateCount++;
            continue;
          }

          let mDivision: MemberDivision = 'Training Associate';
          const divLower = mDivStr.toLowerCase();
          if (divLower.includes('advisor') || divLower.includes('board')) mDivision = 'Advisory Board';
          else if (divLower.includes('core')) mDivision = 'Core Committee';
          else if (divLower.includes('alumni')) mDivision = 'Alumni';
          else mDivision = 'Training Associate';

          const mTier = getTierForDivision(mDivision);

          const newMember: Member = {
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: mName,
            email: mEmail,
            role: mRole || mDivision,
            tier: mTier,
            division: mDivision,
            batch: mDivision === 'Alumni' ? mBatch : undefined
          };

          currentMembers.push(newMember);
          importCount++;
        }

        if (importCount > 0) {
          saveMembers(currentMembers);
          setMembers(getMembers());
          triggerSuccess(`Successfully imported ${importCount} new members. ${duplicateCount > 0 ? `(${duplicateCount} duplicate emails skipped)` : ''}`);
        } else if (duplicateCount > 0) {
          triggerError(`No new members imported. ${duplicateCount} duplicate email addresses found in file.`);
        } else {
          triggerError('No valid member rows found in the CSV.');
        }
      } catch (err) {
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

  const isAdmin = user && (user.tier <= 3 || user.tier === 1);

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

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                  <th className="pb-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {paginatedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-theme-border/10 transition-all text-xs">
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
                        member.division === 'Core Committee' ? 'bg-accent/15 text-accent border-accent/30' :
                        member.division === 'Alumni' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {member.division}
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-theme-text-secondary">{member.role}</td>
                    <td className="py-3.5 text-right">
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
                ))}
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

      {/* Student Profile Modal */}
      <StudentProfileModal
        memberIdOrName={selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
      />

    </div>
  );
}
