'use client';

import React, { useState, useEffect } from 'react';
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
  Bell 
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard/home', icon: LayoutDashboard },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { name: 'Ratings', href: '/dashboard/ratings', icon: Star },
  { name: 'Reimbursements', href: '/dashboard/reimbursements', icon: Receipt },
  { name: 'Public Forms', href: '/dashboard/forms', icon: FileText },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
  { name: 'Directory', href: '/dashboard/directory', icon: FolderGit2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Initialize theme on mount
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

  const activeItem = sidebarItems.find(item => pathname === item.href) || sidebarItems[0];

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-space-theme flex flex-col md:flex-row transition-all duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel bg-theme-sidebar/80 border-r border-theme-sidebar-border h-screen sticky top-0 z-40">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-theme-border/30 gap-3">
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
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-border/20'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-theme-text-secondary group-hover:text-theme-text-primary'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-theme-border/30 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-10 w-10 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-medium text-sm text-theme-text-primary truncate">Kayomarz Pavri</h4>
              <p className="text-[11px] text-theme-text-secondary truncate">Super User (Tier 1)</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Header / Nav */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 glass-panel bg-theme-sidebar/80 border-b border-theme-sidebar-border sticky top-0 z-40 w-full">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 flex items-center justify-center">
            <img 
              src="/images/leads-short-logo.png" 
              alt="LEADS Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <span className="font-semibold text-sm text-theme-text-primary">LEADS Next Gen</span>
        </div>

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
            <nav className="flex flex-col gap-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            <div className="border-t border-theme-border/30 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-10 w-10 bg-accent/15 rounded-xl flex items-center justify-center border border-accent/20">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-theme-text-primary">Kayomarz Pavri</h4>
                  <p className="text-xs text-theme-text-secondary font-medium">Super User (Tier 1)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-all"
              >
                <LogOut className="h-4 w-4" />
                Log Out
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
            <h2 className="text-lg font-semibold text-theme-text-primary">{activeItem.name}</h2>
            <span className="text-[10px] uppercase font-bold text-accent px-2 py-0.5 bg-accent/15 rounded-md tracking-wider">Internal Ops</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-border/20 transition-all cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button className="h-10 w-10 flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary rounded-xl hover:bg-theme-border/20 transition-all cursor-pointer">
                <Bell className="h-5 w-5" />
              </button>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-danger rounded-full border border-theme-card"></span>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-theme-border/30"></div>

            {/* Active User info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h4 className="font-semibold text-sm text-theme-text-primary">Kayomarz Pavri</h4>
                <p className="text-[11px] text-theme-text-secondary font-medium tracking-wider">Super User</p>
              </div>
              <div className="h-9 w-9 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
                <span className="text-white font-bold text-sm">KP</span>
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
