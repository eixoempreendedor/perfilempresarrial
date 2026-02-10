import { BEHAVIORS, GROUPS, MAP, QUIZ_VERSION, SEGMENTS, SUBMIT_URL } from "./config.js";

const STORAGE_KEY = "perfil-do-dono-state";
const AVG_GROUP_SECONDS = 14;

const PROFILE_GUIDE = {
  D: {
    label: "Direto",
    headline: "Direto e destravador",
    work: ["Você gosta de decidir, destravar e cobrar avanço."],
    strengths: [
      "Use sua velocidade para tirar gargalos do time.",
      "Defina metas claras e checkpoints curtos para manter tração.",
      "Canalize sua objetividade para decisões difíceis.",
    ],
    risks: ["Atropelar pessoas", "Impaciência", "Pular etapa"],
    tips: ["1 meta/semana", "Expectativas por escrito", "1 conversa difícil marcada"],
  },
  I: {
    label: "Comunicador",
    headline: "Comunicador e mobilizador",
    work: ["Você mobiliza, vende ideia, cria energia."],
    strengths: [
      "Use sua influência para alinhar time e clientes com clareza.",
      "Aproveite seu carisma para acelerar adesão a mudanças.",
      "Transforme reuniões em decisões com próximos passos definidos.",
    ],
    risks: ["Dispersar", "Prometer demais", "Faltar rotina"],
    tips: ["3 prioridades/dia", "Checklist curto", "Fechar próxima ação"],
  },
  S: {
    label: "Constante",
    headline: "Constante e confiável",
    work: ["Você sustenta o jogo, segura a operação, dá estabilidade."],
    strengths: [
      "Use sua consistência para criar previsibilidade na operação.",
      "Consolide processos que reduzam retrabalho e ruído.",
      "Apoie o time com acompanhamento próximo e calmo.",
    ],
    risks: ["Evitar conflito", "Demorar pra mudar", "Aceitar demais"],
    tips: ["Marcar conversas com data", "Combinar limites", "1 melhoria/semana"],
  },
  C: {
    label: "Analítico",
    headline: "Analítico e orientado a qualidade",
    work: ["Você decide com fatos, organiza e melhora qualidade."],
    strengths: [
      "Use dados para priorizar o que mais impacta resultado.",
      "Transforme seu padrão de qualidade em rotina simples para o time.",
      "Documente critérios para decisões repetíveis.",
    ],
    risks: ["Perfeccionismo", "Demora", "Controle excessivo"],
    tips: ["Prazo + bom o suficiente", "Critério de decisão", "Revisão rápida"],
  },
};

const state = {
  step: 0,
  rankings: GROUPS.map((group) => [...group.items]),
  result: null,
  startedAt: Date.now(),
  groupEnteredAt: Date.now(),
  groupTimingsMs: {},
  events: [],
};

const quizView = document.getElementById("quiz-view");
const resultView = document.getElementById("result-view");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

let sortableInstance;

function trackEvent(name, data = {}) {
  const event = {
    name,
    data,
    timestamp: new Date().toISOString(),
    quizVersion: QUIZ_VERSION,
  };
  state.events.push(event);
  console.info("[analytics]", event);
  if (typeof window.gtag === "function") {
    window.gtag("event", name, data);
  }
}

function persistState() {
  const payload = {
    quizVersion: QUIZ_VERSION,
    step: state.step,
    rankings: state.rankings,
    startedAt: state.startedAt,
    groupTimingsMs: state.groupTimingsMs,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    if (saved.quizVersion !== QUIZ_VERSION) return false;
    if (!Array.isArray(saved.rankings) || saved.rankings.length !== GROUPS.length) return false;

    state.step = Number.isInteger(saved.step) ? Math.max(0, Math.min(saved.step, GROUPS.length - 1)) : 0;
    state.rankings = saved.rankings.map((group, idx) => {
      const expected = GROUPS[idx].items;
      if (!Array.isArray(group) || group.length !== expected.length) return [...expected];
      const sameSet = expected.every((item) => group.includes(item));
      return sameSet ? [...group] : [...expected];
    });
    state.startedAt = saved.startedAt || Date.now();
    state.groupTimingsMs = saved.groupTimingsMs || {};
    return true;
  } catch {
    return false;
  }
}

function clearPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
}

