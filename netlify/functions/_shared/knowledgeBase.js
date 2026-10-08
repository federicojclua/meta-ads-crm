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
import { DEFAULT_AI_BRAIN, MASTER_SALES_DOC_TEMPLATE } from '../../../models/AiBrain.js';

export { MASTER_SALES_DOC_TEMPLATE };

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
export function parseDocumentMetadata(rawContent, filename = 'documento.md') {
  const raw = String(rawContent || '');
  const lines = raw.split('\n');
  const metadata = {
    title: '',
    source: '',
    country: 'AR',
    brand: '',
    company: '',
    audience: 'comercio',
    category: 'ventas',
    allowedFor: ['sales', 'support'],
    priority: 5,
    tags: [],
    lastChecked: '',
    documentCategory: '',
    filename,
  };

  // Extract title from H1 anywhere in the document
  const titleMatch = raw.match(/^#\s+([^\n]+)/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  let inMetadataBlock = false;
  const nonMetadataLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.includes('**Metadata**') || trimmed.includes('Metadata')) {
      inMetadataBlock = true;
      continue;
    }

    if (inMetadataBlock) {
      if (trimmed === '' || (!trimmed.startsWith('>') && !trimmed.startsWith('-'))) {
        inMetadataBlock = false;
        nonMetadataLines.push(line);
        continue;
      }

      // Match key: value inside metadata block (e.g., "> category: electrodomesticos" or "> - allowed_for: [sales]")
      const metaMatch = trimmed.match(/^>?(?:\s*-\s*|\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
      if (metaMatch) {
        const key = metaMatch[1].trim().toLowerCase();
        const value = metaMatch[2].trim();

        const parseList = (str) =>
          str
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean);

        switch (key) {
          case 'source': metadata.source = value; break;
          case 'country': metadata.country = value; break;
          case 'brand': metadata.brand = value; break;
          case 'company': metadata.company = value; break;
          case 'audience': metadata.audience = value; break;
          case 'category':
          case 'document_category':
            metadata.category = value;
            metadata.documentCategory = value;
            break;
          case 'allowed_for':
            metadata.allowedFor = parseList(value);
            break;
          case 'tags':
            metadata.tags = parseList(value);
            break;
          case 'priority':
            metadata.priority = parseInt(value, 10) || 5;
            break;
          case 'last_checked': metadata.lastChecked = value; break;
          default: break;
        }
      }
      continue;
    }

    nonMetadataLines.push(line);
  }

  const content = nonMetadataLines.join('\n').trim();

  return {
    metadata,
    content,
    ...metadata,
  };
}

/**
 * Valida si un documento Markdown cumple con la estructura comercial requerida
 * para que el chatbot venda con coherencia y astucia.
 */
