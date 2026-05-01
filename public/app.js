const form = document.querySelector("#ask-form");
const promptInput = document.querySelector("#prompt");
const submitButton = document.querySelector("#submit-button");
const statusEl = document.querySelector("#status");
const outputEl = document.querySelector("#output");
const charCountEl = document.querySelector("#char-count");
const historyList = document.querySelector("#history-list");
const clearHistoryButton = document.querySelector("#clear-history");

const resultEls = {
  problemUnderstanding: document.querySelector("#problem-understanding"),
  suggestedSolution: document.querySelector("#suggested-solution"),
  stepPlan: document.querySelector("#step-plan"),
  codeWrapper: document.querySelector("#code-block-wrapper"),
  codeExample: document.querySelector("#code-example"),
  responseMeta: document.querySelector("#response-meta")
};

const HISTORY_KEY = "ai-deployment-console-history";
const MAX_HISTORY_ITEMS = 5;

function getSelectedMode() {
  return new FormData(form).get("mode") || "Business";
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
}

function escapeText(value) {
  return typeof value === "string" ? value : "";
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function savePromptToHistory(prompt, mode) {
  const nextItem = {
    prompt,
    mode,
    createdAt: new Date().toISOString()
  };
  const deduped = readHistory().filter((item) => item.prompt !== prompt);
  writeHistory([nextItem, ...deduped].slice(0, MAX_HISTORY_ITEMS));
  renderHistory();
}

function renderHistory() {
  const history = readHistory();
  historyList.innerHTML = "";

  if (!history.length) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "Recent prompts appear here.";
    historyList.append(empty);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent =
      item.prompt.length > 92 ? `${item.prompt.slice(0, 92)}...` : item.prompt;

    const meta = document.createElement("small");
    meta.textContent = `${item.mode} mode`;
    button.append(meta);

    button.addEventListener("click", () => {
      promptInput.value = item.prompt;
      const radio = form.querySelector(`input[name="mode"][value="${item.mode}"]`);
      if (radio) radio.checked = true;
      updateCharCount();
      promptInput.focus();
    });

    li.append(button);
    historyList.append(li);
  });
}

function updateCharCount() {
  charCountEl.textContent = `${promptInput.value.length} / ${promptInput.maxLength}`;
}

function renderResult(data, meta) {
  const result = data.result;
  resultEls.problemUnderstanding.textContent = escapeText(
    result.problemUnderstanding
  );
  resultEls.suggestedSolution.textContent = escapeText(result.suggestedSolution);
  resultEls.stepPlan.innerHTML = "";

  result.stepByStepPlan.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    resultEls.stepPlan.append(li);
  });

  if (result.optionalCodeExample) {
    resultEls.codeExample.textContent = result.optionalCodeExample;
    resultEls.codeWrapper.hidden = false;
  } else {
    resultEls.codeExample.textContent = "";
    resultEls.codeWrapper.hidden = true;
  }

  resultEls.responseMeta.textContent = `${meta.mode} mode - ${meta.latencyMs} ms`;
  outputEl.hidden = false;
  outputEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  const mode = getSelectedMode();

  if (!prompt) {
    setStatus("Enter a problem first.", "error");
    promptInput.focus();
    return;
  }

  setLoading(true);
  setStatus("Generating a structured deployment brief...");

  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt, mode })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    renderResult(data, data.meta);
    savePromptToHistory(prompt, mode);
    setStatus("Brief generated successfully.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setLoading(false);
  }
});

clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

promptInput.addEventListener("input", updateCharCount);

updateCharCount();
renderHistory();
