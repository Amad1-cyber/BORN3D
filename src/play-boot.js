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

  function setGateCompact(compact) {
    const gate = $(gateId);
    if (gate) {
      gate.dataset.compact = compact ? "true" : "false";
    }
    const button = $("born3dPlayCompactBtn");
    const taskButton = $("born3dPlayTaskCompactBtn");
    if (button) {
      button.textContent = compact ? "Expand" : "Compact";
    }
    if (taskButton) {
      taskButton.textContent = compact ? "Expand" : "Compact";
    }
  }

  function toggleConsoleVisibility(forceVisible) {
    const log = $(logId);
    if (!log) {
      return;
    }
    const visible = typeof forceVisible === "boolean" ? forceVisible : log.hidden;
    log.hidden = !visible;
    const button = $("born3dPlayTaskConsoleBtn");
    if (button) {
      button.textContent = visible ? "Console" : "Console";
    }
  }

  function readStoredBackend() {
    try {
      const storedBackend = normalizeBackendUrl(window.localStorage.getItem(BACKEND_KEY));
      if (shouldReplaceStoredBackend(storedBackend)) {
        return "";
      }
      return storedBackend;
    } catch (error) {
      return "";
    }
  }

  function getDefaultBackend() {
    const explicitDefault = normalizeBackendUrl(window.BORN3D_DEFAULT_BACKEND);
    if (explicitDefault) {
      return explicitDefault;
    }

    if (window.location && /\.onrender\.com$/i.test(window.location.hostname)) {
      return "https://born3d-backend.onrender.com";
    }

    if (window.location && window.location.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }

    return "";
  }

  function shouldReplaceStoredBackend(storedBackend) {
    const backend = normalizeBackendUrl(storedBackend);
    if (!backend) {
      return false;
    }

    const defaultBackend = getDefaultBackend();
    if (!defaultBackend) {
      return false;
    }

    try {
      const backendHost = new URL(backend).hostname;
      const defaultHost = new URL(defaultBackend).hostname;
      return backendHost === window.location.hostname && defaultHost !== backendHost;
    } catch (error) {
      return false;
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
    const backend = shouldReplaceStoredBackend(value) ? getDefaultBackend() : normalizeBackendUrl(value);
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

    setStatus(`Backend target set to ${backend}.`);
    appendLog(`Backend target saved: ${backend}.`);
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
      backendInput.value = readStoredBackend() || getDefaultBackend();
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

  function getBackendUrl() {
    const backendInput = $("born3dPlayBackendInput");
    const fromInput = normalizeBackendUrl(backendInput && backendInput.value);
    if (fromInput) {
      return fromInput;
    }

    const storedBackend = readStoredBackend();
    if (storedBackend) {
      return storedBackend;
    }

    return getDefaultBackend();
  }

  function readGateAuthValue(id, fallbackId) {
    const element = $(id) || (fallbackId ? document.getElementById(fallbackId) : null);
    return element && typeof element.value === "string" ? element.value.trim() : "";
  }

  function resolveAuthCredentials(credentials = null) {
    return {
      name: credentials && typeof credentials.name === "string"
        ? credentials.name.trim()
        : readGateAuthValue("born3dPlayUserNameInput", "userNameInput"),
      pin: credentials && typeof credentials.pin === "string"
        ? credentials.pin.trim()
        : readGateAuthValue("born3dPlayPinInput", "userPinInput"),
      avatarGender: credentials && typeof credentials.avatarGender === "string"
        ? credentials.avatarGender.trim().toLowerCase()
        : (readGateAuthValue("born3dPlayAvatarSelect") || "male"),
      shard: credentials && typeof credentials.shard === "string"
        ? credentials.shard.trim()
        : (readGateAuthValue("born3dPlayShardSelect") || "odd-ironic-shard"),
      deviceId: credentials && typeof credentials.deviceId === "string"
        ? credentials.deviceId.trim()
        : getOrCreateDeviceId()
    };
  }

  function getOrCreateDeviceId() {
    try {
      const key = "born3d_device_id";
      const existing = String(window.localStorage.getItem(key) || "").trim();
      if (existing) {
        return existing;
      }
      const generated = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `born3d-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(key, generated);
      return generated;
    } catch (error) {
      return `born3d-${Date.now()}`;
    }
  }

  async function postJson(url, payload, headers = {}) {
    const response = await window.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    return { response, data };
  }

  function installAuthBridge() {
    window.born3dSetBackendUrl = function (value) {
      const backend = normalizeBackendUrl(value) || getDefaultBackend();
      if (!backend) {
        return "";
      }

      try {
        window.localStorage.setItem(BACKEND_KEY, backend);
      } catch (error) {}

      const backendInput = $("born3dPlayBackendInput");
      if (backendInput && backendInput.value !== backend) {
        backendInput.value = backend;
      }

      const backendLabel = $("born3dPlayBackendLabel");
      if (backendLabel) {
        backendLabel.textContent = `Using backend: ${backend}`;
      }

      return backend;
    };

    window.userRegister = async function (credentials = null) {
      const creds = resolveAuthCredentials(credentials);
      const backend = window.born3dSetBackendUrl(getBackendUrl());
      if (!creds.name || !creds.pin) {
        setStatus("Enter both a username and a pin to register.");
        appendLog("Register blocked: missing username or pin.");
        return { success: false };
      }

      appendLog(`Registering ${creds.name}...`);
      setStatus(`Registering ${creds.name}...`);
      try {
        const { data } = await postJson(`${backend}/api/register`, {
          username: creds.name,
          pin: creds.pin,
          avatarGender: creds.avatarGender,
          shard: creds.shard,
          deviceId: creds.deviceId
        });
        if (data && data.success) {
          try {
            window.localStorage.setItem("born3d_account_username", creds.name);
          } catch (error) {}
          setStatus(`User "${creds.name}" registered. You can log in now.`);
          appendLog(`Registered ${creds.name}.`);
        } else {
          setStatus((data && data.error) || "Registration failed.");
          appendLog(`Registration failed for ${creds.name}.`);
        }
        return data || { success: false };
      } catch (error) {
        setStatus("Registration error.");
        appendLog(`Registration error: ${error && error.message ? error.message : "unknown error"}.`);
        return { success: false };
      }
    };

    window.userLogin = async function (credentials = null) {
      const creds = resolveAuthCredentials(credentials);
      const backend = window.born3dSetBackendUrl(getBackendUrl());
      if (!creds.name || !creds.pin) {
        setStatus("Enter both a username and a pin to log in.");
        appendLog("Login blocked: missing username or pin.");
        return { token: "" };
      }

      appendLog(`Logging in as ${creds.name}...`);
      setStatus(`Signing in as ${creds.name}...`);
      try {
        const { data } = await postJson(`${backend}/api/login`, {
          username: creds.name,
          pin: creds.pin,
          avatarGender: creds.avatarGender,
          shard: creds.shard,
          deviceId: creds.deviceId
        });
        if (data && data.token) {
          window._born3d_token = data.token;
          try {
            window.localStorage.setItem("born3d_account_username", creds.name);
          } catch (error) {}
          setStatus(`Logged in as ${creds.name}.`);
          appendLog(`Logged in as ${creds.name}.`);
          if (typeof window.setMode === "function") {
            try {
              window.setMode("game");
            } catch (error) {}
          }
        } else {
          setStatus((data && data.error) || "Login failed.");
          appendLog(`Login failed for ${creds.name}.`);
        }
        return data || { token: "" };
      } catch (error) {
        setStatus("Login error.");
        appendLog(`Login error: ${error && error.message ? error.message : "unknown error"}.`);
        return { token: "" };
      }
    };

    window.userLogout = async function () {
      const backend = getBackendUrl();
      try {
        if (backend && window._born3d_token) {
          await window.fetch(`${backend}/api/logout`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${window._born3d_token}`
            }
          });
        }
      } catch (error) {}

      window._born3d_token = null;
      setStatus("Logged out.");
      appendLog("Logged out.");
      return { success: true };
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
    const compactButtons = [$("born3dPlayCompactBtn"), $("born3dPlayTaskCompactBtn")].filter(Boolean);
    const consoleButtons = [$("born3dPlayTaskConsoleBtn")].filter(Boolean);
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

    compactButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const gate = $(gateId);
        const nextCompact = !(gate && gate.dataset.compact === "true");
        setGateCompact(nextCompact);
      });
    });

    consoleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const log = $(logId);
        const nextVisible = !(log && log.hidden);
        toggleConsoleVisibility(nextVisible);
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

  function boot() {
    ensureHiddenExplorer();
    installAuthBridge();
    setGateCompact(false);
    toggleConsoleVisibility(true);
    fillGateDefaults();
    wireControls();

    const queryBackend = normalizeBackendUrl(new URL(window.location.href).searchParams.get("backend"));
    if (queryBackend) {
      syncBackendTarget(queryBackend);
    } else if (readStoredBackend()) {
      syncBackendTarget(readStoredBackend());
    } else {
      const backendInput = $("born3dPlayBackendInput");
      if (backendInput) {
        backendInput.value = getDefaultBackend();
      }
      const backendLabel = $("born3dPlayBackendLabel");
      if (backendLabel) {
        backendLabel.textContent = getDefaultBackend()
          ? `Using default backend: ${getDefaultBackend()}`
          : "Set the backend URL for login.";
      }
    }

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