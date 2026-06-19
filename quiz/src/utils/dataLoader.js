const BASE = import.meta.env.BASE_URL || '/';

// JSON filename + image-folder name vary per source. Topic ids match the JSON
// stem; imageFolder is the directory name under public/images/{source}/.
const SOURCES = {
  pdf: {
    id: 'pdf',
    label: 'PDF',
    description: 'Cisco PDF — 6 chủ đề theo blueprint thi chính thức.',
    topics: [
      { id: 'routing', label: 'Routing', file: 'routing.json', imageFolder: 'routing' },
      { id: 'ip_services', label: 'IP Services', file: 'ip_services.json', imageFolder: 'ip_services' },
      { id: 'security-and-wireless', label: 'Security & Wireless', file: 'security-and-wireless.json', imageFolder: 'security-and-wireless' },
      { id: 'tcp-udp', label: 'TCP / UDP', file: 'tcp-udp.json', imageFolder: 'tcp-udp' },
      { id: 'automation-virtual-sdn', label: 'Automation, Virtualization & SDN', file: 'automation-virtual-sdn.json', imageFolder: 'automation-virtual-sdn' },
      { id: 'layer2_technologies', label: 'Layer 2 Technologies', file: 'layer2_technologies.json', imageFolder: 'layer2_technologies' },
    ],
  },
  docx: {
    id: 'docx',
    label: 'Part 5–10',
    description: 'Ngân hàng câu hỏi Part 5 đến Part 10 — phân loại theo domain thi.',
    topics: [
      { id: 'CCNA_Network_Fundamentals', label: 'Network Fundamentals', file: 'CCNA_Network_Fundamentals.json', imageFolder: 'CCNA_Network_Fundamentals' },
      { id: 'CCNA_Network_Access', label: 'Network Access', file: 'CCNA_Network_Access.json', imageFolder: 'CCNA_Network_Access' },
      { id: 'CCNA_IP_Connectivity', label: 'IP Connectivity', file: 'CCNA_IP_Connectivity.json', imageFolder: 'CCNA_IP_Connectivity' },
      { id: 'CCNA_IP_Services', label: 'IP Services', file: 'CCNA_IP_Services.json', imageFolder: 'CCNA_IP_Services' },
      { id: 'CCNA_Security_Fundamentals', label: 'Security Fundamentals', file: 'CCNA_Security_Fundamentals.json', imageFolder: 'CCNA_Security_Fundamentals' },
      { id: 'CCNA_Automation_Programmability', label: 'Automation & Programmability', file: 'CCNA_Automation_Programmability.json', imageFolder: 'CCNA_Automation_Programmability' },
    ],
  },
  odt: {
    id: 'odt',
    label: 'Part 11–16',
    description: 'Ngân hàng câu hỏi Part 11 đến Part 16.',
    topics: [
      { id: 'part_11', label: 'Part 11', file: 'Part 11.json', imageFolder: 'Part_11' },
      { id: 'part_12', label: 'Part 12', file: 'Part 12.json', imageFolder: 'Part_12' },
      { id: 'part_13', label: 'Part 13', file: 'Part 13.json', imageFolder: 'Part_13' },
      { id: 'part_14', label: 'Part 14', file: 'part 14.json', imageFolder: 'Part_14' },
      { id: 'part_15', label: 'Part 15', file: 'part 15.json', imageFolder: 'Part_15' },
      { id: 'part_16', label: 'Part 16', file: 'Part 16.json', imageFolder: 'Part_16' },
      { id: 'missing', label: 'Missing', file: 'Missing.json', imageFolder: 'Missing' },
    ],
  },
};

function findTopic(sourceId, topicId) {
  const src = SOURCES[sourceId];
  if (!src) return null;
  return src.topics.find((t) => t.id === topicId) || null;
}

export function getSources() {
  return Object.values(SOURCES).map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
    totalCount: 0, // will be populated by fetchTopicCounts
    topics: s.topics.map((t) => ({ id: t.id, label: t.label, count: 0 })),
  }));
}

const countCache = new Map();

/**
 * Fetch actual question counts from JSON files for a source.
 * Returns { topicId: count } object.
 */
export async function fetchTopicCounts(sourceId) {
  if (countCache.has(sourceId)) return countCache.get(sourceId);

  const src = SOURCES[sourceId];
  if (!src) return {};

  const counts = {};
  await Promise.all(
    src.topics.map(async (t) => {
      const url = `${BASE}data/${sourceId}/${encodeURIComponent(t.file)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const questions = Array.isArray(data) ? data : data.questions || [];
        counts[t.id] = questions.length;
      } catch {
        counts[t.id] = 0;
      }
    })
  );

  countCache.set(sourceId, counts);
  return counts;
}

export function getSource(sourceId) {
  const s = SOURCES[sourceId];
  if (!s) return null;
  return {
    id: s.id,
    label: s.label,
    description: s.description,
    totalCount: 0,
    topics: s.topics.map((t) => ({ id: t.id, label: t.label, count: 0 })),
  };
}

export function getTopics(sourceId) {
  const s = SOURCES[sourceId];
  return s ? s.topics.map((t) => ({ id: t.id, label: t.label, count: 0 })) : [];
}

const cache = new Map();

export async function loadSource(sourceId, topicId) {
  if (topicId === 'all') {
    const src = SOURCES[sourceId];
    if (!src) throw new Error(`Unknown source '${sourceId}'`);
    const lists = await Promise.all(
      src.topics.map((t) => loadSource(sourceId, t.id))
    );
    return lists.flat();
  }

  const topic = findTopic(sourceId, topicId);
  if (!topic) throw new Error(`Unknown topic '${topicId}' for source '${sourceId}'`);

  const key = `${sourceId}/${topicId}`;
  if (cache.has(key)) return cache.get(key);

  const url = `${BASE}data/${sourceId}/${encodeURIComponent(topic.file)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const questions = Array.isArray(data) ? data : data.questions || [];
  const normalized = questions.map((q) => ({
    ...q,
    _source: sourceId,
    _topic: topicId,
    _uid: `${sourceId}:${topicId}:${q.id}`,
    imageFolder: topic.imageFolder,
  }));
  cache.set(key, normalized);
  return normalized;
}

export function getImagePath(sourceId, topicId, filename) {
  if (!filename) return null;
  const topic = findTopic(sourceId, topicId);
  if (!topic || !topic.imageFolder) return null;
  return `${BASE}images/${sourceId}/${topic.imageFolder}/${filename}`;
}

export function clearCache() {
  cache.clear();
}
