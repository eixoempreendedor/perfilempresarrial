import { BEHAVIORS, GROUPS, MAP, QUIZ_VERSION, SEGMENTS, SUBMIT_URL } from "./config.js";

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
    <h2>Grupo ${state.step + 1}</h2>
    <p class="helper">${groupMeta.title}</p>
    <ul id="sortable-list" class="sortable-list">
      ${groupItems
        .map(
          (item, idx) => `
            <li class="drag-item" data-item="${item}">
              <span class="rank">${idx + 1}º</span>
              <span>${item}</span>
              <span class="drag-handle">☰</span>
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
    behaviors_top: behaviorSorted.slice(0, 8).map(([name, score]) => ({ name, score })),
    behaviors_bottom: behaviorSorted.slice(-6).map(([name, score]) => ({ name, score })),
  };
}

function renderResult() {
  state.result = calculateResults();
  quizView.classList.add("hidden");
  resultView.classList.remove("hidden");

  const disc = state.result.disc_pct;
  const top = state.result.behaviors_top
    .map((b, i) => `<li>${i + 1}. ${b.name} <strong>(${b.score.toFixed(1)})</strong></li>`)
    .join("");
  const bottom = state.result.behaviors_bottom
    .map((b, i) => `<li>${i + 1}. ${b.name} <strong>(${b.score.toFixed(1)})</strong></li>`)
    .join("");

  resultView.innerHTML = `
    <h2>Seu resultado</h2>
    <div class="disc-grid">
      <div><span>D</span><strong>${disc.D}%</strong></div>
      <div><span>I</span><strong>${disc.I}%</strong></div>
      <div><span>S</span><strong>${disc.S}%</strong></div>
      <div><span>C</span><strong>${disc.C}%</strong></div>
    </div>
    <p><strong>Primário:</strong> ${state.result.primary} · <strong>Secundário:</strong> ${state.result.secondary}</p>

    <h3>Top 8 comportamentos</h3>
    <ol>${top}</ol>

    <h3>Bottom 6 comportamentos</h3>
    <ol>${bottom}</ol>

    <h3>Receber resultado completo</h3>
    <form id="lead-form" class="lead-form">
      <label>Nome<input required name="name" /></label>
      <label>Email<input required type="email" name="email" /></label>
      <label>WhatsApp<input required name="whatsapp" /></label>
      <label>Empresa<input required name="company" /></label>
      <label>Segmento
        <select required name="segment">
          <option value="" disabled selected>Selecione...</option>
          ${SEGMENTS.map((s) => `<option value="${s}">${s}</option>`).join("")}
        </select>
      </label>
      <button class="btn primary full" type="submit">Enviar</button>
      <p id="submit-feedback" class="feedback"></p>
    </form>
  `;

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
  const formData = new FormData(event.target);
  const lead = Object.fromEntries(formData.entries());

  const payload = {
    quiz_version: QUIZ_VERSION,
    ranking_json: state.result.ranking_json,
    disc_pct: state.result.disc_pct,
    primary: state.result.primary,
    secondary: state.result.secondary,
    behaviors_top: state.result.behaviors_top,
    behaviors_bottom: state.result.behaviors_bottom,
    ...lead,
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
    feedback.textContent = "Enviado com sucesso!";
    event.target.reset();
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