function estimateRemainingText() {
  const remainingGroups = Math.max(GROUPS.length - (state.step + 1), 0);
  const measured = Object.values(state.groupTimingsMs);
  const avgMs = measured.length
    ? measured.reduce((sum, item) => sum + item, 0) / measured.length
    : AVG_GROUP_SECONDS * 1000;
  const remainingMs = remainingGroups * avgMs;
  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes <= 0) return "quase finalizado";
  return `~${minutes} min restantes`;
}

function setFieldError(fieldName, message = "") {
  const errorEl = document.getElementById(`error-${fieldName}`);
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (!errorEl || !field) return;
  errorEl.textContent = message;
  field.classList.toggle("input-error", Boolean(message));
}

function clearFieldErrors() {
  ["name", "email", "whatsapp", "company", "segment_select", "segment_other", "consent"].forEach((field) => {
    setFieldError(field, "");
  });
}

function renderQuizStep() {
  const groupMeta = GROUPS[state.step];
  const groupItems = state.rankings[state.step];
  const orientationQuestion = `${groupMeta.title.toLowerCase()}:`;
  quizView.innerHTML = `
    <h2 class="group-heading">Grupo ${state.step + 1}</h2>
    <p class="group-orientation">
      <span class="orientation-prefix">Como você age, se comporta ou se sente</span>
      <span class="orientation-question">${orientationQuestion}</span>
    </p>
    <p class="order-hint">Topo = mais me identifico</p>
    <ul id="sortable-list" class="sortable-list">
      ${groupItems
        .map(
          (item, idx) => `
            <li class="drag-item" data-item="${item}">
              <span class="rank">${idx + 1}º</span>
              <span>${item}</span>
              <div class="item-controls">
                <button class="move-btn" type="button" data-move="up" aria-label="Mover para cima">↑</button>
                <button class="move-btn" type="button" data-move="down" aria-label="Mover para baixo">↓</button>
                <span class="drag-handle" aria-hidden="true">☰</span>
              </div>
            </li>
          `
        )
        .join("")}
    </ul>
    <p class="order-hint order-hint-bottom">Embaixo = menos me identifico</p>
  `;

  const listEl = document.getElementById("sortable-list");
  sortableInstance?.destroy();
  if (window.Sortable) {
    sortableInstance = new Sortable(listEl, {
      animation: 180,
      ghostClass: "drag-ghost",
      handle: ".drag-handle",
      onEnd: saveCurrentOrder,
    });
  }

  listEl.addEventListener("click", (event) => {
    const button = event.target.closest(".move-btn");
    if (!button) return;

    const item = button.closest(".drag-item");
    if (!item) return;

    const move = button.dataset.move;
    if (move === "up" && item.previousElementSibling) {
      listEl.insertBefore(item, item.previousElementSibling);
      saveCurrentOrder();
      return;
    }

    if (move === "down" && item.nextElementSibling) {
      listEl.insertBefore(item.nextElementSibling, item);
      saveCurrentOrder();
    }
  });

  trackEvent("group_viewed", { group: state.step + 1, totalGroups: GROUPS.length });
  state.groupEnteredAt = Date.now();

  updateProgress();
  updateButtons();
}

function saveCurrentOrder() {
  const list = quizView.querySelectorAll(".drag-item");
  state.rankings[state.step] = [...list].map((el) => el.dataset.item);
  [...list].forEach((el, idx) => {
    el.querySelector(".rank").textContent = `${idx + 1}º`;
  });
  persistState();
  updateButtons();
}

function commitGroupTiming(groupIndex) {
  const elapsed = Date.now() - state.groupEnteredAt;
  if (elapsed > 0) {
    state.groupTimingsMs[groupIndex] = (state.groupTimingsMs[groupIndex] || 0) + elapsed;
  }
}

function updateProgress() {
  const total = GROUPS.length;
  const current = Math.min(state.step + 1, total);
  progressText.textContent = `Grupo ${current} de ${total} • ${estimateRemainingText()}`;
  progressFill.style.width = `${(current / total) * 100}%`;
}

function currentStepValid() {
  return Array.isArray(state.rankings[state.step]) && state.rankings[state.step].length === 4;
}

function updateButtons() {
  btnBack.disabled = state.step === 0;
  btnNext.textContent = state.step < GROUPS.length - 1 ? "Próximo" : "Ver resultado";
  btnNext.disabled = !currentStepValid();
}

