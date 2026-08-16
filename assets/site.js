const SHEET_ID = '1eaFO8uSvKf9EY0mEOXL4SU1K8xFIANxV0_RZ9KiDdHo';
const SHEET_NAME = 'Extensions';
const DEFAULT_LOGO = 'Yonal.png';
const FALLBACK_EXTENSIONS = [{
  id: 'typlune',
  name: 'Typlune',
  tagline: 'Smart typing tools for the browser',
  summary: 'Typlune helps you write cleaner browser text faster with quick formatting and productivity shortcuts.',
  description: 'Typlune is a lightweight Chrome extension from Yonal Studio for people who write often in the browser.',
  version: '1.0.0',
  status: 'Coming soon',
  storeUrl: 'https://chromewebstore.google.com/',
  iconUrl: '',
  features: 'Quick text cleanup|Writing workflow shortcuts|Lightweight browser UI|No third-party analytics',
  privacyEffectiveDate: '2026-08-15',
  privacyPolicy: '',
  permissions: 'Only the Chrome permissions required for the extension features shown in the Chrome Web Store listing.',
  dataCollected: 'Typlune does not sell personal data and does not use third-party analytics. Extension data is used only to provide the stated extension features.',
  published: 'true'
}];

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (value || row.length) {
        row.push(value);
        rows.push(row);
        row = [];
        value = '';
      }
      if (char === '\r' && next === '\n') i += 1;
    } else {
      value += char;
    }
  }

  if (value || row.length) row.push(value);
  if (row.length) rows.push(row);
  return rows;
}

