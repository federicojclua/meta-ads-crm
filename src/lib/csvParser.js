/**
 * Robust CSV parser supporting RFC 4180 rules, Excel UTF-8 BOM, semicolons, CRLF,
 * escaped quotes (""), and multiline fields within quotes.
 * Used identically in frontend and backend.
 *
 * @param {string} text - Raw CSV text
 * @param {object} [options] - Parsing options
 * @param {number} [options.maxRows=500] - Maximum allowable rows
 * @param {number} [options.maxBytes=1048576] - Maximum allowable bytes (1 MB default)
 * @returns {{ headers: string[], rows: Array<object>, rawRows: string[][], error?: string }}
 */
export function parseCsvString(text, options = {}) {
  const maxRows = options.maxRows || 500;
  const maxBytes = options.maxBytes || 1024 * 1024; // 1 MB

  if (typeof text !== 'string') {
    return { headers: [], rows: [], rawRows: [], error: 'El contenido debe ser texto.' };
  }

  // Check byte size (UTF-8 estimate)
  const byteLength = new TextEncoder().encode(text).length;
  if (byteLength > maxBytes) {
    return {
      headers: [],
      rows: [],
      rawRows: [],
      error: `El archivo supera el tamaño máximo permitido de ${(maxBytes / (1024 * 1024)).toFixed(0)} MB.`,
    };
  }

  // Strip Excel UTF-8 BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  // Normalize standalone \r to \n while preserving \r\n
  cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Detect delimiter: evaluate count outside quotes on the first non-empty line
  let delimiter = ',';
  let firstLine = '';
  let insideFirstQuotes = false;
  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    if (ch === '"') insideFirstQuotes = !insideFirstQuotes;
    if (ch === '\n' && !insideFirstQuotes) {
      firstLine = cleanText.slice(0, i);
      break;
    }
  }
  if (!firstLine) firstLine = cleanText;

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  if (semicolonCount > commaCount) {
    delimiter = ';';
  }

  const rawRows = [];
  let currentRow = [];
  let currentEntry = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentEntry += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentEntry.trim());
      currentEntry = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentEntry.trim());
      // Only keep non-empty rows
      if (currentRow.some((cell) => cell.length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
      currentEntry = '';
    } else {
      currentEntry += char;
    }
  }

  if (currentEntry || currentRow.length > 0) {
    currentRow.push(currentEntry.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length < 2) {
    return { headers: [], rows: [], rawRows: [], error: 'El archivo CSV no contiene registros suficientes.' };
  }

  const rawHeaders = rawRows[0];
  const normalizedHeaders = rawHeaders.map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s_-]+/g, '')
  );

  const dataRows = rawRows.slice(1);
  if (dataRows.length > maxRows) {
    return {
      headers: rawHeaders,
      rows: [],
      rawRows,
      error: `El archivo contiene ${dataRows.length} filas, superando el límite de ${maxRows} filas.`,
    };
  }

  // Find column indices
  const nameIdx = normalizedHeaders.findIndex(
    (h) => h.includes('nombre') || h.includes('name') || h.includes('contacto') || h.includes('cliente')
  );
  const emailIdx = normalizedHeaders.findIndex((h) => h.includes('email') || h.includes('correo'));
  const phoneIdx = normalizedHeaders.findIndex(
    (h) => h.includes('phone') || h.includes('tel') || h.includes('cel') || h.includes('whatsapp') || h.includes('movil')
  );
  const spIdx = normalizedHeaders.findIndex(
    (h) => h.includes('vendedor') || h.includes('salesperson') || h.includes('asesor') || h.includes('agente')
  );
  const notesIdx = normalizedHeaders.findIndex(
    (h) => h.includes('nota') || h.includes('obs') || h.includes('comentario') || h.includes('descripcion')
  );
  const valueIdx = normalizedHeaders.findIndex(
    (h) => h.includes('valor') || h.includes('monto') || h.includes('estimado') || h.includes('precio')
  );

  const mappedRows = dataRows.map((r, i) => {
    const name = nameIdx !== -1 ? r[nameIdx] || '' : r[0] || '';
    const email = emailIdx !== -1 ? r[emailIdx] || '' : '';
    const phone = phoneIdx !== -1 ? r[phoneIdx] || '' : '';
    const assignedSalespersonEmail = spIdx !== -1 ? r[spIdx] || '' : '';
    const notes = notesIdx !== -1 ? r[notesIdx] || '' : '';
    let valueEstimateMinor = 0;
    if (valueIdx !== -1 && r[valueIdx]) {
      const parsedNum = parseFloat(r[valueIdx].replace(/[^0-9.-]+/g, ''));
      if (!isNaN(parsedNum) && parsedNum > 0) {
        valueEstimateMinor = Math.round(parsedNum * 100);
      }
    }

    const isValid = Boolean(name.trim() && (email.trim() || phone.trim()));

    return {
      rowNumber: i + 1,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      assignedSalespersonEmail: assignedSalespersonEmail.trim() || null,
      notes: notes.trim() || null,
      valueEstimateMinor,
      isValid,
    };
  });

  return {
    headers: rawHeaders,
    rows: mappedRows,
    rawRows,
  };
}
