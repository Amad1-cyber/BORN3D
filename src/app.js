          // --- Name tag above avatar ---
          function updateNameTag() {
            if (!gameAvatar || !playerName) return;
            let tag = document.getElementById('playerNameTag');
            if (!tag) {
              tag = document.createElement('div');
              tag.id = 'playerNameTag';
              tag.style.position = 'absolute';
              tag.style.pointerEvents = 'none';
              tag.style.background = 'rgba(0,0,0,0.7)';
              tag.style.color = '#fff';
              tag.style.padding = '2px 8px';
              tag.style.borderRadius = '6px';
              tag.style.fontSize = '1em';
              tag.style.zIndex = 100;
              document.body.appendChild(tag);
            }
            // Project 3D position to 2D screen
            const pos = gameAvatar.position.clone();
            pos.y += 2.2;
            const vector = pos.project(camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
            tag.style.left = `${x}px`;
            tag.style.top = `${y}px`;
            tag.textContent = playerName;
          }

          // Call updateNameTag in render/game loop
          if (!window._origRenderLoop) window._origRenderLoop = window.renderLoop;
          window.renderLoop = function() {
            if (typeof window._origRenderLoop === 'function') window._origRenderLoop();
            updateNameTag();
          };

          // --- Multiplayer: make name tag visible to other players ---
          // (Stub: multiplayer sync logic would go here)
          // For now, just show local name tag
        // Live level checker UI
        function updateLevelChecker() {
          let panel = document.getElementById('levelCheckerPanel');
          if (!panel) {
            panel = document.createElement('div');
            panel.id = 'levelCheckerPanel';
            panel.style.position = 'absolute';
            panel.style.bottom = '24px';
            panel.style.right = '32px';
            panel.style.zIndex = '40';
            panel.style.background = 'rgba(18,28,38,0.92)';
            panel.style.borderRadius = '10px';
            panel.style.padding = '0.5em 1em';
            panel.style.boxShadow = '0 2px 8px #0006';
            panel.style.fontSize = '1em';
            panel.style.color = '#fff';
            document.body.appendChild(panel);
          }
          // Gather live stats
          let stats = [];
          if (mode === 'game') {
            stats.push(`<b>Player:</b> ${playerName || 'N/A'}`);
            if (gameAvatar) {
              stats.push(`Pos: ${gameAvatar.position.x.toFixed(1)}, ${gameAvatar.position.y.toFixed(1)}, ${gameAvatar.position.z.toFixed(1)}`);
            }
            stats.push(`<b>Health:</b> ${playerStats.health}`);
            stats.push(`<b>Vigor:</b> ${playerStats.vigor}`);
            stats.push(`<b>Magicka:</b> ${playerStats.magicka}`);
            stats.push(`<b>Weather:</b> ${weather}`);
            stats.push(`<b>Camera:</b> ${cameraMode}`);
            stats.push(`<b>Movement:</b> ${movementMode}`);
            stats.push(`<b>Props:</b> ${scene ? scene.children.filter(o => o.userData && o.userData.prop).length : 0}`);
          } else {
            stats.push(`<b>Editor Mode</b>`);
            stats.push(`<b>Props:</b> ${scene ? scene.children.filter(o => o.userData && o.userData.prop).length : 0}`);
            stats.push(`<b>Weather:</b> ${weather}`);
            stats.push(`<b>Camera:</b> ${cameraMode}`);
          }
          panel.innerHTML = stats.join('<br>');
        }
      // Weather system state
      const WEATHER_TYPES = [
        'clear', 'rain', 'snow', 'hail', 'asteroids', 'thunder', 'lightning', 'day', 'night', 'fog'
      ];
      let weather = 'clear';
      let weatherParticles = [];

      function setWeather(type) {
        if (!WEATHER_TYPES.includes(type)) return;
        weather = type;
        setStatus('Weather: ' + type.charAt(0).toUpperCase() + type.slice(1));
        updateWeatherUI();
        resetWeatherParticles();
      }

      function updateWeatherUI() {
        let panel = document.getElementById('weatherPanel');
        if (!panel) {
          panel = document.createElement('div');
          panel.id = 'weatherPanel';
          panel.style.position = 'absolute';
          panel.style.top = '120px';
          panel.style.right = '32px';
          panel.style.zIndex = '32';
          panel.style.background = 'rgba(18,28,38,0.92)';
          panel.style.borderRadius = '10px';
          panel.style.padding = '0.5em 1em';
          panel.style.boxShadow = '0 2px 8px #0006';
          panel.style.display = 'flex';
          panel.style.gap = '0.5em';
          panel.innerHTML = WEATHER_TYPES.map(w => `<button id="weatherBtn_${w}">${w.charAt(0).toUpperCase() + w.slice(1)}</button>`).join('');
          document.body.appendChild(panel);
          WEATHER_TYPES.forEach(w => {
            document.getElementById('weatherBtn_' + w).onclick = () => setWeather(w);
          });
        }
        WEATHER_TYPES.forEach(w => {
          const btn = document.getElementById('weatherBtn_' + w);
          if (btn) btn.classList.toggle('active', weather === w);
        });
      }

      function resetWeatherParticles() {
        // Remove old particles
        weatherParticles.forEach(p => { if (p.parent && p.parent.remove) p.parent.remove(p); });
        weatherParticles = [];
        // Add new particles for current weather
        if (!scene) return;
        if (weather === 'rain' || weather === 'snow' || weather === 'hail' || weather === 'asteroids') {
          const count = weather === 'asteroids' ? 24 : 120;
          for (let i = 0; i < count; i++) {
            const geo = new THREE.SphereGeometry(weather === 'hail' ? 0.12 : weather === 'asteroids' ? 0.5 : 0.08, 6, 6);
            const mat = new THREE.MeshStandardMaterial({ color: weather === 'snow' ? 0xffffff : weather === 'hail' ? 0xcce6ff : weather === 'asteroids' ? 0x888888 : 0x3399ff });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
              (Math.random() - 0.5) * terrainConfig.width,
              8 + Math.random() * 12,
              (Math.random() - 0.5) * terrainConfig.length
            );
            scene.add(mesh);
            weatherParticles.push(mesh);
          }
        }
        // Fog
        if (weather === 'fog') {
          scene.fog = new THREE.Fog(0xcce6ff, 8, 32);
        } else {
          scene.fog = null;
        }
        // Day/Night
        if (weather === 'night') {
          scene.background = new THREE.Color(0x0a0a1a);
        } else if (weather === 'day') {
          scene.background = new THREE.Color(0xbfdfff);
        } else {
          scene.background = new THREE.Color(0x0e141b);
        }
      }
    // Camera perspective UI
    function addCameraModeUI() {
      if (document.getElementById("cameraModePanel")) return;
      const panel = document.createElement("div");
      panel.id = "cameraModePanel";
      panel.style.position = "absolute";
      panel.style.top = "24px";
      panel.style.right = "32px";
      panel.style.zIndex = 30;
      panel.style.background = "rgba(18,28,38,0.92)";
      panel.style.borderRadius = "10px";
      panel.style.padding = "0.5em 1em";
      panel.style.boxShadow = "0 2px 8px #0006";
      panel.style.display = "flex";
      panel.style.gap = "0.5em";
      panel.innerHTML = `
        <button id="camThirdBtn">3rd</button>
        <button id="camFirstBtn">1st</button>
        <button id="camTopBtn">Top</button>
        <button id="camTerrainBtn">Terrain</button>
      `;
      document.body.appendChild(panel);
      document.getElementById("camThirdBtn").onclick = () => setCameraMode("third");
      document.getElementById("camFirstBtn").onclick = () => setCameraMode("first");
      document.getElementById("camTopBtn").onclick = () => setCameraMode("top");
      document.getElementById("camTerrainBtn").onclick = () => setCameraMode("terrain");
    }
  // Camera perspectives
  let cameraMode = "third"; // third, first, top, terrain

  function setCameraMode(mode) {
    cameraMode = mode;
    updateCameraPerspective();
    setStatus("Camera mode: " + mode.replace(/^(.)/, (m) => m.toUpperCase()) + " person/view.");
  }

  function updateCameraPerspective() {
    if (!camera || !gameAvatar) return;
    const avatarPos = gameAvatar.position.clone();
    if (cameraMode === "third") {
      // Third person: behind and above avatar
      camera.position.copy(avatarPos).add(new THREE.Vector3(0, 4, 7));
      camera.lookAt(avatarPos.x, avatarPos.y + 1.2, avatarPos.z);
    } else if (cameraMode === "first") {
      // First person: at avatar head
      camera.position.copy(avatarPos).add(new THREE.Vector3(0, 1.6, 0));
      camera.lookAt(avatarPos.x, avatarPos.y + 1.6, avatarPos.z + 1);
    } else if (cameraMode === "top") {
      // Top down: above avatar
      camera.position.copy(avatarPos).add(new THREE.Vector3(0, 18, 0));
      camera.lookAt(avatarPos.x, avatarPos.y, avatarPos.z);
    } else if (cameraMode === "terrain") {
      // Terrain view: far above, looking at terrain center
      camera.position.set(0, 32, 0);
      camera.lookAt(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }
// Point-and-click travel for player avatar in game mode
function handleGameModeClick(event) {
  if (mode !== "game" || !gameAvatar) return;
  // Only respond to left click
  if (event.button !== 0) return;
  const point = getTerrainIntersection(event);
  // ...existing code...
}


function clearAreaSelectOverlay() {
  if (areaOverlayDiv && areaOverlayDiv.parentNode) {
    areaOverlayDiv.parentNode.removeChild(areaOverlayDiv);
  }
  areaOverlayDiv = null;
}
// src/app.js
// Born 3D - Pure 3D Editor & Game
  const LEVEL_PREFIX = "born3d_level_";
  const USER_PREFIX = "born3d_user_";
  const LAST_TEXTURE_KEY = "born3d_last_texture";
  const BUILTIN_TEXTURES = [
    "Textures/Desertous.png",
    "Textures/Desertous2.png",
    "Textures/Foresty.png",
    "Textures/Foresty2.png"
  ];
  const TERRAIN_SEGMENTS = 48;
  const TERRAIN_BRUSH_STRENGTH = 0.45;
  const TERRAIN_MAX_HEIGHT = 4;
  const TERRAIN_PAINT_CANVAS_SIZE = 1024;
  const TERRAIN_PAINT_TYPES = [
    { id: "road", label: "Road" },
    { id: "street", label: "Street" },
    { id: "golden-road", label: "Golden Road" },
    { id: "brick-road", label: "Brick Road" },
    { id: "concrete-road", label: "Concrete Road" },
    { id: "stone-road", label: "Stone Road" },
    { id: "castle-road", label: "Castle Road" },
    { id: "neighborhood-road", label: "Neighborhood Road" },
    { id: "gravel-road", label: "Gravel Road" },
    { id: "grassy-road", label: "Grassy Road" },
    { id: "mud-road", label: "Mud Road" },
    { id: "desert-road", label: "Desert Road" }
  ];

  const MASS_PROPS = window.MASS_PROPS || [];
  const OUTDOOR_PROPS = window.OUTDOOR_PROPS || [];
  const ALL_PROPS = window.ALL_PROPS || [...MASS_PROPS, ...OUTDOOR_PROPS];
  const PROP_TEXTURE_SETS = window.PROP_TEXTURE_SETS || [];
  const MALE_AVATARS = window.MALE_AVATARS || [];
  const PROP_SCALE_PRESETS = {
    small: 0.75,
    medium: 1,
    large: 1.5,
    huge: 2.25
  };

  let mode = "editor";
  let scene = null;
  let camera = null;
  let renderer = null;
  let terrain = null;
  let terrainOverlay = null;
  let terrainPaintCanvas = null;
  let terrainPaintContext = null;
  let terrainPaintTexture = null;
  let raycaster = null;
  let moveAudio = null;
  let pendingPlacement = null;
  let cameraOrbit = null;
  let currentUser = null;
  let currentLevelName = "";
  let currentPropType = "all";
  let currentProp = ALL_PROPS[0] || MASS_PROPS[0] || OUTDOOR_PROPS[0] || null;
  let currentPropScalePreset = "medium";
  let currentPropCustomScale = 1;
  let currentPropTextureSet = "auto";
  let currentNaturePlacementMode = "cluster";
  let currentAvatar = MALE_AVATARS[0] || null;
  let isIndoor = true;
  let gameAvatar = null;
  let gameAvatarMixer = null;
  let gameAvatarActions = {};
  let gameAvatarCurrentAction = null;
  let gameAvatarTarget = null;
  let gameLoadToken = 0;
  let startLocation = { x: 0, y: 0, z: 0 };
  // Animation .fbx files
  const FBX_ANIMATIONS = {
    idle: 'styles/Avatars/Male Idle.fbx',
    walk: 'styles/Avatars/Male Walk.fbx',
    punch: 'styles/Avatars/Male Punch.fbx'
  };
    // --- Load .fbx animations for avatar ---
    function loadAvatarAnimations(avatar, mixer) {
      if (!avatar || !mixer) return;
      const loader = new THREE.FBXLoader();
      Object.entries(FBX_ANIMATIONS).forEach(([key, url]) => {
        loader.load(url, function (anim) {
          const action = mixer.clipAction(anim.animations[0]);
          gameAvatarActions[key] = action;
          if (key === 'idle' && !gameAvatarCurrentAction) {
            gameAvatarCurrentAction = action;
            action.play();
          }
        });
      });
    }

    // --- Apply PBR textures to male avatar ---
    function applyMaleAvatarTextures(avatar) {
      if (!avatar) return;
      const loader = new THREE.TextureLoader();
      // Body textures
      const bodyMaps = {
        map: loader.load('styles/Avatars/body_BaseColor.png'),
        metalnessMap: loader.load('styles/Avatars/body_Metallic.png'),
        aoMap: loader.load('styles/Avatars/body_Mixed_AO.png'),
        normalMap: loader.load('styles/Avatars/body_Normal_DirectX.png'),
        alphaMap: loader.load('styles/Avatars/body_Opacity.png'),
        roughnessMap: loader.load('styles/Avatars/body_Roughness.png'),
      };
      // Cloths textures
      const clothsMaps = {
        map: loader.load('styles/Avatars/Cloths_Base_Color.png'),
        metalnessMap: loader.load('styles/Avatars/Cloths_Metallic.png'),
        aoMap: loader.load('styles/Avatars/Cloths_Mixed_AO.png'),
        normalMap: loader.load('styles/Avatars/Cloths_Normal_DirectX.png'),
        roughnessMap: loader.load('styles/Avatars/Cloths_Roughness.png'),
      };
      avatar.traverse(child => {
        if (child.isMesh && child.material) {
          // Heuristic: body meshes contain 'body', cloths contain 'cloth' in name
          if (child.name.toLowerCase().includes('body')) {
            Object.assign(child.material, bodyMaps);
            child.material.transparent = true;
            child.material.needsUpdate = true;
          } else if (child.name.toLowerCase().includes('cloth')) {
            Object.assign(child.material, clothsMaps);
            child.material.transparent = true;
            child.material.needsUpdate = true;
          }
        }
      });
    }

    // Call this after avatar is loaded
    function onAvatarLoaded(avatar) {
      gameAvatar = avatar;
      gameAvatarMixer = new THREE.AnimationMixer(avatar);
      loadAvatarAnimations(avatar, gameAvatarMixer);
      applyMaleAvatarTextures(avatar);
    }

    // Example: switch animation
    function playAvatarAnimation(name) {
      if (!gameAvatarActions[name]) return;
      if (gameAvatarCurrentAction) gameAvatarCurrentAction.stop();
      gameAvatarCurrentAction = gameAvatarActions[name];
      gameAvatarCurrentAction.play();
    }
    // --- Name tag above avatar ---
    function updateNameTag() {
      if (!gameAvatar || !playerName) return;
      let tag = document.getElementById('playerNameTag');
      if (!tag) {
        tag = document.createElement('div');
        tag.id = 'playerNameTag';
        tag.style.position = 'absolute';
        tag.style.pointerEvents = 'none';
        tag.style.background = 'rgba(0,0,0,0.7)';
        tag.style.color = '#fff';
        tag.style.padding = '2px 8px';
        tag.style.borderRadius = '6px';
        tag.style.fontSize = '1em';
        tag.style.zIndex = 100;
        document.body.appendChild(tag);
      }
      // Project 3D position to 2D screen
      const pos = gameAvatar.position.clone();
      pos.y += 2.2;
      const vector = pos.project(camera);
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      tag.style.left = `${x}px`;
      tag.style.top = `${y}px`;
      tag.textContent = playerName;
    }

    // Call updateNameTag in render/game loop
    const origRenderLoop = window.renderLoop;
    window.renderLoop = function() {
      if (typeof origRenderLoop === 'function') origRenderLoop();
      updateNameTag();
    };

    // --- Multiplayer: make name tag visible to other players ---
    // (Stub: multiplayer sync logic would go here)
    // For now, just show local name tag
    // --- PLAYER START HERE marker in editor ---
    function showPlayerStartMarker() {
      let marker = document.getElementById('playerStartMarker');
      if (!marker) {
        marker = document.createElement('div');
        marker.id = 'playerStartMarker';
        marker.style.position = 'absolute';
        marker.style.left = '50%';
        marker.style.top = '50%';
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.background = '#0af';
        marker.style.color = '#fff';
        marker.style.padding = '4px 12px';
        marker.style.borderRadius = '8px';
        marker.style.zIndex = 99;
        marker.textContent = 'PLAYER START HERE';
        document.body.appendChild(marker);
      }
      marker.style.display = (mode === 'editor') ? 'block' : 'none';
    }

    // Call showPlayerStartMarker on mode switch
    const origSetMode = window.setMode;
    window.setMode = function(newMode) {
      if (typeof origSetMode === 'function') origSetMode(newMode);
      showPlayerStartMarker();
    };
    // --- Persistent player start location ---
    function savePlayerStartLocation() {
      if (startLocation) {
        localStorage.setItem('born3d_player_start', JSON.stringify(startLocation));
      }
    }
    function loadPlayerStartLocation() {
      const val = localStorage.getItem('born3d_player_start');
      if (val) {
        try {
          startLocation = JSON.parse(val);
        } catch (e) {}
      }
    }
    // Call loadPlayerStartLocation on app start
    loadPlayerStartLocation();

    // When player logs in, set avatar to startLocation
    const origUserLogin = window.userLogin;
    window.userLogin = function() {
      if (typeof origUserLogin === 'function') origUserLogin();
      if (gameAvatar && startLocation) {
        gameAvatar.position.set(startLocation.x, startLocation.y, startLocation.z);
      }
    };

    // When setting start location in editor, save it
    const origEnableStartLocationPlacement = window.enableStartLocationPlacement;
    window.enableStartLocationPlacement = function() {
      if (typeof origEnableStartLocationPlacement === 'function') origEnableStartLocationPlacement();
      // After picking, save
      savePlayerStartLocation();
    };
  // Inventory/Backpack
  let playerInventory = [
    { id: 'aloe-drink', name: 'Aloe Drink', type: 'consumable', description: 'Heals all vitals', icon: '🥤', use: function() {
      playerState.health = playerState.maxHealth;
      playerState.vigor = playerState.maxVigor;
      playerState.magicka = playerState.maxMagicka;
      setStatus('Aloe Drink used! All vitals restored.', 'success');
      // Remove after use
      playerInventory = playerInventory.filter(item => item.id !== 'aloe-drink');
      updateInventoryUI();
      updateLevelChecker();
    }}
  ];

  // Pin code for editor lock
  const EDITOR_PIN_CODE = '03291990';
  let editorLocked = true;
  let editorPinAttempts = 0;
  let textureSources = [];
  let terrainPaintStrokes = [];
  let currentTerrainTexture =
    localStorage.getItem(LAST_TEXTURE_KEY) || BUILTIN_TEXTURES[0];
  let currentTerrainPaintType = "road";

  // Player GUI and RPG state
  let playerGui = null;
  let playerState = {
    health: 100,
    vigor: 100,
    magicka: 100,
    maxHealth: 100,
    maxVigor: 100,
    maxMagicka: 100,
    attributes: {
      strength: 10,
      agility: 10,
      intelligence: 10,
      endurance: 10,
      luck: 10
    },
    skills: {
      sword: 1,
      punch: 1,
      magic: 1,
      archery: 1,
      defense: 1,
      stealth: 1
    },
    exp: 0,
    level: 1
  };

  let terrainConfig = {
    width: 20,
    length: 20,
    rotationY: 0,
    heightData: []
  };

  let placedProps = [];
  let placedAvatars = [];

  const elements = {};

  function basename(path) {
    return path.split("/").pop();
  }

  function setStatus(message, tone) {
    if (!elements.statusText) {
      return;
    }

    elements.statusText.textContent = message;
    elements.statusText.dataset.tone = tone || "info";
  }

  function createPanel(title) {
    const panel = document.createElement("section");
    panel.className = "panel";

    if (title) {
      const heading = document.createElement("h2");
      heading.textContent = title;
      panel.appendChild(heading);
    }

    return panel;
  }

  function getTerrainPaintTypeLabel(type) {
    const entry = TERRAIN_PAINT_TYPES.find((item) => item.id === type);
    return entry ? entry.label : "Road";
  }

  function normalizeTerrainPaintType(type) {
    return TERRAIN_PAINT_TYPES.some((item) => item.id === type) ? type : "road";
  }

  function getTerrainPaintTypeOptionsMarkup() {
    return TERRAIN_PAINT_TYPES.map((item) => {
      return `<option value="${item.id}">${item.label}</option>`;
    }).join("");
  }

  function cacheStaticElements() {
    elements.explorer = document.getElementById("explorer");
    elements.viewport = document.getElementById("viewport");
    elements.textureInput = document.getElementById("textureInput");
    elements.textureList = document.getElementById("textureList");
    elements.editorModeBtn = document.getElementById("editorModeBtn");
    elements.gameModeBtn = document.getElementById("gameModeBtn");
  }

  function buildExplorerLayout() {
    const textureInput = elements.textureInput;
    const textureList = elements.textureList;

    elements.explorer.innerHTML = "";

    // Editor lock panel
    if (editorLocked) {
      const lockPanel = createPanel("Editor Locked");
      lockPanel.innerHTML += `
        <div class="stack">
          <input id="editorPinInput" placeholder="Enter Pin Code" type="password">
        </div>
        <button id="unlockEditorBtn">Unlock Editor</button>
        <div id="editorLockStatus" class="muted"></div>
      `;
      elements.explorer.appendChild(lockPanel);
      document.getElementById('unlockEditorBtn').onclick = function() {
        const pin = document.getElementById('editorPinInput').value;
        if (pin === EDITOR_PIN_CODE) {
          editorLocked = false;
          buildExplorerLayout();
        } else {
          editorPinAttempts++;
          document.getElementById('editorLockStatus').textContent = 'Incorrect pin.';
        }
      };
      return;
    }

    const statusPanel = createPanel("Status");
    const statusText = document.createElement("div");
    statusText.id = "appStatus";
    statusText.className = "status-text";
    statusPanel.appendChild(statusText);
    elements.statusText = statusText;
    elements.explorer.appendChild(statusPanel);

    const texturePanel = createPanel("Texture Explorer");
    texturePanel.appendChild(textureInput);
    texturePanel.appendChild(textureList);
    elements.explorer.appendChild(texturePanel);

    try {
      elements.explorer.appendChild(createUserPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'User panel failed to load.';
    }
    try {
      elements.explorer.appendChild(createLevelPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'Level panel failed to load.';
    }
    try {
      elements.explorer.appendChild(createTerrainPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'Terrain panel failed to load.';
    }
    try {
      elements.explorer.appendChild(createPropPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'Props panel failed to load.';
    }
    try {
      elements.explorer.appendChild(createAvatarPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'Avatars panel failed to load.';
    }
    try {
      elements.explorer.appendChild(createEnvironmentPanel());
    } catch (e) {
      elements.explorer.appendChild(document.createElement('div')).textContent = 'Environment panel failed to load.';
    }

    // Inventory/Backpack panel
    elements.explorer.appendChild(createInventoryPanel());

    // Game screen port/IP loader for editor
    elements.explorer.appendChild(createGameScreenLoaderPanel());
    // Player GUI is only added to viewport in game mode
  }
  // Inventory/Backpack UI
  function createInventoryPanel() {
    const panel = createPanel('Backpack');
    panel.id = 'inventoryPanel';
    panel.innerHTML += `<div id="inventoryList"></div>`;
    updateInventoryUI(panel);
    return panel;
  }

  function updateInventoryUI(panel) {
    if (!panel) panel = document.getElementById('inventoryPanel');
    if (!panel) return;
    const list = panel.querySelector('#inventoryList') || document.createElement('div');
    list.id = 'inventoryList';
    if (playerInventory.length === 0) {
      list.innerHTML = '<span class="muted">Backpack is empty.</span>';
    } else {
      list.innerHTML = playerInventory.map(item =>
        `<div class="inventory-item">
          <span>${item.icon || ''} <b>${item.name}</b> <small>${item.description || ''}</small>
          <button onclick="window.useInventoryItem && window.useInventoryItem('${item.id}')">Use</button>
        </div>`
      ).join('');
    }
    panel.appendChild(list);
    window.useInventoryItem = function(id) {
      const item = playerInventory.find(i => i.id === id);
      if (item && typeof item.use === 'function') item.use();
    };
  }

  // Game screen port/IP loader for editor
  function createGameScreenLoaderPanel() {
    const panel = createPanel('Game Screen Loader');
    panel.innerHTML += `
      <div class="stack">
        <input id="gameScreenIpInput" placeholder="Game IP/Port (e.g. 127.0.0.1:8080)">
        <button id="loadGameScreenBtn">Load Game Screen</button>
      </div>
      <div id="gameScreenStatus" class="muted"></div>
    `;
    setTimeout(() => {
      const btn = document.getElementById('loadGameScreenBtn');
      if (btn) btn.onclick = function() {
        const ip = document.getElementById('gameScreenIpInput').value;
        if (ip) {
          window.open('http://' + ip, '_blank');
          document.getElementById('gameScreenStatus').textContent = 'Game screen opened: ' + ip;
        } else {
          document.getElementById('gameScreenStatus').textContent = 'Please enter a valid IP/Port.';
        }
      };
    }, 0);
    return panel;
  }
  // --- Name tag above avatar ---
  function updateNameTag() {
    if (!gameAvatar || !playerName) return;
    let tag = document.getElementById('playerNameTag');
    if (!tag) {
      tag = document.createElement('div');
      tag.id = 'playerNameTag';
      tag.style.position = 'absolute';
      tag.style.pointerEvents = 'none';
      tag.style.background = 'rgba(0,0,0,0.7)';
      tag.style.color = '#fff';
      tag.style.padding = '2px 8px';
      tag.style.borderRadius = '6px';
      tag.style.fontSize = '1em';
      tag.style.zIndex = 100;
      document.body.appendChild(tag);
    }
    // Project 3D position to 2D screen
    const pos = gameAvatar.position.clone();
    pos.y += 2.2;
    const vector = pos.project(camera);
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
    tag.style.left = `${x}px`;
    tag.style.top = `${y}px`;
    tag.textContent = playerName;
  }

  // Call updateNameTag in render/game loop
  if (!window._origRenderLoop) window._origRenderLoop = window.renderLoop;
  window.renderLoop = function() {
    if (typeof window._origRenderLoop === 'function') window._origRenderLoop();
    updateNameTag();
  };

  // --- Multiplayer: make name tag visible to other players ---
  // (Stub: multiplayer sync logic would go here)
  // For now, just show local name tag

  // --- PLAYER START HERE marker in editor ---
  function showPlayerStartMarker() {
    let marker = document.getElementById('playerStartMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'playerStartMarker';
      marker.style.position = 'absolute';
      marker.style.left = '50%';
      marker.style.top = '50%';
      marker.style.transform = 'translate(-50%, -50%)';
      marker.style.background = '#0af';
      marker.style.color = '#fff';
      marker.style.padding = '4px 12px';
      marker.style.borderRadius = '8px';
      marker.style.zIndex = 99;
      marker.textContent = 'PLAYER START HERE';
      document.body.appendChild(marker);
    }
    marker.style.display = (mode === 'editor') ? 'block' : 'none';
  }

  // Call showPlayerStartMarker on mode switch
  if (!window._origSetMode) window._origSetMode = window.setMode;
  window.setMode = function(newMode) {
    if (typeof window._origSetMode === 'function') window._origSetMode(newMode);
    showPlayerStartMarker();
  };

  // --- Persistent player start location ---
  function savePlayerStartLocation() {
    if (startLocation && typeof startLocation.x === 'number' && typeof startLocation.y === 'number' && typeof startLocation.z === 'number') {
      localStorage.setItem('born3d_player_start', JSON.stringify(startLocation));
    }
  }
  function loadPlayerStartLocation() {
    const val = localStorage.getItem('born3d_player_start');
    if (val) {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
          startLocation = parsed;
        }
      } catch (e) {}
    }
  }
  // Call loadPlayerStartLocation on app start
  loadPlayerStartLocation();

  // When player logs in, set avatar to startLocation
  if (!window._origUserLogin) window._origUserLogin = window.userLogin;
  window.userLogin = function() {
    if (typeof window._origUserLogin === 'function') window._origUserLogin();
    if (gameAvatar && startLocation && typeof startLocation.x === 'number') {
      gameAvatar.position.set(startLocation.x, startLocation.y, startLocation.z);
    }
  };

  // When setting start location in editor, save it
  if (!window._origEnableStartLocationPlacement) window._origEnableStartLocationPlacement = window.enableStartLocationPlacement;
  window.enableStartLocationPlacement = function() {
    if (typeof window._origEnableStartLocationPlacement === 'function') window._origEnableStartLocationPlacement();
    // After picking, save
    savePlayerStartLocation();
  };

  function createUserPanel() {
    const panel = createPanel("Account");
    panel.innerHTML += `
      <div class="login-feature-menu">
        <div class="stack">
          <input id="userNameInput" placeholder="Username">
          <input id="userPinInput" placeholder="Pin Code" type="password">
        </div>
        <div class="button-row">
          <button id="loginBtn">🔓 Login</button>
          <button id="registerBtn" class="secondary">📝 Register</button>
          <button id="logoutBtn" class="danger">🚪 Logout</button>
        </div>
        <div id="userStatus" class="muted"></div>
      </div>
    `;

    elements.userNameInput = panel.querySelector("#userNameInput");
    elements.userPinInput = panel.querySelector("#userPinInput");
    elements.userStatus = panel.querySelector("#userStatus");

    panel.querySelector("#loginBtn").addEventListener("click", userLogin);
    panel.querySelector("#registerBtn").addEventListener("click", userRegister);
    panel.querySelector("#logoutBtn").addEventListener("click", userLogout);

    return panel;
  }
  // --- PLAYER START HERE marker in editor ---
  function showPlayerStartMarker() {
    let marker = document.getElementById('playerStartMarker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'playerStartMarker';
      marker.style.position = 'absolute';
      marker.style.left = '50%';
      marker.style.top = '50%';
      marker.style.transform = 'translate(-50%, -50%)';
      marker.style.background = '#0af';
      marker.style.color = '#fff';
      marker.style.padding = '4px 12px';
      marker.style.borderRadius = '8px';
      marker.style.zIndex = 99;
      marker.textContent = 'PLAYER START HERE';
      document.body.appendChild(marker);
    }
    marker.style.display = (mode === 'editor') ? 'block' : 'none';
  }

  // Call showPlayerStartMarker on mode switch
  if (!window._origSetMode) window._origSetMode = window.setMode;
  window.setMode = function(newMode) {
    if (typeof window._origSetMode === 'function') window._origSetMode(newMode);
    showPlayerStartMarker();
  };

  function createLevelPanel() {
    const panel = createPanel("Level Management");
    panel.innerHTML += `
      <div class="stack">
        <input id="levelNameInput" placeholder="Level Name">
        <input id="levelPinInput" placeholder="Level Pin" type="password">
      </div>
      <div class="button-row">
        <button id="saveLevelBtn">Save</button>
        <button id="overwriteLevelBtn" class="secondary">Overwrite</button>
      </div>
      <div class="button-row">
        <button id="loadLevelBtn">Load</button>
        <button id="listLevelsBtn" class="secondary">Refresh List</button>
      </div>
      <button id="newLevelBtn" class="secondary">Create New Level</button>
      <div id="levelList" class="list-grid"></div>
      <div class="subsection">
        <h3>Start Location</h3>
        <button id="setStartLocationBtn">Pick on Terrain</button>
        <div id="startLocationDisplay" class="muted"></div>
      </div>
    `;

    elements.levelNameInput = panel.querySelector("#levelNameInput");
    elements.levelPinInput = panel.querySelector("#levelPinInput");
    elements.levelList = panel.querySelector("#levelList");
    elements.startLocationDisplay = panel.querySelector("#startLocationDisplay");

    panel
      .querySelector("#saveLevelBtn")
      .addEventListener("click", saveLevel);
    panel
      .querySelector("#overwriteLevelBtn")
      .addEventListener("click", overwriteLevel);
    panel
      .querySelector("#loadLevelBtn")
      .addEventListener("click", loadLevel);
    panel
      .querySelector("#listLevelsBtn")
      .addEventListener("click", renderLevelList);
    panel
      .querySelector("#newLevelBtn")
      .addEventListener("click", createNewLevel);
    panel
      .querySelector("#setStartLocationBtn")
      .addEventListener("click", enableStartLocationPlacement);

    return panel;
  }

  function createTerrainPanel() {
    const panel = createPanel("Terrain");
    panel.innerHTML += `
      <div class="two-col">
        <label>
          <span class="muted">Width</span>
          <input id="terrainWidthInput" type="number" min="4" step="1" value="20">
        </label>
        <label>
          <span class="muted">Length</span>
          <input id="terrainLengthInput" type="number" min="4" step="1" value="20">
        </label>
      </div>
      <div class="button-row">
        <button id="applyTerrainSizeBtn">Apply Size</button>
        <button id="resetViewBtn" class="secondary">Reset View</button>
      </div>
      <div class="button-row">
        <button id="rotateTerrainLeftBtn" class="secondary">Rotate Left</button>
        <button id="rotateTerrainRightBtn" class="secondary">Rotate Right</button>
      </div>
      <div class="button-row">
        <button id="raiseTerrainBtn" class="secondary">Raise Terrain</button>
        <button id="lowerTerrainBtn" class="secondary">Lower Terrain</button>
      </div>
      <label>
        <span class="muted">Paint Type</span>
        <select id="terrainPaintTypeSelect">
          ${getTerrainPaintTypeOptionsMarkup()}
        </select>
      </label>
      <button id="paintTerrainBtn" class="secondary">Paint Terrain</button>
      <button id="clearSceneBtn" class="danger">Clear Placed Items</button>
    `;

    elements.terrainWidthInput = panel.querySelector("#terrainWidthInput");
    elements.terrainLengthInput = panel.querySelector("#terrainLengthInput");
    elements.terrainPaintTypeSelect = panel.querySelector("#terrainPaintTypeSelect");
    elements.terrainPaintTypeSelect.value = currentTerrainPaintType;

    panel
      .querySelector("#applyTerrainSizeBtn")
      .addEventListener("click", updateTerrainSizeFromInputs);
    panel
      .querySelector("#resetViewBtn")
      .addEventListener("click", resetCameraView);
    panel
      .querySelector("#rotateTerrainLeftBtn")
      .addEventListener("click", () => rotateTerrain(-Math.PI / 8));
    panel
      .querySelector("#rotateTerrainRightBtn")
      .addEventListener("click", () => rotateTerrain(Math.PI / 8));
    panel
      .querySelector("#raiseTerrainBtn")
      .addEventListener("click", () => enableTerrainSculpt("raise-terrain"));
    panel
      .querySelector("#lowerTerrainBtn")
      .addEventListener("click", () => enableTerrainSculpt("lower-terrain"));
    panel
      .querySelector("#paintTerrainBtn")
      .addEventListener("click", toggleTerrainPaintMode);
    panel
      .querySelector("#clearSceneBtn")
      .addEventListener("click", clearPlacedItems);
    elements.terrainPaintTypeSelect.addEventListener("change", (event) => {
      currentTerrainPaintType = event.target.value;

      if (pendingPlacement && pendingPlacement.kind === "paint-terrain") {
        setStatus(
          `Paint mode active: ${getTerrainPaintTypeLabel(currentTerrainPaintType)}. Click the terrain to keep painting.`
        );
      }
    });

    return panel;
  }

  function createPropPanel() {
    const panel = createPanel("Props");
    panel.innerHTML += `
      <select id="propTypeSelect">
        <option value="all">All Props (${ALL_PROPS.length})</option>
        <option value="mass">Indoor (Mass)</option>
        <option value="outdoor">Outdoor (Nature)</option>
      </select>
      <div class="two-col prop-controls">
        <label>
          <span class="muted">Size</span>
          <select id="propScalePresetSelect">
            <option value="small">Small</option>
            <option value="medium" selected>Medium</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label>
          <span class="muted">Custom Size</span>
          <input id="propCustomScaleInput" type="number" min="0.1" step="0.1" value="1.0">
        </label>
      </div>
      <label>
        <span class="muted">Texture Set</span>
        <select id="propTextureSetSelect">
          <option value="auto">Auto For Selected Prop</option>
        </select>
      </label>
      <label>
        <span class="muted">Nature Layout</span>
        <select id="naturePlacementModeSelect">
          <option value="cluster">Clustered Areas</option>
          <option value="scatter">Scatter Wide</option>
        </select>
      </label>
      <div id="propHelpText" class="muted"></div>
      <div id="propList" class="list-grid"></div>
      <div class="button-row">
        <button id="placePropBtn">Place Prop</button>
        <button id="natureGenBtn" class="secondary">Auto-Place Nature</button>
      </div>
      <button id="removeOnePropBtn" class="danger">Remove 1 Prop</button>
    `;

    elements.propTypeSelect = panel.querySelector("#propTypeSelect");
    elements.propScalePresetSelect = panel.querySelector("#propScalePresetSelect");
    elements.propCustomScaleInput = panel.querySelector("#propCustomScaleInput");
    elements.propTextureSetSelect = panel.querySelector("#propTextureSetSelect");
    elements.naturePlacementModeSelect = panel.querySelector("#naturePlacementModeSelect");
    elements.propHelpText = panel.querySelector("#propHelpText");
    elements.propList = panel.querySelector("#propList");
    elements.propTypeSelect.value = currentPropType;
    elements.propScalePresetSelect.value = currentPropScalePreset;
    elements.propCustomScaleInput.value = String(currentPropCustomScale);
    elements.naturePlacementModeSelect.value = currentNaturePlacementMode;
    populatePropTextureOptions();
    syncPropScaleControls();

    elements.propTypeSelect.addEventListener("change", (event) => {
      currentPropType = event.target.value;
      const propSet = getCurrentPropSet();
      currentProp = propSet[0] || null;
      renderPropList();
    });
    elements.propScalePresetSelect.addEventListener("change", (event) => {
      currentPropScalePreset = event.target.value;
      syncPropScaleControls();
      renderPropList();
    });
    elements.propCustomScaleInput.addEventListener("input", (event) => {
      const value = Number.parseFloat(event.target.value);
      if (Number.isFinite(value) && value > 0) {
        currentPropCustomScale = value;
      }
      renderPropList();
    });
    elements.propTextureSetSelect.addEventListener("change", (event) => {
      currentPropTextureSet = event.target.value;
      renderPropList();
    });
    elements.naturePlacementModeSelect.addEventListener("change", (event) => {
      currentNaturePlacementMode = event.target.value;
      setStatus(
        currentNaturePlacementMode === "scatter"
          ? "Nature generation set to wide scatter."
          : "Nature generation set to clustered areas."
      );
    });

    panel
      .querySelector("#placePropBtn")
      .addEventListener("click", () => enablePropPlacement(currentProp));
    panel
      .querySelector("#natureGenBtn")
      .addEventListener("click", autoPlaceNatureProps);
    panel
      .querySelector("#removeOnePropBtn")
      .addEventListener("click", enableSinglePropRemoval);

    return panel;
  }

  function createAvatarPanel() {
    const panel = createPanel("Avatars");
    panel.innerHTML += `
      <div id="avatarList" class="list-grid"></div>
      <button id="placeAvatarBtn">Place Avatar</button>
    `;

    elements.avatarList = panel.querySelector("#avatarList");

    panel
      .querySelector("#placeAvatarBtn")
      .addEventListener("click", () => enableAvatarPlacement(currentAvatar));

    return panel;
  }

  function createEnvironmentPanel() {
    const panel = createPanel("Environment");
    panel.innerHTML += `
      <label class="checkbox-row">
        <input id="indoorToggle" type="checkbox" checked>
        <span>Indoor terrain tint</span>
      </label>
      <div class="muted">
        Editor mode keeps building tools active. Game mode spawns an avatar at the saved start point.
      </div>
    `;

    elements.indoorToggle = panel.querySelector("#indoorToggle");
    elements.indoorToggle.addEventListener("change", (event) => {
      isIndoor = event.target.checked;
      updateTerrainType();
    });

    return panel;
  }

  function bindStaticEvents() {
    elements.textureInput.addEventListener("change", handleTextureUpload);
    elements.editorModeBtn.addEventListener("click", () => setMode("editor"));
    elements.gameModeBtn.addEventListener("click", () => setMode("game"));
    // Point-and-click travel in game mode
    elements.viewport.addEventListener("click", handleGameModeClick);
  }

  function populatePropTextureOptions() {
    if (!elements.propTextureSetSelect) {
      return;
    }

    PROP_TEXTURE_SETS.forEach((textureSet) => {
      const option = document.createElement("option");
      option.value = textureSet.id;
      option.textContent = textureSet.label;
      elements.propTextureSetSelect.appendChild(option);
    });

    elements.propTextureSetSelect.value = currentPropTextureSet;
  }

  function syncPropScaleControls() {
    if (!elements.propScalePresetSelect || !elements.propCustomScaleInput) {
      return;
    }

    const isCustom = currentPropScalePreset === "custom";
    elements.propCustomScaleInput.disabled = !isCustom;
  }

  function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e141b);

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    resetCameraView();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    elements.viewport.innerHTML = "";
    elements.viewport.appendChild(renderer.domElement);
    renderer.domElement.addEventListener("contextmenu", handleViewportContextMenu);
    renderer.domElement.addEventListener("mousedown", handleViewportMouseDown);
    renderer.domElement.addEventListener("click", handleViewportClick);
    window.addEventListener("mousemove", handleViewportMouseMove);
    window.addEventListener("mouseup", handleViewportMouseUp);

    raycaster = new THREE.Raycaster();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(12, 18, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const helper = new THREE.GridHelper(24, 24, 0x5d748c, 0x24313f);
    helper.position.y = 0.01;
    scene.add(helper);

    terrainConfig.heightData = ensureTerrainHeightData(terrainConfig.heightData);
    terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(
        terrainConfig.width,
        terrainConfig.length,
        TERRAIN_SEGMENTS,
        TERRAIN_SEGMENTS
      ),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
      })
    );
    terrain.receiveShadow = true;
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);
    ensureTerrainPaintOverlay();

    refreshTerrain();
    resizeRenderer();
    window.addEventListener("resize", resizeRenderer);
    updateViewportCursor();
    animate();
  }

  function resetCameraView() {
    if (!camera) {
      return;
    }

    cameraOrbit = {
      radius: 25,
      theta: Math.PI / 4,
      phi: 0.95,
      target: new THREE.Vector3(0, 0.75, 0),
      isRotating: false,
      lastX: 0,
      lastY: 0
    };
    applyCameraOrbit();
  }

  function applyCameraOrbit() {
    if (!camera || !cameraOrbit) {
      return;
    }

    const sinPhi = Math.sin(cameraOrbit.phi);
    const cosPhi = Math.cos(cameraOrbit.phi);
    camera.position.set(
      cameraOrbit.target.x + cameraOrbit.radius * sinPhi * Math.cos(cameraOrbit.theta),
      cameraOrbit.target.y + cameraOrbit.radius * cosPhi,
      cameraOrbit.target.z + cameraOrbit.radius * sinPhi * Math.sin(cameraOrbit.theta)
    );
    camera.lookAt(cameraOrbit.target);
  }

  function updateViewportCursor() {
    if (!renderer) {
      return;
    }

    if (cameraOrbit && cameraOrbit.isRotating) {
      renderer.domElement.style.cursor = "grabbing";
      return;
    }

    renderer.domElement.style.cursor = pendingPlacement ? "crosshair" : "grab";
  }

  function handleViewportContextMenu(event) {
    event.preventDefault();
  }

  function handleViewportMouseDown(event) {
    // Area select for start location
    if (pendingPlacement && pendingPlacement.kind === "start-area" && event.button === 2) {
      event.preventDefault();
      const start = getTerrainIntersection(event);
      if (!start) return;
      window.areaSelect = { start, end: null, selecting: true, startScreen: {x: event.clientX, y: event.clientY} };
      if (typeof drawAreaSelectOverlay === 'function') drawAreaSelectOverlay(start, start);
      return;
    }
    // Camera orbit
    if (event.button !== 2 || !cameraOrbit) {
      return;
    }
    event.preventDefault();
    cameraOrbit.isRotating = true;
    cameraOrbit.lastX = event.clientX;
    cameraOrbit.lastY = event.clientY;
    updateViewportCursor();
  }

  function handleViewportMouseMove(event) {
    // Area select for start location
    if (pendingPlacement && pendingPlacement.kind === "start-area" && window.areaSelect && window.areaSelect.selecting) {
      const end = getTerrainIntersection(event);
      if (!end) return;
      window.areaSelect.end = end;
      if (typeof drawAreaSelectOverlay === 'function') drawAreaSelectOverlay(window.areaSelect.start, end);
      return;
    }
    if (!cameraOrbit || !cameraOrbit.isRotating) {
      return;
    }
    const deltaX = event.clientX - cameraOrbit.lastX;
    const deltaY = event.clientY - cameraOrbit.lastY;
    cameraOrbit.lastX = event.clientX;
    cameraOrbit.lastY = event.clientY;
    cameraOrbit.theta -= deltaX * 0.01;
    cameraOrbit.phi = clamp(cameraOrbit.phi + deltaY * 0.01, 0.2, 1.45);
    applyCameraOrbit();
  }

  function handleViewportMouseUp(event) {
    // Area select for start location
    if (pendingPlacement && pendingPlacement.kind === "start-area" && window.areaSelect && window.areaSelect.selecting && event.button === 2) {
      window.areaSelect.selecting = false;
      if (window.areaSelect.start && window.areaSelect.end) {
        // Set startLocation to center of area
        const center = new THREE.Vector3(
          (window.areaSelect.start.x + window.areaSelect.end.x) / 2,
          (window.areaSelect.start.y + window.areaSelect.end.y) / 2,
          (window.areaSelect.start.z + window.areaSelect.end.z) / 2
        );
        startLocation = { x: center.x, y: center.y, z: center.z };
        updateStartLocationDisplay();
        setStatus("Start location set to center of selected area.");
      } else {
        setStatus("Area selection canceled.", "error");
      }
      if (typeof clearAreaSelectOverlay === 'function') clearAreaSelectOverlay();
      clearPendingPlacement();
      return;
    }
    if (event.button !== 2 || !cameraOrbit || !cameraOrbit.isRotating) {
      return;
    }
    cameraOrbit.isRotating = false;
    updateViewportCursor();
  }

  function resizeRenderer() {
    if (!renderer || !camera) {
      return;
    }

    const width = elements.viewport.clientWidth || 1000;
    const height = elements.viewport.clientHeight || 720;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);

    // Animate avatar movement and animation
    if (mode === "game" && gameAvatar && gameAvatarMixer) {
      const delta = (window.THREE && THREE.Clock ? (animate._clock = animate._clock || new THREE.Clock()).getDelta() : 0.016);
      gameAvatarMixer.update(delta);
      // Move avatar toward target if set
      if (gameAvatarTarget) {
        const pos = gameAvatar.position;
        const dist = pos.distanceTo(gameAvatarTarget);
        if (dist > 0.1) {
          playAvatarAction("walk");
          const speed = 2.2 * delta;
          const dir = gameAvatarTarget.clone().sub(pos).setY(0).normalize();
          pos.add(dir.clone().multiplyScalar(Math.min(speed, dist)));
          // Face direction
          if (dir.lengthSq() > 0.001) {
            gameAvatar.rotation.y = Math.atan2(dir.x, dir.z);
          }
        } else {
          gameAvatar.position.copy(gameAvatarTarget);
          gameAvatarTarget = null;
          playAvatarAction("idle");
        }
      }
      // Update camera perspective
      updateCameraPerspective();
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function getTerrainVertexCount() {
    return (TERRAIN_SEGMENTS + 1) * (TERRAIN_SEGMENTS + 1);
  }

  function createEmptyTerrainHeightData() {
    return new Array(getTerrainVertexCount()).fill(0);
  }

  function ensureTerrainPaintCanvas() {
    if (terrainPaintCanvas && terrainPaintContext && terrainPaintTexture) {
      return;
    }

    terrainPaintCanvas = document.createElement("canvas");
    terrainPaintCanvas.width = TERRAIN_PAINT_CANVAS_SIZE;
    terrainPaintCanvas.height = TERRAIN_PAINT_CANVAS_SIZE;
    terrainPaintContext = terrainPaintCanvas.getContext("2d");
    terrainPaintTexture = new THREE.CanvasTexture(terrainPaintCanvas);
    terrainPaintTexture.wrapS = THREE.ClampToEdgeWrapping;
    terrainPaintTexture.wrapT = THREE.ClampToEdgeWrapping;
    terrainPaintTexture.needsUpdate = true;
  }

  function createTerrainPaintPatternCanvas(type) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    paintTerrainPattern(context, normalizeTerrainPaintType(type), canvas.width, canvas.height);
    return canvas;
  }

  function fillPatternNoise(context, width, height, baseColor, speckPalette, speckCount, minSize, maxSize) {
    context.fillStyle = baseColor;
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < speckCount; index += 1) {
      context.fillStyle = speckPalette[index % speckPalette.length];
      const size = randomBetween(minSize, maxSize);
      context.fillRect(
        randomBetween(0, width),
        randomBetween(0, height),
        size,
        size
      );
    }
  }

  function drawCenterDashedLine(context, width, height, color, lineWidth, dash, gap, alpha) {
    context.strokeStyle = color;
    context.globalAlpha = alpha;
    context.lineWidth = lineWidth;
    context.setLineDash([dash, gap]);
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.stroke();
    context.setLineDash([]);
    context.globalAlpha = 1;
  }

  function drawBrickPattern(context, width, height, mortarColor, brickPalette, rowHeight, brickWidth) {
    context.fillStyle = mortarColor;
    context.fillRect(0, 0, width, height);

    for (let row = 0; row < Math.ceil(height / rowHeight); row += 1) {
      const offset = row % 2 ? brickWidth / 2 : 0;

      for (let x = -offset; x < width + brickWidth; x += brickWidth) {
        context.fillStyle = brickPalette[(row + Math.floor((x + offset) / brickWidth)) % brickPalette.length];
        context.fillRect(x + 1, row * rowHeight + 1, brickWidth - 2, rowHeight - 2);
      }
    }
  }

  function drawStonePattern(context, width, height, groutColor, stonePalette, columns, rows, jitter) {
    context.fillStyle = groutColor;
    context.fillRect(0, 0, width, height);
    const cellWidth = width / columns;
    const cellHeight = height / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * cellWidth + randomBetween(-jitter, jitter);
        const y = row * cellHeight + randomBetween(-jitter, jitter);
        const stoneWidth = cellWidth - randomBetween(4, 10);
        const stoneHeight = cellHeight - randomBetween(4, 10);
        context.fillStyle = stonePalette[(row + column) % stonePalette.length];
        context.fillRect(x + 2, y + 2, stoneWidth, stoneHeight);
        context.strokeStyle = "rgba(0,0,0,0.12)";
        context.strokeRect(x + 2, y + 2, stoneWidth, stoneHeight);
      }
    }
  }

  function drawWheelTracks(context, width, height, trackColor, shoulderColor) {
    context.fillStyle = shoulderColor;
    context.fillRect(0, 0, width, height);
    context.fillStyle = trackColor;
    context.fillRect(width * 0.26, 0, width * 0.17, height);
    context.fillRect(width * 0.57, 0, width * 0.17, height);
  }

  function paintTerrainPattern(context, type, width, height) {
    switch (type) {
      case "road":
        fillPatternNoise(
          context,
          width,
          height,
          "#3d4248",
          ["rgba(53, 58, 63, 0.28)", "rgba(80, 86, 92, 0.2)", "rgba(30, 34, 38, 0.16)"],
          420,
          2,
          5
        );
        drawCenterDashedLine(context, width, height, "#f3d25e", 5, 22, 18, 0.35);
        return;
      case "street":
        drawStonePattern(context, width, height, "#5f6368", ["#90949a", "#7d8288", "#6f747b"], 8, 8, 2.5);
        return;
      case "golden-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#b68a1e",
          ["rgba(255, 224, 132, 0.28)", "rgba(164, 118, 23, 0.22)", "rgba(255, 243, 193, 0.18)"],
          360,
          2,
          5
        );
        drawCenterDashedLine(context, width, height, "#fff2be", 4, 18, 14, 0.28);
        return;
      case "brick-road":
        drawBrickPattern(context, width, height, "#8a6c57", ["#8c3c2b", "#a54834", "#723121"], 16, 26);
        return;
      case "concrete-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#a3a7ad",
          ["rgba(230, 235, 240, 0.18)", "rgba(115, 122, 128, 0.22)", "rgba(82, 88, 94, 0.14)"],
          320,
          2,
          4
        );
        context.strokeStyle = "rgba(82, 88, 94, 0.35)";
        context.lineWidth = 2;
        for (let index = 0; index < 5; index += 1) {
          context.beginPath();
          context.moveTo(randomBetween(0, width), 0);
          context.lineTo(randomBetween(0, width), height);
          context.stroke();
        }
        return;
      case "stone-road":
        drawStonePattern(context, width, height, "#62615b", ["#8f8a80", "#7d786f", "#aba59b"], 7, 7, 4);
        return;
      case "castle-road":
        drawStonePattern(context, width, height, "#534d46", ["#7d756c", "#6a6259", "#938a80"], 6, 9, 3);
        drawCenterDashedLine(context, width, height, "#b18a5d", 3, 12, 12, 0.18);
        return;
      case "neighborhood-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#494d54",
          ["rgba(90, 96, 102, 0.24)", "rgba(50, 54, 60, 0.18)"],
          360,
          2,
          4
        );
        context.strokeStyle = "rgba(255,255,255,0.45)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(width * 0.2, 0);
        context.lineTo(width * 0.2, height);
        context.moveTo(width * 0.8, 0);
        context.lineTo(width * 0.8, height);
        context.stroke();
        drawCenterDashedLine(context, width, height, "#ffffff", 3, 14, 12, 0.28);
        return;
      case "gravel-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#8d8476",
          ["rgba(191, 182, 166, 0.35)", "rgba(116, 108, 97, 0.28)", "rgba(153, 143, 129, 0.24)"],
          580,
          2,
          6
        );
        return;
      case "grassy-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#5f7e38",
          ["rgba(112, 146, 63, 0.24)", "rgba(65, 93, 30, 0.28)", "rgba(143, 176, 86, 0.18)"],
          500,
          2,
          5
        );
        drawWheelTracks(context, width, height, "rgba(122, 104, 70, 0.55)", "rgba(0,0,0,0)");
        return;
      case "mud-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#6d4e35",
          ["rgba(90, 60, 37, 0.26)", "rgba(125, 92, 61, 0.22)", "rgba(50, 34, 21, 0.14)"],
          420,
          3,
          7
        );
        drawWheelTracks(context, width, height, "rgba(55, 37, 24, 0.44)", "rgba(0,0,0,0)");
        return;
      case "desert-road":
        fillPatternNoise(
          context,
          width,
          height,
          "#c7a260",
          ["rgba(233, 205, 146, 0.26)", "rgba(183, 141, 74, 0.18)", "rgba(153, 112, 53, 0.14)"],
          460,
          2,
          5
        );
        context.strokeStyle = "rgba(235, 219, 185, 0.16)";
        context.lineWidth = 2;
        for (let index = 0; index < 6; index += 1) {
          context.beginPath();
          context.moveTo(0, randomBetween(0, height));
          context.quadraticCurveTo(
            width * 0.5,
            randomBetween(0, height),
            width,
            randomBetween(0, height)
          );
          context.stroke();
        }
        return;
      default:
        fillPatternNoise(
          context,
          width,
          height,
          "#3d4248",
          ["rgba(53, 58, 63, 0.28)", "rgba(80, 86, 92, 0.2)"],
          420,
          2,
          5
        );
    }
  }

  function getTerrainPaintPattern(type) {
    if (!elements.terrainPaintPatterns) {
      elements.terrainPaintPatterns = {};
    }

    if (!elements.terrainPaintPatterns[type]) {
      elements.terrainPaintPatterns[type] = createTerrainPaintPatternCanvas(type);
    }

    return elements.terrainPaintPatterns[type];
  }

  function stampTerrainPaintStroke(context, stroke) {
    const patternCanvas = getTerrainPaintPattern(stroke.type);
    const radius = stroke.radius * TERRAIN_PAINT_CANVAS_SIZE;

    if (radius <= 0) {
      return;
    }

    const stampCanvas = document.createElement("canvas");
    stampCanvas.width = Math.max(4, Math.ceil(radius * 2));
    stampCanvas.height = Math.max(4, Math.ceil(radius * 2));
    const stampContext = stampCanvas.getContext("2d");
    const pattern = stampContext.createPattern(patternCanvas, "repeat");
    stampContext.fillStyle = pattern;
    stampContext.fillRect(0, 0, stampCanvas.width, stampCanvas.height);
    stampContext.globalCompositeOperation = "destination-in";
    const gradient = stampContext.createRadialGradient(
      stampCanvas.width / 2,
      stampCanvas.height / 2,
      radius * 0.15,
      stampCanvas.width / 2,
      stampCanvas.height / 2,
      radius
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.92)");
    gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.72)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    stampContext.fillStyle = gradient;
    stampContext.fillRect(0, 0, stampCanvas.width, stampCanvas.height);

    context.drawImage(
      stampCanvas,
      stroke.u * TERRAIN_PAINT_CANVAS_SIZE - stampCanvas.width / 2,
      stroke.v * TERRAIN_PAINT_CANVAS_SIZE - stampCanvas.height / 2
    );
  }

  function rebuildTerrainPaintOverlay() {
    ensureTerrainPaintCanvas();
    terrainPaintContext.clearRect(
      0,
      0,
      TERRAIN_PAINT_CANVAS_SIZE,
      TERRAIN_PAINT_CANVAS_SIZE
    );
    terrainPaintStrokes.forEach((stroke) => {
      stampTerrainPaintStroke(terrainPaintContext, stroke);
    });
    terrainPaintTexture.needsUpdate = true;
  }

  function ensureTerrainPaintOverlay() {
    ensureTerrainPaintCanvas();

    if (!terrainOverlay) {
      terrainOverlay = new THREE.Mesh(
        terrain.geometry.clone(),
        new THREE.MeshStandardMaterial({
          map: terrainPaintTexture,
          transparent: true,
          alphaTest: 0.05,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -2
        })
      );
      terrainOverlay.receiveShadow = false;
      terrainOverlay.castShadow = false;
      terrainOverlay.renderOrder = 2;
      scene.add(terrainOverlay);
    }

    if (terrainOverlay.geometry) {
      terrainOverlay.geometry.dispose();
    }

    terrainOverlay.geometry = terrain.geometry.clone();
    terrainOverlay.position.copy(terrain.position);
    terrainOverlay.rotation.copy(terrain.rotation);
    terrainOverlay.visible = true;
    rebuildTerrainPaintOverlay();
  }

  function ensureTerrainHeightData(heightData) {
    if (Array.isArray(heightData) && heightData.length === getTerrainVertexCount()) {
      return heightData.slice();
    }

    return createEmptyTerrainHeightData();
  }

  function applyTerrainHeightDataToGeometry(geometry, heightData) {
    const positions = geometry.attributes.position;

    for (let index = 0; index < positions.count; index += 1) {
      positions.setZ(index, heightData[index] || 0);
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    if (geometry.attributes.normal) {
      geometry.attributes.normal.needsUpdate = true;
    }
  }

  function getTerrainBrushRadius() {
    return Math.max(1.25, Math.min(terrainConfig.width, terrainConfig.length) * 0.12);
  }

  function refreshTerrain() {
    if (!terrain) {
      return;
    }

    terrainConfig.heightData = ensureTerrainHeightData(terrainConfig.heightData);
    terrain.geometry.dispose();
    const geometry = new THREE.PlaneGeometry(
      terrainConfig.width,
      terrainConfig.length,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS
    );
    applyTerrainHeightDataToGeometry(geometry, terrainConfig.heightData);
    terrain.geometry = geometry;
    terrain.rotation.set(-Math.PI / 2, terrainConfig.rotationY, 0);
    if (terrainOverlay) {
      ensureTerrainPaintOverlay();
    }
    applyTexture(currentTerrainTexture);
    updateTerrainType();
    syncTerrainInputs();
  }

  function syncTerrainInputs() {
    if (!elements.terrainWidthInput || !elements.terrainLengthInput) {
      return;
    }

    elements.terrainWidthInput.value = String(terrainConfig.width);
    elements.terrainLengthInput.value = String(terrainConfig.length);
  }

  function updateTerrainSizeFromInputs() {
    const width = Number.parseFloat(elements.terrainWidthInput.value);
    const length = Number.parseFloat(elements.terrainLengthInput.value);

    if (!Number.isFinite(width) || !Number.isFinite(length) || width < 4 || length < 4) {
      setStatus("Terrain size must be at least 4 x 4.", "error");
      return;
    }

    terrainConfig.width = width;
    terrainConfig.length = length;
    refreshTerrain();
    setStatus(`Terrain resized to ${width} x ${length}.`);
  }

  function rotateTerrain(delta) {
    terrainConfig.rotationY += delta;
    refreshTerrain();
    setStatus("Terrain rotation updated.");
  }

  function updateTerrainType() {
    if (!terrain || !terrain.material) {
      return;
    }

    terrain.material.color.set(isIndoor ? 0xf2efe8 : 0xd6f2d3);
    terrain.material.needsUpdate = true;
  }

  function loadTextureMap(src) {
    const texture = new THREE.TextureLoader().load(src, undefined, undefined, () => {
      setStatus(`Could not load texture: ${basename(src)}`, "error");
    });

    if ("SRGBColorSpace" in THREE) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(
      Math.max(1, terrainConfig.width / 6),
      Math.max(1, terrainConfig.length / 6)
    );

    return texture;
  }

  function applyTexture(src) {
    currentTerrainTexture = src;
    localStorage.setItem(LAST_TEXTURE_KEY, src);

    if (terrain && terrain.material) {
      terrain.material.map = loadTextureMap(src);
      terrain.material.needsUpdate = true;
    }

    syncTextureSelection();
  }

  function seedTextureSources() {
    textureSources = [];

    BUILTIN_TEXTURES.forEach(addTextureSource);

    if (currentTerrainTexture && !textureSources.includes(currentTerrainTexture)) {
      addTextureSource(currentTerrainTexture);
    }

    renderTextureList();
    applyTexture(currentTerrainTexture);
  }

  function addTextureSource(src) {
    if (!src || textureSources.includes(src)) {
      return;
    }

    textureSources.push(src);
  }

  function renderTextureList() {
    elements.textureList.innerHTML = "";

    textureSources.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = basename(src);
      img.title = basename(src);
      img.addEventListener("click", () => {
        applyTexture(src);
        setStatus(`Applied texture: ${basename(src)}.`);
      });
      elements.textureList.appendChild(img);
    });

    syncTextureSelection();
  }

  function syncTextureSelection() {
    Array.from(elements.textureList.querySelectorAll("img")).forEach((img) => {
      img.classList.toggle("active", img.src === new URL(currentTerrainTexture, window.location.href).href);
    });
  }

  function handleTextureUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      addTextureSource(src);
      renderTextureList();
      applyTexture(src);
      setStatus(`Added custom texture: ${file.name}.`);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function updateUserStatus() {
    if (!elements.userStatus) {
      return;
    }

    if (currentUser) {
      elements.userStatus.textContent = `Logged in as ${currentUser}`;
    } else {
      elements.userStatus.textContent = "Not logged in";
    }
  }

  // Backend API URL (set to your deployed backend, e.g. https://born3d-backend.onrender.com)
  const BACKEND_URL = "http://localhost:4000"; // Change to your deployed backend URL

  async function userRegister() {
    const name = elements.userNameInput.value.trim();
    const pin = elements.userPinInput.value.trim();
    if (!name || !pin) {
      setStatus("Enter both a username and a pin to register.", "error");
      return;
    }
    try {
      const res = await fetch(BACKEND_URL + "/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, pin })
      });
      const data = await res.json();
      if (data.success) {
        setStatus(`User \"${name}\" registered. You can log in now.`);
      } else {
        setStatus(data.error || "Registration failed.", "error");
      }
    } catch (e) {
      setStatus("Registration error.", "error");
    }
  }

  async function userLogin() {
    const name = elements.userNameInput.value.trim();
    const pin = elements.userPinInput.value.trim();
    if (!name || !pin) {
      setStatus("Enter both a username and a pin to log in.", "error");
      return;
    }
    try {
      const res = await fetch(BACKEND_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, pin })
      });
      const data = await res.json();
      if (data.token) {
        currentUser = name;
        window._born3d_token = data.token;
        updateUserStatus();
        setStatus(`Logged in as ${name}.`);
        // Optionally load character data here
      } else {
        setStatus(data.error || "Login failed.", "error");
      }
    } catch (e) {
      setStatus("Login error.", "error");
    }
  }

  async function userLogout() {
    // Auto-save character before logout
    if (typeof getCurrentCharacterData === 'function' && window._born3d_token) {
      try { await saveCharacterToBackend(getCurrentCharacterData()); } catch {}
    }
    try {
      await fetch(BACKEND_URL + "/api/logout", {
        method: "POST",
        headers: { "Authorization": "Bearer " + (window._born3d_token || "") }
      });
    } catch {}
    currentUser = null;
    window._born3d_token = null;
    updateUserStatus();
    setStatus("Logged out.");
  }
    // --- Automatic cloud save on page unload ---
    window.addEventListener('beforeunload', function() {
      if (typeof getCurrentCharacterData === 'function' && window._born3d_token) {
        // Note: navigator.sendBeacon is preferred for unload events
        try {
          const data = JSON.stringify({ character: getCurrentCharacterData() });
          navigator.sendBeacon && navigator.sendBeacon(BACKEND_URL + "/api/save", data);
        } catch {}
      }
    });

    // --- Automatic cloud save on mode switch ---
    if (!window._origSetMode) window._origSetMode = window.setMode;
    window.setMode = async function(newMode) {
      if (typeof window._origSetMode === 'function') await window._origSetMode(newMode);
      if (typeof getCurrentCharacterData === 'function' && window._born3d_token) {
        try { await saveCharacterToBackend(getCurrentCharacterData()); } catch {}
      }
    };

    // Helper: get current character data (customize as needed)
    function getCurrentCharacterData() {
      // Example: collect relevant player state for saving
      return {
        name: currentUser,
        stats: playerState,
        inventory: playerInventory,
        lastPosition: gameAvatar && gameAvatar.position ? {
          x: gameAvatar.position.x,
          y: gameAvatar.position.y,
          z: gameAvatar.position.z
        } : undefined,
        updatedAt: new Date().toISOString()
      };
    }
  // Save character to backend
  async function saveCharacterToBackend(character) {
    if (!window._born3d_token) return;
    try {
      await fetch(BACKEND_URL + "/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + window._born3d_token
        },
        body: JSON.stringify({ character })
      });
      setStatus("Character saved to cloud.");
    } catch {
      setStatus("Failed to save character to cloud.", "error");
    }
  }

  // Load character from backend
  async function loadCharacterFromBackend() {
    if (!window._born3d_token) return null;
    try {
      const res = await fetch(BACKEND_URL + "/api/character", {
        headers: { "Authorization": "Bearer " + window._born3d_token }
      });
      const data = await res.json();
      return data.character;
    } catch {
      setStatus("Failed to load character from cloud.", "error");
      return null;
    }
  }

  function getLevelKey(name) {
    return LEVEL_PREFIX + name;
  }

  function serializeSceneObject(object) {
    return {
      name: object.userData.name,
      path: object.userData.path,
      kind: object.userData.kind,
      textureSet: object.userData.textureSet || null,
      position: object.position.toArray(),
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: object.scale.toArray()
    };
  }

  function serializeLevel(pin) {
    return {
      owner: currentUser,
      pin: pin,
      savedAt: new Date().toISOString(),
      isIndoor: isIndoor,
      startLocation: startLocation,
      terrain: {
        width: terrainConfig.width,
        length: terrainConfig.length,
        rotationY: terrainConfig.rotationY,
        texture: currentTerrainTexture,
        heightData: terrainConfig.heightData.slice(),
        paintStrokes: terrainPaintStrokes.map((stroke) => ({
          type: stroke.type,
          u: stroke.u,
          v: stroke.v,
          radius: stroke.radius
        }))
      },
      props: placedProps.map(serializeSceneObject),
      avatars: placedAvatars.map(serializeSceneObject)
    };
  }

  function saveLevel() {
    if (!currentUser) {
      setStatus("Log in before saving a level.", "error");
      return;
    }

    const name = elements.levelNameInput.value.trim();
    const pin = elements.levelPinInput.value.trim();

    if (!name || !pin) {
      setStatus("Enter a level name and level pin before saving.", "error");
      return;
    }

    const key = getLevelKey(name);
    if (localStorage.getItem(key)) {
      setStatus(`Level "${name}" already exists. Use Overwrite instead.`, "error");
      return;
    }

    localStorage.setItem(key, JSON.stringify(serializeLevel(pin)));
    currentLevelName = name;
    renderLevelList();
    setStatus(`Level "${name}" saved.`);
  }

  function overwriteLevel() {
    if (!currentUser) {
      setStatus("Log in before overwriting a level.", "error");
      return;
    }

    const name = elements.levelNameInput.value.trim();
    const pin = elements.levelPinInput.value.trim();

    if (!name || !pin) {
      setStatus("Enter a level name and level pin before overwriting.", "error");
      return;
    }

    const key = getLevelKey(name);
    const existing = localStorage.getItem(key);

    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.owner && parsed.owner !== currentUser) {
        setStatus(`Only ${parsed.owner} can overwrite "${name}".`, "error");
        return;
      }
    }

    localStorage.setItem(key, JSON.stringify(serializeLevel(pin)));
    currentLevelName = name;
    renderLevelList();
    setStatus(`Level "${name}" overwritten.`);
  }

  function loadLevel() {
    if (!currentUser) {
      setStatus("Log in before loading a level.", "error");
      return;
    }

    const name = elements.levelNameInput.value.trim();
    const pin = elements.levelPinInput.value.trim();

    if (!name || !pin) {
      setStatus("Enter a level name and level pin before loading.", "error");
      return;
    }

    const raw = localStorage.getItem(getLevelKey(name));
    if (!raw) {
      setStatus(`No saved level named "${name}".`, "error");
      return;
    }

    const data = JSON.parse(raw);
    if (data.owner && data.owner !== currentUser) {
      setStatus(`Level "${name}" belongs to ${data.owner}.`, "error");
      return;
    }

    if (data.pin !== pin) {
      setStatus("Incorrect level pin.", "error");
      return;
    }

    currentLevelName = name;
    deserializeLevel(data);
    setStatus(`Level "${name}" loaded.`);
  }

  function createNewLevel() {
    clearPendingPlacement();
    clearObjectCollection(placedProps);
    clearObjectCollection(placedAvatars);
    stopGame(true);
    currentLevelName = "";
    terrainConfig.width = 20;
    terrainConfig.length = 20;
    terrainConfig.rotationY = 0;
    terrainConfig.heightData = createEmptyTerrainHeightData();
    terrainPaintStrokes = [];
    currentTerrainTexture = BUILTIN_TEXTURES[0];
    addTextureSource(currentTerrainTexture);
    renderTextureList();
    refreshTerrain();
    isIndoor = true;
    if (elements.indoorToggle) {
      elements.indoorToggle.checked = true;
    }
    updateTerrainType();
    startLocation = { x: 0, y: 0, z: 0 };
    updateStartLocationDisplay();
    if (elements.levelNameInput) {
      elements.levelNameInput.value = "";
    }
    if (elements.levelPinInput) {
      elements.levelPinInput.value = "";
    }
    renderLevelList();
    setMode("editor");
    setStatus("Created a new blank level.");
  }

  function renderLevelList() {
    elements.levelList.innerHTML = "";

    const levelNames = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && key.startsWith(LEVEL_PREFIX)) {
        levelNames.push(key.slice(LEVEL_PREFIX.length));
      }
    }

    levelNames.sort((left, right) => left.localeCompare(right));

    if (!levelNames.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No saved levels yet.";
      elements.levelList.appendChild(empty);
      return;
    }

    levelNames.forEach((name) => {
      const button = document.createElement("button");
      button.className = name === currentLevelName ? "active" : "secondary";
      button.textContent = name;
      button.addEventListener("click", () => {
        elements.levelNameInput.value = name;
        currentLevelName = name;
        renderLevelList();
      });
      elements.levelList.appendChild(button);
    });
  }

  function clearPendingPlacement() {
    pendingPlacement = null;
    updateViewportCursor();
  }

  function enableTerrainSculpt(kind) {
    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before editing the terrain.", "error");
      return;
    }

    pendingPlacement = { kind: kind };
    updateViewportCursor();
    setStatus(
      kind === "raise-terrain"
        ? "Click once on the terrain to raise that area."
        : "Click once on the terrain to lower that area."
    );
  }

  function toggleTerrainPaintMode() {
    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before painting the terrain.", "error");
      return;
    }

    if (pendingPlacement && pendingPlacement.kind === "paint-terrain") {
      clearPendingPlacement();
      setStatus("Paint mode canceled.");
      return;
    }

    pendingPlacement = { kind: "paint-terrain", persistent: true };
    updateViewportCursor();
    setStatus(
      `Paint mode active: ${getTerrainPaintTypeLabel(currentTerrainPaintType)}. Click the terrain to paint roads or streets.`
    );
  }

  function enableStartLocationPlacement() {
    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before picking a start location.", "error");
      return;
    }
    pendingPlacement = { kind: "start-area" };
    window.areaSelect = null;
    updateViewportCursor();
    setStatus("Right-click and drag on the terrain to select a start area.");
  }

  function updateStartLocationDisplay() {
    if (!elements.startLocationDisplay) {
      return;
    }

    elements.startLocationDisplay.textContent =
      "(" +
      startLocation.x.toFixed(2) +
      ", " +
      startLocation.y.toFixed(2) +
      ", " +
      startLocation.z.toFixed(2) +
      ")";
  }

  function getCurrentPropSet() {
    if (currentPropType === "outdoor") {
      return OUTDOOR_PROPS;
    }

    if (currentPropType === "mass") {
      return MASS_PROPS;
    }

    return ALL_PROPS;
  }

  function renderPropList() {
    elements.propList.innerHTML = "";

    const propSet = getCurrentPropSet();
    if (propSet.length && (!currentProp || !propSet.some((prop) => prop.path === currentProp.path))) {
      currentProp = propSet[0];
    }

    const scaleLabel =
      currentPropScalePreset === "custom"
        ? `${currentPropCustomScale.toFixed(2)}x`
        : `${currentPropScalePreset} (${getCurrentPropScaleMultiplier().toFixed(2)}x)`;
    const textureLabel =
      currentPropTextureSet === "auto"
        ? describeTextureSet(resolvePropTextureSetId(currentProp))
        : describeTextureSet(currentPropTextureSet);
    if (elements.propHelpText) {
      elements.propHelpText.textContent = propSet.length
        ? `${propSet.length} props ready. Size: ${scaleLabel}. Texture: ${textureLabel}. Select one, click "Place Prop", then click the terrain.`
        : "No props are loaded yet.";
    }

    if (!propSet.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No props available. Check that the model loaders finished loading or that asset files exist.";
      elements.propList.appendChild(empty);
      // Still show the panel UI
      return;
    }

    propSet.forEach((prop) => {
      const button = document.createElement("button");
      button.className =
        "prop-button " + (currentProp && currentProp.path === prop.path ? "active" : "secondary");
      button.textContent = prop.name;
      button.title = prop.path;
      button.addEventListener("click", () => {
        currentProp = prop;
        renderPropList();
        setStatus(`Selected prop: ${prop.name}. Click "Place Prop", then click the terrain.`);
      });
      elements.propList.appendChild(button);
    });
  }

  function renderAvatarList() {
    elements.avatarList.innerHTML = "";

    if (!MALE_AVATARS.length) {
      const empty = document.createElement("div");
      empty.className = "muted";
      empty.textContent = "No avatars available. Check that the model loaders finished loading or that avatar files exist.";
      elements.avatarList.appendChild(empty);
      // Still show the panel UI
      return;
    }

    MALE_AVATARS.forEach((avatar) => {
      const button = document.createElement("button");
      button.className =
        currentAvatar && currentAvatar.path === avatar.path ? "active" : "secondary";
      button.textContent = avatar.name;
      button.addEventListener("click", () => {
        currentAvatar = avatar;
        renderAvatarList();
      });
      elements.avatarList.appendChild(button);
    });
  }

  function setupSFX() {
    if (!window.MOVE_SFX) {
      return;
    }

    moveAudio = new Audio(window.MOVE_SFX);
    moveAudio.preload = "auto";
  }

  function playMoveSFX() {
    if (!moveAudio) {
      return;
    }

    moveAudio.currentTime = 0;
    moveAudio.play().catch(() => {});
  }

  function normalizeObjectHeight(object, desiredHeight) {
    const bounds = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bounds.getSize(size);

    if (!size.y) {
      return;
    }

    const scale = desiredHeight / size.y;
    object.scale.multiplyScalar(scale);
  }

  function getCurrentPropScaleMultiplier() {
    if (currentPropScalePreset === "custom") {
      return Math.max(0.1, currentPropCustomScale);
    }

    return PROP_SCALE_PRESETS[currentPropScalePreset] || PROP_SCALE_PRESETS.medium;
  }

  function describeTextureSet(textureSetId) {
    if (!textureSetId) {
      return "None";
    }

    const textureSet = PROP_TEXTURE_SETS.find((entry) => entry.id === textureSetId);
    return textureSet ? textureSet.label : textureSetId;
  }

  function resolvePropTextureSetId(prop, savedState) {
    if (savedState && savedState.textureSet) {
      return savedState.textureSet;
    }

    if (currentPropTextureSet !== "auto") {
      return currentPropTextureSet;
    }

    if (typeof window.getDefaultTextureSetForProp === "function" && prop) {
      return window.getDefaultTextureSetForProp(prop.path);
    }

    return null;
  }

  function placeObjectOnTerrain(object, point) {
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object);
    const lift = bounds.isEmpty() ? 0 : -bounds.min.y;
    object.position.set(point.x, point.y + lift, point.z);
  }

  function getTerrainHeightAtLocal(localX, localY) {
    const halfWidth = terrainConfig.width / 2;
    const halfLength = terrainConfig.length / 2;
    const columnFloat = clamp(
      ((localX + halfWidth) / terrainConfig.width) * TERRAIN_SEGMENTS,
      0,
      TERRAIN_SEGMENTS
    );
    const rowFloat = clamp(
      ((halfLength - localY) / terrainConfig.length) * TERRAIN_SEGMENTS,
      0,
      TERRAIN_SEGMENTS
    );
    const columnLow = Math.floor(columnFloat);
    const columnHigh = Math.min(TERRAIN_SEGMENTS, Math.ceil(columnFloat));
    const rowLow = Math.floor(rowFloat);
    const rowHigh = Math.min(TERRAIN_SEGMENTS, Math.ceil(rowFloat));
    const rowSize = TERRAIN_SEGMENTS + 1;
    const tx = columnFloat - columnLow;
    const ty = rowFloat - rowLow;
    const topLeft = terrainConfig.heightData[rowLow * rowSize + columnLow] || 0;
    const topRight = terrainConfig.heightData[rowLow * rowSize + columnHigh] || 0;
    const bottomLeft = terrainConfig.heightData[rowHigh * rowSize + columnLow] || 0;
    const bottomRight = terrainConfig.heightData[rowHigh * rowSize + columnHigh] || 0;
    const top = topLeft + (topRight - topLeft) * tx;
    const bottom = bottomLeft + (bottomRight - bottomLeft) * tx;

    return top + (bottom - top) * ty;
  }

  function createTerrainPaintStroke(point, type) {
    if (!terrain) {
      return null;
    }

    const localPoint = terrain.worldToLocal(point.clone());
    const halfWidth = terrainConfig.width / 2;
    const halfLength = terrainConfig.length / 2;
    const u = clamp((localPoint.x + halfWidth) / terrainConfig.width, 0, 1);
    const v = clamp((halfLength - localPoint.y) / terrainConfig.length, 0, 1);
    const radius = getTerrainBrushRadius() / Math.min(terrainConfig.width, terrainConfig.length);

    return { type: type, u: u, v: v, radius: radius };
  }

  function paintTerrainAtPoint(point, type) {
    const stroke = createTerrainPaintStroke(point, type);

    if (!stroke) {
      return false;
    }

    terrainPaintStrokes.push(stroke);
    rebuildTerrainPaintOverlay();
    return true;
  }

  function sculptTerrainAtPoint(point, direction) {
    if (!terrain || !terrain.geometry) {
      return false;
    }

    terrainConfig.heightData = ensureTerrainHeightData(terrainConfig.heightData);
    const localPoint = terrain.worldToLocal(point.clone());
    const positions = terrain.geometry.attributes.position;
    const overlayPositions =
      terrainOverlay && terrainOverlay.geometry
        ? terrainOverlay.geometry.attributes.position
        : null;
    const brushRadius = getTerrainBrushRadius();
    let modified = false;

    for (let index = 0; index < positions.count; index += 1) {
      const vx = positions.getX(index);
      const vy = positions.getY(index);
      const distance = Math.hypot(vx - localPoint.x, vy - localPoint.y);

      if (distance > brushRadius) {
        continue;
      }

      const influence = Math.pow(1 - distance / brushRadius, 2);
      const currentHeight = terrainConfig.heightData[index] || 0;
      const nextHeight = clamp(
        currentHeight + direction * TERRAIN_BRUSH_STRENGTH * influence,
        -TERRAIN_MAX_HEIGHT,
        TERRAIN_MAX_HEIGHT
      );
      terrainConfig.heightData[index] = nextHeight;
      positions.setZ(index, nextHeight);
      if (overlayPositions) {
        overlayPositions.setZ(index, nextHeight);
      }
      modified = true;
    }

    if (!modified) {
      return false;
    }

    positions.needsUpdate = true;
    terrain.geometry.computeVertexNormals();
    terrain.geometry.computeBoundingBox();
    terrain.geometry.computeBoundingSphere();
    if (overlayPositions) {
      overlayPositions.needsUpdate = true;
      terrainOverlay.geometry.computeVertexNormals();
      terrainOverlay.geometry.computeBoundingBox();
      terrainOverlay.geometry.computeBoundingSphere();

      if (terrainOverlay.geometry.attributes.normal) {
        terrainOverlay.geometry.attributes.normal.needsUpdate = true;
      }
    }

    if (terrain.geometry.attributes.normal) {
      terrain.geometry.attributes.normal.needsUpdate = true;
    }

    return true;
  }

  function placePropAt(prop, point, savedState) {
    const textureSetId = resolvePropTextureSetId(prop, savedState);
    const scaleMultiplier = savedState && savedState.scale ? null : getCurrentPropScaleMultiplier();

    window.loadOBJProp(
      prop.path,
      (object) => {
        object.userData = {
          kind: "prop",
          name: prop.name,
          path: prop.path,
          textureSet: textureSetId
        };

        if (savedState && savedState.scale) {
          object.scale.fromArray(savedState.scale);
        }

        if (!savedState) {
          normalizeObjectHeight(object, 2.2 * scaleMultiplier);
        }

        if (savedState && savedState.rotation) {
          object.rotation.set(
            savedState.rotation[0],
            savedState.rotation[1],
            savedState.rotation[2]
          );
        } else {
          object.rotation.y = Math.random() * Math.PI * 2;
        }

        if (savedState && savedState.position) {
          object.position.fromArray(savedState.position);
        } else {
          placeObjectOnTerrain(object, point);
        }

        const finishPlacement = () => {
          scene.add(object);
          placedProps.push(object);
          playMoveSFX();
        };

        if (textureSetId && typeof window.applyTextureSetToObject === "function") {
          window.applyTextureSetToObject(object, textureSetId).finally(finishPlacement);
          return;
        }

        finishPlacement();
      },
      () => {
        setStatus(`Could not load prop: ${prop.name}.`, "error");
      }
    );
  }

  function placeAvatarAt(avatar, point, savedState) {
    window.loadFBXAvatar(
      avatar.path,
      (object) => {
        object.userData = {
          kind: "avatar",
          name: avatar.name,
          path: avatar.path
        };

        if (savedState && savedState.scale) {
          object.scale.fromArray(savedState.scale);
        } else {
          normalizeObjectHeight(object, 2.4);
        }

        if (savedState && savedState.rotation) {
          object.rotation.set(
            savedState.rotation[0],
            savedState.rotation[1],
            savedState.rotation[2]
          );
        }

        if (savedState && savedState.position) {
          object.position.fromArray(savedState.position);
        } else {
          placeObjectOnTerrain(object, point);
        }

        scene.add(object);
        placedAvatars.push(object);
        playMoveSFX();
      },
      () => {
        setStatus(`Could not load avatar: ${avatar.name}.`, "error");
      }
    );
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function getTerrainSurfacePoint(localX, localZ) {
    const safeTerrain = terrain || { localToWorld: (point) => point };
    return safeTerrain.localToWorld(
      new THREE.Vector3(localX, -localZ, getTerrainHeightAtLocal(localX, -localZ))
    );
  }

  function enablePropPlacement(prop) {
    if (!prop) {
      setStatus("Choose a prop before placing it.", "error");
      return;
    }

    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before placing props.", "error");
      return;
    }

    pendingPlacement = { kind: "prop", value: prop };
    updateViewportCursor();
    setStatus(`Click the terrain to place ${prop.name}.`);
  }

  function enableAvatarPlacement(avatar) {
    if (!avatar) {
      setStatus("Choose an avatar before placing it.", "error");
      return;
    }

    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before placing avatars.", "error");
      return;
    }

    pendingPlacement = { kind: "avatar", value: avatar };
    updateViewportCursor();
    setStatus(`Click the terrain to place ${avatar.name}.`);
  }

  function enableSinglePropRemoval() {
    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before removing props.", "error");
      return;
    }

    pendingPlacement = { kind: "delete-prop" };
    updateViewportCursor();
    setStatus("Click one placed prop to remove it.");
  }

  function getViewportPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  function getTerrainIntersection(event) {
    if (!renderer || !camera || !terrain) {
      return null;
    }

    const pointer = getViewportPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObject(terrain);
    return intersections.length ? intersections[0].point : null;
  }

  function getPlacedPropFromEvent(event) {
    if (!renderer || !camera || !placedProps.length) {
      return null;
    }

    const pointer = getViewportPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(placedProps, true);

    if (!intersections.length) {
      return null;
    }

    let object = intersections[0].object;
    while (object && !placedProps.includes(object)) {
      object = object.parent;
    }

    return object || null;
  }

  function handleViewportClick(event) {
    if (!pendingPlacement) {
      return;
    }

    if (pendingPlacement.kind === "delete-prop") {
      const prop = getPlacedPropFromEvent(event);

      if (!prop) {
        setStatus("Click directly on a placed prop to remove it.", "error");
        return;
      }

      removePlacedProp(prop);
      setStatus(`Removed ${prop.userData.name || "prop"}.`);
      clearPendingPlacement();
      return;
    }

    const point = getTerrainIntersection(event);
    if (!point) {
      setStatus("Click directly on the terrain surface.", "error");
      return;
    }

    if (pendingPlacement.kind === "start") {
      startLocation = { x: point.x, y: point.y, z: point.z };
      updateStartLocationDisplay();
      setStatus("Start location updated.");
    }

    if (pendingPlacement.kind === "paint-terrain") {
      paintTerrainAtPoint(point, currentTerrainPaintType);
      setStatus(
        `Painted ${getTerrainPaintTypeLabel(currentTerrainPaintType)} onto the terrain. Paint mode stays active until you toggle it off or choose another tool.`
      );
      return;
    }

    if (pendingPlacement.kind === "raise-terrain") {
      sculptTerrainAtPoint(point, 1);
      setStatus("Raised the terrain in that area.");
      clearPendingPlacement();
      return;
    }

    if (pendingPlacement.kind === "lower-terrain") {
      sculptTerrainAtPoint(point, -1);
      setStatus("Lowered the terrain in that area.");
      clearPendingPlacement();
      return;
    }

    if (pendingPlacement.kind === "prop") {
      placePropAt(pendingPlacement.value, point);
      setStatus(`Placed ${pendingPlacement.value.name}.`);
    }

    if (pendingPlacement.kind === "avatar") {
      placeAvatarAt(pendingPlacement.value, point);
      setStatus(`Placed ${pendingPlacement.value.name}.`);
    }

    clearPendingPlacement();
  }

  function autoPlaceNatureProps() {
    if (mode !== "editor") {
      setStatus("Switch back to Editor Mode before auto-placing nature.", "error");
      return;
    }

    if (!OUTDOOR_PROPS.length) {
      setStatus("No outdoor props are available.", "error");
      return;
    }

    if (currentNaturePlacementMode === "scatter") {
      autoPlaceScatteredNatureProps();
      return;
    }

    autoPlaceClusteredNatureProps();
  }

  function autoPlaceClusteredNatureProps() {
    const halfWidth = terrainConfig.width / 2;
    const halfLength = terrainConfig.length / 2;
    const areaCount = Math.max(2, Math.min(5, Math.round((terrainConfig.width + terrainConfig.length) / 18)));
    const maxRadius = Math.max(2.5, Math.min(terrainConfig.width, terrainConfig.length) * 0.22);
    const minRadius = Math.max(1.75, maxRadius * 0.55);
    let totalPlaced = 0;

    for (let areaIndex = 0; areaIndex < areaCount; areaIndex += 1) {
      const radius = randomBetween(minRadius, maxRadius);
      const centerX = randomBetween(-halfWidth + radius, halfWidth - radius);
      const centerZ = randomBetween(-halfLength + radius, halfLength - radius);
      const propsInArea = Math.max(4, Math.round(randomBetween(4, 8)));

      for (let propIndex = 0; propIndex < propsInArea; propIndex += 1) {
        const prop = OUTDOOR_PROPS[Math.floor(Math.random() * OUTDOOR_PROPS.length)];
        const angle = randomBetween(0, Math.PI * 2);
        const distance = Math.sqrt(Math.random()) * radius;
        const localX = clamp(
          centerX + Math.cos(angle) * distance,
          -halfWidth + 0.75,
          halfWidth - 0.75
        );
        const localZ = clamp(
          centerZ + Math.sin(angle) * distance,
          -halfLength + 0.75,
          halfLength - 0.75
        );
        const point = getTerrainSurfacePoint(localX, localZ);
        placePropAt(prop, point);
        totalPlaced += 1;
      }
    }

    setStatus(`Auto-placed ${totalPlaced} nature props across ${areaCount} random areas.`);
  }

  function autoPlaceScatteredNatureProps() {
    const halfWidth = terrainConfig.width / 2;
    const halfLength = terrainConfig.length / 2;
    const desiredCount = Math.max(
      8,
      Math.min(18, Math.round((terrainConfig.width * terrainConfig.length) / 45))
    );
    const minimumDistance = Math.max(
      3.5,
      Math.min(terrainConfig.width, terrainConfig.length) * 0.24
    );
    const positions = [];
    const maxAttempts = desiredCount * 40;
    let attempts = 0;

    while (positions.length < desiredCount && attempts < maxAttempts) {
      attempts += 1;
      const candidate = {
        x: randomBetween(-halfWidth + 1, halfWidth - 1),
        z: randomBetween(-halfLength + 1, halfLength - 1)
      };
      const isFarEnough = positions.every((position) => {
        return Math.hypot(position.x - candidate.x, position.z - candidate.z) >= minimumDistance;
      });

      if (isFarEnough) {
        positions.push(candidate);
      }
    }

    positions.forEach((position) => {
      const prop = OUTDOOR_PROPS[Math.floor(Math.random() * OUTDOOR_PROPS.length)];
      const point = getTerrainSurfacePoint(position.x, position.z);
      placePropAt(prop, point);
    });

    setStatus(
      `Auto-placed ${positions.length} scattered nature props with wider spacing (${minimumDistance.toFixed(1)} minimum distance).`
    );
  }

  function disposeObject(root) {
    root.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material && material.dispose && material.dispose());
        } else if (child.material && child.material.dispose) {
          child.material.dispose();
        }
      }
    });

    scene.remove(root);
  }

  function clearObjectCollection(collection) {
    collection.forEach((object) => disposeObject(object));
    collection.length = 0;
  }

  function removePlacedProp(prop) {
    const index = placedProps.indexOf(prop);
    if (index !== -1) {
      placedProps.splice(index, 1);
    }

    disposeObject(prop);
  }

  function clearPlacedItems() {
    clearPendingPlacement();
    clearObjectCollection(placedProps);
    clearObjectCollection(placedAvatars);
    stopGame(false);
    setStatus("Cleared placed props and avatars.");
  }

  function deserializeLevel(data) {
    clearPlacedItems();

    terrainConfig.width = data.terrain && data.terrain.width ? data.terrain.width : 20;
    terrainConfig.length = data.terrain && data.terrain.length ? data.terrain.length : 20;
    terrainConfig.rotationY =
      data.terrain && Number.isFinite(data.terrain.rotationY) ? data.terrain.rotationY : 0;
    terrainConfig.heightData = ensureTerrainHeightData(
      data.terrain && Array.isArray(data.terrain.heightData) ? data.terrain.heightData : null
    );
    terrainPaintStrokes =
      data.terrain && Array.isArray(data.terrain.paintStrokes)
        ? data.terrain.paintStrokes.map((stroke) => ({
            type: stroke.type === "street" ? "street" : "road",
            u: Number.isFinite(stroke.u) ? stroke.u : 0.5,
            v: Number.isFinite(stroke.v) ? stroke.v : 0.5,
            radius: Number.isFinite(stroke.radius) ? stroke.radius : 0.08
          }))
        : [];
    currentTerrainTexture =
      data.terrain && data.terrain.texture ? data.terrain.texture : BUILTIN_TEXTURES[0];
    addTextureSource(currentTerrainTexture);
    renderTextureList();
    refreshTerrain();

    isIndoor = data.isIndoor !== false;
    elements.indoorToggle.checked = isIndoor;
    updateTerrainType();

    startLocation = data.startLocation || { x: 0, y: 0, z: 0 };
    updateStartLocationDisplay();

    (data.props || []).forEach((item) => {
      placePropAt(
        { name: item.name || basename(item.path), path: item.path },
        null,
        item
      );
    });

    (data.avatars || []).forEach((item) => {
      placeAvatarAt(
        { name: item.name || basename(item.path), path: item.path },
        null,
        item
      );
    });
  }

  function setMode(newMode) {
    mode = newMode;
    elements.editorModeBtn.classList.toggle("active", mode === "editor");
    elements.gameModeBtn.classList.toggle("active", mode === "game");

    if (mode === "game") {
      startGame();
      showPlayerGui();
    } else {
      stopGame(false);
      hidePlayerGui();
      setStatus("Editor mode active.");
    }
  }

  function startGame() {
      addCameraModeUI();
    clearPendingPlacement();
    stopGame(true);

    const avatar = currentAvatar || MALE_AVATARS[0];
    if (!avatar) {
      setStatus("No avatar is available for game mode.", "error");
      return;
    }

    const token = gameLoadToken + 1;
    gameLoadToken = token;

    window.loadFBXAvatar(
      avatar.path,
      (object) => {
        if (mode !== "game" || gameLoadToken !== token) {
          disposeObject(object);
          return;
        }

        normalizeObjectHeight(object, 2.4);
        placeObjectOnTerrain(
          object,
          new THREE.Vector3(startLocation.x, startLocation.y, startLocation.z)
        );
        object.userData = {
          kind: "game-avatar",
          name: avatar.name,
          path: avatar.path
        };
        scene.add(object);
        gameAvatar = object;
        // Animation setup
        if (object.animations && object.animations.length) {
          gameAvatarMixer = new THREE.AnimationMixer(object);
          gameAvatarActions = {};
          object.animations.forEach((clip) => {
            if (clip.name.toLowerCase().includes("idle")) gameAvatarActions.idle = gameAvatarMixer.clipAction(clip);
            if (clip.name.toLowerCase().includes("walk")) gameAvatarActions.walk = gameAvatarMixer.clipAction(clip);
            if (clip.name.toLowerCase().includes("punch")) gameAvatarActions.punch = gameAvatarMixer.clipAction(clip);
          });
          playAvatarAction("idle");
        } else {
          gameAvatarMixer = null;
          gameAvatarActions = {};
        }
        gameAvatarTarget = null;
        playMoveSFX();
        setCameraMode("third");
        setStatus("Game mode active. Avatar spawned at the saved start location.");
        resetPlayerState();
        updatePlayerGui();
      },
      () => {
        setStatus("The game avatar could not be loaded.", "error");
      }
    );
  }

  function playAvatarAction(name) {
    if (!gameAvatarMixer || !gameAvatarActions[name]) return;
    if (gameAvatarCurrentAction === name) return;
    Object.values(gameAvatarActions).forEach((action) => action.stop());
    gameAvatarActions[name].reset().play();
    gameAvatarCurrentAction = name;
  }

  function stopGame(silent) {
    gameLoadToken += 1;

    if (gameAvatar) {
      disposeObject(gameAvatar);
      gameAvatar = null;
    }
    gameAvatarMixer = null;
    gameAvatarActions = {};
    gameAvatarCurrentAction = null;
    gameAvatarTarget = null;

    hidePlayerGui();

    if (!silent) {
      setStatus("Exited game mode.");
    }
  }

  // --- Player GUI meters ---
  function showPlayerGui() {
    if (playerGui) return;
    const viewport = elements.viewport;
    playerGui = document.createElement("div");
    playerGui.id = "playerGui";
    playerGui.innerHTML = `
      <div class="meter meter-health"><div class="meter-bar" id="meterHealthBar"></div><span class="meter-label">Health</span></div>
      <div class="meter meter-vigor"><div class="meter-bar" id="meterVigorBar"></div><span class="meter-label">Vigor</span></div>
      <div class="meter meter-magicka"><div class="meter-bar" id="meterMagickaBar"></div><span class="meter-label">Magicka</span></div>
      <div id="playerRPGPanel" class="rpg-panel">
        <div class="rpg-row"><b>Level:</b> <span id="playerLevel"></span> <b>EXP:</b> <span id="playerExp"></span></div>
        <div class="rpg-row"><b>Attributes:</b>
          <span id="attrStrength"></span>
          <span id="attrAgility"></span>
          <span id="attrIntelligence"></span>
          <span id="attrEndurance"></span>
          <span id="attrLuck"></span>
        </div>
        <div class="rpg-row"><b>Skills:</b>
          <span id="skillSword"></span>
          <span id="skillPunch"></span>
          <span id="skillMagic"></span>
          <span id="skillArchery"></span>
          <span id="skillDefense"></span>
          <span id="skillStealth"></span>
        </div>
      </div>
    `;
    viewport.appendChild(playerGui);
    updatePlayerGui();
  }

  function hidePlayerGui() {
    if (playerGui && playerGui.parentNode) {
      playerGui.parentNode.removeChild(playerGui);
    }
    playerGui = null;
  }

  function updatePlayerGui() {
    if (!playerGui) return;
    const h = Math.max(0, Math.min(1, playerState.health / playerState.maxHealth));
    const v = Math.max(0, Math.min(1, playerState.vigor / playerState.maxVigor));
    const m = Math.max(0, Math.min(1, playerState.magicka / playerState.maxMagicka));
    const healthBar = playerGui.querySelector("#meterHealthBar");
    const vigorBar = playerGui.querySelector("#meterVigorBar");
    const magickaBar = playerGui.querySelector("#meterMagickaBar");
    if (healthBar) healthBar.style.width = (h * 100) + "%";
    if (vigorBar) vigorBar.style.width = (v * 100) + "%";
    if (magickaBar) magickaBar.style.width = (m * 100) + "%";

    // RPG panel
    const set = (id, val) => {
      const el = playerGui.querySelector(id);
      if (el) el.textContent = val;
    };
    set("#playerLevel", playerState.level);
    set("#playerExp", playerState.exp);
    set("#attrStrength", `STR: ${playerState.attributes.strength}`);
    set("#attrAgility", `AGI: ${playerState.attributes.agility}`);
    set("#attrIntelligence", `INT: ${playerState.attributes.intelligence}`);
    set("#attrEndurance", `END: ${playerState.attributes.endurance}`);
    set("#attrLuck", `LCK: ${playerState.attributes.luck}`);
    set("#skillSword", `Sword: ${playerState.skills.sword}`);
    set("#skillPunch", `Punch: ${playerState.skills.punch}`);
    set("#skillMagic", `Magic: ${playerState.skills.magic}`);
    set("#skillArchery", `Archery: ${playerState.skills.archery}`);
    set("#skillDefense", `Defense: ${playerState.skills.defense}`);
    set("#skillStealth", `Stealth: ${playerState.skills.stealth}`);
  }

  function resetPlayerState() {
    playerState.health = playerState.maxHealth = 100;
    playerState.vigor = playerState.maxVigor = 100;
    playerState.magicka = playerState.maxMagicka = 100;
    playerState.level = 1;
    playerState.exp = 0;
    playerState.attributes = {
      strength: 10,
      agility: 10,
      intelligence: 10,
      endurance: 10,
      luck: 10
    };
    playerState.skills = {
      sword: 1,
      punch: 1,
      magic: 1,
      archery: 1,
      defense: 1,
      stealth: 1
    };
  }

  function initialize() {
    cacheStaticElements();
    buildExplorerLayout();
    bindStaticEvents();
    initScene();
    setupSFX();
    seedTextureSources();
    updateUserStatus();
    updateStartLocationDisplay();
    renderLevelList();
    renderPropList();
    renderAvatarList();
    syncTerrainInputs();
    setMode("editor");

    if (!MASS_PROPS.length && !OUTDOOR_PROPS.length) {
      setStatus("Prop data did not load. Check src/propLoader.js first.", "error");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
