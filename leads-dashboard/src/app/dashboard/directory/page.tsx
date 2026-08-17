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
  Users
} from 'lucide-react';
import { 
  getMembers, 
  saveMembers, 
  addMember, 
  deleteMember,
  getCommittees, 
  addCommittee, 
  Member 
} from '@/lib/local-data';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function DirectoryPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortField, setSortField] = useState<keyof Member>('tier');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Manual Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTier, setRoleTier] = useState(6);
  const [committee, setCommittee] = useState('Organizing Committee');
  
  // Notification Alert State
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Committee State
  const [committees, setCommittees] = useState<string[]>([]);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [newCommitteeName, setNewCommitteeName] = useState('');

  // Edit Member Form State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleTier, setEditRoleTier] = useState(6);
  const [editCommittee, setEditCommittee] = useState('Organizing Committee');

  const startEdit = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRoleTier(member.tier);
    setEditCommittee(member.committee);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName || !editEmail) return;

    const rolesMap: { [key: number]: string } = {
      1: 'Super User',
      2: 'Centre Head',
      3: 'Head of Events',
      4: 'Advisory Board',
      5: 'Core Committee',
      6: 'Training Associate',
    };

    const currentMembers = getMembers();
    // Check if new email conflicts with another member
    const emailConflict = currentMembers.some(m => m.id !== editingMember.id && m.email.toLowerCase() === editEmail.toLowerCase().trim());
    if (emailConflict) {
      triggerError(`Email ${editEmail} is already assigned to another member.`);
      return;
    }

    const updated = currentMembers.map(m => m.id === editingMember.id ? {
      ...m,
      name: editName.trim(),
      email: editEmail.toLowerCase().trim(),
      role: rolesMap[editRoleTier] || 'Training Associate',
      tier: editRoleTier,
      committee: editCommittee
    } : m);

    saveMembers(updated);
    setEditingMember(null);
    setMembers(getMembers());
    triggerSuccess('Member details and privileges updated.');
  };

  useEffect(() => {
    setMembers(getMembers());
    setCommittees(getCommittees());
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const rolesMap: { [key: number]: string } = {
      1: 'Super User',
      2: 'Centre Head',
      3: 'Head of Events',
      4: 'Advisory Board',
      5: 'Core Committee',
      6: 'Training Associate',
    };

    try {
      addMember({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: rolesMap[roleTier] || 'Training Associate',
        tier: roleTier,
        committee
      });

      // Reset & Close
      setName('');
      setEmail('');
      setRoleTier(6);
      setCommittee('Organizing Committee');
      setIsModalOpen(false);

      // Refresh & Notify
      setMembers(getMembers());
      triggerSuccess('New member added to roster successfully.');
    } catch (err: any) {
      triggerError(err.message || 'Failed to add member.');
    }
  };

  const handleCreateCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitteeName.trim()) return;

    addCommittee(newCommitteeName.trim());
    setNewCommitteeName('');
    setIsCommitteeModalOpen(false);
    setCommittees(getCommittees());
    triggerSuccess('New event-based committee created successfully.');
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'Name,Email,Committee,Role\nJohn Doe,john.doe@msruas.ac.in,Organizing Committee,Training Associate\nJane Smith,jane.smith@msruas.ac.in,Senior Student Leadership,Core Committee';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_members_template.csv');
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
        const expectedHeaders = ['name', 'email', 'committee', 'role'];
        const hasAllHeaders = expectedHeaders.every(eh => headers.includes(eh));
        
        if (!hasAllHeaders) {
          triggerError('Invalid CSV headers. Required: Name, Email, Committee, Role');
          return;
        }

        const nameIndex = headers.indexOf('name');
        const emailIndex = headers.indexOf('email');
        const committeeIndex = headers.indexOf('committee');
        const roleIndex = headers.indexOf('role');

        const rolesMap: { [key: number]: string } = {
          1: 'Super User',
          2: 'Centre Head',
          3: 'Head of Events',
          4: 'Advisory Board',
          5: 'Core Committee',
          6: 'Training Associate',
        };

        const currentMembers = getMembers();
        let importCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
          if (values.length < 4) continue;

          const mName = values[nameIndex];
          const mEmail = values[emailIndex]?.toLowerCase();
          const mCommittee = values[committeeIndex];
          const mRole = values[roleIndex];

          if (!mName || !mEmail || !mRole) continue;

          // Duplicate Email Check
          if (currentMembers.some(m => m.email.toLowerCase() === mEmail)) {
            duplicateCount++;
            continue;
          }

          // Map string designation to Role Tier
          const mRoleLower = mRole.toLowerCase();
          let mTier = 6;
          if (mRoleLower.includes('super')) mTier = 1;
          else if (mRoleLower.includes('centre') || mRoleLower.includes('center') || mRoleLower.includes('head')) mTier = 2;
          else if (mRoleLower.includes('event')) mTier = 3;
          else if (mRoleLower.includes('advisory') || mRoleLower.includes('advisor')) mTier = 4;
          else if (mRoleLower.includes('core')) mTier = 5;
          else if (mRoleLower.includes('training') || mRoleLower.includes('associate')) mTier = 6;

          const newMember: Member = {
            id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: mName,
            email: mEmail,
            role: rolesMap[mTier],
            tier: mTier,
            committee: mCommittee
          };

          currentMembers.push(newMember);
          importCount++;
        }

        if (importCount > 0) {
          saveMembers(currentMembers);
          setMembers(getMembers());
          triggerSuccess(`Successfully imported ${importCount} new members. ${duplicateCount > 0 ? `(${duplicateCount} existing duplicates skipped)` : ''}`);
        } else if (duplicateCount > 0) {
          triggerError(`No new members imported. ${duplicateCount} duplicate email addresses found in file.`);
        } else {
          triggerError('No valid member rows found in the CSV.');
        }
      } catch (err) {
        triggerError('Error parsing CSV file. Please verify its formatting.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  const isAdmin = user && user.tier <= 3; // Tier 1-3 can manage roster

  // Filter members list based on search query
  const filteredMembers = members
    .filter(m => {
      const q = searchQuery.toLowerCase();
      const nameMatch = (m.name || '').toLowerCase().includes(q);
      const emailMatch = (m.email || '').toLowerCase().includes(q);
      const roleMatch = (m.role || '').toLowerCase().includes(q);
      const committeeMatch = (m.committee || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || roleMatch || committeeMatch;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination slice
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
          <h1 className="text-xl font-bold text-theme-text-primary">Member Directory & Rosters</h1>
          <p className="text-xs text-theme-text-secondary">View and configure center advisors, committees, and training associate credentials</p>
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
              onClick={() => setIsCommitteeModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary text-xs font-semibold rounded-xl transition-all cursor-pointer border border-theme-border/40"
            >
              <Plus className="h-4 w-4" />
              Create Committee
            </button>

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

      {/* Directory Filter Bar & Search */}
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
            placeholder="Search roster by name, email, designation, or committee..."
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
                    onClick={() => toggleSort('tier')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Privilege Tier <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th 
                    onClick={() => toggleSort('committee')}
                    className="pb-3.5 font-semibold cursor-pointer hover:text-theme-text-primary select-none"
                  >
                    <span className="flex items-center gap-1">
                      Committee Assignment <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  {isAdmin && <th className="pb-3.5 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/20">
                {paginatedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-theme-border/10 transition-all text-xs">
                    <td className="py-3.5 pr-2 font-bold text-theme-text-primary flex items-center gap-2.5">
                      <div className="h-8 w-8 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20">
                        <span className="text-[11px] font-bold text-accent">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span>{member.name}</span>
                    </td>
                    <td className="py-3.5 pr-2 text-theme-text-secondary">{member.email}</td>
                    <td className="py-3.5 pr-2">
                      <span className="inline-flex items-center text-[10px] font-semibold text-theme-text-primary px-2.5 py-0.5 rounded-full bg-theme-border/30">
                        {member.role} (Tier {member.tier})
                      </span>
                    </td>
                    <td className="py-3.5 pr-2 text-theme-text-secondary">{member.committee}</td>
                    {isAdmin && (
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => startEdit(member)}
                            className="p-1.5 text-accent hover:bg-accent/10 rounded-md transition-all cursor-pointer"
                            title="Edit Member Privileges"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          {member.id !== 'm1' ? (
                            <button
                              onClick={() => setDeletingMember(member)}
                              className="p-1.5 text-danger hover:bg-danger/10 rounded-md transition-all cursor-pointer"
                              title="Remove Member"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    )}
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
              <h2 className="text-base font-bold text-theme-text-primary">Add Member to Roster</h2>
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
                  <label className="block font-medium text-theme-text-secondary">Role & Privilege Tier</label>
                  <select
                    value={roleTier}
                    onChange={(e) => setRoleTier(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value={1}>Tier 1 - Super User</option>
                    <option value={2}>Tier 2 - Centre Head</option>
                    <option value={3}>Tier 3 - Head of Events</option>
                    <option value={4}>Tier 4 - Advisory Board</option>
                    <option value={5}>Tier 5 - Core Committee</option>
                    <option value={6}>Tier 6 - Training Associate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Committee Assignment</label>
                  <select
                    value={committee}
                    onChange={(e) => setCommittee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="All Committees">All Committees</option>
                    {committees.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Add Member to Roster
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
              <h2 className="text-base font-bold text-theme-text-primary">Edit Member Privileges</h2>
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
                  <label className="block font-medium text-theme-text-secondary">Designation / Role</label>
                  <select
                     value={editRoleTier}
                     onChange={(e) => setEditRoleTier(parseInt(e.target.value))}
                     className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value={1}>Tier 1 - Super User</option>
                    <option value={2}>Tier 2 - Centre Head</option>
                    <option value={3}>Tier 3 - Head of Events</option>
                    <option value={4}>Tier 4 - Advisory Board</option>
                    <option value={5}>Tier 5 - Core Committee</option>
                    <option value={6}>Tier 6 - Training Associate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Committee Assignment</label>
                  <select
                    value={editCommittee}
                    onChange={(e) => setEditCommittee(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="All Committees">All Committees</option>
                    {committees.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Save Member Updates
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Committee Modal */}
      {isCommitteeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">Create Event-Based Committee</h2>
              <button 
                onClick={() => setIsCommitteeModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommittee} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Committee Name *</label>
                <input
                  type="text"
                  required
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  placeholder="e.g. Media & Photography Committee"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-4"
              >
                Create Committee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingMember)}
        title="Remove Member from Roster"
        message={`Are you sure you want to remove ${deletingMember?.name} (${deletingMember?.email}) from the LEADS directory roster?`}
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingMember(null)}
      />

    </div>
  );
}
