'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  X,
  Edit2,
  Trash2,
  Tag,
  Users,
  Search,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  getGroupPolicies,
  addGroupPolicy,
  updateGroupPolicy,
  deleteGroupPolicy,
  getMembers,
  GroupPolicy,
  Member,
  MemberDivision,
} from '@/lib/local-data';
import { CAPABILITY_CATALOG } from '@/lib/permissions';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { EmptyState } from '@/components/ui/empty-state';

const ALL_DIVISIONS: MemberDivision[] = ['Advisory Board', 'Core Committee', 'Training Associate', 'Alumni', 'Faculty'];
const ALL_TIERS = [1, 2, 3, 4, 5, 6, 7];

function slugifyTag(name: string): string {
  const slug = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return slug || 'NEW_TAG';
}

interface TargetCriteria {
  targetDivisions: MemberDivision[];
  targetTiers: number[];
  targetDesignationKeyword: string;
  targetMemberIds: string[];
}

function memberMatchesCriteria(member: Member, criteria: TargetCriteria): boolean {
  if (criteria.targetMemberIds.includes(member.id)) return true;
  if (criteria.targetDivisions.length && criteria.targetDivisions.includes(member.division)) return true;
  if (criteria.targetTiers.length && criteria.targetTiers.includes(member.tier)) return true;
  if (criteria.targetDesignationKeyword.trim()) {
    if ((member.role || '').toLowerCase().includes(criteria.targetDesignationKeyword.trim().toLowerCase())) return true;
  }
  return false;
}

