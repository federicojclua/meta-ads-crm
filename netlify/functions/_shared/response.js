export function jsonResponse(statusCode, data, customHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      ...customHeaders,
    },
    body: JSON.stringify(data),
  };
}

export function errorResponse(statusCode, message, code = null) {
  return jsonResponse(statusCode, {
    error: message,
    code: code || `ERR_HTTP_${statusCode}`,
    statusCode,
  });
}