function cleanId(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function text(value, fallback = '') {
  const clean = String(value || '').trim();
  return clean || fallback;
}

function safeUrl(value, fallback = '#') {
  if (!String(value || '').trim()) return fallback;
  try {
    const url = new URL(String(value || ''), window.location.href);
    return ['https:', 'mailto:'].includes(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function safeAssetUrl(value, fallback = DEFAULT_LOGO) {
  if (!String(value || '').trim()) return fallback;
  try {
    const url = new URL(String(value || ''), window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    return url.protocol === 'https:' || sameOrigin ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function isPublished(item) {
  return ['true', 'yes', '1', 'published'].includes(String(item.published || '').toLowerCase().trim());
}

function splitFeatures(value) {
  return String(value || '')
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function logoFor(item) {
  return safeAssetUrl(item.iconUrl, DEFAULT_LOGO);
}

function handleImageError(image) {
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.src = DEFAULT_LOGO;
}

function privacyUrl(item) {
  return `privacy.html?privacy=${encodeURIComponent(cleanId(item.id))}`;
}

function generatedPolicy(item) {
  const name = text(item.name, 'This extension');
  const effectiveDate = text(item.privacyEffectiveDate, '2026-08-16');
  const description = text(item.description, text(item.summary, `${name} is a Chrome extension published by Yonal Studio.`));
  const permissions = text(item.permissions, 'The extension requests only the Chrome permissions required for its stated features.');
  const dataCollected = text(item.dataCollected, 'The extension does not sell personal data and does not use user data for advertising.');

  return `${name} Privacy Policy

Effective date: ${effectiveDate}

Overview
${description}

Data collection and use
${dataCollected}

Permissions
${permissions}

Data sharing and sale
Yonal Studio does not sell user data. Yonal Studio does not transfer user data to advertising platforms, data brokers, information resellers, or unrelated third parties.

Chrome Web Store Limited Use
The use and transfer of information received from Chrome extension APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.

Security
Yonal Studio uses reasonable care to keep extension behavior limited to the features described in the extension listing and this policy.

Children
Yonal Studio extensions are not directed to children under 13.

Changes
If this policy changes, the effective date on this page will be updated.

Contact
For privacy questions or data requests, contact Yonal Studio by email at yonalsolutions@gmail.com.`;
}

function displayPolicy(item) {
  return text(item.privacyPolicy, generatedPolicy(item))
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+or Telegram\s*/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizedRecords(rows) {
  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  if (!headers.includes('id') || !headers.includes('name')) return [];
  return rows
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])))
    .filter((item) => cleanId(item.id) && text(item.name));
}

async function loadExtensions() {
  try {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&cache=${Date.now()}`;
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error('Sheet request failed');
    const csv = await response.text();
    if (/<!doctype html|<html/i.test(csv)) throw new Error('Unexpected sheet response');
    const records = normalizedRecords(parseCsv(csv)).filter(isPublished);
    return records.length ? records : FALLBACK_EXTENSIONS;
  } catch (error) {
    console.warn(error);
    return FALLBACK_EXTENSIONS;
  }
}

function createExtensionCard(item) {
  const card = document.createElement('article');
  card.className = 'extension-card';
  card.innerHTML = `
    <div class="extension-head">
      <img class="logo-tile" alt="">
      <div>
        <h3></h3>
        <p class="muted"></p>
      </div>
    </div>
    <ul class="clean-list"></ul>
    <div class="actions">
      <a class="button primary store-button" target="_blank" rel="noopener" aria-label="Open Chrome Web Store">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14.9-4"/><path d="M20 12a8 8 0 0 1-12 6.9"/><path d="M8 18.9A8 8 0 0 1 4 12"/><circle cx="12" cy="12" r="3"/></svg>
        Store
      </a>
      <a class="button privacy-button" aria-label="Open privacy policy">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
        Privacy
      </a>
    </div>`;

  const image = card.querySelector('img');
  image.src = logoFor(item);
  image.alt = `${text(item.name, 'Extension')} logo`;
  image.onerror = () => handleImageError(image);
  card.querySelector('h3').textContent = text(item.name, 'Extension');
  card.querySelector('p').textContent = text(item.summary, text(item.tagline, text(item.description)));
  card.querySelector('.store-button').href = safeUrl(item.storeUrl, 'https://chromewebstore.google.com/');
  card.querySelector('.privacy-button').href = privacyUrl(item);

  const list = card.querySelector('ul');
  const features = splitFeatures(item.features);
  (features.length ? features : ['Simple privacy policy', 'Official support available']).forEach((feature) => {
    const li = document.createElement('li');
    li.textContent = feature;
    list.appendChild(li);
  });

  return card;
}

function selectedExtension(items) {
  const params = new URLSearchParams(window.location.search);
  const requested = cleanId(params.get('privacy') || params.get('id'));
  return items.find((item) => cleanId(item.id) === requested) || items[0] || FALLBACK_EXTENSIONS[0];
}

function playTouchAnimation(event) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.getElementById('touchLayer');
  if (!layer) return;

  const colors = ['#0f8ea8', '#f2a541', '#138a5b', '#0b6478'];
  const ring = document.createElement('span');
  ring.className = 'touch-ring';
  ring.style.left = `${event.clientX}px`;
  ring.style.top = `${event.clientY}px`;
  layer.appendChild(ring);
  setTimeout(() => ring.remove(), 720);

  for (let i = 0; i < 12; i += 1) {
    const spark = document.createElement('span');
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 28 + Math.random() * 38;
    spark.className = 'touch-spark';
    spark.style.left = `${event.clientX}px`;
    spark.style.top = `${event.clientY}px`;
    spark.style.background = colors[i % colors.length];
    spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
    spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
    layer.appendChild(spark);
    setTimeout(() => spark.remove(), 760);
  }
}

function renderFooterYear() {
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
}

function bootChromePrivacyRedirect() {
  const params = new URLSearchParams(window.location.search);
  if (location.pathname.endsWith('/') || location.pathname.endsWith('/index.html')) {
    const privacy = params.get('privacy');
    if (privacy) location.replace(`privacy.html?privacy=${encodeURIComponent(cleanId(privacy))}`);
  }
}

document.addEventListener('pointerdown', playTouchAnimation, { passive: true });
renderFooterYear();
