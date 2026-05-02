export const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

export const formatMoney = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
};

export const statusTone = (status = '') => {
  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'DOCS_VERIFIED', 'VERIFIED', 'DOCUMENTS_COMPLETED'].includes(s)) return 'good';
  if (['REJECTED', 'FAIL', 'REUPLOAD'].includes(s)) return 'bad';
  // Removed CLOSED check as it is obsolete
  return 'warn';
};

export const labelize = (value = '') => String(value || 'Unknown').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

export const formatError = (err) => {
  if (!err) return '';
  
  let msg = '';
  const data = err.response?.data;
  const raw = err.message || String(err);

  // 1. Try to extract from axios response data
  if (data) {
    let parsedData = data;
    if (typeof data === 'string') {
      try { parsedData = JSON.parse(data); } catch (e) {
        // Try to handle double-stringified JSON
        try { parsedData = JSON.parse(JSON.parse(data)); } catch (e2) {}
      }
    }
    if (typeof parsedData === 'object' && parsedData !== null) {
      msg = parsedData.message || parsedData.error_description || parsedData.detail || parsedData.error;
    }
  }

  // 2. If no msg yet, scan the raw error string for JSON blocks
  if (!msg || typeof msg !== 'string' || msg.startsWith('{')) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        const jsonStr = raw.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        msg = parsed.message || parsed.error_description || parsed.detail || parsed.error;
      } catch (e) {}
    }
  }

  // 3. Fallback to cleaning the raw string
  if (!msg) {
    msg = raw.replace(/^Proxy error: \d+ : /i, '').replace(/^"|"$|'|\\"/g, '').trim();
  }

  // 4. Final Polish: Remove technical prefixes and enforce string type
  const finalMsg = String(msg || 'An unexpected operation error occurred.');
  return finalMsg
    .replace(/^Decision Blocked: /i, '')
    .replace(/^Bad Request: /i, '')
    .trim();
};