export function validateKnowledgeFormat(rawContent = '') {
  const content = String(rawContent || '');
  const issues = [];
  const suggestions = [];

  const hasH1 = /^#\s+[^\n]+/m.test(content);
  if (!hasH1) {
    issues.push('Falta un título principal (# Nombre del Producto/Negocio).');
  }

  const hasMetadata = /Metadata/i.test(content) && /allowed_for/i.test(content);
  if (!hasMetadata) {
    issues.push('Falta el bloque de Metadata (> **Metadata** con audience y allowed_for).');
    suggestions.push('Agregá un encabezado de Metadata para que el RAG identifique la prioridad y el contexto de venta.');
  }

  const hasBenefits = /beneficio|ventaja|propuesta de valor|característica|pitch/i.test(content);
  if (!hasBenefits) {
    issues.push('Falta una sección de Beneficios Concretos a comunicar.');
    suggestions.push('Incluí una lista con al menos 2 o 3 beneficios comerciales clave.');
  }

  const hasObjections = /objeci[oó]n|cómo responder|dudas|pregunta|competencia|caro/i.test(content);
  if (!hasObjections) {
    issues.push('Falta una sección de Objeciones Frecuentes y Respuestas.');
    suggestions.push('Agregá cómo responder cuando el cliente duda sobre precio, garantía o competencia.');
  }

  const hasIndagacion = /indagaci[oó]n|calificaci[oó]n|flujo|antes de|cerrar/i.test(content);
  if (!hasIndagacion) {
    suggestions.push('Recomendado: Añadir qué preguntas de indagación debe hacer el bot antes de arrojar un precio.');
  }

  // Scoring
  let score = 100;
  if (!hasH1) score -= 20;
  if (!hasMetadata) score -= 25;
  if (!hasBenefits) score -= 25;
  if (!hasObjections) score -= 20;
  if (!hasIndagacion) score -= 10;
  score = Math.max(0, score);

  return {
    isValid: score >= 60,
    score,
    hasH1,
    hasMetadata,
    hasBenefits,
    hasObjections,
    hasIndagacion,
    checks: {
      hasH1,
      hasMetadata,
      hasBenefits,
      hasObjections,
      hasIndagacion,
    },
    issues,
    suggestions,
    recommendations: suggestions,
    statusText: score >= 90 ? 'Formato Comercial Óptimo' : score >= 60 ? 'Formato Aceptable' : 'Formato Incompleto',
  };
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
/**
 * Searches the knowledge base for the most relevant documents to a given query.
 * Supports dynamic multi-tenant documents (tenantDocuments) and falls back to
 * default disk documents.
 *
 * @param {string} query - The user's message or search query.
 * @param {Object} options
 * @param {Array} [options.tenantDocuments=[]] - Custom documents uploaded by the tenant/business.
 * @param {number} [options.topK=5] - Max number of documents to return.
 * @param {string} [options.context='sales'] - Filter by allowed_for context.
 * @returns {Array<{ title: string, filename: string, content: string, score: number, source: 'tenant'|'disk' }>}
 */
export function searchKnowledge(query, { tenantDocuments = [], topK = 5, context = 'sales' } = {}) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const candidateDocs = [];

  // 1. Process custom tenant documents if provided
  if (Array.isArray(tenantDocuments) && tenantDocuments.length > 0) {
    for (const tDoc of tenantDocuments) {
      if (!tDoc) continue;
      let title = tDoc.title || 'Documento Comercial';
      let content = tDoc.content || tDoc.rawContent || '';
      let metadata = tDoc.metadata;

      // If document has raw content with metadata block, parse it
      if (!metadata || typeof metadata !== 'object') {
        const parsed = parseDocumentMetadata(content, tDoc.filename || `${title}.md`);
        metadata = parsed.metadata;
        content = parsed.content;
      }

      // Check title from content if still generic
      if (title === 'Documento Comercial' || !title) {
        const titleMatch = (tDoc.content || '').match(/^#\s+(.+)$/m);
        if (titleMatch) title = titleMatch[1].trim();
      }

      candidateDocs.push({
        title,
        filename: tDoc.filename || 'tenant_document.md',
        category: metadata?.category || metadata?.documentCategory || tDoc.category || 'ventas',
        metadata: {
          ...metadata,
          priority: Math.max(metadata?.priority || 5, tDoc.priority || 7), // Boost tenant doc priority
        },
        content,
        isTenantDoc: true,
      });
    }
  }

  // 2. If no tenant documents provided, load from disk
  if (candidateDocs.length === 0) {
    const diskDocs = loadKnowledgeBase();
    for (const d of diskDocs) {
      candidateDocs.push({
        ...d,
        category: d.metadata?.category || d.metadata?.documentCategory || 'general',
        isTenantDoc: false,
      });
    }
  }

  if (candidateDocs.length === 0) return [];

  const scored = candidateDocs
    .filter((doc) => {
      // Filter by context if specified
      if (context && doc.metadata.allowedFor && doc.metadata.allowedFor.length > 0) {
        return doc.metadata.allowedFor.some((af) => af === context || af === 'sales' || af === 'support');
      }
      return true;
    })
    .map((doc) => {
      let score = scoreDocument(queryTokens, doc);
      // Give 25% boost to custom tenant documents so business-specific instructions win
      if (doc.isTenantDoc && score > 0) {
        score *= 1.25;
      }
      return {
        title: doc.title,
        filename: doc.filename,
        category: doc.category || doc.metadata?.category || doc.metadata?.documentCategory || 'ventas',
        content: doc.content,
        score,
        source: doc.isTenantDoc ? 'tenant' : 'disk',
        isTenantDoc: Boolean(doc.isTenantDoc),
      };
    })
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
 * @param {Array} [options.tenantDocuments=[]]
 * @param {number} [options.topK=5]
 * @param {number} [options.maxCharsPerDoc=2000]
 * @param {string} [options.context='sales']
 * @returns {string} Formatted context block for the system prompt.
 */
export function buildRAGContext(query, { tenantDocuments = [], topK = 5, maxCharsPerDoc = 2000, context = 'sales' } = {}) {
  const results = searchKnowledge(query, { tenantDocuments, topK, context });

  if (results.length === 0) {
    return '(No se encontraron documentos relevantes en la base de conocimiento para esta consulta.)';
  }

  const blocks = results.map((doc) => {
    const truncatedContent = doc.content.length > maxCharsPerDoc
      ? doc.content.slice(0, maxCharsPerDoc) + '\n[... documento truncado]'
      : doc.content;

    const sourceTag = doc.source === 'tenant' ? ' [Documento del Negocio]' : '';
    return `### ${doc.title}${sourceTag}\n${truncatedContent}`;
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
