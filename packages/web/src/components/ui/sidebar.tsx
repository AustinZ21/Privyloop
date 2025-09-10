"use client"

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  FileText,
  Bell,
  HelpCircle,
  Shield,
  User,
  UserPlus
} from 'lucide-react';
import { cn } from 'src/lib/utils';
import { useAuthState, signOut } from 'src/lib/auth-client';
import { useDialogManager } from 'src/lib/dialog-manager';

// Type definition for a navigation item
interface NavigationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

// Props interface for the Sidebar
interface SidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

// Data for the navigation links
const navigationItems: NavigationItem[] = [
  { id: "dashboard", name: "Dashboard", icon: Home, href: "/dashboard" },
  { id: "privacy", name: "Privacy Scans", icon: Shield, href: "/privacy" },
  { id: "analytics", name: "Analytics", icon: BarChart3, href: "/analytics" },
  { id: "reports", name: "Reports", icon: FileText, href: "/reports", badge: "3" },
  { id: "notifications", name: "Notifications", icon: Bell, href: "/notifications", badge: "12" },
  { id: "settings", name: "Settings", icon: Settings, href: "/settings" },
  { id: "help", name: "Help & Support", icon: HelpCircle, href: "/help" },
];

export default function Sidebar({ className = "", activeItem = "dashboard", onItemClick }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Authentication state and dialog management
  const { isAuthenticated, isLoading, user } = useAuthState();
  const { open } = useDialogManager();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const handleItemClick = async (itemId: string) => {
    // Handle authentication-specific actions
    switch (itemId) {
      case 'login':
        open('login');
        break;
      case 'signup':
        open('signup');
        break;
      case 'logout':
        try {
          await signOut();
          // Optionally redirect to home page
          window.location.href = '/';
        } catch (error) {
          console.error('Logout failed:', error);
        }
        break;
      default:
        // Handle regular navigation
        onItemClick?.(itemId);
        break;
    }
    
    // Close mobile sidebar
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-bg-800 shadow-md border border-neutral-700 md:hidden hover:bg-brand-600 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? 
          <X className="h-5 w-5 text-brand-500" /> : 
          <Menu className="h-5 w-5 text-brand-500" />
        }
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen bg-bg-800 border-r border-neutral-700 z-40 transition-all duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-20" : "w-72",
          "md:translate-x-0 md:static md:z-auto md:h-screen",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-700 bg-bg-900">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-bg-900" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-brand-500 text-base">PrivyLoop</span>
                <span className="text-xs text-neutral-400">Privacy Dashboard</span>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center mx-auto shadow-sm">
              <Shield className="w-5 h-5 text-bg-900" />
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-neutral-700 transition-all duration-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-neutral-400" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-neutral-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-left transition-all duration-200 group relative",
                      isActive
                        ? "bg-brand-500/10 text-brand-500"
                        : "text-neutral-400 hover:bg-neutral-700 hover:text-white",
                      isCollapsed ? "justify-center px-2" : ""
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      <Icon
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isActive 
                            ? "text-brand-500" 
                            : "text-neutral-400 group-hover:text-white"
                        )}
                      />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full">
                        <span className={cn("text-sm", isActive ? "font-medium" : "font-normal")}>{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-xs font-medium rounded-full",
                            isActive
                              ? "bg-brand-500/20 text-brand-500"
                              : "bg-neutral-700 text-neutral-400"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {isCollapsed && item.badge && (
                      <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-brand-500 border-2 border-bg-800">
                        <span className="text-[10px] font-medium text-bg-900">
                          {parseInt(item.badge) > 9 ? '9+' : item.badge}
                        </span>
                      </div>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-bg-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-neutral-700">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-brand-500 text-bg-900 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-bg-900 rotate-45 border-l border-b border-neutral-700" />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer / User Profile Section */}
        <div className="mt-auto border-t border-neutral-700">
          {isLoading ? (
            /* Loading State */
            <div className="p-3 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isAuthenticated && user ? (
            /* Authenticated User Profile */
            <>
              <div className={cn("border-b border-neutral-700 bg-bg-900", isCollapsed ? 'py-3 px-2' : 'p-3')}>
                {!isCollapsed ? (
                  <div className="flex items-center px-3 py-2 rounded-md bg-bg-700 hover:bg-neutral-700 transition-colors duration-200">
                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                      <span className="text-bg-900 font-medium text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 ml-2.5">
                      <p className="text-sm font-medium text-white truncate">
                        {user.name || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {user.emailVerified ? 'Privacy Admin' : 'Unverified'}
                      </p>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full ml-2",
                      user.emailVerified ? "bg-green-500" : "bg-yellow-500"
                    )} title={user.emailVerified ? "Verified" : "Pending verification"} />
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-bg-900 font-medium text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-800",
                        user.emailVerified ? "bg-green-500" : "bg-yellow-500"
                      )} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3">
                <button
                  onClick={() => handleItemClick("logout")}
                  className={cn(
                    "w-full flex items-center rounded-md text-left transition-all duration-200 group relative",
                    "text-red-400 hover:bg-red-500/10 hover:text-red-300",
                    isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"
                  )}
                  title={isCollapsed ? "Logout" : undefined}
                >
                  <div className="flex items-center justify-center min-w-[24px]">
                    <LogOut className="h-4 w-4 flex-shrink-0 text-red-400 group-hover:text-red-300" />
                  </div>
                  
                  {!isCollapsed && (
                    <span className="text-sm">Logout</span>
                  )}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-bg-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-neutral-700">
                      Logout
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-bg-900 rotate-45 border-l border-b border-neutral-700" />
                    </div>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Unauthenticated State - Login/Signup Buttons */
            <div className="p-3 space-y-2">
              {!isCollapsed ? (
                <>
                  <button
                    onClick={() => handleItemClick("login")}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-left transition-all duration-200 bg-brand-500 hover:bg-brand-600 text-black font-medium"
                  >
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Sign In</span>
                  </button>
                  
                  <button
                    onClick={() => handleItemClick("signup")}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-md text-left transition-all duration-200 border border-brand-500 text-brand-500 hover:bg-brand-500/10"
                  >
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Sign Up</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleItemClick("login")}
                    className="w-full p-2.5 rounded-md transition-all duration-200 bg-brand-500 hover:bg-brand-600 text-black font-medium flex justify-center relative group"
                    title="Sign In"
                  >
                    <User className="h-4 w-4" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-bg-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-neutral-700">
                      Sign In
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-bg-900 rotate-45 border-l border-b border-neutral-700" />
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleItemClick("signup")}
                    className="w-full p-2.5 rounded-md transition-all duration-200 border border-brand-500 text-brand-500 hover:bg-brand-500/10 flex justify-center relative group"
                    title="Sign Up"
                  >
                    <UserPlus className="h-4 w-4" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-bg-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-neutral-700">
                      Sign Up
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-bg-900 rotate-45 border-l border-b border-neutral-700" />
                    </div>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}