function normalizePercent(raw) {
  const keys = Object.keys(raw);
  const total = keys.reduce((sum, k) => sum + raw[k], 0) || 1;
  const exact = keys.map((k) => ({ key: k, value: (raw[k] / total) * 100 }));
  const floored = exact.map((e) => ({ ...e, floor: Math.floor(e.value), frac: e.value - Math.floor(e.value) }));
  let remaining = 100 - floored.reduce((s, e) => s + e.floor, 0);
  floored.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < floored.length && remaining > 0; i += 1) {
    floored[i].floor += 1;
    remaining -= 1;
  }
  return floored.reduce((acc, e) => {
    acc[e.key] = e.floor;
    return acc;
  }, {});
}

function calculateResults() {
  const positionPoints = [4, 3, 2, 1];
  const discRaw = { D: 0, I: 0, S: 0, C: 0 };
  const behaviorRaw = Object.fromEntries(BEHAVIORS.map((b) => [b, 0]));

  state.rankings.forEach((group) => {
    group.forEach((item, idx) => {
      const points = positionPoints[idx];
      const map = MAP[item];
      if (!map) return;

      Object.entries(map.disc).forEach(([disc, weight]) => {
        discRaw[disc] += points * weight;
      });

      Object.entries(map.behaviors).forEach(([behavior, weight]) => {
        behaviorRaw[behavior] = (behaviorRaw[behavior] || 0) + points * weight;
      });
    });
  });

  const discPct = normalizePercent(discRaw);
  const discSorted = Object.entries(discPct).sort((a, b) => b[1] - a[1]);
  const behaviorSorted = Object.entries(behaviorRaw).sort((a, b) => b[1] - a[1]);

  return {
    ranking_json: state.rankings,
    disc_pct: discPct,
    primary: discSorted[0][0],
    secondary: discSorted[1][0],
    behaviors_scores: behaviorRaw,
    behaviors_top: behaviorSorted.slice(0, 8).map(([name, score]) => ({ name, score })),
    behaviors_bottom: behaviorSorted.slice(-6).map(([name, score]) => ({ name, score })),
  };
}

