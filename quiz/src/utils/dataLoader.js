const BASE = import.meta.env.BASE_URL || '/';

// JSON filename + image-folder name vary per source. Topic ids match the JSON
// stem; imageFolder is the directory name under public/images/{source}/.
const SOURCES = {
  pdf: {
    id: 'pdf',
    label: 'PDF',
    description: 'Cisco PDF source — 6 topics covering the official exam blueprint.',
    topics: [
      { id: 'routing', label: 'Routing', file: 'routing.json', imageFolder: 'routing', count: 139 },
      { id: 'ip_services', label: 'IP Services', file: 'ip_services.json', imageFolder: 'ip_services', count: 103 },
      { id: 'security-and-wireless', label: 'Security & Wireless', file: 'security-and-wireless.json', imageFolder: 'security-and-wireless', count: 181 },
      { id: 'tcp-udp', label: 'TCP / UDP', file: 'tcp-udp.json', imageFolder: 'tcp-udp', count: 36 },
      { id: 'automation-virtual-sdn', label: 'Automation, Virtualization & SDN', file: 'automation-virtual-sdn.json', imageFolder: 'automation-virtual-sdn', count: 116 },
      { id: 'layer2_technologies', label: 'Layer 2 Technologies', file: 'layer2_technologies.json', imageFolder: 'layer2_technologies', count: 120 },
    ],
  },
  docx: {
    id: 'docx',
    label: 'DOCX',
    description: 'CCNA DOCX bank — grouped by exam domain.',
    topics: [
      { id: 'CCNA_Network_Fundamentals', label: 'Network Fundamentals', file: 'CCNA_Network_Fundamentals.json', imageFolder: 'CCNA_Network_Fundamentals', count: 43 },
      { id: 'CCNA_Network_Access', label: 'Network Access', file: 'CCNA_Network_Access.json', imageFolder: 'CCNA_Network_Access', count: 102 },
      { id: 'CCNA_IP_Connectivity', label: 'IP Connectivity', file: 'CCNA_IP_Connectivity.json', imageFolder: 'CCNA_IP_Connectivity', count: 59 },
      { id: 'CCNA_IP_Services', label: 'IP Services', file: 'CCNA_IP_Services.json', imageFolder: 'CCNA_IP_Services', count: 42 },
      { id: 'CCNA_Security_Fundamentals', label: 'Security Fundamentals', file: 'CCNA_Security_Fundamentals.json', imageFolder: 'CCNA_Security_Fundamentals', count: 66 },
      { id: 'CCNA_Automation_Programmability', label: 'Automation & Programmability', file: 'CCNA_Automation_Programmability.json', imageFolder: 'CCNA_Automation_Programmability', count: 42 },
    ],
  },
  odt: {
    id: 'odt',
    label: 'ODT',
    description: 'ODT practice set — Parts 11 through 16.',
    topics: [
      { id: 'part_11', label: 'Part 11', file: 'Part 11.json', imageFolder: 'Part_11', count: 62 },
      { id: 'part_12', label: 'Part 12', file: 'Part 12.json', imageFolder: 'Part_12', count: 93 },
      { id: 'part_13', label: 'Part 13', file: 'Part 13.json', imageFolder: 'Part_13', count: 79 },
      { id: 'part_14', label: 'Part 14', file: 'part 14.json', imageFolder: 'Part_14', count: 90 },
      { id: 'part_15', label: 'Part 15', file: 'part 15.json', imageFolder: 'Part_15', count: 86 },
      { id: 'part_16', label: 'Part 16', file: 'Part 16.json', imageFolder: 'Part_16', count: 72 },
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
    totalCount: s.topics.reduce((sum, t) => sum + (t.count || 0), 0),
    topics: s.topics.map((t) => ({ id: t.id, label: t.label, count: t.count || 0 })),
  }));
}

export function getSource(sourceId) {
  const s = SOURCES[sourceId];
  if (!s) return null;
  return {
    id: s.id,
    label: s.label,
    description: s.description,
    totalCount: s.topics.reduce((sum, t) => sum + (t.count || 0), 0),
    topics: s.topics.map((t) => ({ id: t.id, label: t.label, count: t.count || 0 })),
  };
}

export function getTopics(sourceId) {
  const s = SOURCES[sourceId];
  return s ? s.topics.map((t) => ({ id: t.id, label: t.label, count: t.count || 0 })) : [];
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
