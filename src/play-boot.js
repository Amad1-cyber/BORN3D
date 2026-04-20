(function () {
  const BACKEND_KEY = "born3d_backend_url";
  const ACCOUNT_NAME_KEY = "born3d_account_username";
  const gateId = "born3dPlayGate";
  const statusId = "born3dPlayStatus";
  const logId = "born3dPlayLog";
  const taskbarId = "born3dPlayTaskbar";
  const hiddenExplorerId = "explorer";

  function $(id) {
    return document.getElementById(id);
  }

  function ensureHiddenExplorer() {
    let explorer = $(hiddenExplorerId);
    if (!explorer) {
      explorer = document.createElement("div");
      explorer.id = hiddenExplorerId;
      document.body.appendChild(explorer);
    }
    return explorer;
  }

  function normalizeBackendUrl(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    const withProtocol = /^[a-z]+:\/\//i.test(text)
      ? text
      : `${window.location.protocol}//${text}`;

    try {
      const url = new URL(withProtocol);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      return "";
    }
  }

  function injectGateStyles() {
    if (document.getElementById("born3dPlayInjectedStyles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "born3dPlayInjectedStyles";
    style.textContent = `
      .born3d-play-gate__form { display: grid; gap: 10px; }
      .born3d-play-gate__field { display: grid; gap: 6px; }
      .born3d-play-gate__field span {
        color: rgba(227, 241, 253, 0.82);
        font-size: 0.74rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .born3d-play-gate__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .born3d-play-gate__hint { color: rgba(204, 227, 243, 0.72); font-size: 0.76rem; line-height: 1.45; }
      .born3d-play-gate__actions button,
      .born3d-play-taskbar button { width: auto; min-width: 0; }
      @media (max-width: 560px) { .born3d-play-gate__grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function ensureGateMarkup() {
    const gate = $(gateId);
    if (!gate || document.getElementById("born3dPlayLoginForm")) {
      return gate;
    }

    const log = $(logId);
    const actions = gate.querySelector(".born3d-play-gate__actions");
    const form = document.createElement("form");
    form.id = "born3dPlayLoginForm";
    form.className = "born3d-play-gate__form";
    form.innerHTML = `
      <label class="born3d-play-gate__field">
        <span>Backend URL</span>
        <input id="born3dPlayBackendInput" type="text" placeholder="https://born3d-play.onrender.com">
      </label>
      <div class="born3d-play-gate__grid">
        <label class="born3d-play-gate__field">
          <span>Username</span>
          <input id="born3dPlayUserNameInput" type="text" autocomplete="username" placeholder="Enter username">
        </label>
        <label class="born3d-play-gate__field">
          <span>Pin</span>
          <input id="born3dPlayPinInput" type="password" autocomplete="current-password" placeholder="Enter pin">
        </label>
      </div>
      <div class="born3d-play-gate__grid">
        <label class="born3d-play-gate__field">
          <span>Avatar</span>
          <select id="born3dPlayAvatarSelect">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label class="born3d-play-gate__field">
          <span>Shard</span>
          <select id="born3dPlayShardSelect">
            <option value="odd-ironic-shard">Odd Ironic Shard</option>
          </select>
        </label>
      </div>
      <div id="born3dPlayBackendLabel" class="born3d-play-gate__hint">The play page will reuse the backend from the URL or the field above.</div>
    `;

    if (log && log.parentNode === gate) {
      gate.insertBefore(form, log.nextSibling);
    } else if (actions && actions.parentNode === gate) {
      gate.insertBefore(form, actions);
    } else {
      gate.appendChild(form);
    }

    const hideButton = $("born3dPlayHideBtn");
    if (hideButton && hideButton.parentNode === gate) {
      hideButton.textContent = "Hide Gate";
    }

    return gate;
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

  function hideGate() {
    const gate = $(gateId);
    if (gate) {
      gate.hidden = true;
    }
  }

  function readStoredBackend() {
    try {
      return normalizeBackendUrl(window.localStorage.getItem(BACKEND_KEY));
    } catch (error) {
      return "";
    }
  }

  function readStoredAccountName() {
    try {
      return String(window.localStorage.getItem(ACCOUNT_NAME_KEY) || "").trim();
    } catch (error) {
      return "";
    }
  }

  function syncBackendTarget(value) {
    const backend = normalizeBackendUrl(value);
    const backendInput = $("born3dPlayBackendInput");
    if (!backend) {
      setStatus("Enter a valid backend URL.");
      return false;
    }

    try {
      window.localStorage.setItem(BACKEND_KEY, backend);
    } catch (error) {}

    if (backendInput && backendInput.value !== backend) {
      backendInput.value = backend;
    }

    if (typeof window.born3dSetBackendUrl === "function") {
      window.born3dSetBackendUrl(backend);
    }

    const backendLabel = $("born3dPlayBackendLabel");
    if (backendLabel) {
      backendLabel.textContent = `Using backend: ${backend}`;
    }

    return true;
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
      setStatus("Game mode requested. If the scene is still blank, sign in and press Enter Game.");
      return true;
    } catch (error) {
      appendLog(`Game mode error: ${error && error.message ? error.message : "unknown error"}.`);
      setStatus("Game mode request failed. Press Retry.");
      return false;
    }
  }

  function fillGateDefaults() {
    const nameInput = $("born3dPlayUserNameInput");
    const pinInput = $("born3dPlayPinInput");
    const avatarSelect = $("born3dPlayAvatarSelect");
    const shardSelect = $("born3dPlayShardSelect");
    const backendInput = $("born3dPlayBackendInput");

    if (nameInput && !nameInput.value.trim()) {
      nameInput.value = readStoredAccountName();
    }
    if (avatarSelect && !avatarSelect.value) {
      avatarSelect.value = "male";
    }
    if (shardSelect && !shardSelect.value) {
      shardSelect.value = "odd-ironic-shard";
    }
    if (backendInput && !backendInput.value.trim()) {
      backendInput.value = readStoredBackend() || `${window.location.origin}`;
    }
    if (pinInput) {
      pinInput.value = "";
    }
  }

  function getGateCredentials() {
    const nameInput = $("born3dPlayUserNameInput");
    const pinInput = $("born3dPlayPinInput");
    const avatarSelect = $("born3dPlayAvatarSelect");
    const shardSelect = $("born3dPlayShardSelect");
    return {
      name: nameInput ? nameInput.value.trim() : "",
      pin: pinInput ? pinInput.value.trim() : "",
      avatarGender: avatarSelect && avatarSelect.value === "female" ? "female" : "male",
      shard: shardSelect ? shardSelect.value : "odd-ironic-shard"
    };
  }

  async function submitLogin() {
    const creds = getGateCredentials();
    const backendInput = $("born3dPlayBackendInput");
    if (backendInput) {
      syncBackendTarget(backendInput.value);
    }

    if (!creds.name || !creds.pin) {
      setStatus("Enter both a username and a pin to log in.");
      return;
    }

    if (typeof window.userLogin !== "function") {
      setStatus("Login is still loading. Try again in a moment.");
      appendLog("Login handler not ready yet.");
      return;
    }

    appendLog(`Logging in as ${creds.name}...`);
    setStatus(`Signing in as ${creds.name}...`);
    try {
      await window.userLogin(creds);
      if (window._born3d_token) {
        appendLog(`Logged in as ${creds.name}. Loading the world...`);
        setStatus(`Logged in as ${creds.name}. Loading the world...`);
        hideGate();
        window.setTimeout(() => {
          forceGameMode("post-login");
        }, 120);
      } else {
        setStatus("Login failed. Check your username, pin, and backend.");
      }
    } catch (error) {
      setStatus("Login failed. Check your username, pin, and backend.");
      appendLog(`Login error: ${error && error.message ? error.message : "unknown error"}.`);
    }
  }

  async function submitRegister() {
    const creds = getGateCredentials();
    const backendInput = $("born3dPlayBackendInput");
    if (backendInput) {
      syncBackendTarget(backendInput.value);
    }

    if (!creds.name || !creds.pin) {
      setStatus("Enter both a username and a pin to register.");
      return;
    }

    if (typeof window.userRegister !== "function") {
      setStatus("Register is still loading. Try again in a moment.");
      appendLog("Register handler not ready yet.");
      return;
    }

    appendLog(`Registering ${creds.name}...`);
    setStatus(`Registering ${creds.name}...`);
    try {
      await window.userRegister(creds);
      setStatus(`User "${creds.name}" registered. Log in to enter the world.`);
      appendLog(`Registered ${creds.name}. Use Login & Play next.`);
    } catch (error) {
      setStatus("Registration failed.");
      appendLog(`Registration error: ${error && error.message ? error.message : "unknown error"}.`);
    }
  }

  async function enterGame() {
    const creds = getGateCredentials();
    if (creds.name && creds.pin) {
      await submitLogin();
      return;
    }

    appendLog("Enter your username and pin to sign in.");
    forceGameMode("manual retry");
  }

  function wireControls() {
    const retryButtons = [
      $("born3dPlayRetryBtn"),
      $("born3dPlayTaskRetryBtn")
    ].filter(Boolean);
    const gateToggleButtons = [$("born3dPlayTaskGateBtn"), $("born3dPlayHideBtn")].filter(Boolean);
    const loginForm = $("born3dPlayLoginForm");
    const loginButton = $("born3dPlayLoginBtn");
    const registerButton = $("born3dPlayRegisterBtn");
    const enterGameButton = $("born3dPlayGameBtn");
    const backendInput = $("born3dPlayBackendInput");
    const logoutButton = $("born3dPlayLogoutBtn");

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

    if (loginForm) {
      loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        void submitLogin();
      });
    }
    if (loginButton) {
      loginButton.addEventListener("click", (event) => {
        event.preventDefault();
        void submitLogin();
      });
    }
    if (registerButton) {
      registerButton.addEventListener("click", (event) => {
        event.preventDefault();
        void submitRegister();
      });
    }
    if (enterGameButton) {
      enterGameButton.addEventListener("click", (event) => {
        event.preventDefault();
        void enterGame();
      });
    }
    if (backendInput) {
      backendInput.addEventListener("change", () => {
        syncBackendTarget(backendInput.value);
      });
      backendInput.addEventListener("blur", () => {
        syncBackendTarget(backendInput.value);
      });
    }
    if (logoutButton) {
      logoutButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (typeof window.userLogout !== "function") {
          appendLog("Logout handler not ready yet.");
          return;
        }
        appendLog("Logging out...");
        try {
          await window.userLogout();
        } catch (error) {}
        showGate();
        setStatus("Logged out. Sign in again to enter the world.");
      });
    }
  }

  function syncBackendFromQuery() {
    const backend = normalizeBackendUrl(new URL(window.location.href).searchParams.get("backend"));
    if (backend) {
      try {
        window.localStorage.setItem(BACKEND_KEY, backend);
      } catch (error) {}
      syncBackendTarget(backend);
      appendLog("Backend URL saved from the page query.");
      return;
    }

    const stored = readStoredBackend();
    if (stored) {
      syncBackendTarget(stored);
    }
  }

  function boot() {
    ensureHiddenExplorer();
    injectGateStyles();
    ensureGateMarkup();
    fillGateDefaults();
    syncBackendFromQuery();
    wireControls();

    appendLog("Play page booted.");
    appendLog("Game gate is ready.");
    appendLog("Sign in with username and pin to spawn the 3D world.");

    showGate();

    if (window._born3d_token) {
      setStatus("A session token was found. Sign in again to restore the world.");
      appendLog("Session token detected.");
    }

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
