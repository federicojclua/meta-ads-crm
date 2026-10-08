/**
 * Knowledge Base RAG Engine
 *
 * Loads all documents from the `base de conocimiento/` directory, parses their
 * metadata headers, and provides keyword-based search to inject relevant context
 * into the LLM prompt. This is a lightweight "RAG-inline" approach that avoids
 * external vector databases — suitable for a knowledge base under ~1 MB total.
 *
 * Each document has a YAML-like metadata block at the top:
 *   > **Metadata**
 *   > - source: ...
 *   > - country: AR · brand: Clover · company: Fiserv
 *   > - audience: comercio · allowed_for: sales, support
 *   > - priority: 10
 *   > - last_checked: 2026-05-07
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { DEFAULT_AI_BRAIN } from '../../../models/AiBrain.js';

// Cache for loaded knowledge base (survives within a single Lambda invocation)
let _cachedKB = null;

/**
 * Resolves the path to the `base de conocimiento` directory.
 * Works both locally and in Netlify Functions deployment.
 */
function resolveKBPath() {
  // In Netlify Functions, the working directory is the function's directory.
  // The knowledge base is at the project root.
  const candidates = [
    join(process.cwd(), 'base de conocimiento'),
    join(process.cwd(), '..', '..', 'base de conocimiento'),
    join(process.cwd(), '..', 'base de conocimiento'),
    // Netlify bundles from project root
    join('/var/task', 'base de conocimiento'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Parses the metadata block from a markdown/text document.
 * Returns { metadata, content } where content is the document without the metadata block.
 */
function parseDocumentMetadata(rawContent, filename) {
  const lines = rawContent.split('\n');
  const metadata = {
    source: '',
    country: 'AR',
    brand: '',
    company: '',
    audience: 'comercio',
    allowedFor: ['sales', 'support'],
    priority: 5,
    lastChecked: '',
    documentCategory: '',
    filename,
  };

  let contentStartIndex = 0;
  let inMetadataBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect metadata block start
    if (line.includes('**Metadata**') || line.includes('Metadata')) {
      inMetadataBlock = true;
      contentStartIndex = i + 1;
      continue;
    }

    if (inMetadataBlock) {
      // Metadata lines start with > - key: value
      const metaMatch = line.match(/^>?\s*-\s*(\w[\w_]*)\s*:\s*(.+)$/);
      if (metaMatch) {
        const key = metaMatch[1].trim();
        const value = metaMatch[2].trim();

        switch (key) {
          case 'source': metadata.source = value; break;
          case 'country': metadata.country = value; break;
          case 'brand': metadata.brand = value; break;
          case 'company': metadata.company = value; break;
          case 'audience': metadata.audience = value; break;
          case 'allowed_for':
            metadata.allowedFor = value.split(',').map((s) => s.trim());
            break;
          case 'priority':
            metadata.priority = parseInt(value, 10) || 5;
            break;
          case 'last_checked': metadata.lastChecked = value; break;
          case 'document_category': metadata.documentCategory = value; break;
          default: break;
        }
        contentStartIndex = i + 1;
      } else if (line === '' || (!line.startsWith('>') && !line.startsWith('-'))) {
        // End of metadata block
        inMetadataBlock = false;
      }
    }
  }

  const content = lines.slice(contentStartIndex).join('\n').trim();
  return { metadata, content };
}

/**
 * Tokenizes text into lowercase words for keyword matching.
 */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9áéíóúñü\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Calculates a relevance score between a query and a document.
 * Uses TF-based keyword matching with priority and title boosting.
 */
function scoreDocument(queryTokens, doc) {
  const docTokens = new Set(tokenize(doc.content));
  const titleTokens = new Set(tokenize(doc.title));

  let matchCount = 0;
  let titleMatchCount = 0;

  for (const qt of queryTokens) {
    if (docTokens.has(qt)) matchCount++;
    if (titleTokens.has(qt)) titleMatchCount++;
  }

  if (matchCount === 0 && titleMatchCount === 0) return 0;

  // Score: keyword matches + title bonus + priority bonus
  const keywordScore = matchCount / Math.max(queryTokens.length, 1);
  const titleBonus = titleMatchCount * 0.3;
  const priorityBonus = (doc.metadata.priority || 5) / 10 * 0.2;

  return keywordScore + titleBonus + priorityBonus;
}

/**
 * Loads all knowledge base documents from disk.
 * Caches the result for the duration of the Lambda invocation.
 *
 * @returns {Array<{ title: string, filename: string, metadata: Object, content: string }>}
 */
export function loadKnowledgeBase() {
  if (_cachedKB) return _cachedKB;

  const kbPath = resolveKBPath();
  if (!kbPath) {
    console.warn('[KB] Knowledge base directory not found. Bot will operate without RAG.');
    _cachedKB = [];
    return _cachedKB;
  }

  const files = readdirSync(kbPath).filter((f) => {
    const ext = extname(f).toLowerCase();
    return ['.md', '.txt'].includes(ext);
  });

  const documents = [];

  for (const filename of files) {
    try {
      const filePath = join(kbPath, filename);
      const rawContent = readFileSync(filePath, 'utf-8');
      const { metadata, content } = parseDocumentMetadata(rawContent, filename);

      // Extract title from first H1 or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : filename.replace(/\.(md|txt)$/, '').replace(/[_-]/g, ' ');

      // Skip the massive articles dump (530KB) — it's too large for inline RAG.
      // Its index (posberry_kb_indice.md) provides enough coverage.
      if (filename === 'posberry_kb_articulos.md') {
        documents.push({
          title: 'Índice de artículos POSBerry (referencia)',
          filename,
          metadata,
          content: '(Base documental completa de POSBerry: 371 artículos de ayuda técnica. Para consultas específicas de soporte técnico, derivar al asesor o a la central de ayuda: https://posberry.tawk.help)',
        });
        continue;
      }

      documents.push({ title, filename, metadata, content });
    } catch (err) {
      console.warn(`[KB] Error loading ${filename}:`, err.message);
    }
  }

  console.log(`[KB] Loaded ${documents.length} knowledge base documents.`);
  _cachedKB = documents;
  return _cachedKB;
}

/**
 * Searches the knowledge base for the most relevant documents to a given query.
 *
 * @param {string} query - The user's message or search query.
 * @param {Object} options
 * @param {number} [options.topK=5] - Max number of documents to return.
 * @param {string} [options.context='sales'] - Filter by allowed_for context.
 * @returns {Array<{ title: string, filename: string, content: string, score: number }>}
 */
export function searchKnowledge(query, { topK = 5, context = 'sales' } = {}) {
  const documents = loadKnowledgeBase();
  if (documents.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const scored = documents
    .filter((doc) => {
      // Filter by context if specified
      if (context && doc.metadata.allowedFor && doc.metadata.allowedFor.length > 0) {
        return doc.metadata.allowedFor.some((af) => af === context || af === 'sales' || af === 'support');
      }
      return true;
    })
    .map((doc) => ({
      title: doc.title,
      filename: doc.filename,
      content: doc.content,
      score: scoreDocument(queryTokens, doc),
    }))
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

/**
 * Builds a context string from the top-K relevant documents for injection into the LLM prompt.
 * Truncates each document to a reasonable size to fit within token limits.
 *
 * @param {string} query - The user's message.
 * @param {Object} options
 * @param {number} [options.topK=5]
 * @param {number} [options.maxCharsPerDoc=2000]
 * @param {string} [options.context='sales']
 * @returns {string} Formatted context block for the system prompt.
 */
export function buildRAGContext(query, { topK = 5, maxCharsPerDoc = 2000, context = 'sales' } = {}) {
  const results = searchKnowledge(query, { topK, context });

  if (results.length === 0) {
    return '(No se encontraron documentos relevantes en la base de conocimiento para esta consulta.)';
  }

  const blocks = results.map((doc) => {
    const truncatedContent = doc.content.length > maxCharsPerDoc
      ? doc.content.slice(0, maxCharsPerDoc) + '\n[... documento truncado]'
      : doc.content;

    return `### ${doc.title}\n${truncatedContent}`;
  });

  return blocks.join('\n\n---\n\n');
}

/**
 * Returns the formatted commercial plan for inclusion in the system prompt.
 *
 * @param {Array} commercialPlan - The brain's commercial plan array.
 * @returns {string}
 */
export function formatCommercialPlan(commercialPlan) {
  if (!Array.isArray(commercialPlan) || commercialPlan.length === 0) {
    return '(No hay ofertas comerciales configuradas.)';
  }

  const activeOffers = commercialPlan
    .filter((o) => o.isActive)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));

  if (activeOffers.length === 0) {
    return '(No hay ofertas comerciales vigentes.)';
  }

  return activeOffers.map((offer, idx) => {
    const benefits = (offer.benefits || []).map((b) => `  - ${b}`).join('\n');
    return [
      `${idx + 1}. ${offer.name}`,
      `   ¿Para quién? ${offer.target}`,
      `   Pregunta de calificación: "${offer.qualificationQuestion}"`,
      `   ¿A quién NO mencionársela? ${offer.exclusion}`,
      `   Beneficios:`,
      benefits,
    ].join('\n');
  }).join('\n\n');
}

/**
 * Returns the active commercial plan matrix sorted by priority.
 *
 * @param {Array} [commercialPlan]
 * @returns {Array}
 */
export function getCommercialPlan(commercialPlan) {
  const plan = Array.isArray(commercialPlan) ? commercialPlan : DEFAULT_AI_BRAIN.commercialPlan;
  if (!Array.isArray(plan)) return [];
  return plan
    .filter((o) => o.isActive)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
}
