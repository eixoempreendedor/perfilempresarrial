const OWNER_EMAIL = 'OWNER_EMAIL';

const HEADERS = [
  'timestamp',
  'nome',
  'email',
  'whatsapp',
  'empresa',
  'segmento',
  'cidade_uf',
  'primary',
  'secondary',
  'pct_D',
  'pct_I',
  'pct_S',
  'pct_C',
  'answers_json',
  'behaviors_scores_json',
  'behaviors_top_json',
  'behaviors_bottom_json',
  'consent',
  'page_url',
  'referrer',
  'user_agent',
  'quiz_version',
];

function doGet() {
  return jsonOutput_({ ok: true });
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeaders_(sheet);

  let payload = {};
  try {
    const rawBody = e && e.postData && e.postData.contents;
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (_err) {
    payload = {};
  }

  const segmentoFinal = buildSegmentoFinal_(payload);
  const answersJson = buildAnswersJson_(payload);
  const behaviorsScoresJson = buildJsonOrString_(
    findFirst_(payload, ['behaviors_scores', 'behaviors_json'])
  );
  const behaviorsTopJson = buildJsonOrString_(
    findFirst_(payload, ['behaviors_top', 'behaviorsTop'])
  );
  const behaviorsBottomJson = buildJsonOrString_(
    findFirst_(payload, ['behaviors_bottom', 'behaviorsBottom'])
  );

  const rowObj = {
    timestamp: findFirst_(payload, ['timestamp', 'submitted_at']) || new Date().toISOString(),
    nome: findFirst_(payload, ['nome', 'name']),
    email: findFirst_(payload, ['email']),
    whatsapp: findFirst_(payload, ['whatsapp', 'phone']),
    empresa: findFirst_(payload, ['empresa', 'company']),
    segmento: segmentoFinal,
    cidade_uf: findFirst_(payload, ['cidade_uf', 'cidadeUf', 'city_uf']),
    primary: findFirst_(payload, ['primary']),
    secondary: findFirst_(payload, ['secondary']),
    pct_D: parseNumberOrBlank_(findFirst_(payload, ['pct_D', 'pct_d', 'disc_pct_d'])),
    pct_I: parseNumberOrBlank_(findFirst_(payload, ['pct_I', 'pct_i', 'disc_pct_i'])),
    pct_S: parseNumberOrBlank_(findFirst_(payload, ['pct_S', 'pct_s', 'disc_pct_s'])),
    pct_C: parseNumberOrBlank_(findFirst_(payload, ['pct_C', 'pct_c', 'disc_pct_c'])),
    answers_json: answersJson,
    behaviors_scores_json: behaviorsScoresJson,
    behaviors_top_json: behaviorsTopJson,
    behaviors_bottom_json: behaviorsBottomJson,
    consent: normalizeConsent_(findFirst_(payload, ['consent'])),
    page_url: findFirst_(payload, ['page_url', 'pageUrl']),
    referrer: findFirst_(payload, ['referrer']),
    user_agent: findFirst_(payload, ['user_agent', 'userAgent']),
    quiz_version: findFirst_(payload, ['quiz_version', 'quizVersion']),
  };

  const headerMap = getHeaderMap_(sheet);
  const row = new Array(HEADERS.length).fill('');
  HEADERS.forEach((header) => {
    const index = headerMap[header];
    if (index === undefined) {
      return;
    }
    const val = rowObj[header];
    row[index] = val === undefined || val === null ? '' : val;
  });

  const targetRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(targetRow, 1, 1, HEADERS.length).setValues([row]);

  notifyOwner_(rowObj);

  return jsonOutput_({ ok: true });
}

function ensureHeaders_(sheet) {
  const currentMaxColumns = sheet.getMaxColumns();
  if (currentMaxColumns < HEADERS.length) {
    sheet.insertColumnsAfter(currentMaxColumns, HEADERS.length - currentMaxColumns);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const sameHeaders = HEADERS.every((header, i) => currentHeaders[i] === header);

  if (!sameHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function getHeaderMap_(sheet) {
  const rawHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const map = {};

  rawHeaders.forEach((headerName, idx) => {
    if (!headerName) {
      return;
    }
    map[String(headerName).trim()] = idx;
  });

  HEADERS.forEach((expectedHeader, idx) => {
    if (map[expectedHeader] === undefined) {
      map[expectedHeader] = idx;
    }
  });

  return map;
}

function buildSegmentoFinal_(payload) {
  return (
    findFirst_(payload, ['segmento_final']) ||
    findFirst_(payload, ['segmento']) ||
    findFirst_(payload, ['segment', 'segmento_select']) ||
    findFirst_(payload, ['segmento_outro', 'segment_other']) ||
    ''
  );
}

function buildAnswersJson_(payload) {
  return buildJsonOrString_(
    findFirst_(payload, ['answers_json']) ||
    findFirst_(payload, ['ranking_json']) ||
    findFirst_(payload, ['answers']) ||
    findFirst_(payload, ['quiz_answers']) ||
    null
  );
}

function buildJsonOrString_(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (_err) {
    return '';
  }
}

function normalizeConsent_(value) {
  if (value === true || value === 'true' || value === '1' || value === 1) {
    return true;
  }
  if (value === false || value === 'false' || value === '0' || value === 0) {
    return false;
  }
  return value || '';
}

function parseNumberOrBlank_(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : '';
}

function findFirst_(obj, keys) {
  if (!obj) {
    return '';
  }

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }

  return '';
}

function notifyOwner_(rowObj) {
  if (!OWNER_EMAIL || OWNER_EMAIL === 'OWNER_EMAIL') {
    return;
  }

  const leadEmail = rowObj.email || '(sem email)';
  const subject = 'Novo envio - Perfil do Dono';
  const body = [
    'Novo envio recebido.',
    '',
    `Nome: ${rowObj.nome || ''}`,
    `Email: ${leadEmail}`,
    `WhatsApp: ${rowObj.whatsapp || ''}`,
    `Empresa: ${rowObj.empresa || ''}`,
    `Segmento: ${rowObj.segmento || ''}`,
    `Cidade/UF: ${rowObj.cidade_uf || ''}`,
    `Primary: ${rowObj.primary || ''}`,
    `Secondary: ${rowObj.secondary || ''}`,
    '',
    `Timestamp: ${rowObj.timestamp || ''}`,
  ].join('\n');

  MailApp.sendEmail(OWNER_EMAIL, subject, body);
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
