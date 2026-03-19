/**
 * Padrões de detecção de prompt injection e output perigoso.
 * Inclui variações em português e inglês.
 */

// ── Injection: Override de instruções ──────────────────────────────
export const INJECTION_PATTERNS: RegExp[] = [
  // PT - ignorar/desconsiderar instruções
  /ignor[ea]\s+(todas?\s+)?(instru[çc][õo]es|regras|comandos)\s+(anteriores|acima|do\s+sistema)/i,
  /desconsider[ea]\s+(todas?\s+)?(instru[çc][õo]es|regras|comandos)/i,
  /esque[çc]a\s+(todas?\s+)?(instru[çc][õo]es|regras|comandos)\s+(anteriores|acima)/i,
  /sobrescrev[ea]\s+(as\s+)?(instru[çc][õo]es|regras|sistema)/i,
  /anula?\s+(as\s+)?(instru[çc][õo]es|regras)/i,

  // EN - ignore/disregard instructions
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /override\s+(system|instructions?|rules?|prompts?)/i,

  // ── Injection: Troca de identidade ───────────────────────────────
  // PT
  /agora\s+voc[eê]\s+[eé]\s+(um|uma|o|a)\s+/i,
  /finja\s+(ser|que\s+[eé])\s+/i,
  /fa[çc]a\s+de\s+conta\s+que/i,
  /assuma\s+o?\s*(papel|identidade|persona)\s+de/i,
  /mude\s+(seu|sua|de)\s+(papel|persona|identidade|modo)/i,
  /novo\s+(papel|persona|identidade|modo)\s*:/i,

  // EN
  /you\s+are\s+now\s+(a|an|the)\s+/i,
  /act\s+as\s+(a|an|if)\s+/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /switch\s+to\s+(a\s+)?(new\s+)?(role|mode|persona)/i,
  /new\s+(role|persona|identity|character)\s*:/i,

  // ── Injection: Delimitadores falsos ──────────────────────────────
  /system\s*:\s*/i,
  /\[system\]/i,
  /\[inst\]/i,
  /<<\s*sys\s*>>/i,
  /###\s*(system|instruction|prompt|sistema|instru[çc][õo]es)/i,

  // ── Injection: Extração de prompt ────────────────────────────────
  // PT
  /mostr[ea]\s+(me\s+)?(seu|sua|o|as?)\s+(prompt|instru[çc][õo]es|regras)/i,
  /qual\s+[eé]\s+(seu|sua|o)\s+(prompt|instru[çc][õo]es|regras)/i,
  /repita\s+(seu|sua|o|as?)\s+(prompt|instru[çc][õo]es|regras)/i,
  /revel[ea]\s+(seu|sua|o|as?)\s+(prompt|instru[çc][õo]es|regras)/i,
  /traduz[ai]\s+(seu|sua|o|as?)\s+(prompt|instru[çc][õo]es|regras)/i,
  /codifiqu?e\s+(seu|sua|o|as?)\s+(prompt|instru[çc][õo]es)/i,

  // EN
  /repeat\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /show\s+(me\s+)?(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions?|rules?)/i,
  /reveal\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /print\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /output\s+(your|the)\s+(initial|system|original)\s+(prompt|instructions?)/i,
  /translate\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /encode\s+(your|the|system)\s+(prompt|instructions?|rules?)/i,
  /base64\s+(your|the|system)/i,

  // ── Injection: Jailbreak ─────────────────────────────────────────
  /jailbreak/i,
  /DAN\s*mode/i,
  /developer\s*mode/i,
  /modo\s+(desenvolvedor|dev|irrestrito|sem\s+filtro)/i,
  /sudo\s+mode/i,
  /god\s*mode/i,
  /modo\s+deus/i,
  /sem\s+(restri[çc][õo]es|limites|filtros?|censura)/i,
];

// ── Padrões usados para sanitizar customPrompt do vendedor ─────────
export const CUSTOM_PROMPT_DANGEROUS_PATTERNS: RegExp[] = [
  /ignor[ea]\s+(todas?\s+)?(instru[çc][õo]es|regras)\s+(anteriores|do\s+sistema)/gi,
  /desconsider[ea]\s+(todas?\s+)?(instru[çc][õo]es|regras)/gi,
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?)/gi,
  /override\s+(system|instructions?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /agora\s+voc[eê]\s+[eé]/gi,
  /you\s+are\s+now/gi,
  /novo?\s+(papel|role)\s*:/gi,
  /system\s*:\s*/gi,
];

// ── Output: conteúdo perigoso na resposta do agente ────────────────
export const DANGEROUS_OUTPUT_PATTERNS: RegExp[] = [
  /https?:\/\/[^\s]*(?:malware|phishing|hack|exploit)/i,
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on(?:error|load|click)\s*=/i,
  /data:text\/html/i,
];
