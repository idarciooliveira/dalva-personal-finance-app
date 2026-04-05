import {
  Banknote,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  Utensils,
  Car,
  Home,
  Zap,
  Tv,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Repeat,
  MoreHorizontal,
  Briefcase,
  Coins,
  Plane,
  Dumbbell,
  Coffee,
  Baby,
  Dog,
  Scissors,
  Shirt,
  Music,
  Gamepad2,
  BookOpen,
  Stethoscope,
  Pill,
  Umbrella,
  Landmark,
  Receipt,
  Wallet,
  PiggyBank,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

/**
 * Map of Lucide icon name strings (as stored in the database) to their
 * React component. This is the single source of truth for all category icons.
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  laptop: Laptop,
  "trending-up": TrendingUp,
  gift: Gift,
  "plus-circle": PlusCircle,
  utensils: Utensils,
  car: Car,
  home: Home,
  zap: Zap,
  tv: Tv,
  "heart-pulse": HeartPulse,
  "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,
  repeat: Repeat,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  coins: Coins,
  plane: Plane,
  dumbbell: Dumbbell,
  coffee: Coffee,
  baby: Baby,
  dog: Dog,
  scissors: Scissors,
  shirt: Shirt,
  music: Music,
  gamepad2: Gamepad2,
  "book-open": BookOpen,
  stethoscope: Stethoscope,
  pill: Pill,
  umbrella: Umbrella,
  landmark: Landmark,
  receipt: Receipt,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  "hand-coins": HandCoins,
};

/**
 * Resolve a Lucide icon name to its component. Falls back to Wallet.
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICON_MAP[iconName] ?? Wallet;
}

/**
 * All available icon names for the icon picker.
 */
export const AVAILABLE_ICONS = Object.keys(CATEGORY_ICON_MAP);

/**
 * Curated palette of category colors. Covers a good spectrum for both light
 * and dark themes.
 */
export const CATEGORY_COLORS = [
  "#2F5711", // Forest green
  "#4A7C23", // Lime green
  "#1A6B3C", // Teal green
  "#0EA5E9", // Sky blue
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#7C3AED", // Purple
  "#A855F7", // Bright purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#6B7280", // Gray
  "#374151", // Dark gray
];
