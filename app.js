import { BEHAVIORS, GROUPS, MAP, QUIZ_VERSION, REPORT_UPLOAD_URL, SEGMENTS, SUBMIT_URL } from "./config.js";

const STORAGE_KEY = "perfil-do-dono-state";
const PENDING_SUBMIT_KEY = `${STORAGE_KEY}-pending-submit`;
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
  lead: {
    name: "",
    email: "",
    whatsapp: "",
    company: "",
    segment_select: "",
    segment_other: "",
    cidade_uf: "",
    website: "",
    consent: "",
  },
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

function setSubmitFeedback(feedbackEl, message, status = "info", meta = {}) {
  if (!feedbackEl) return;
  feedbackEl.textContent = message;
  feedbackEl.dataset.status = status;
  console.info("[submit-feedback]", {
    status,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  });
}

function readLeadInputs(formElement) {
  const leadData = Object.fromEntries(new FormData(formElement).entries());
  state.lead = {
    ...state.lead,
    name: (leadData.name || "").trim(),
    email: (leadData.email || "").trim(),
    whatsapp: (leadData.whatsapp || "").trim(),
    company: (leadData.company || "").trim(),
    segment_select: leadData.segment_select || "",
    segment_other: (leadData.segment_other || "").trim(),
    cidade_uf: (leadData.cidade_uf || "").trim(),
    website: (leadData.website || "").trim(),
    consent: leadData.consent || "",
  };
  return state.lead;
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
    .map((b) => `<li>${b.name}</li>`)
    .join("");
  const bottom = state.result.behaviors_bottom
    .map((b) => `<li>${b.name}</li>`)
    .join("");

  resultView.innerHTML = `
    <h2>Seu resultado</h2>
    <div class="disc-grid">
      <div><span class="disc-label">D - Dominante</span><strong>${disc.D}%</strong></div>
      <div><span class="disc-label">I - Influente</span><strong>${disc.I}%</strong></div>
      <div><span class="disc-label">S - Estável</span><strong>${disc.S}%</strong></div>
      <div><span class="disc-label">C - Analítico</span><strong>${disc.C}%</strong></div>
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
        <label for="cidade_uf">Cidade/UF (opcional) — pra eu ajustar pro seu mercado local
          <input id="cidade_uf" name="cidade_uf" placeholder="Ex.: Itumbiara/GO" />
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
  const leadForm = document.getElementById("lead-form");

  ["name", "email", "whatsapp", "company", "segment_other", "cidade_uf"].forEach((fieldName) => {
    const field = leadForm.querySelector(`[name="${fieldName}"]`);
    if (field) field.value = state.lead[fieldName] || "";
  });
  const consentInput = leadForm.querySelector('[name="consent"]');
  if (consentInput) consentInput.checked = state.lead.consent === "sim";

  if (state.lead.segment_select) {
    segmentSelect.value = state.lead.segment_select;
  }

  const isOtherSelected = segmentSelect.value === "Outro (digitar)";
  segmentOtherWrap.classList.toggle("hidden", !isOtherSelected);
  segmentOtherInput.required = isOtherSelected;

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

  leadForm.addEventListener("submit", submitLead);

  progressText.textContent = "Resultado";
  progressFill.style.width = "100%";
  btnBack.disabled = false;
  btnNext.disabled = true;
  btnNext.textContent = "Concluído";

  clearPersistedState();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function splitBullets(items = [], max = 3) {
  return items
    .slice(0, max)
    .map((item) => `• ${item}`)
    .join("<br />");
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildReportPlaceholders(leadInput = null) {
  const lead = leadInput || state.lead;
  const primaryGuide = PROFILE_GUIDE[state.result.primary];
  const secondaryGuide = PROFILE_GUIDE[state.result.secondary];
  const topBehaviors = state.result.behaviors_top.map((item) => item.name);
  const bottomBehaviors = [...state.result.behaviors_bottom].reverse().map((item) => item.name);
  const segment = lead.segment_select === "Outro (digitar)" ? (lead.segment_other || "Outro segmento") : (lead.segment_select || "Segmento não informado");
  const city = lead.cidade_uf || "Cidade não informada";

  return {
    DATA: formatDate(),
    NOME_PESSOA: lead.name || "Empreendedor(a)",
    NOME_EMPRESA: lead.company || "Empresa não informada",
    SEGMENTO: segment,
    CIDADE: city,
    DISC_TIPO: `${state.result.primary}/${state.result.secondary}`,
    DISC_RESUMO_1_FRASE: `${primaryGuide.headline} com apoio de ${secondaryGuide.label.toLowerCase()} para equilibrar execução.`,
    TOP_FORCAS_3: splitBullets(primaryGuide.strengths, 3),
    TOP_ATENCOES_2: splitBullets(primaryGuide.risks, 2),
    FOCO_30D: `Foco em rotina de ${primaryGuide.tips[0].toLowerCase()} e revisão semanal de execução.`,
    COMPORTAMENTOS_TOP_LISTA: splitBullets(topBehaviors, 5),
    COMPORTAMENTOS_TRABALHAR_LISTA: splitBullets(bottomBehaviors, 5),
    IMPACTO_CAIXA: "Indicadores sem ritual de revisão criam decisões por feeling.",
    IMPACTO_VENDAS: "Sem processo claro, a conversão depende do humor do dia.",
    IMPACTO_TIME: "Falta de alinhamento aumenta retrabalho e ruído operacional.",
    IMPACTO_PROCESSOS: "Padrões pouco definidos geram variação e perda de margem.",
    PLANO_30D_ACAO_PRINCIPAL: primaryGuide.tips[0],
    PLANO_30D_HABITO_DIARIO: primaryGuide.tips[1],
    PLANO_30D_ROTINA_SEMANAL: "Bloco semanal de 45 minutos para revisar números e decisões.",
    PLANO_30D_CONVERSA_OBRIGATORIA: primaryGuide.tips[2],
    PLANO_30D_ENTREGA_OBJETIVA: "Uma melhoria aplicada com responsável, prazo e critério de sucesso.",
    MONITORAMENTO_NUM1: "Faturamento semanal vs meta",
    MONITORAMENTO_NUM2: "Margem de contribuição",
    MONITORAMENTO_NUM3: "Taxa de conversão",
    MONITORAMENTO_COMPORTAMENTO: "Cumprimento da rotina de liderança (2x por semana)",
    LIDERANCA_3_PONTOS: splitBullets(["Defina expectativa por escrito", "Dê feedback semanal com critério", "Delegue com prazo e checagem"], 3),
    TIME_3_PONTOS: splitBullets(["Prioridades visíveis para todos", "Ritual curto de alinhamento diário", "Acompanhe execução sem microgerenciar"], 3),
    VENDAS_3_PONTOS: splitBullets(["Script simples com perguntas-chave", "Oferta com próximo passo claro", "Follow-up com data e responsável"], 3),
    SCRIPT_ABERTURA: "Quero entender seu cenário em 3 perguntas para te indicar o melhor próximo passo.",
    SCRIPT_FECHAMENTO: "Pelo que você trouxe, o caminho mais seguro é começar por este plano. Faz sentido iniciarmos hoje?",
    POSICIONAMENTO_DIAGNOSTICO_5_ITENS: splitBullets([`Google Meu Negócio otimizado para ${city}`, "Página com prova social e CTA", "Oferta principal clara por segmento", "Rotina de conteúdo local", "Canal de atendimento com SLA"], 5),
    POSICIONAMENTO_3_ACOES_7D: splitBullets(["Atualizar perfil e ofertas no Google", "Publicar 3 conteúdos com prova real", "Padronizar mensagem de resposta comercial"], 3),
    OPORTUNIDADES_SEGMENTO_5_ITENS: splitBullets([`Oferta de entrada para ${segment}`, "Parcerias locais com indicação", "Pacote de recorrência", "Campanha de reativação de base", "Upsell para clientes ativos"], 5),
    PROXIMOS_PASSOS: "Escolha um gargalo, defina dono, prazo e ritual de revisão. Execute por 30 dias sem negociar consistência.",
  };
}

function reportPage(title, subtitle, cards, pageNumber, placeholders, includeAlert = true) {
  const cardsHtml = cards
    .map((card) => `
      <article class="report-card ${card.variant || ""}">
        <h4>${escapeHtml(card.title)}</h4>
        <div class="report-text">${card.content}</div>
      </article>
    `)
    .join("");

  const alertCard = includeAlert
    ? `<article class="report-card warning"><h4>Alerta / ponto cego</h4><div class="report-text">${placeholders.TOP_ATENCOES_2}</div></article>`
    : "";

  return `
    <section class="report-page">
      <header class="report-header"><span>Relatório de Perfil Empreendedor</span><span class="logo-box">LOGO</span></header>
      <main class="report-body">
        <h2>${escapeHtml(title)}</h2>
        <p class="report-subtitle">${escapeHtml(subtitle)}</p>
        ${cardsHtml}
        ${alertCard}
      </main>
      <footer class="report-footer">Confidencial • Gerado em ${escapeHtml(placeholders.DATA)} • Página ${pageNumber}/12</footer>
    </section>
  `;
}

function buildReportMarkup(placeholders) {
  return `
    <div class="report-root">
      <section class="report-page cover">
        <aside class="cover-bar"></aside>
        <main class="report-body cover-body">
          <h1>Relatório de Perfil Empreendedor</h1>
          <p class="report-subtitle">Análise comportamental estratégica</p>
          <div class="report-card"><h4>Preparado para</h4><div class="report-text">${escapeHtml(placeholders.NOME_PESSOA)}</div></div>
          <div class="report-card"><h4>Empresa</h4><div class="report-text">${escapeHtml(placeholders.NOME_EMPRESA)}</div></div>
          <div class="report-card"><h4>Segmento e cidade</h4><div class="report-text">${escapeHtml(placeholders.SEGMENTO)} • ${escapeHtml(placeholders.CIDADE)}</div></div>
          <div class="report-tag">Versão executável (30 dias)</div>
          <div class="report-date">${escapeHtml(placeholders.DATA)}</div>
        </main>
      </section>
      ${reportPage("Resumo executivo", "Visão geral do seu perfil e direcionamento imediato.", [
        { title: "Seu perfil em 1 frase", content: placeholders.DISC_RESUMO_1_FRASE, variant: "accent" },
        { title: "3 forças que te fazem ganhar", content: placeholders.TOP_FORCAS_3 },
        { title: "Foco dos próximos 30 dias", content: placeholders.FOCO_30D, variant: "accent" },
      ], 2, placeholders)}
      ${reportPage("Seu DISC na prática", "Como você decide, comunica e lidera no dia a dia.", [
        { title: "Tipo e leitura rápida", content: `${escapeHtml(placeholders.DISC_TIPO)}<br />${placeholders.DISC_RESUMO_1_FRASE}`, variant: "accent" },
        { title: "Como você decide • comunica • lidera", content: splitBullets(["Decide com foco no resultado", "Comunica com objetividade", "Lidera com direção e cobrança"], 3) },
        { title: "Ação prática", content: placeholders.PLANO_30D_HABITO_DIARIO },
      ], 3, placeholders)}
      ${reportPage("Comportamentos top", "Forças que já geram resultado e como potencializar.", [
        { title: "Comportamentos com maior impacto", content: placeholders.COMPORTAMENTOS_TOP_LISTA, variant: "accent" },
        { title: "Como usar isso melhor", content: "Transforme força em rotina: aplique 1 vez por dia, sem exagero." },
        { title: "Ação prática", content: placeholders.PLANO_30D_HABITO_DIARIO },
      ], 4, placeholders, false)}
      ${reportPage("Comportamentos a trabalhar", "Ajustes que reduzem custo de decisão e execução.", [
        { title: "Comportamentos para evoluir", content: placeholders.COMPORTAMENTOS_TRABALHAR_LISTA },
        { title: "Ação prática", content: placeholders.PLANO_30D_ACAO_PRINCIPAL, variant: "accent" },
      ], 5, placeholders)}
      ${reportPage("Impacto na empresa", "Onde o comportamento aparece na operação e no caixa.", [
        { title: "Caixa", content: escapeHtml(placeholders.IMPACTO_CAIXA) },
        { title: "Vendas", content: escapeHtml(placeholders.IMPACTO_VENDAS) },
        { title: "Time", content: escapeHtml(placeholders.IMPACTO_TIME) },
        { title: "Processos", content: escapeHtml(placeholders.IMPACTO_PROCESSOS) },
      ], 6, placeholders, false)}
      ${reportPage("Plano de 30 dias", "Execução simples: um gargalo por vez.", [
        { title: "Ação principal", content: escapeHtml(placeholders.PLANO_30D_ACAO_PRINCIPAL), variant: "accent" },
        { title: "Hábito diário", content: escapeHtml(placeholders.PLANO_30D_HABITO_DIARIO) },
        { title: "Rotina semanal", content: escapeHtml(placeholders.PLANO_30D_ROTINA_SEMANAL) },
        { title: "Conversa obrigatória", content: escapeHtml(placeholders.PLANO_30D_CONVERSA_OBRIGATORIA) },
        { title: "Entrega objetiva", content: escapeHtml(placeholders.PLANO_30D_ENTREGA_OBJETIVA) },
      ], 7, placeholders, false)}
      ${reportPage("Monitoramento do dono", "3 números + 1 comportamento para reduzir achismo.", [
        { title: "Número 1", content: escapeHtml(placeholders.MONITORAMENTO_NUM1), variant: "accent" },
        { title: "Número 2", content: escapeHtml(placeholders.MONITORAMENTO_NUM2) },
        { title: "Número 3", content: escapeHtml(placeholders.MONITORAMENTO_NUM3) },
        { title: "Comportamento", content: escapeHtml(placeholders.MONITORAMENTO_COMPORTAMENTO) },
      ], 8, placeholders, false)}
      ${reportPage("Liderança", "Ajustes de liderança para seu momento de empresa.", [
        { title: "Liderança em 3 pontos", content: placeholders.LIDERANCA_3_PONTOS },
        { title: "Time em 3 pontos", content: placeholders.TIME_3_PONTOS },
        { title: "Ação prática", content: escapeHtml(placeholders.PLANO_30D_CONVERSA_OBRIGATORIA), variant: "accent" },
      ], 9, placeholders, false)}
      ${reportPage("Vendas e negociação", "Seu script comercial direto ao ponto.", [
        { title: "Vendas em 3 pontos", content: placeholders.VENDAS_3_PONTOS },
        { title: "Script de abertura", content: escapeHtml(placeholders.SCRIPT_ABERTURA) },
        { title: "Script de fechamento", content: escapeHtml(placeholders.SCRIPT_FECHAMENTO), variant: "accent" },
      ], 10, placeholders, false)}
      ${reportPage(`Posicionamento em ${placeholders.CIDADE}`, "Diagnóstico rápido e 3 ações para 7 dias.", [
        { title: "Diagnóstico (5 itens)", content: placeholders.POSICIONAMENTO_DIAGNOSTICO_5_ITENS },
        { title: "3 ações em 7 dias", content: placeholders.POSICIONAMENTO_3_ACOES_7D, variant: "accent" },
        { title: "Ação prática", content: "Padronizar mensagem comercial com prova + próxima ação." },
      ], 11, placeholders, false)}
      ${reportPage("Oportunidades e próximos passos", "Priorize uma frente e transforme em rotina.", [
        { title: "5 oportunidades do segmento", content: placeholders.OPORTUNIDADES_SEGMENTO_5_ITENS },
        { title: "Próximos passos", content: escapeHtml(placeholders.PROXIMOS_PASSOS), variant: "accent" },
        { title: "Mensagem final", content: "Transforme isso em rotina. Relatório sem ação vira decoração." },
      ], 12, placeholders, false)}
    </div>
  `;
}

function ensureReportStyles() {
  if (document.getElementById("report-template-style")) return;
  const style = document.createElement("style");
  style.id = "report-template-style";
  style.textContent = `
    .report-render-root { position: fixed; left: -99999px; top: 0; width: 210mm; background: #e8e9ed; padding: 8mm 0; }
    .report-page { width: 210mm; min-height: 297mm; background: #F5F6FA; color: #1D1E23; position: relative; padding: 20mm; margin: 0 auto 6mm; font-family: 'Open Sans', Arial, sans-serif; overflow: hidden; }
    .report-page h1, .report-page h2, .report-page h4 { font-family: Georgia, 'Times New Roman', serif; margin: 0; }
    .cover { padding-left: 30mm; }
    .cover-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 10mm; background: #2E7D32; }
    .report-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #2E7D32; border-bottom: 1px solid #D3D9DF; padding-bottom: 8px; margin-bottom: 10px; }
    .logo-box { border: 1px dashed #A8B0BA; border-radius: 8px; font-size: 10px; padding: 4px 8px; color: #A8B0BA; }
    .report-body { display: grid; gap: 10px; }
    .cover-body { margin-top: 28mm; }
    .report-subtitle { margin: 0; color: #5f6772; font-size: 13px; min-height: 34px; }
    .report-card { background: #fff; border-radius: 14px; border: 1px solid rgba(168,176,186,.35); box-shadow: 0 2px 6px rgba(0,0,0,.06); padding: 10px; min-height: 46px; }
    .report-card.accent { border-left: 4px solid #2E7D32; }
    .report-card.warning { border-left: 4px solid #FFB300; }
    .report-card h4 { font-size: 14px; margin-bottom: 6px; }
    .report-text { font-size: 12px; line-height: 1.4; max-height: 72px; overflow: hidden; }
    .report-footer { position: absolute; bottom: 14px; left: 20mm; right: 20mm; font-size: 10px; color: #7b8290; border-top: 1px solid #D3D9DF; padding-top: 6px; }
    .report-tag { display: inline-block; margin-top: 8px; background: #2E7D32; color: #fff; padding: 5px 10px; border-radius: 999px; font-size: 12px; }
    .report-date { color: #7b8290; font-size: 12px; margin-top: 8px; }
  `;
  document.head.appendChild(style);
}

async function renderReportPdfBlob(placeholders) {
  if (!window.html2canvas || !window.jspdf) {
    throw new Error("Bibliotecas de PDF indisponíveis");
  }
  ensureReportStyles();
  const renderRoot = document.createElement("div");
  renderRoot.className = "report-render-root";
  renderRoot.innerHTML = buildReportMarkup(placeholders);
  document.body.appendChild(renderRoot);

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pages = Array.from(renderRoot.querySelectorAll(".report-page"));

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await window.html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#F5F6FA",
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    return pdf.output("blob");
  } finally {
    renderRoot.remove();
  }
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  bytes.forEach((item) => {
    binary += String.fromCharCode(item);
  });
  return btoa(binary);
}

async function uploadReportToDrive(blob, placeholders) {
  if (!REPORT_UPLOAD_URL) return null;
  const fileName = `Relatorio-${(placeholders.NOME_EMPRESA || "empresa").replace(/\s+/g, "-")}-${formatDate().replace(/\//g, "")}.pdf`;
  const payload = {
    fileName,
    folderId: REPORT_FOLDER_ID,
    mimeType: "application/pdf",
    contentBase64: await blobToBase64(blob),
    meta: {
      person: placeholders.NOME_PESSOA,
      company: placeholders.NOME_EMPRESA,
      segment: placeholders.SEGMENTO,
      city: placeholders.CIDADE,
      generatedAt: placeholders.DATA,
      folderId: REPORT_FOLDER_ID,
    },
  };

  const response = await fetch(REPORT_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Falha no upload do relatório");
  return response.json();
}

async function generateAndDownloadReport(buttonEl, feedbackEl, formEl) {
  try {
    buttonEl.disabled = true;
    setSubmitFeedback(feedbackEl, "Gerando relatório em PDF...", "info", { source: "report" });
    const leadInput = readLeadInputs(formEl);
    const placeholders = buildReportPlaceholders(leadInput);
    const blob = await renderReportPdfBlob(placeholders);
    saveBlob(blob, `Relatorio-Perfil-${placeholders.NOME_EMPRESA.replace(/\s+/g, "-")}.pdf`);

    if (REPORT_UPLOAD_URL) {
      setSubmitFeedback(feedbackEl, "PDF gerado. Enviando para o Drive...", "info", { source: "report_upload" });
      const uploadResponse = await uploadReportToDrive(blob, placeholders);
      const link = uploadResponse?.webViewLink || uploadResponse?.url || "";
      const message = link
        ? `PDF salvo no Drive ✅ Link: ${link}`
        : "PDF salvo no Drive ✅";
      setSubmitFeedback(feedbackEl, message, "success", { source: "report_upload" });
    } else {
      setSubmitFeedback(feedbackEl, "PDF gerado e baixado ✅", "success", { source: "report" });
    }
    trackEvent("report_generated", {
      segment: placeholders.SEGMENTO,
      hasDriveUpload: Boolean(REPORT_UPLOAD_URL),
    });
  } catch (error) {
    setSubmitFeedback(feedbackEl, "Não foi possível gerar o relatório agora. Tente novamente.", "error", { source: "report", error: String(error) });
    trackEvent("report_generation_failed", { reason: String(error) });
  } finally {
    buttonEl.disabled = false;
  }
}

async function fetchWithRetry(url, options, { timeoutMs = 10000, retries = 1, acceptOpaqueResponse = false } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) {
        if (acceptOpaqueResponse && response.type === "opaque") {
          return response;
        }
        throw new Error("Falha no envio");
      }
      return response;
    } catch (error) {
      clearTimeout(timer);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      attempt += 1;
    }
  }
}

async function postLead(payload) {
  const serializedPayload = JSON.stringify(payload);

  try {
    await fetchWithRetry(
      SUBMIT_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serializedPayload,
      },
      { timeoutMs: 15000, retries: 1 }
    );
    return;
  } catch {
    try {
      await fetchWithRetry(
        SUBMIT_URL,
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: serializedPayload,
        },
        { timeoutMs: 15000, retries: 1, acceptOpaqueResponse: true }
      );
      return;
    } catch {
      const beaconPayload = new Blob([serializedPayload], { type: "text/plain;charset=utf-8" });
      const beaconSent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(SUBMIT_URL, beaconPayload);
      if (!beaconSent) {
        throw new Error("Falha no envio");
      }
    }
  }
}

async function flushPendingSubmit() {
  const rawPendingSubmit = localStorage.getItem(PENDING_SUBMIT_KEY);
  if (!rawPendingSubmit) return;

  try {
    const pendingPayload = JSON.parse(rawPendingSubmit);
    await postLead(pendingPayload);
    localStorage.removeItem(PENDING_SUBMIT_KEY);
    trackEvent("lead_submit_pending_flushed", {
      segment: pendingPayload.segment || pendingPayload.segmento || "",
    });
  } catch {
    trackEvent("lead_submit_pending_flush_failed", {});
  }
}

async function submitLead(event) {
  event.preventDefault();
  clearFieldErrors();

  const feedback = document.getElementById("submit-feedback");
  const submitButton = document.getElementById("plan-submit");
  const lead = readLeadInputs(event.target);

  if (lead.website) {
    trackEvent("lead_submit_blocked_honeypot", {});
    setSubmitFeedback(feedback, "Recebido ✅ vou te enviar em breve.", "success", { source: "honeypot" });
    submitButton.disabled = true;
    return;
  }

  const finalSegment = lead.segment_select === "Outro (digitar)"
    ? (lead.segment_other || "").trim()
    : lead.segment_select;

  const email = lead.email;
  const whatsapp = lead.whatsapp;
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
    setSubmitFeedback(feedback, "Corrija os campos destacados para continuar.", "warning", { reason: "validation" });
    trackEvent("lead_submit_validation_failed", { step: "result" });
    return;
  }

  const submittedAt = new Date().toISOString();
  const answersJson = state.result.ranking_json;
  const behaviorsScoresJson = state.result.behaviors_scores;
  const behaviorsTopJson = state.result.behaviors_top.map((item) => item.name);
  const behaviorsBottomJson = state.result.behaviors_bottom.map((item) => item.name);
  const payloadJsonText = JSON.stringify(
    {
      timestamp: submittedAt,
      nome: lead.name,
      email,
      whatsapp,
      empresa: lead.company,
      segmento: finalSegment,
      cidade_uf: state.lead.cidade_uf,
      primary: state.result.primary,
      secondary: state.result.secondary,
      pct_D: state.result.disc_pct.D,
      pct_I: state.result.disc_pct.I,
      pct_S: state.result.disc_pct.S,
      pct_C: state.result.disc_pct.C,
      answers_json: answersJson,
      behaviors_scores_json: behaviorsScoresJson,
      behaviors_top_json: behaviorsTopJson,
      behaviors_bottom_json: behaviorsBottomJson,
      consent: lead.consent,
      page_url: window.location.href,
    },
    null,
    2
  );

  const payload = {
    // contrato principal (documentado)
    name: lead.name,
    email,
    whatsapp,
    company: lead.company,
    segment: finalSegment,
    cidade_uf: state.lead.cidade_uf,
    consent: lead.consent,
    ranking_json: answersJson,
    disc_pct: state.result.disc_pct,
    pct_D: state.result.disc_pct.D,
    pct_I: state.result.disc_pct.I,
    pct_S: state.result.disc_pct.S,
    pct_C: state.result.disc_pct.C,
    primary: state.result.primary,
    secondary: state.result.secondary,
    behaviors_scores: behaviorsScoresJson,
    behaviors_top: behaviorsTopJson,
    behaviors_bottom: behaviorsBottomJson,
    quiz_version: QUIZ_VERSION,
    submitted_at: submittedAt,
    page_url: window.location.href,
    referrer: document.referrer || "",
    user_agent: navigator.userAgent,
    quiz_events: state.events,
    group_timings_ms: state.groupTimingsMs,
    payload_json_text: payloadJsonText,

    // chaves legadas (compatibilidade)
    nome: lead.name,
    empresa: lead.company,
    segmento: finalSegment,
    pct: state.result.disc_pct,
    behaviors_json: behaviorsScoresJson,
    behaviorsTop: behaviorsTopJson,
    behaviorsBottom: behaviorsBottomJson,
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,
    quizVersion: QUIZ_VERSION,
  };

  setSubmitFeedback(feedback, "Enviando...", "info", { phase: "attempt" });
  trackEvent("lead_submit_attempt", {
    segment: finalSegment,
    hasEmail: Boolean(email),
    hasWhatsapp: Boolean(whatsapp),
  });

  try {
    await postLead(payload);

    setSubmitFeedback(feedback, "Recebido ✅ vou te enviar em breve.", "success", { source: "submit" });
    submitButton.disabled = true;
    localStorage.removeItem(PENDING_SUBMIT_KEY);
    trackEvent("lead_submit_success", { segment: finalSegment });
  } catch {
    localStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify(payload));
    setTimeout(() => {
      void flushPendingSubmit();
    }, 15000);
    setSubmitFeedback(
      feedback,
      "Não foi possível enviar agora. Tentamos novamente em instantes. Se persistir, atualize e tente de novo.",
      "error",
      { reason: "network_or_cors" }
    );
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
setTimeout(() => {
  void flushPendingSubmit();
}, 2000);
trackEvent("quiz_started", { resumed: hasSavedSession });
renderQuizStep();
