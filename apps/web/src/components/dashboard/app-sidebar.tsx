import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  CreditCard,
  Settings,
  LogOut,
  Sun,
  Moon,
  Tags,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

/* -------------------------------------------------------------------------- */
/*  Navigation items                                                          */
/* -------------------------------------------------------------------------- */

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Accounts", icon: Wallet, href: "/accounts" },
  { label: "Transactions", icon: ArrowLeftRight, href: "/transactions" },
  { label: "Categories", icon: Tags, href: "/categories" },
  { label: "Budgets", icon: PieChart, href: "/dashboard" },
  { label: "Goals", icon: Target, href: "/goals" },
  { label: "Debts", icon: CreditCard, href: "/dashboard" },
] as const;

const settingsNav = [
  { label: "Settings", icon: Settings, href: "/dashboard" },
] as const;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface AppSidebarProps {
  onSignOut: () => void;
  onToggleDark: () => void;
  isDark: boolean;
  userName?: string;
}

export function AppSidebar({
  onSignOut,
  onToggleDark,
  isDark,
  userName,
}: AppSidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <Sidebar>
      {/* Logo + user */}
      <SidebarHeader className="flex h-14 flex-row items-center gap-3 border-b border-border px-5">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-heading  text-lg font-semibold text-sidebar-foreground">
            DALVA
          </span>
          {userName && (
            <p className="text-xs text-sidebar-foreground/60 truncate max-w-35">
              {userName}
            </p>
          )}
        </Link>
      </SidebarHeader>

      {/* Main navigation */}
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup className="p-0 pt-4">
          <SidebarGroupLabel className="px-3 pb-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/40">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={currentPath === item.href}
                    tooltip={item.label}
                    className="px-3 [&_svg]:size-5"
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span className="text-[14px]">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-3" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 pb-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/40">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    tooltip={item.label}
                    className="px-3 [&_svg]:size-5"
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span className="text-[14px]">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: theme toggle + sign out */}
      <SidebarFooter className="px-4 pb-5 pt-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onToggleDark}
              size="lg"
              tooltip="Toggle theme"
              className="px-3 [&_svg]:size-5"
            >
              {isDark ? <Sun /> : <Moon />}
              <span className="text-[14px]">
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSignOut}
              size="lg"
              tooltip="Sign out"
              className="px-3 [&_svg]:size-5"
            >
              <LogOut />
              <span className="text-[14px]">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
