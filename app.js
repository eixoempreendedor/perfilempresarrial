import { BEHAVIORS, GROUPS, MAP, QUIZ_VERSION, SEGMENTS, SUBMIT_URL } from "./config.js";

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
    tips: [
      "1 meta/semana",
      "Expectativas por escrito",
      "1 conversa difícil marcada",
    ],
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
    tips: [
      "Marcar conversas com data",
      "Combinar limites",
      "1 melhoria/semana",
    ],
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
    tips: [
      "Prazo + bom o suficiente",
      "Critério de decisão",
      "Revisão rápida",
    ],
  },
};

const state = {
  step: 0,
  rankings: GROUPS.map((group) => [...group.items]),
  result: null,
};

const quizView = document.getElementById("quiz-view");
const resultView = document.getElementById("result-view");
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");

let sortableInstance;

function renderQuizStep() {
  const groupMeta = GROUPS[state.step];
  const groupItems = state.rankings[state.step];
  quizView.innerHTML = `
    <h1 class="quiz-title">Perfil do Dono</h1>
    <h2>Grupo ${state.step + 1}</h2>
    <p class="helper">${groupMeta.title}</p>
    <p class="order-hint">Topo = mais me identifico • Embaixo = menos me identifico.</p>
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
  `;

  const listEl = document.getElementById("sortable-list");
  sortableInstance?.destroy();
  sortableInstance = new Sortable(listEl, {
    animation: 180,
    ghostClass: "drag-ghost",
    handle: ".drag-handle",
    onEnd: saveCurrentOrder,
  });

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

  updateProgress();
  updateButtons();
}

function saveCurrentOrder() {
  const list = quizView.querySelectorAll(".drag-item");
  state.rankings[state.step] = [...list].map((el) => el.dataset.item);
  [...list].forEach((el, idx) => {
    el.querySelector(".rank").textContent = `${idx + 1}º`;
  });
  updateButtons();
}

function updateProgress() {
  const total = GROUPS.length;
  const current = Math.min(state.step + 1, total);
  progressText.textContent = `Grupo ${current} de ${total}`;
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
      <form id="lead-form" class="lead-form">
        <label>Nome<input name="name" /></label>
        <label>Email<input type="email" name="email" /></label>
        <label>WhatsApp<input name="whatsapp" /></label>
        <label>Empresa<input required name="company" /></label>
        <label>Segmento
          <select required name="segment_select" id="segment-select">
            <option value="" disabled selected>Selecione...</option>
            ${SEGMENTS.map((s) => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </label>
        <label id="segment-other-wrap" class="hidden">Outro segmento
          <input name="segment_other" id="segment-other" />
        </label>
        <input class="hidden" tabindex="-1" autocomplete="off" name="website" />
        <label class="consent-line"><input type="checkbox" name="consent" value="sim" required /> Eu concordo em receber o plano personalizado e comunicações relacionadas.</label>
        <button id="plan-submit" class="btn primary full" type="submit">Quero meu plano personalizado</button>
        <p id="submit-feedback" class="feedback"></p>
      </form>
    </section>
  `;

  const segmentSelect = document.getElementById("segment-select");
  const segmentOtherWrap = document.getElementById("segment-other-wrap");
  const segmentOtherInput = document.getElementById("segment-other");

  segmentSelect.addEventListener("change", () => {
    const isOther = segmentSelect.value === "Outro (digitar)";
    segmentOtherWrap.classList.toggle("hidden", !isOther);
    segmentOtherInput.required = isOther;
    if (!isOther) segmentOtherInput.value = "";
  });

  document.getElementById("lead-form").addEventListener("submit", submitLead);

  progressText.textContent = "Resultado";
  progressFill.style.width = "100%";
  btnBack.disabled = false;
  btnNext.disabled = true;
  btnNext.textContent = "Concluído";
}

async function submitLead(event) {
  event.preventDefault();
  const feedback = document.getElementById("submit-feedback");
  const submitButton = document.getElementById("plan-submit");
  const formData = new FormData(event.target);
  const lead = Object.fromEntries(formData.entries());

  const finalSegment = lead.segment_select === "Outro (digitar)"
    ? (lead.segment_other || "").trim()
    : lead.segment_select;

  if (!lead.company?.trim()) {
    feedback.textContent = "Informe a empresa para receber o plano.";
    return;
  }

  if (!finalSegment) {
    feedback.textContent = "Selecione o segmento (ou informe em Outro).";
    return;
  }

  if (!lead.email?.trim() && !lead.whatsapp?.trim()) {
    feedback.textContent = "Informe email ou WhatsApp para contato.";
    return;
  }

  if (lead.consent !== "sim") {
    feedback.textContent = "Você precisa autorizar o contato para receber o plano.";
    return;
  }

  const payload = {
    nome: (lead.name || "").trim(),
    email: (lead.email || "").trim(),
    whatsapp: (lead.whatsapp || "").trim(),
    empresa: lead.company.trim(),
    segmento: finalSegment,
    consent: lead.consent,
    primary: state.result.primary,
    secondary: state.result.secondary,
    pct: state.result.disc_pct,
    ranking_json: state.result.ranking_json,
    behaviors_json: state.result.behaviors_scores,
    behaviorsTop: state.result.behaviors_top.map((item) => item.name),
    behaviorsBottom: state.result.behaviors_bottom.map((item) => item.name),
    pageUrl: window.location.href,
    referrer: document.referrer || "",
    userAgent: navigator.userAgent,
    quizVersion: QUIZ_VERSION,
    website: lead.website || "",
    submitted_at: new Date().toISOString(),
  };

  feedback.textContent = "Enviando...";
  try {
    const response = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Falha no envio");
    feedback.textContent = "Recebido ✅ vou te enviar em breve.";
    submitButton.disabled = true;
  } catch (error) {
    feedback.textContent = "Não foi possível enviar agora. Tente novamente.";
  }
}

btnBack.addEventListener("click", () => {
  if (!resultView.classList.contains("hidden")) {
    resultView.classList.add("hidden");
    quizView.classList.remove("hidden");
    state.step = GROUPS.length - 1;
    renderQuizStep();
    return;
  }
  if (state.step > 0) {
    state.step -= 1;
    renderQuizStep();
  }
});

btnNext.addEventListener("click", () => {
  saveCurrentOrder();
  if (state.step < GROUPS.length - 1) {
    state.step += 1;
    renderQuizStep();
  } else {
    renderResult();
  }
});

renderQuizStep();
