/**
 * Programmatic Creative Renderer
 * Renders strict high-resolution SVG and Canvas composition specs
 * ensuring zero AI rasterization hallucinations on text, prices, or logos.
 */

function formatNumberARS(num) {
  return Number(num || 0).toLocaleString('es-AR');
}

/**
 * Compiles a Layout Specification into a standalone, high-fidelity SVG string.
 */
export function compileLayoutToSvg({ layoutSpec = {}, brandProfile = {} }) {
  const width = layoutSpec.canvas?.width || 1080;
  const height = layoutSpec.canvas?.height || 1080;
  const elements = layoutSpec.elements || [];

  const primaryColor = layoutSpec.background?.primaryColor || '#0F172A';
  const secondaryColor = layoutSpec.background?.secondaryColor || '#1E293B';
  const accentColor = layoutSpec.background?.accentColor || '#F59E0B';

  const headingFont = brandProfile.typography?.headingFont || 'Montserrat, sans-serif';
  const bodyFont = brandProfile.typography?.bodyFont || 'Inter, sans-serif';

  let svgElements = '';

  for (const el of elements) {
    if (el.type === 'logo') {
      svgElements += `
        <!-- Logo -->
        <g transform="translate(${el.position.x}, ${el.position.y})">
          <rect width="${el.width}" height="${el.height}" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
          <text x="20" y="38" fill="#FFFFFF" font-family="${headingFont}" font-size="22" font-weight="900" letter-spacing="2">${el.commercialName.toUpperCase()}</text>
        </g>
      `;
    }

    if (el.type === 'headline') {
      svgElements += `
        <!-- Headline -->
        <text x="${el.position.x}" y="${el.position.y}" fill="${el.color || '#FFFFFF'}" font-family="${headingFont}" font-size="${el.fontSize || 48}" font-weight="${el.fontWeight || '800'}" letter-spacing="-0.5">
          ${el.text}
        </text>
      `;
    }

    if (el.type === 'subtitle') {
      svgElements += `
        <!-- Subtitle -->
        <text x="${el.position.x}" y="${el.position.y}" fill="${el.color || '#94A3B8'}" font-family="${bodyFont}" font-size="${el.fontSize || 22}" font-weight="${el.fontWeight || '500'}">
          ${el.text}
        </text>
      `;
    }

    if (el.type === 'product_hero') {
      const prod = el.product || {};
      const imgX = el.position.x - el.width / 2;
      const imgY = el.position.y - el.height / 2;

      svgElements += `
        <!-- Hero Product Graphic Layer -->
        <g>
          <!-- Soft Drop Glow -->
          <ellipse cx="${el.position.x}" cy="${el.position.y + el.height * 0.42}" rx="${el.width * 0.4}" ry="35" fill="rgba(0,0,0,0.55)" filter="blur(16px)" />
          
          <!-- Product Image Container -->
          <image href="${prod.imageUrl || ''}" x="${imgX}" y="${imgY}" width="${el.width}" height="${el.height}" preserveAspectRatio="xMidYMid meet" />
        </g>
      `;
    }

    if (el.type === 'product_card') {
      const prod = el.product || {};
      svgElements += `
        <!-- Product Grid Card -->
        <g transform="translate(${el.position.x}, ${el.position.y})">
          <rect width="${el.width}" height="${el.height}" rx="14" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
          
          <!-- Image -->
          <image href="${prod.imageUrl || ''}" x="${el.width * 0.08}" y="15" width="${el.width * 0.84}" height="${el.height * 0.5}" preserveAspectRatio="xMidYMid meet" />
          
          <!-- Product Name -->
          <text x="16" y="${el.height * 0.62}" fill="#FFFFFF" font-family="${headingFont}" font-size="16" font-weight="700" width="${el.width - 32}">
            ${prod.name ? (prod.name.length > 28 ? prod.name.substring(0, 25) + '...' : prod.name) : 'Producto'}
          </text>
          
          <!-- Price -->
          <text x="16" y="${el.height * 0.78}" fill="${accentColor}" font-family="${headingFont}" font-size="22" font-weight="900">
            $${formatNumberARS(prod.price)}
          </text>
          
          <!-- Installments -->
          <text x="16" y="${el.height * 0.90}" fill="#94A3B8" font-family="${bodyFont}" font-size="13" font-weight="600">
            ${prod.installments || '12 cuotas fijas'}
          </text>
        </g>
      `;
    }

    if (el.type === 'price_badge') {
      svgElements += `
        <!-- Price & Offer Badge -->
        <g transform="translate(${el.position.x}, ${el.position.y})">
          ${el.discount ? `
            <rect width="110" height="30" rx="6" fill="#EF4444" />
            <text x="10" y="21" fill="#FFFFFF" font-family="${headingFont}" font-size="14" font-weight="800">
              ${el.discount}% OFF
            </text>
          ` : ''}
          
          <!-- Previous Price -->
          ${el.previousPrice ? `
            <text x="${el.discount ? 125 : 0}" y="22" fill="#64748B" font-family="${headingFont}" font-size="18" font-weight="600" text-decoration="line-through">
              $${formatNumberARS(el.previousPrice)}
            </text>
          ` : ''}
          
          <!-- Main Price -->
          <text x="0" y="78" fill="${el.accentColor || '#F59E0B'}" font-family="${headingFont}" font-size="52" font-weight="900" letter-spacing="-1">
            $${formatNumberARS(el.price)}
          </text>
          
          <!-- Installments Badge -->
          <text x="0" y="108" fill="#E2E8F0" font-family="${bodyFont}" font-size="20" font-weight="600">
            💳 ${el.installments || '12 cuotas fijas'}
          </text>
        </g>
      `;
    }

    if (el.type === 'cta_button') {
      svgElements += `
        <!-- CTA Button -->
        <g transform="translate(${el.position.x}, ${el.position.y})">
          <rect width="${el.width}" height="${el.height}" rx="32" fill="${el.backgroundColor || '#F59E0B'}" />
          <text x="${el.width / 2}" y="${el.height / 2 + 7}" text-anchor="middle" fill="${el.textColor || '#0F172A'}" font-family="${headingFont}" font-size="18" font-weight="800" letter-spacing="1">
            ${el.text}
          </text>
        </g>
      `;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgLinear" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${secondaryColor}" />
      <stop offset="55%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="accentGlow" cx="80%" cy="30%" r="50%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background Layer -->
  <rect width="${width}" height="${height}" fill="url(#bgLinear)" />
  <rect width="${width}" height="${height}" fill="url(#accentGlow)" />

  <!-- Programmatic Elements Layer -->
  ${svgElements}
</svg>`;
}
