export const CLI_PROMPT_RE = /^(?:[\w.-]+(?:\([\w-]*\))?[>#]\s*|Router[\w(>#]|Switch[\w(>#]|R\d+[\w(>#]|SW\d+[\w(>#])/;
export const CLI_KEYWORD_RE = /^(?:interface\s|ip\s|no\s|router\s|switch\s|enable\b|configure\s|line\s|access-list\s|vlan\s|hostname\s|description\s|switchport\s|spanning-tree\s|encapsulation\s|show\s|debug\s|copy\s|exit\b|end\b)/i;
export const CLI_OUTPUT_RE = /^(?:gigabitethernet|fastethernet|serial|vlan|loopback|tunnel|port-channel|hardware is|mtu \d|bw \d|encapsulation|arp type|last input|output queue|five minute|packets input|packets output|received \d|\d+ input|\d+ output|input errors|output errors|\s{2,}|\!|building config|current config|version \d|boot|interface |ip |no |router |spanning|switchport|access-list|vlan |hostname |description |line |crypto |aaa |snmp |ntp |logging |end$|!$)/i;

export const PROSE_RE = /^(?:which|what|how|why|where|when|who|select|choose|an |a |the |this |that |these |if |given |based |refer |drag |place |match |\w.*\?$)/i;

export function looksLikeCli(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (CLI_PROMPT_RE.test(trimmed)) return true;
  if (CLI_KEYWORD_RE.test(trimmed)) return true;
  return false;
}

// Detect inline CLI block: "Refer to the exhibit. Cat9K-1#show lldp..." — CLI starts mid-sentence
// Match only when there's a clear sentence boundary before the CLI prompt
const INLINE_CLI_RE = /^(.+?[.!?])\s+([\w][\w.:-]*(?:\([\w-]*\))?[>#]\s.+)$/;

export function splitIntoSegments(text) {
  if (!text) return [];

  // First: handle inline CLI — text has CLI prompt mid-sentence on same line
  // Only applies to single-line text; multi-line text is handled by the loop below
  const inlineMatch = !text.includes('\n') ? text.match(INLINE_CLI_RE) : null;
  if (inlineMatch && inlineMatch[1].trim().length > 0) {
    // There's prose before the CLI prompt — split into prose + cli
    const prosePart = inlineMatch[1].trim();
    const cliPart = inlineMatch[2].trim();
    const segments = [];
    if (prosePart) segments.push({ kind: 'prose', text: prosePart });
    if (cliPart) segments.push({ kind: 'cli', text: cliPart });
    return segments;
  }

  const lines = text.split('\n');
  const segments = [];
  let buffer = [];
  let bufferKind = null;
  let inCliBlock = false;

  const flush = () => {
    if (!buffer.length) return;
    if (bufferKind === 'cli') {
      while (buffer.length && !buffer[buffer.length - 1].trim()) buffer.pop();
    }
    if (buffer.length) segments.push({ kind: bufferKind, text: buffer.join('\n') });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (inCliBlock) {
      const isClearProse = PROSE_RE.test(trimmed) && !looksLikeCli(line) && trimmed.length > 20;
      if (isClearProse) {
        inCliBlock = false;
        flush();
        bufferKind = 'prose';
        buffer.push(line);
      } else {
        buffer.push(line);
      }
      continue;
    }

    if (CLI_PROMPT_RE.test(trimmed)) {
      inCliBlock = true;
      flush();
      bufferKind = 'cli';
      buffer.push(line);
      continue;
    }

    const kind = looksLikeCli(line) ? 'cli' : 'prose';
    if (kind !== bufferKind) {
      flush();
      bufferKind = kind;
    }
    buffer.push(line);
  }
  flush();
  return segments;
}