function listItems(items) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderResult() {
  state.result = calculateResults();
  trackEvent("quiz_result_viewed", {
    primary: state.result.primary,
    secondary: state.result.secondary,
  });

  quizView.classList.add("hidden");
  resultView.classList.remove("hidden");

  const disc = state.result.disc_pct;
  const primaryGuide = PROFILE_GUIDE[state.result.primary];
  const secondaryGuide = PROFILE_GUIDE[state.result.secondary];
  const top = state.result.behaviors_top
    .map((b) => `<li>${b.name} <strong>(${b.score.toFixed(1)})</strong></li>`)
    .join("");
  const bottom = state.result.behaviors_bottom
    .map((b) => `<li>${b.name} <strong>(${b.score.toFixed(1)})</strong></li>`)
    .join("");

  resultView.innerHTML = `
    <h2>Seu resultado</h2>
    <div class="disc-grid">
      <div><span>D</span><strong>${disc.D}%</strong></div>
      <div><span>I</span><strong>${disc.I}%</strong></div>
      <div><span>S</span><strong>${disc.S}%</strong></div>
      <div><span>C</span><strong>${disc.C}%</strong></div>
    </div>

    <section class="card-soft profile-summary">
      <h3>Seu Perfil</h3>
      <p><strong>Primário:</strong> ${state.result.primary} — ${primaryGuide.label} · ${primaryGuide.headline}</p>
      <p><strong>Secundário:</strong> ${state.result.secondary} — ${secondaryGuide.label} · ${secondaryGuide.headline}</p>
    </section>

    <section class="card-soft">
      <h3>Como você trabalha</h3>
      <ul>${listItems(primaryGuide.work)}</ul>
      <p class="helper">Seu secundário ${state.result.secondary} (${secondaryGuide.label}) entra como apoio para equilibrar decisões e execução.</p>
    </section>

    <section class="card-soft">
      <h3>Como usar isso a seu favor</h3>
      <ul>${listItems(primaryGuide.strengths)}</ul>
    </section>

    <section class="card-soft">
      <h3>Riscos</h3>
      <ul>${listItems(primaryGuide.risks)}</ul>
    </section>

    <section class="card-soft">
      <h3>Ajustes práticos</h3>
      <ul>${listItems(primaryGuide.tips)}</ul>
    </section>

    <h3>Você se destaca nestes 8 comportamentos!</h3>
    <ol>${top}</ol>

    <h3>Precisamos trabalhar estes aqui para melhorar ainda mais o seu desempenho</h3>
    <ol>${bottom}</ol>

    <section class="card-soft cta-plan">
      <h3>Plano personalizado por segmento</h3>
      <p>Se você quiser, eu monto um plano prático pro seu segmento (rotina, foco da semana e ajustes do seu perfil) e te envio.</p>
      <form id="lead-form" class="lead-form" novalidate>
        <label>Nome
          <input name="name" />
          <small id="error-name" class="field-error"></small>
        </label>
        <label>Email
          <input type="email" name="email" />
          <small id="error-email" class="field-error"></small>
        </label>
        <label>WhatsApp
          <input name="whatsapp" inputmode="numeric" placeholder="(11) 99999-9999" />
          <small id="error-whatsapp" class="field-error"></small>
        </label>
        <label>Empresa
          <input required name="company" />
          <small id="error-company" class="field-error"></small>
        </label>
        <label>Segmento
          <select required name="segment_select" id="segment-select">
            <option value="" disabled selected>Selecione...</option>
            ${SEGMENTS.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
          <small id="error-segment_select" class="field-error"></small>
        </label>
        <label id="segment-other-wrap" class="hidden">Outro segmento
          <input name="segment_other" id="segment-other" />
          <small id="error-segment_other" class="field-error"></small>
        </label>
        <input class="hidden" tabindex="-1" autocomplete="off" name="website" />
        <label class="consent-line"><input type="checkbox" name="consent" value="sim" required /> Eu concordo em receber o plano personalizado e comunicações relacionadas.</label>
        <small id="error-consent" class="field-error"></small>
        <button id="plan-submit" class="btn primary full" type="submit">Quero meu plano personalizado</button>
        <p id="submit-feedback" class="feedback"></p>
      </form>
    </section>
  `;

  const segmentSelect = document.getElementById("segment-select");
  const segmentOtherWrap = document.getElementById("segment-other-wrap");
  const segmentOtherInput = document.getElementById("segment-other");
  const whatsappInput = document.querySelector('[name="whatsapp"]');

  segmentSelect.addEventListener("change", () => {
    const isOther = segmentSelect.value === "Outro (digitar)";
    segmentOtherWrap.classList.toggle("hidden", !isOther);
    segmentOtherInput.required = isOther;
    if (!isOther) {
      segmentOtherInput.value = "";
      setFieldError("segment_other", "");
    }
  });

  whatsappInput.addEventListener("input", () => {
    const digits = whatsappInput.value.replace(/\D/g, "").slice(0, 13);
    const ddd = digits.slice(0, 2);
    const prefixo = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
    const sufixo = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);
    whatsappInput.value = [ddd ? `(${ddd})` : "", prefixo, sufixo].filter(Boolean).join(" ").trim();
  });

  document.getElementById("lead-form").addEventListener("submit", submitLead);

  progressText.textContent = "Resultado";
  progressFill.style.width = "100%";
  btnBack.disabled = false;
  btnNext.disabled = true;
  btnNext.textContent = "Concluído";

  clearPersistedState();
}

async function fetchWithRetry(url, options, { timeoutMs = 10000, retries = 1 } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error("Falha no envio");
      return response;
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      attempt += 1;
    }
  }
}