export default function GroupPoliciesPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GroupPolicy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [tagManuallyEdited, setTagManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [targetDivisions, setTargetDivisions] = useState<MemberDivision[]>([]);
  const [targetTiers, setTargetTiers] = useState<number[]>([]);
  const [targetDesignationKeyword, setTargetDesignationKeyword] = useState('');
  const [targetMemberIds, setTargetMemberIds] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setPolicies(getGroupPolicies());
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
    setUserHydrated(true);

    window.addEventListener('leads-data-sync', refreshData);
    window.addEventListener('storage', refreshData);
    return () => {
      window.removeEventListener('leads-data-sync', refreshData);
      window.removeEventListener('storage', refreshData);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setIsMemberDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const isSuperUser = user?.tier === 1;

  const resetForm = () => {
    setName('');
    setTag('');
    setTagManuallyEdited(false);
    setDescription('');
    setCapabilities([]);
    setTargetDivisions([]);
    setTargetTiers([]);
    setTargetDesignationKeyword('');
    setTargetMemberIds([]);
    setEnabled(true);
    setMemberSearchQuery('');
    setIsMemberDropdownOpen(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (policy: GroupPolicy) => {
    setEditingPolicy(policy);
    setName(policy.name);
    setTag(policy.tag);
    setTagManuallyEdited(true);
    setDescription(policy.description || '');
    setCapabilities(policy.capabilities || []);
    setTargetDivisions(policy.targetDivisions || []);
    setTargetTiers(policy.targetTiers || []);
    setTargetDesignationKeyword(policy.targetDesignationKeyword || '');
    setTargetMemberIds(policy.targetMemberIds || []);
    setEnabled(policy.enabled !== false);
    setMemberSearchQuery('');
    setIsMemberDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!tagManuallyEdited) setTag(slugifyTag(value));
  };

  const toggleCapability = (key: string) => {
    setCapabilities(prev => (prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]));
  };

  const toggleDivision = (division: MemberDivision) => {
    setTargetDivisions(prev => (prev.includes(division) ? prev.filter(d => d !== division) : [...prev, division]));
  };

  const toggleTier = (tierNum: number) => {
    setTargetTiers(prev => (prev.includes(tierNum) ? prev.filter(t => t !== tierNum) : [...prev, tierNum]));
  };

  const addTargetMember = (member: Member) => {
    setTargetMemberIds(prev => (prev.includes(member.id) ? prev : [...prev, member.id]));
    setMemberSearchQuery('');
    setIsMemberDropdownOpen(false);
  };

  const removeTargetMember = (id: string) => {
    setTargetMemberIds(prev => prev.filter(m => m !== id));
  };

  const draftCriteria: TargetCriteria = { targetDivisions, targetTiers, targetDesignationKeyword, targetMemberIds };
  const draftMatches = members.filter(m => memberMatchesCriteria(m, draftCriteria));

  const memberSearchResults = members.filter(m => {
    const q = memberSearchQuery.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim() || capabilities.length === 0) return;

    const hasAnyTarget =
      targetDivisions.length > 0 || targetTiers.length > 0 || !!targetDesignationKeyword.trim() || targetMemberIds.length > 0;
    if (!hasAnyTarget) return;

    const payload = {
      tag: tag.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      capabilities,
      targetDivisions,
      targetTiers,
      targetDesignationKeyword: targetDesignationKeyword.trim() || undefined,
      targetMemberIds,
      enabled,
    };

    if (editingPolicy) {
      updateGroupPolicy(editingPolicy.id, payload, user?.name || 'Super User');
      triggerSuccess(`Policy tag "${name}" updated — now applies to ${draftMatches.length} member(s).`);
    } else {
      addGroupPolicy({ ...payload, createdBy: user?.name || 'Super User' });
      triggerSuccess(`Policy tag "${name}" created and applied to ${draftMatches.length} member(s).`);
    }

    setPolicies(getGroupPolicies());
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleToggleEnabled = (policy: GroupPolicy) => {
    const nowEnabled = !(policy.enabled !== false);
    updateGroupPolicy(policy.id, { enabled: nowEnabled }, user?.name || 'Super User');
    setPolicies(getGroupPolicies());
    triggerSuccess(`Policy tag "${policy.name}" ${nowEnabled ? 'enabled' : 'disabled'}.`);
  };

  const handleConfirmDelete = () => {
    if (!deletingId) return;
    const target = policies.find(p => p.id === deletingId);
    deleteGroupPolicy(deletingId, user?.name || 'Super User');
    setPolicies(getGroupPolicies());
    setDeletingId(null);
    triggerSuccess(`Policy tag "${target?.name || ''}" deleted.`);
  };

  const getMatchingMembers = (policy: GroupPolicy) =>
    members.filter(m =>
      memberMatchesCriteria(m, {
        targetDivisions: policy.targetDivisions || [],
        targetTiers: policy.targetTiers || [],
        targetDesignationKeyword: policy.targetDesignationKeyword || '',
        targetMemberIds: policy.targetMemberIds || [],
      })
    );

  const summarizeTargets = (policy: GroupPolicy): string[] => {
    const parts: string[] = [];
    if (policy.targetDivisions?.length) parts.push(`Division: ${policy.targetDivisions.join(', ')}`);
    if (policy.targetTiers?.length) parts.push(`Tier: ${policy.targetTiers.join(', ')}`);
    if (policy.targetDesignationKeyword) parts.push(`Designation contains "${policy.targetDesignationKeyword}"`);
    if (policy.targetMemberIds?.length) parts.push(`${policy.targetMemberIds.length} explicit member(s)`);
    return parts.length ? parts : ['No targeting criteria set'];
  };

  // Wait for localStorage user hydration before deciding what to render, so a real
  // Super User never briefly sees the "Access Restricted" state on first paint.
  if (!userHydrated) return null;

  if (!isSuperUser) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={ShieldAlert}
          title="Super User Access Required"
          description="Group Policy Management controls who can access what across the entire dashboard. Only the Super User account can view or change these settings."
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-success/15 border border-success/20 rounded-2xl text-theme-text-primary text-xs animate-in fade-in duration-300">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Group Policy Management
          </h1>
          <p className="text-xs text-theme-text-secondary">
            Create access tags, target them at a division, tier, designation, or specific people, and grant capabilities dynamically — no code changes needed.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-primary-light text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Policy Tag
        </button>
      </div>

      {policies.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No policy tags yet"
          description="Create your first tag to grant a category of members access to a capability without writing any code."
          actionLabel="New Policy Tag"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {policies.map(policy => {
            const isEnabled = policy.enabled !== false;
            const matches = getMatchingMembers(policy);
            const isExpanded = expandedMembersId === policy.id;
            return (
              <div
                key={policy.id}
                className={`glass-panel rounded-2xl p-5 space-y-3.5 border ${isEnabled ? 'border-white/10' : 'border-theme-border/20 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-theme-text-primary">{policy.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/15 text-accent rounded-md border border-accent/20">
                        {policy.tag}
                      </span>
                      {!isEnabled && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-theme-border/30 text-theme-text-secondary rounded-md">
                          Disabled
                        </span>
                      )}
                    </div>
                    {policy.description && (
                      <p className="text-[11px] text-theme-text-secondary">{policy.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleEnabled(policy)}
                      title={isEnabled ? 'Disable tag' : 'Enable tag'}
                      className="p-1.5 hover:bg-theme-border/30 rounded-lg text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
                    >
                      {isEnabled ? <ToggleRight className="h-4.5 w-4.5 text-success" /> : <ToggleLeft className="h-4.5 w-4.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(policy)}
                      title="Edit tag"
                      className="p-1.5 hover:bg-accent/10 rounded-lg text-accent transition-all cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(policy.id)}
                      title="Delete tag"
                      className="p-1.5 hover:bg-danger/10 rounded-lg text-danger transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {policy.capabilities.map(capKey => {
                    const cap = CAPABILITY_CATALOG.find(c => c.key === capKey);
                    return (
                      <span
                        key={capKey}
                        title={cap?.description}
                        className="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary-light rounded-md border border-primary/20"
                      >
                        {cap?.label || capKey}
                      </span>
                    );
                  })}
                </div>

                <div className="text-[11px] text-theme-text-secondary space-y-0.5">
                  {summarizeTargets(policy).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                <button
                  onClick={() => setExpandedMembersId(isExpanded ? null : policy.id)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5" />
                  Applies to {matches.length} member{matches.length === 1 ? '' : 's'} right now
                </button>

                {isExpanded && (
                  <div className="max-h-40 overflow-y-auto space-y-1 pt-1 border-t border-theme-border/20">
                    {matches.length === 0 ? (
                      <p className="text-[11px] text-theme-text-secondary py-2">No members currently match this tag.</p>
                    ) : (
                      matches.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-[11px] py-1">
                          <span className="text-theme-text-primary font-medium">{m.name}</span>
                          <span className="text-theme-text-secondary">{m.role}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Policy Tag Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 flex flex-col space-y-5 relative border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-theme-text-primary">
                {editingPolicy ? 'Edit Policy Tag' : 'New Policy Tag'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPolicy(null);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-theme-border/30 text-theme-text-secondary hover:text-theme-text-primary transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Tag Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Junior Event Lead Access"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-theme-text-secondary">Tag Code *</label>
                  <input
                    type="text"
                    required
                    value={tag}
                    onChange={(e) => {
                      setTag(slugifyTag(e.target.value));
                      setTagManuallyEdited(true);
                    }}
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary font-mono focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What is this tag for and who should hold it?"
                  className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-theme-text-secondary">
                  Grants These Capabilities * <span className="font-normal">(select at least one)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPABILITY_CATALOG.map(cap => (
                    <label
                      key={cap.key}
                      title={cap.description}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        capabilities.includes(cap.key)
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-theme-background/20 border-theme-card-border hover:bg-theme-border/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={capabilities.includes(cap.key)}
                        onChange={() => toggleCapability(cap.key)}
                        className="accent-accent mt-0.5"
                      />
                      <span className="font-medium text-theme-text-primary leading-tight">{cap.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t border-theme-border/20">
                <label className="block font-medium text-theme-text-secondary">
                  Assign To People Matching ANY Of These <span className="font-normal">(at least one required)</span>
                </label>

                <div className="space-y-1.5">
                  <span className="block text-[11px] font-medium text-theme-text-secondary">By Division</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_DIVISIONS.map(division => (
                      <button
                        key={division}
                        type="button"
                        onClick={() => toggleDivision(division)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          targetDivisions.includes(division)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-theme-background/30 border-theme-card-border text-theme-text-secondary hover:text-theme-text-primary'
                        }`}
                      >
                        {division}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[11px] font-medium text-theme-text-secondary">By Tier</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_TIERS.map(tierNum => (
                      <button
                        key={tierNum}
                        type="button"
                        onClick={() => toggleTier(tierNum)}
                        className={`h-7 w-7 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          targetTiers.includes(tierNum)
                            ? 'bg-accent text-white border-accent'
                            : 'bg-theme-background/30 border-theme-card-border text-theme-text-secondary hover:text-theme-text-primary'
                        }`}
                      >
                        {tierNum}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-medium text-theme-text-secondary">By Designation (role contains)</label>
                  <input
                    type="text"
                    value={targetDesignationKeyword}
                    onChange={(e) => setTargetDesignationKeyword(e.target.value)}
                    placeholder="e.g. Head, Logistics, Coordinator"
                    className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="space-y-1.5" ref={memberDropdownRef}>
                  <label className="block text-[11px] font-medium text-theme-text-secondary">By Specific Person</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl focus-within:border-accent">
                      <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onFocus={() => setIsMemberDropdownOpen(true)}
                        onChange={(e) => {
                          setMemberSearchQuery(e.target.value);
                          setIsMemberDropdownOpen(true);
                        }}
                        placeholder="Search by name, role, or email to add a person..."
                        className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-theme-text-primary placeholder-theme-text-secondary"
                      />
                    </div>

                    {isMemberDropdownOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto glass-panel rounded-xl border border-white/15 shadow-2xl z-10 divide-y divide-theme-border/20 animate-in fade-in zoom-in-95 duration-150">
                        {memberSearchResults.length === 0 ? (
                          <div className="text-center py-4 text-theme-text-secondary">No matching members.</div>
                        ) : (
                          memberSearchResults.map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => addTargetMember(m)}
                              className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 hover:bg-theme-border/20 transition-all cursor-pointer ${
                                targetMemberIds.includes(m.id) ? 'bg-accent/10' : ''
                              }`}
                            >
                              <span className="font-medium text-theme-text-primary">{m.name}</span>
                              <span className="text-theme-text-secondary shrink-0">{m.role}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {targetMemberIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {targetMemberIds.map(id => {
                        const m = members.find(mm => mm.id === id);
                        if (!m) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-accent/10 text-accent text-[11px] font-semibold rounded-lg border border-accent/20"
                          >
                            {m.name}
                            <button
                              type="button"
                              onClick={() => removeTargetMember(id)}
                              className="hover:bg-accent/20 rounded p-0.5 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl">
                  <Users className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-[11px] text-theme-text-primary font-semibold">
                    This tag currently matches {draftMatches.length} member{draftMatches.length === 1 ? '' : 's'}.
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-theme-text-primary">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="accent-accent"
                />
                Enabled (grants access immediately on save)
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:bg-primary-light text-white font-semibold rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer mt-2"
              >
                {editingPolicy ? 'Save Policy Tag' : 'Create Policy Tag'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Policy Tag"
        message="This will immediately revoke this tag's capabilities from everyone it currently applies to. This action cannot be undone."
        confirmLabel="Delete Tag"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
