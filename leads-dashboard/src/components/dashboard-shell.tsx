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
  Info
} from 'lucide-react';
import { getAnnouncements, getTasks, TaskItem, AnnouncementItem } from '@/lib/local-data';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
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
      { name: 'Events', href: '/dashboard/events', icon: Calendar },
      { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
      { name: 'Ratings', href: '/dashboard/ratings', icon: Star },
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
  const [notifications, setNotifications] = useState<{ id: string; title: string; time: string; read: boolean }[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState({
    name: 'Kayomarz Pavri',
    email: 'kayomarz.pavri@msruas.ac.in',
    role: 'Super User',
    tier: 1,
    committee: 'All Committees'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize theme, user session, and notifications
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

      // Load dynamic notifications from recent announcements and tasks
      const recentAnnounce = getAnnouncements().slice(0, 3).map(a => ({
        id: a.id,
        title: `Announcement: ${a.title}`,
        time: a.publishedAt,
        read: false
      }));
      const recentTasks = getTasks().slice(0, 2).map(t => ({
        id: t.id,
        title: `Task assigned: ${t.title}`,
        time: `Due ${t.dueDate}`,
        read: false
      }));
      setNotifications([...recentAnnounce, ...recentTasks]);
    } catch (e) {
      console.error('Failed to parse user session:', e);
      router.replace('/');
    }
  }, [router]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                {section.items.map((item) => {
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
                  {section.items.map((item) => {
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

            {/* Divider */}
            <div className="h-6 w-px bg-theme-border/30"></div>

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
