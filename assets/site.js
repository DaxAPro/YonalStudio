const SHEET_ID = '1eaFO8uSvKf9EY0mEOXL4SU1K8xFIANxV0_RZ9KiDdHo';
const SHEET_NAME = 'Extensions';
const LOCAL_CSV = 'Extensions-template.csv';
const DEFAULT_LOGO = 'Yonal.png';
const FALLBACK_EXTENSIONS = [{
  id: 'typlune-local-draft-recovery',
  name: 'Typlune - Local Draft Recovery',
  tagline: 'Recover lost web form text with private local draft snapshots.',
  summary: 'Typlune saves temporary local snapshots of text entered into supported website text fields and compatible rich-text editors, so users can recover drafts after refreshes, navigation, crashes, or accidental deletion.',
  description: 'Typlune is a local-only draft recovery extension for websites. It monitors supported text fields and compatible rich-text editors, saves temporary draft snapshots in the browser local extension database, and lets users copy, restore, pin, search, version, or delete saved drafts.',
  version: '1.1.1',
  status: 'Coming soon',
  storeUrl: 'https://chromewebstore.google.com/',
  iconUrl: 'https://res.cloudinary.com/ikag87ay/image/upload/v1787579124/Typlune_Local_Draft_Recovery_icon.png',
  features: 'Local draft snapshots|Recover lost text from web forms|Version history|Copy and restore drafts|Pause saving on specific websites|No analytics or ads',
  privacyEffectiveDate: '2026-08-24',
  privacyPolicy: `Overview
Typlune saves draft recovery data only on the user's device. It uses the data only for local draft recovery features.

Data stored locally
Draft text, draft previews, draft versions, timestamps, pinned status, paused-site settings, retention settings, website domain or origin, normalized page path, page title, field type, editor type, character counts, and field labels or attributes.

Sensitive data
Typlune is designed not to save password, OTP, payment-card, PIN, seed phrase, private-key, API-key, or similar sensitive fields. It does not collect screenshots, cookies, authentication data, analytics logs, or ad identifiers.

Data sharing and sale
Typlune does not upload draft text to Yonal Studio servers. Yonal Studio does not sell user data, share user data with data brokers, or use user data for advertising.

External services
The optional support button opens Buy Me a Coffee only after a direct user click and does not send draft data.

Chrome Web Store Limited Use
The use and transfer of information received from Chrome extension APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

yonalsolutions@gmail.com
For privacy questions or user-requested help, email yonalsolutions@gmail.com.`,
  permissions: 'Storage is used to save extension settings and local draft data. Alarms are used for periodic cleanup of expired drafts. Host permissions are used only to detect, save, and restore supported text fields on regular websites.',
  dataCollected: 'User-entered form text and rich-text editor content is stored locally in the browser profile with related recovery metadata. Typlune does not transmit draft data externally and does not use analytics or advertising.',
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

function isPublished(item) {
  return ['true', 'yes', '1', 'published'].includes(String(item.published || '').toLowerCase().trim());
}

function transitionPolicyLogo(image, targetUrl) {
  const nextUrl = safeAssetUrl(targetUrl, DEFAULT_LOGO);
  if (nextUrl === DEFAULT_LOGO) return;

  const preload = new Image();
  preload.onload = () => {
    image.classList.add('logo-switching');
    setTimeout(() => {
      image.src = nextUrl;
      image.classList.remove('logo-placeholder');
      requestAnimationFrame(() => image.classList.remove('logo-switching'));
    }, 180);
  };
  preload.onerror = () => handleImageError(image);
  preload.src = nextUrl;
}

function privacyUrl(item) {
  return `privacy.html?privacy=${encodeURIComponent(cleanId(item.id))}`;
}

function displayPolicy(item) {
  return text(item.privacyPolicy, 'Privacy policy content is not available for this extension yet. Email yonalsolutions@gmail.com for privacy questions.')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+or Telegram\s*/gi, ' ')
    .replace(/^.*privacy policy\s*$/gim, '')
    .replace(/^effective date:.*$/gim, '')
    .replace(/^published:\s*\w+\s*/gim, '')
    .replace(/^C\.\s*Chrome Web Store Privacy Answers[\s\S]*$/gim, '')
    .replace(/^Chrome Web Store Privacy Answers[\s\S]*$/gim, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^-{2,}$/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function renderPolicyDocument(container, policyText) {
  container.textContent = '';
  const lines = String(policyText || '').split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const title = lines.shift();
  const fragment = document.createDocumentFragment();

  if (title && !/privacy policy$/i.test(title)) {
    lines.unshift(title);
  }

  let section = null;
  const headingPattern = /^(overview|data collection and use|data stored locally|data sharing and sale|permissions|sensitive data|external services|chrome web store limited use|chrome web store privacy answers|security|children|changes|yonalsolutions@gmail\.com|does .+\?)$/i;

  lines.forEach((line) => {
    if (headingPattern.test(line) || /^[A-Z][A-Za-z\s]+:$/.test(line)) {
      section = document.createElement('section');
      section.className = 'policy-section';
      const heading = document.createElement('h2');
      heading.textContent = line.replace(/:$/, '');
      section.appendChild(heading);
      fragment.appendChild(section);
      return;
    }

    if (!section) {
      section = document.createElement('section');
      section.className = 'policy-section';
      fragment.appendChild(section);
    }

    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    section.appendChild(paragraph);
  });

  container.appendChild(fragment);
}

function renderPolicyMeta(container, item) {
  container.textContent = '';
  [
    ['Version', item.version],
    ['Features', splitFeatures(item.features).join(', ')],
    ['Privacy effective date', item.privacyEffectiveDate],
    ['Permissions', item.permissions],
    ['Data collected', item.dataCollected]
  ].forEach(([label, value]) => {
    const cleanValue = text(value);
    if (!cleanValue) return;
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = cleanValue;
    container.append(term, detail);
  });
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
  const parsePublishedCsv = (csv) => normalizedRecords(parseCsv(csv)).filter(isPublished);

  try {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}&cache=${Date.now()}`;
    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error('Sheet request failed');
    const csv = await response.text();
    if (/<!doctype html|<html/i.test(csv)) throw new Error('Unexpected sheet response');
    const records = parsePublishedCsv(csv);
    if (records.length) return records;
  } catch (error) {
    console.warn(error);
  }

  try {
    const response = await fetch(`${LOCAL_CSV}?cache=${Date.now()}`);
    if (!response.ok) throw new Error('Local CSV request failed');
    const records = parsePublishedCsv(await response.text());
    if (records.length) return records;
  } catch (error) {
    console.warn(error);
  }

  return FALLBACK_EXTENSIONS;
}

function createExtensionCard(item) {
  const card = document.createElement('article');
  card.className = 'extension-card';
  card.id = cleanId(item.id);
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
