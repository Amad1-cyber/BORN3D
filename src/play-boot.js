(function () {
  const BACKEND_KEY = "born3d_backend_url";
  const gateId = "born3dPlayGate";
  const statusId = "born3dPlayStatus";
  const logId = "born3dPlayLog";
  const hiddenExplorerId = "explorer";

  function $(id) {
    return document.getElementById(id);
  }

  function ensureExplorer() {
    let explorer = $(hiddenExplorerId);
    if (!explorer) {
      explorer = document.createElement("div");
      explorer.id = hiddenExplorerId;
      document.body.appendChild(explorer);
    }
    return explorer;
  }

  function appendLog(line) {
    const log = $(logId);
    if (!log) {
      return;
    }

    const entry = document.createElement("div");
    entry.className = "born3d-play-gate__row";
    entry.textContent = line;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
  }

  function setStatus(text) {
    const status = $(statusId);
    if (status) {
      status.textContent = text;
    }
  }

  function showGate() {
    const gate = $(gateId);
    if (gate) {
      gate.hidden = false;
    }
  }

  function forceGameMode(reason) {
    if (typeof window.setMode !== "function") {
      appendLog(`Waiting for game engine (${reason}).`);
      setStatus("Waiting for the game engine to finish loading...");
      return false;
    }

    try {
      window.setMode("game");
      appendLog(`Game mode requested (${reason}).`);
      setStatus("Game mode requested. If the scene is still blank, press Retry.");
      return true;
    } catch (error) {
      appendLog(`Game mode error: ${error && error.message ? error.message : "unknown error"}.`);
      setStatus("Game mode request failed. Press Retry.");
      return false;
    }
  }

  function syncBackendFromQuery() {
    const backend = new URL(window.location.href).searchParams.get("backend");
    if (!backend) {
      return;
    }

    try {
      window.localStorage.setItem(BACKEND_KEY, backend);
      appendLog("Backend URL saved from the page query.");
    } catch (error) {
      appendLog("Backend URL could not be saved in this browser.");
    }
  }

  function wireControls() {
    const retryButtons = [
      $("born3dPlayRetryBtn"),
      $("born3dPlayTaskRetryBtn"),
      $("born3dPlayGameBtn")
    ].filter(Boolean);
    const gateToggleButtons = [$("born3dPlayTaskGateBtn"), $("born3dPlayHideBtn")].filter(Boolean);

    retryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        showGate();
        forceGameMode("manual retry");
      });
    });

    gateToggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const gate = $(gateId);
        if (!gate) {
          return;
        }
        gate.hidden = !gate.hidden;
      });
    });
  }

  function boot() {
    ensureExplorer();
    syncBackendFromQuery();
    wireControls();

    appendLog("Play page booted.");
    appendLog("Game gate is ready.");
    appendLog("If the viewport is blank, the game mode will be requested again.");

    showGate();

    const retries = [0, 250, 1000, 2500, 5000];
    retries.forEach((delay) => {
      window.setTimeout(() => {
        forceGameMode(delay === 0 ? "auto" : `retry ${delay}ms`);
      }, delay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
