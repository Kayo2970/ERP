'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Star, 
  Receipt, 
  FileText, 
  BarChart3, 
  Megaphone, 
  FolderGit2, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User,
  Bell,
  Check,
  Info,
  ShieldAlert,
  ShieldCheck,
  Palette,
  UserCog,
  Search,
  Undo2,
  DatabaseBackup
} from 'lucide-react';
import { getAnnouncements, getTasks, getDesigns, getMembers, logAuditEvent, Member, TaskItem, AnnouncementItem, syncWithServer } from '@/lib/local-data';
import { canViewTaskExtended, getAnnouncementScopeMatch } from '@/lib/permissions';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  superUserOnly?: boolean;
}

interface NavSection {
  title: string;
  items: SidebarItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard/home', icon: LayoutDashboard },
      { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
      { name: 'Events', href: '/dashboard/events', icon: Calendar },
      { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
      { name: 'Ratings', href: '/dashboard/ratings', icon: Star },
      { name: 'Design Portal', href: '/dashboard/designs', icon: Palette },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt },
      { name: 'Public Forms', href: '/dashboard/forms', icon: FileText },
      { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      { name: 'Directory', href: '/dashboard/directory', icon: FolderGit2 },
      { name: 'Group Policies', href: '/dashboard/policies', icon: ShieldCheck, superUserOnly: true },
      { name: 'Backup & Restore', href: '/dashboard/backup', icon: DatabaseBackup, superUserOnly: true },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

const allSidebarItems = navSections.flatMap(s => s.items);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string; read: boolean }[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Super User-only quick account switch — jumps straight into any real member's
  // session without a password. originalUser is the Super User's own identity,
  // stashed only while impersonating so there's always a way back.
  const [isQuickSwitchOpen, setIsQuickSwitchOpen] = useState(false);
  const [quickSwitchSearch, setQuickSwitchSearch] = useState('');
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<any>(null);
  const quickSwitchRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState({
    name: 'Kayomarz Pavri',
    email: 'kayomarz.pavri@msruas.ac.in',
    role: 'Super User',
    tier: 1,
    division: 'Core Committee',
    committee: 'All Committees'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize theme, user session, notifications, and server sync
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && systemDark)) {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkTheme(false);
      document.documentElement.classList.remove('dark');
    }

    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      // Route guard: Redirect to login if unauthenticated
      router.replace('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      setAllMembers(getMembers());

      const stashedOriginal = localStorage.getItem('impersonatorOriginalUser');
      if (stashedOriginal) {
        try {
          setOriginalUser(JSON.parse(stashedOriginal));
          setIsImpersonating(true);
        } catch (e) {
          console.error('Failed to parse stashed impersonator identity:', e);
        }
      }

      // Initial sync: pull server state into localStorage immediately
      setIsSyncing(true);
      syncWithServer().finally(() => setIsSyncing(false));

      // Poll every 7 seconds so changes from other devices appear automatically
      const pollInterval = setInterval(() => {
        syncWithServer().catch(() => {}); // silent — offline is OK
      }, 7000);

      // Load dynamic notifications from recent announcements, tasks, and proofread requests
      const proofreadNotifs = getDesigns()
        .filter(d => d.proofreadRequested && d.assignedProofreaderEmail === parsedUser.email && d.review?.status === 'Pending Proofread')
        .map(d => ({
          id: 'pf_' + d.id,
          title: `Proofreading Request: ${d.title}`,
          time: `From ${d.designerName}`,
          read: false
        }));

      const recentAnnounce = getAnnouncements()
        .filter(a => getAnnouncementScopeMatch(a.scope, parsedUser))
        .slice(0, 3)
        .map(a => ({
          id: a.id,
          title: `Announcement: ${a.title}`,
          time: a.publishedAt,
          read: false
        }));
      const recentTasks = getTasks()
        .filter(t => canViewTaskExtended(t, parsedUser))
        .slice(0, 2)
        .map(t => ({
          id: t.id,
          title: `Task assigned: ${t.title}`,
          time: `Due ${t.dueDate}`,
          read: false
        }));
      setNotifications([...proofreadNotifs, ...recentAnnounce, ...recentTasks]);

      return () => clearInterval(pollInterval);
    } catch (e) {
      console.error('Failed to parse user session:', e);
      router.replace('/');
    }

  }, [router]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (quickSwitchRef.current && !quickSwitchRef.current.contains(event.target as Node)) {
        setIsQuickSwitchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Super User only: jump straight into any real member's session, no password.
  // The Super User's own identity is stashed so "Return to my account" always works,
  // even across a chain of switches (only ever stashes the ORIGINAL identity once).
  const canQuickSwitch = isImpersonating ? originalUser?.tier === 1 : user.tier === 1;

  const handleQuickSwitch = (target: Member) => {
    const realIdentity = isImpersonating ? originalUser : user;
    localStorage.setItem('impersonatorOriginalUser', JSON.stringify(realIdentity));
    localStorage.setItem('user', JSON.stringify(target));
    logAuditEvent(
      'ADMIN_QUICK_SWITCH',
      realIdentity.name,
      `Quick-switched into ${target.name} (${target.email}) without a password`,
      realIdentity.email
    );
    setIsQuickSwitchOpen(false);
    setQuickSwitchSearch('');
    window.location.reload();
  };

  const handleReturnToSelf = () => {
    if (!originalUser) return;
    localStorage.setItem('user', JSON.stringify(originalUser));
    localStorage.removeItem('impersonatorOriginalUser');
    logAuditEvent(
      'ADMIN_QUICK_SWITCH_RETURN',
      originalUser.name,
      'Returned to own account from a quick-switch session',
      originalUser.email
    );
    window.location.reload();
  };

  const quickSwitchResults = allMembers.filter(m => {
    const q = quickSwitchSearch.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Match active item using longest prefix match for detail sub-routes
  const activeItem = allSidebarItems
    .filter(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0] || allSidebarItems[0];

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.replace('/');
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-space-theme flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-theme flex flex-col md:flex-row transition-all duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel bg-theme-sidebar/80 border-r border-theme-sidebar-border h-screen sticky top-0 z-40">
        {/* Brand Logo Link to Dashboard Home */}
        <Link 
          href="/dashboard/home" 
          className="h-16 flex items-center px-6 border-b border-theme-border/30 gap-3 hover:opacity-90 transition-all cursor-pointer select-none"
          title="Return to Dashboard Home"
        >
          <div className="h-8 w-8 flex items-center justify-center">
            <img 
              src="/images/leads-short-logo.png" 
              alt="LEADS Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-semibold text-theme-text-primary text-sm tracking-wide">LEADS Next Gen</h1>
            <p className="text-[10px] text-theme-text-secondary font-medium tracking-wider uppercase">MSRUAS Portal</p>
          </div>
        </Link>

        {/* Sidebar Nav links grouped by section */}
        <nav className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1 pt-1">
                {section.items.filter(item => !item.superUserOnly || user.tier === 1).map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-accent text-white shadow-md shadow-accent/20'
                          : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-border/20'
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-theme-text-secondary'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-theme-border/30 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-9 w-9 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20">
              <User className="h-4.5 w-4.5 text-accent" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-xs text-theme-text-primary truncate">{user.name}</h4>
              <p className="text-[11px] text-theme-text-secondary truncate">{user.role} (Tier {user.tier})</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header / Nav */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 glass-panel bg-theme-sidebar/80 border-b border-theme-sidebar-border sticky top-0 z-40 w-full">
        <Link 
          href="/dashboard/home" 
          className="flex items-center gap-2.5 hover:opacity-90 transition-all cursor-pointer select-none"
          title="Return to Dashboard Home"
        >
          <div className="h-7 w-7 flex items-center justify-center">
            <img 
              src="/images/leads-short-logo.png" 
              alt="LEADS Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-semibold text-sm text-theme-text-primary">LEADS Next Gen</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-lg hover:bg-theme-border/20 transition-all"
          >
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-lg hover:bg-theme-border/20 transition-all"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden bg-background/40 backdrop-blur-md">
          <div className="absolute top-16 left-0 right-0 glass-panel bg-theme-sidebar/95 border-b border-theme-sidebar-border max-h-[calc(100vh-4rem)] overflow-y-auto p-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-4">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <h4 className="px-2 text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider">
                    {section.title}
                  </h4>
                  {section.items.filter(item => !item.superUserOnly || user.tier === 1).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-theme-text-secondary hover:text-theme-text-primary'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            
            <div className="border-t border-theme-border/30 pt-3 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20">
                  <User className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-theme-text-primary">{user.name}</h4>
                  <p className="text-[11px] text-theme-text-secondary font-medium">{user.role} (Tier {user.tier})</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger/10 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 glass-panel bg-theme-sidebar/50 border-b border-theme-sidebar-border sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-theme-text-primary">{activeItem.name}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-border/20 transition-all cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {isDarkTheme ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification bell & dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="h-9 w-9 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-border/20 transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-danger rounded-full ring-2 ring-theme-sidebar"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-4 shadow-2xl border border-white/20 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-theme-border/30">
                    <h4 className="text-xs font-bold text-theme-text-primary">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-theme-border/20 max-h-64 overflow-y-auto pt-1 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-theme-text-secondary text-xs">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`py-2.5 px-2 rounded-lg text-xs transition-all ${notif.read ? 'opacity-60' : 'bg-accent/5'}`}>
                          <div className="flex items-start gap-2">
                            <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-theme-text-primary text-xs leading-snug">{notif.title}</p>
                              <p className="text-[10px] text-theme-text-secondary mt-0.5">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Super User quick-switch: view as any real member without a password */}
            {isImpersonating && (
              <button
                onClick={handleReturnToSelf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-warning/15 border border-warning/40 text-warning text-[11px] font-semibold rounded-xl hover:bg-warning/25 transition-all cursor-pointer"
                title={`Return to ${originalUser?.name || 'your account'}`}
              >
                <Undo2 className="h-3.5 w-3.5" />
                Viewing as {user.name} &mdash; Return
              </button>
            )}

            {canQuickSwitch && (
              <div className="relative" ref={quickSwitchRef}>
                <button
                  onClick={() => setIsQuickSwitchOpen(!isQuickSwitchOpen)}
                  className="h-9 w-9 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-border/20 transition-all cursor-pointer"
                  title="Quick Switch: view as any account (Super User only)"
                >
                  <UserCog className="h-4.5 w-4.5" />
                </button>

                {isQuickSwitchOpen && (
                  <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-3 shadow-2xl border border-white/20 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-theme-border/30 mb-2">
                      <h4 className="text-xs font-bold text-theme-text-primary">Quick Switch</h4>
                      <span className="text-[10px] text-theme-text-secondary">Super User only</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-theme-background/40 border border-theme-border/40 rounded-lg mb-2">
                      <Search className="h-3.5 w-3.5 text-theme-text-secondary shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        value={quickSwitchSearch}
                        onChange={(e) => setQuickSwitchSearch(e.target.value)}
                        placeholder="Search by name, email, or role..."
                        className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-theme-text-primary placeholder-theme-text-secondary"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-theme-border/20">
                      {quickSwitchResults.length === 0 ? (
                        <div className="text-center py-6 text-theme-text-secondary text-xs">No matching members.</div>
                      ) : (
                        quickSwitchResults.map(m => (
                          <button
                            key={m.id}
                            onClick={() => handleQuickSwitch(m)}
                            className="w-full flex items-center gap-2.5 py-2 px-1 hover:bg-theme-border/20 rounded-lg transition-all cursor-pointer text-left"
                          >
                            <div className="h-7 w-7 bg-accent/15 rounded-lg flex items-center justify-center border border-accent/20 shrink-0">
                              <span className="text-[10px] font-bold text-accent">
                                {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-theme-text-primary truncate">
                                {m.name}{m.email === user.email && ' (current)'}
                              </p>
                              <p className="text-[10px] text-theme-text-secondary truncate">{m.role} · Tier {m.tier}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active User info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h4 className="font-bold text-xs text-theme-text-primary">{user.name}</h4>
                <p className="text-[10px] text-theme-text-secondary font-medium tracking-wide">{user.role}</p>
              </div>
              <div className="h-8.5 w-8.5 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
                <span className="text-white font-bold text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
