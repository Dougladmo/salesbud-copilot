import {
  INJECTION_PATTERNS,
  DANGEROUS_OUTPUT_PATTERNS,
  CUSTOM_PROMPT_DANGEROUS_PATTERNS,
} from './patterns.js';

const REGEX_TIMEOUT_MS = 15;

export interface SanitizeResult {
  sanitized: string;
  flagged: boolean;
  threats: string[];
}

function safeTest(pattern: RegExp, text: string): boolean {
  const start = performance.now();
  const result = pattern.test(text);
  if (performance.now() - start > REGEX_TIMEOUT_MS) {
    return false;
  }
  return result;
}

function safeReplace(text: string, pattern: RegExp, replacement: string): string {
  const start = performance.now();
  const result = text.replace(pattern, replacement);
  if (performance.now() - start > REGEX_TIMEOUT_MS) {
    return text;
  }
  return result;
}

export function sanitizeUserInput(input: string): SanitizeResult {
  const threats: string[] = [];

  const invisible = /[\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g;
  let sanitized = input.replace(invisible, '');

  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  sanitized = sanitized.replace(/\n{5,}/g, '\n\n\n');

  for (const pattern of INJECTION_PATTERNS) {
    if (safeTest(pattern, sanitized)) {
      threats.push(`injection_pattern:${pattern.source.slice(0, 40)}`);
    }
  }

  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000);
    threats.push('input_truncated:exceeded_2000_chars');
  }

  return {
    sanitized,
    flagged: threats.length > 0,
    threats,
  };
}

export function sanitizeOutput(output: string): string {
  let sanitized = output;

  for (const pattern of DANGEROUS_OUTPUT_PATTERNS) {
    if (safeTest(pattern, sanitized)) {
      sanitized = safeReplace(sanitized, pattern, '[conteúdo removido]');
    }
  }

  return sanitized;
}

export function sanitizeCustomPrompt(customPrompt: string): string {
  let sanitized = customPrompt;

  for (const pattern of CUSTOM_PROMPT_DANGEROUS_PATTERNS) {
    sanitized = safeReplace(sanitized, pattern, '[instrução removida]');
  }

  if (sanitized.length > 1000) {
    sanitized = sanitized.slice(0, 1000);
  }

  return sanitized;
}
