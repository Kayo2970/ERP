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
  Eye,
  ClipboardCheck,
  BookLock,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  getGroupPolicies,
  addGroupPolicy,
  updateGroupPolicy,
  deleteGroupPolicy,
  getMembers,
  getAccessLevelSettings,
  updateAccessLevelSettings,
  DEFAULT_ACCESS_LEVEL_SETTINGS,
  GroupPolicy,
  Member,
  MemberDivision,
  AccessLevelSettings,
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

// The two rules that never change — Tier 1 is permanently hardcoded (the one
// access rule that can never be reconfigured, so there's no way to lock the
// real Super User out), and "everyone else" is just the fallback description,
// not a rule with parameters to edit.
const SUPER_USER_RULE = {
  name: 'Super User (Tier 1)',
  description: 'Unrestricted access to every module in the dashboard, including this page. Always the approver of last resort for any pending submission. This tier can never be reconfigured — a permanent safety floor so the Super User can never be locked out.',
};
const EVERYONE_ELSE_RULE = {
  name: 'Everyone else (no matching rule below, and no policy tag)',
  description: 'Sees their own tasks/ratings, every event (unless a policy restricts them), and their own Design Portal / reimbursement submissions. Cannot create, edit, or delete events, tasks, forms, announcements, or directory records.',
};