async function submitLead(event) {
  event.preventDefault();
  clearFieldErrors();

  const feedback = document.getElementById("submit-feedback");
  const submitButton = document.getElementById("plan-submit");
  const formData = new FormData(event.target);
  const lead = Object.fromEntries(formData.entries());

  if (lead.website?.trim()) {
    trackEvent("lead_submit_blocked_honeypot", {});
    feedback.textContent = "Recebido ✅ vou te enviar em breve.";
    submitButton.disabled = true;
    return;
  }

  const finalSegment = lead.segment_select === "Outro (digitar)"
    ? (lead.segment_other || "").trim()
    : lead.segment_select;

  const email = (lead.email || "").trim();
  const whatsapp = (lead.whatsapp || "").trim();
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const hasValidEmail = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasValidWhatsapp = !whatsapp || whatsappDigits.length >= 10;

  let hasError = false;
  if (!lead.company?.trim()) {
    setFieldError("company", "Informe a empresa para receber o plano.");
    hasError = true;
  }
  if (!lead.segment_select) {
    setFieldError("segment_select", "Selecione um segmento.");
    hasError = true;
  }
  if (lead.segment_select === "Outro (digitar)" && !finalSegment) {
    setFieldError("segment_other", "Informe seu segmento.");
    hasError = true;
  }
  if (!email && !whatsapp) {
    setFieldError("email", "Informe email ou WhatsApp para contato.");
    setFieldError("whatsapp", "Informe email ou WhatsApp para contato.");
    hasError = true;
  }
  if (!hasValidEmail) {
    setFieldError("email", "Digite um email válido.");
    hasError = true;
  }
  if (!hasValidWhatsapp) {
    setFieldError("whatsapp", "Digite um WhatsApp válido com DDD.");
    hasError = true;
  }
  if (lead.consent !== "sim") {
    setFieldError("consent", "Você precisa autorizar o contato para receber o plano.");
    hasError = true;
  }

  if (hasError) {
    feedback.textContent = "Corrija os campos destacados para continuar.";
    trackEvent("lead_submit_validation_failed", { step: "result" });
    return;
  }

  const payload = {
    // contrato principal (documentado)
    name: (lead.name || "").trim(),
    email,
    whatsapp,
    company: lead.company.trim(),
    segment: finalSegment,
    consent: lead.consent,
    ranking_json: state.result.ranking_json,
    disc_pct: state.result.disc_pct,
    primary: state.result.primary,
    secondary: state.result.secondary,
    behaviors_scores: state.result.behaviors_scores,
    behaviors_top: state.result.behaviors_top.map((item) => item.name),
    behaviors_bottom: state.result.behaviors_bottom.map((item) => item.name),
    quiz_version: QUIZ_VERSION,
    submitted_at: new Date().toISOString(),
    page_url: window.location.href,
    referrer: document.referrer || "",
    user_agent: navigator.userAgent,
    quiz_events: state.events,
    group_timings_ms: state.groupTimingsMs,

    // chaves legadas (compatibilidade)
    nome: (lead.name || "").trim(),
    empresa: lead.company.trim(),
    segmento: finalSegment,
    pct: state.result.disc_pct,
    behaviors_json: state.result.behaviors_scores,
    behaviorsTop: state.result.behaviors_top.map((item) => item.name),
    behaviorsBottom: state.result.behaviors_bottom.map((item) => item.name),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    quizVersion: QUIZ_VERSION,
  };

  feedback.textContent = "Enviando...";
  trackEvent("lead_submit_attempt", {
    segment: finalSegment,
    hasEmail: Boolean(email),
    hasWhatsapp: Boolean(whatsapp),
  });

  try {
    await fetchWithRetry(
      SUBMIT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { timeoutMs: 10000, retries: 1 }
    );

    feedback.textContent = "Recebido ✅ vou te enviar em breve.";
    submitButton.disabled = true;
    trackEvent("lead_submit_success", { segment: finalSegment });
  } catch {
    localStorage.setItem(`${STORAGE_KEY}-pending-submit`, JSON.stringify(payload));
    feedback.textContent = "Não foi possível enviar agora. Tentamos novamente em instantes. Se persistir, atualize e tente de novo.";
    trackEvent("lead_submit_failed", { segment: finalSegment });
  }
}

btnBack.addEventListener("click", () => {
  if (!resultView.classList.contains("hidden")) {
    resultView.classList.add("hidden");
    quizView.classList.remove("hidden");
    state.step = GROUPS.length - 1;
    state.groupEnteredAt = Date.now();
    renderQuizStep();
    return;
  }
  if (state.step > 0) {
    commitGroupTiming(state.step);
    state.step -= 1;
    persistState();
    renderQuizStep();
  }
});

btnNext.addEventListener("click", () => {
  saveCurrentOrder();
  commitGroupTiming(state.step);
  trackEvent("group_completed", { group: state.step + 1 });

  if (state.step < GROUPS.length - 1) {
    state.step += 1;
    persistState();
    renderQuizStep();
  } else {
    renderResult();
  }
});

const hasSavedSession = loadState();
trackEvent("quiz_started", { resumed: hasSavedSession });
renderQuizStep();
