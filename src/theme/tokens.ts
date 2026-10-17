/**
 * FlockMitra design tokens.
 *
 * Single source of truth for colors, spacing, typography, radii and layout
 * metrics. Components must read from here instead of scattering raw values.
 *
 * Palette direction: grounded deep green for trust and farm context without
 * agricultural clichés; warm amber for attention; neutral ink for records.
 * Semantic tones (success/warning/danger/info/neutral) keep the same meaning
 * on every screen. Light theme only for now (app.json sets light UI style).
 */
import type { TextStyle } from 'react-native';

export const colors = {
  // Surfaces
  background: '#F4F7F5',
  surface: '#FFFFFF',
  border: '#DBE4DF',

  // Text
  ink: '#17231E',
  inkMuted: '#5B6B63',

  // Brand (primary actions, selected states)
  brand: '#0F5F45',
  brandPressed: '#0B4734',
  brandSoft: '#E3EFEA',
  brandBorder: '#C8DCD3',
  onBrand: '#FFFFFF',

  // Semantic — meaning is fixed across the app
  success: '#1B6C3E',
  successSoft: '#E5F2EA',
  warning: '#8A5300',
  warningSoft: '#FCF1DF',
  danger: '#9E2B20',
  dangerSoft: '#FAEBE9',
  info: '#1C5287',
  infoSoft: '#E7EFF8',
  neutral: '#54625B',
  neutralSoft: '#ECEFEE',

  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Type scale. System font (Roboto on Android) renders Devanagari natively,
 * so no custom font loading is needed for Marathi.
 * hero > title > metric > section > body > caption.
 */
export const typography = {
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  metric: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  section: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

export const layout = {
  screenPadding: 16,
  tabBarHeight: 56,
  /** ~48dp minimum touch target for actions. */
  touchTargetMin: 48,
  /** Scroll clearance so content is not hidden behind the fixed tab bar. */
  tabScreenBottomSpace: 80,
  /** Conservative padding under the tab bar on Android system navigation. */
  androidNavBarPadding: 12,
} as const;

/** Restrained elevation: hairline borders do most of the separation work. */
export const elevation = {
  tabBar: {
    shadowColor: '#0B1712',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
} as const;