export default function GroupPoliciesPage() {
  const [user, setUser] = useState<any>(null);
  const [userHydrated, setUserHydrated] = useState(false);
  const [policies, setPolicies] = useState<GroupPolicy[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null);
  const [isBuiltInRulesOpen, setIsBuiltInRulesOpen] = useState(false);
  const [accessSettings, setAccessSettings] = useState<AccessLevelSettings>(DEFAULT_ACCESS_LEVEL_SETTINGS);
  const [isSavingAccessSettings, setIsSavingAccessSettings] = useState(false);
  const [accessSettingsMsg, setAccessSettingsMsg] = useState('');

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

  // Restrict event visibility to own/listed only for the targeted people (opt-in —
  // omitted means unrestricted, exactly as before this control existed).
  const [restrictEventVisibility, setRestrictEventVisibility] = useState(false);

  // Approval requirement: any capability this tag grants only takes effect once
  // the resolved approver signs off.
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approverType, setApproverType] = useState<'CENTER_HEAD' | 'SPECIFIC_MEMBER' | 'POLICY_TAG'>('CENTER_HEAD');
  const [approverMemberId, setApproverMemberId] = useState('');
  const [approverPolicyTagId, setApproverPolicyTagId] = useState('');
  const [approverSearchQuery, setApproverSearchQuery] = useState('');
  const [isApproverDropdownOpen, setIsApproverDropdownOpen] = useState(false);
  const approverDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refreshData = () => {
      setPolicies(getGroupPolicies());
      setMembers(getMembers());
    };
    refreshData();
    // Loaded once on mount only — not on every background sync, so it never
    // clobbers an in-progress unsaved edit in the form below.
    setAccessSettings(getAccessLevelSettings());

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
      if (approverDropdownRef.current && !approverDropdownRef.current.contains(event.target as Node)) {
        setIsApproverDropdownOpen(false);
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
    setRestrictEventVisibility(false);
    setRequiresApproval(false);
    setApproverType('CENTER_HEAD');
    setApproverMemberId('');
    setApproverPolicyTagId('');
    setApproverSearchQuery('');
    setIsApproverDropdownOpen(false);
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
    setRestrictEventVisibility(policy.eventVisibilityScope === 'OWN_ONLY');
    setRequiresApproval(!!policy.requiresApproval);
    setApproverType(policy.approverType || 'CENTER_HEAD');
    setApproverMemberId(policy.approverMemberId || '');
    setApproverPolicyTagId(policy.approverPolicyTagId || '');
    setApproverSearchQuery('');
    setIsApproverDropdownOpen(false);
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

  const approverSearchResults = members.filter(m => {
    const q = approverSearchQuery.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });
  const selectedApproverMember = members.find(m => m.id === approverMemberId);
  const otherPolicies = policies.filter(p => p.id !== editingPolicy?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tag.trim() || capabilities.length === 0) return;

    const hasAnyTarget =
      targetDivisions.length > 0 || targetTiers.length > 0 || !!targetDesignationKeyword.trim() || targetMemberIds.length > 0;
    if (!hasAnyTarget) return;

    if (requiresApproval && approverType === 'SPECIFIC_MEMBER' && !approverMemberId) return;
    if (requiresApproval && approverType === 'POLICY_TAG' && !approverPolicyTagId) return;

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
      eventVisibilityScope: restrictEventVisibility ? ('OWN_ONLY' as const) : undefined,
      requiresApproval,
      approverType: requiresApproval ? approverType : undefined,
      approverMemberId: requiresApproval && approverType === 'SPECIFIC_MEMBER' ? approverMemberId : undefined,
      approverPolicyTagId: requiresApproval && approverType === 'POLICY_TAG' ? approverPolicyTagId : undefined,
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

  const handleSaveAccessSettings = () => {
    setIsSavingAccessSettings(true);
    const updated = updateAccessLevelSettings(
      {
        baseLeadershipMaxTier: accessSettings.baseLeadershipMaxTier,
        coreCommitteeTier: accessSettings.coreCommitteeTier,
        sectorHeadMaxTier: accessSettings.sectorHeadMaxTier,
        headKeyword: accessSettings.headKeyword,
        sectorHeadKeywords: accessSettings.sectorHeadKeywords,
        financeKeyword: accessSettings.financeKeyword,
      },
      user?.name || 'Super User'
    );
    setAccessSettings(updated);
    setIsSavingAccessSettings(false);
    setAccessSettingsMsg('Saved — these thresholds now apply to every account across the platform immediately.');
    setTimeout(() => setAccessSettingsMsg(''), 5000);
  };

  const handleResetAccessSettings = () => {
    setAccessSettings({ ...DEFAULT_ACCESS_LEVEL_SETTINGS });
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

  const describeApprover = (policy: GroupPolicy): string => {
    if (policy.approverType === 'SPECIFIC_MEMBER') {
      return members.find(m => m.id === policy.approverMemberId)?.name || 'unassigned member';
    }
    if (policy.approverType === 'POLICY_TAG') {
      return policies.find(p => p.id === policy.approverPolicyTagId)?.name
        ? `anyone holding "${policies.find(p => p.id === policy.approverPolicyTagId)?.name}"`
        : 'unassigned tag';
    }
    return 'Center Head';
  };

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
                  {policy.eventVisibilityScope === 'OWN_ONLY' && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-warning/10 text-warning rounded-md border border-warning/20">
                      <Eye className="h-3 w-3" /> Own/Listed Events Only
                    </span>
                  )}
                  {policy.requiresApproval && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-accent/10 text-accent rounded-md border border-accent/20">
                      <ClipboardCheck className="h-3 w-3" /> Approval Required &rarr; {describeApprover(policy)}
                    </span>
                  )}
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

      {/* Built-in Access Rules — the tier/role rules that exist even with zero policy
          tags. Editable by the Super User: these thresholds/keywords are what
          permissions.ts's isBaseLeadership/isCoreCommitteeTier/isHeadRole/isSectorHead/
          isFinanceHead actually check, so a change here takes effect for every account
          immediately. Tier 1 stays permanently hardcoded as a safety floor. */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setIsBuiltInRulesOpen(!isBuiltInRulesOpen)}
          className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <BookLock className="h-4.5 w-4.5 text-theme-text-secondary" />
            <div>
              <h3 className="text-sm font-bold text-theme-text-primary">Built-in Access Rules</h3>
              <p className="text-[11px] text-theme-text-secondary">The tier/role rules that exist even with zero policy tags — editable here.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-accent shrink-0">{isBuiltInRulesOpen ? 'Hide' : 'Show'}</span>
        </button>
        {isBuiltInRulesOpen && (
          <div className="px-5 pb-5 space-y-3 border-t border-theme-border/20 pt-4 text-xs">
            <div className="flex items-start gap-2 p-3 bg-danger/5 border border-danger/25 rounded-xl text-[11px] text-theme-text-secondary">
              <ShieldAlert className="h-3.5 w-3.5 text-danger shrink-0 mt-0.5" />
              <span>
                Changing these values changes who has elevated access across the entire platform, for every account,
                the moment you save — not just for new logins. Tier 1 (the real Super User) is the one rule that can
                never be reconfigured, so you can never lock yourself out.
              </span>
            </div>

            {accessSettingsMsg && (
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl text-[11px] text-theme-text-primary">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>{accessSettingsMsg}</span>
              </div>
            )}

            {/* Super User — permanently hardcoded */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl">
              <h4 className="text-xs font-bold text-theme-text-primary">{SUPER_USER_RULE.name}</h4>
              <p className="text-[11px] text-theme-text-secondary mt-0.5 leading-relaxed">{SUPER_USER_RULE.description}</p>
            </div>

            {/* Base Leadership */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-theme-text-primary">Base Leadership</h4>
              <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                Create/edit/delete events and tasks, edit the directory, view the full directory, publish announcements, and view every Design Portal submission.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary">
                <span>Tier 1 through</span>
                <select
                  value={accessSettings.baseLeadershipMaxTier}
                  onChange={(e) => setAccessSettings({ ...accessSettings, baseLeadershipMaxTier: parseInt(e.target.value, 10) })}
                  className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  {ALL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Core Committee */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-theme-text-primary">Core Committee</h4>
              <p className="text-[11px] text-theme-text-secondary leading-relaxed">Create/edit events and tasks, and publish announcements.</p>
              <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary">
                <span>Tier equals</span>
                <select
                  value={accessSettings.coreCommitteeTier}
                  onChange={(e) => setAccessSettings({ ...accessSettings, coreCommitteeTier: parseInt(e.target.value, 10) })}
                  className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                >
                  {ALL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Head role */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-theme-text-primary">Any &quot;Head&quot; Role</h4>
              <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                Create/edit events and tasks, build public forms, publish announcements, view all designs, and see their own department&apos;s tasks and ratings regardless of tier.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary">
                <span>Job title contains the word</span>
                <input
                  type="text"
                  value={accessSettings.headKeyword}
                  onChange={(e) => setAccessSettings({ ...accessSettings, headKeyword: e.target.value })}
                  className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent w-28"
                />
              </div>
            </div>

            {/* Sector / Centre Head */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-theme-text-primary">Sector / Centre Head</h4>
              <p className="text-[11px] text-theme-text-secondary leading-relaxed">
                First-stage reimbursement approval. Also the built-in &quot;Center Head&quot; approver for any policy that requires approval without naming a specific person or tag.
              </p>
              <div className="flex flex-col gap-1.5 text-[11px] text-theme-text-secondary">
                <div className="flex items-center gap-2">
                  <span>Title contains any of</span>
                  <input
                    type="text"
                    value={accessSettings.sectorHeadKeywords}
                    onChange={(e) => setAccessSettings({ ...accessSettings, sectorHeadKeywords: e.target.value })}
                    placeholder="comma-separated phrases"
                    className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span>...or tier is 1 through</span>
                  <select
                    value={accessSettings.sectorHeadMaxTier}
                    onChange={(e) => setAccessSettings({ ...accessSettings, sectorHeadMaxTier: parseInt(e.target.value, 10) })}
                    className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent"
                  >
                    {ALL_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Finance Head */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-theme-text-primary">Finance Head</h4>
              <p className="text-[11px] text-theme-text-secondary leading-relaxed">Final-stage reimbursement approval, after the Sector Head stage.</p>
              <div className="flex items-center gap-2 text-[11px] text-theme-text-secondary">
                <span>Title or department contains</span>
                <input
                  type="text"
                  value={accessSettings.financeKeyword}
                  onChange={(e) => setAccessSettings({ ...accessSettings, financeKeyword: e.target.value })}
                  className="px-2.5 py-1 bg-theme-background/30 border border-theme-card-border rounded-lg text-theme-text-primary focus:outline-none focus:border-accent w-28"
                />
              </div>
            </div>

            {/* Everyone else — static */}
            <div className="p-3 bg-theme-border/10 border border-theme-border/20 rounded-xl">
              <h4 className="text-xs font-bold text-theme-text-primary">{EVERYONE_ELSE_RULE.name}</h4>
              <p className="text-[11px] text-theme-text-secondary mt-0.5 leading-relaxed">{EVERYONE_ELSE_RULE.description}</p>
            </div>

            {accessSettings.updatedAt && (
              <p className="text-[10px] text-theme-text-secondary">
                Last changed {new Date(accessSettings.updatedAt).toLocaleString()} by {accessSettings.updatedBy || 'unknown'}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveAccessSettings}
                disabled={isSavingAccessSettings}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent hover:bg-primary-light text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-accent/15 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {isSavingAccessSettings ? 'Saving...' : 'Save Access Rules'}
              </button>
              <button
                onClick={handleResetAccessSettings}
                title="Reset the fields above to their defaults (not saved until you click Save)"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-theme-border/30 hover:bg-theme-border/50 text-theme-text-primary font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Defaults
              </button>
            </div>
          </div>
        )}
      </div>

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

              <label
                title="Members matched by this tag will only see events they created or are listed on a committee for, instead of every event. Purely restrictive — it never grants visibility beyond what someone already has."
                className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  restrictEventVisibility ? 'bg-warning/10 border-warning/30' : 'bg-theme-background/20 border-theme-card-border hover:bg-theme-border/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={restrictEventVisibility}
                  onChange={(e) => setRestrictEventVisibility(e.target.checked)}
                  className="accent-warning mt-0.5"
                />
                <span className="flex items-center gap-1.5 font-medium text-theme-text-primary leading-tight">
                  <Eye className="h-3.5 w-3.5 text-warning shrink-0" />
                  Restrict event visibility to their own / listed events only
                </span>
              </label>

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

              <div className="space-y-3 pt-1 border-t border-theme-border/20">
                <label
                  className={`flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    requiresApproval ? 'bg-accent/10 border-accent/30' : 'bg-theme-background/20 border-theme-card-border hover:bg-theme-border/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={requiresApproval}
                    onChange={(e) => setRequiresApproval(e.target.checked)}
                    className="accent-accent mt-0.5"
                  />
                  <span className="flex items-center gap-1.5 font-medium text-theme-text-primary leading-tight">
                    <ClipboardCheck className="h-3.5 w-3.5 text-accent shrink-0" />
                    Require approval before these capabilities take effect
                  </span>
                </label>

                {requiresApproval && (
                  <div className="space-y-3 pl-1">
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        { value: 'CENTER_HEAD', label: 'Center Head' },
                        { value: 'SPECIFIC_MEMBER', label: 'Specific Person' },
                        { value: 'POLICY_TAG', label: 'Anyone Holding Another Tag' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setApproverType(opt.value)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                            approverType === opt.value
                              ? 'bg-accent text-white border-accent'
                              : 'bg-theme-background/30 border-theme-card-border text-theme-text-secondary hover:text-theme-text-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {approverType === 'SPECIFIC_MEMBER' && (
                      <div ref={approverDropdownRef} className="relative">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl focus-within:border-accent">
                          <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                          <input
                            type="text"
                            value={isApproverDropdownOpen ? approverSearchQuery : (selectedApproverMember?.name || '')}
                            onFocus={() => { setApproverSearchQuery(''); setIsApproverDropdownOpen(true); }}
                            onChange={(e) => { setApproverSearchQuery(e.target.value); setIsApproverDropdownOpen(true); }}
                            placeholder="Search for the approver by name, role, or email..."
                            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-theme-text-primary placeholder-theme-text-secondary"
                          />
                        </div>
                        {isApproverDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto glass-panel rounded-xl border border-white/15 shadow-2xl z-10 divide-y divide-theme-border/20 animate-in fade-in zoom-in-95 duration-150">
                            {approverSearchResults.length === 0 ? (
                              <div className="text-center py-4 text-theme-text-secondary">No matching members.</div>
                            ) : (
                              approverSearchResults.map(m => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => { setApproverMemberId(m.id); setApproverSearchQuery(''); setIsApproverDropdownOpen(false); }}
                                  className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 hover:bg-theme-border/20 transition-all cursor-pointer ${
                                    m.id === approverMemberId ? 'bg-accent/10' : ''
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
                    )}

                    {approverType === 'POLICY_TAG' && (
                      <select
                        value={approverPolicyTagId}
                        onChange={(e) => setApproverPolicyTagId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-theme-background/30 border border-theme-card-border rounded-xl text-theme-text-primary focus:outline-none focus:border-accent"
                      >
                        <option value="">-- Select a tag --</option>
                        {otherPolicies.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
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
