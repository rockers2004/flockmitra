/**
 * Pure translation helpers — no React, no platform code.
 *
 * `translate` resolves a key against a dictionary and interpolates
 * `{param}` placeholders. Missing keys fall back to the key itself so a
 * lookup mistake degrades visibly instead of rendering "undefined".
 */

export type TranslationParams = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{(\w+)\}/g;

/** Replaces `{name}` placeholders from `params`; unknown ones are left as-is. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Returns the placeholder names used by a template, sorted for comparison. */
export function extractPlaceholders(template: string): readonly string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

export function translate<L extends Record<string, string>>(
  dictionary: L,
  key: string & keyof L,
  params?: TranslationParams,
): string {
  const template = dictionary[key];
  if (template === undefined) {
    return String(key);
  }
  return interpolate(template, params);
}
