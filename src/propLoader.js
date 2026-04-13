// src/propLoader.js
// Utility for loading and placing 3D props and avatars in classic-script mode.

(function () {
  let objLoader = null;
  let fbxLoader = null;
  let textureLoader = null;
  const textureDirectoryCache = new Map();
  const textureSetCache = new Map();

  const MASS_PROPS = [
    { name: "Bag", path: "Objects/bag.obj" },
    { name: "Chair", path: "Objects/chair.obj" },
    { name: "House 1", path: "Objects/house1.obj" },
    { name: "House 2", path: "Objects/house2.obj" },
    { name: "Wall", path: "Objects/wall.obj" }
  ];

  const OUTDOOR_PROPS = [
    { name: "Rock Boulder", path: "Objects/Nature Objects/rock_boulder.obj" },
    { name: "Tree", path: "Objects/Nature Objects/tree.obj" }
  ];
  const ALL_PROPS = [...MASS_PROPS, ...OUTDOOR_PROPS];
  const PROP_TEXTURE_SETS = [
    { id: "advanced_chair", label: "Advanced Chair", dir: "Textures/advanced_chair" },
    { id: "bag", label: "Bag", dir: "Textures/bag" },
    { id: "barrell", label: "Barrell", dir: "Textures/barrell" },
    { id: "basic_house", label: "Basic House", dir: "Textures/basic_house" },
    { id: "Bed", label: "Bed", dir: "Textures/Bed" },
    { id: "bookshelf", label: "Bookshelf", dir: "Textures/bookshelf" },
    { id: "bookshelf_2", label: "Bookshelf 2", dir: "Textures/bookshelf_2" },
    { id: "Bowl", label: "Bowl", dir: "Textures/Bowl" },
    { id: "bowl2", label: "Bowl 2", dir: "Textures/bowl2" },
    { id: "castle_gate", label: "Castle Gate", dir: "Textures/castle_gate" },
    { id: "castle_pillar", label: "Castle Pillar", dir: "Textures/castle_pillar" },
    { id: "castle_wall", label: "Castle Wall", dir: "Textures/castle_wall" },
    { id: "castle_wall2", label: "Castle Wall 2", dir: "Textures/castle_wall2" },
    { id: "chair_stool", label: "Chair Stool", dir: "Textures/chair_stool" },
    { id: "crate", label: "Crate", dir: "Textures/crate" },
    { id: "house", label: "House", dir: "Textures/house" },
    { id: "light_post", label: "Light Post", dir: "Textures/light_post" },
    { id: "Mushroom_Large", label: "Mushroom Large", dir: "Textures/Mushroom_Large" },
    { id: "orb_display_box", label: "Orb Display Box", dir: "Textures/orb_display_box" },
    { id: "picture_frame", label: "Picture Frame", dir: "Textures/picture_frame" },
    { id: "plant", label: "Plant", dir: "Textures/plant" },
    { id: "Rock", label: "Rock", dir: "Textures/Rock" },
    { id: "sign_post", label: "Sign Post", dir: "Textures/sign_post" },
    { id: "Table", label: "Table", dir: "Textures/Table" },
    { id: "teleportation", label: "Teleportation", dir: "Textures/teleportation" },
    { id: "torch_lamp", label: "Torch Lamp", dir: "Textures/torch_lamp" },
    { id: "tower", label: "Tower", dir: "Textures/tower" },
    { id: "tree", label: "Tree", dir: "Textures/tree" },
    { id: "tree1", label: "Tree 1", dir: "Textures/tree1" },
    { id: "wooden_gate", label: "Wooden Gate", dir: "Textures/wooden_gate" }
  ];
  const DEFAULT_PROP_TEXTURE_SETS = {
    "Objects/bag.obj": "bag",
    "Objects/chair.obj": "advanced_chair",
    "Objects/house1.obj": "basic_house",
    "Objects/house2.obj": "house",
    "Objects/wall.obj": "castle_wall",
    "Objects/Nature Objects/flowerc.obj": "plant",
    "Objects/Nature Objects/rock_boulder.obj": "Rock",
    "Objects/Nature Objects/shroom.obj": "Mushroom_Large",
    "Objects/Nature Objects/tree.obj": "tree1"
  };

  const MALE_AVATARS = [
    { name: "Male Idle", path: "styles/Avatars/Male Idle.fbx" },
    { name: "Male Punch", path: "styles/Avatars/Male Punch.fbx" },
    { name: "Male Walk", path: "styles/Avatars/Male Walk.fbx" }
  ];

  const MOVE_SFX = "assets/SFX/Move.mp3";

  function getOBJLoader() {
    if (!THREE || typeof THREE.OBJLoader !== "function") {
      throw new Error("OBJLoader is not available.");
    }

    if (!objLoader) {
      objLoader = new THREE.OBJLoader();
    }

    return objLoader;
  }

  function getFBXLoader() {
    if (!THREE || typeof THREE.FBXLoader !== "function") {
      throw new Error("FBXLoader is not available.");
    }

    if (!fbxLoader) {
      fbxLoader = new THREE.FBXLoader();
    }

    return fbxLoader;
  }

  function getTextureLoader() {
    if (!THREE || typeof THREE.TextureLoader !== "function") {
      throw new Error("TextureLoader is not available.");
    }

    if (!textureLoader) {
      textureLoader = new THREE.TextureLoader();
    }

    return textureLoader;
  }

  function applyMeshShadows(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  function ensureUv2(geometry) {
    if (
      geometry &&
      geometry.attributes &&
      geometry.attributes.uv &&
      !geometry.attributes.uv2
    ) {
      geometry.setAttribute("uv2", geometry.attributes.uv.clone());
    }
  }

  function setTextureColorSpace(texture, isColorTexture) {
    if (!texture) {
      return;
    }

    if ("colorSpace" in texture) {
      texture.colorSpace = isColorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      return;
    }

    if ("encoding" in texture) {
      texture.encoding = isColorTexture ? THREE.sRGBEncoding : THREE.LinearEncoding;
    }
  }

  function loadTexture(url, isColorTexture) {
    return new Promise((resolve, reject) => {
      getTextureLoader().load(
        url,
        (texture) => {
          setTextureColorSpace(texture, isColorTexture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  function listTextureFiles(textureSet) {
    if (textureDirectoryCache.has(textureSet.id)) {
      return Promise.resolve(textureDirectoryCache.get(textureSet.id));
    }

    return fetch(textureSet.dir + "/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Texture directory could not be read.");
        }

        return response.text();
      })
      .then((html) => {
        const matches = Array.from(
          html.matchAll(/href="([^"]+\.(png|jpg|jpeg|webp))"/gi)
        );
        const files = matches.map((match) => decodeURIComponent(match[1]));
        textureDirectoryCache.set(textureSet.id, files);
        return files;
      });
  }

  function buildTextureMapPaths(textureSet, files) {
    const maps = {};

    files.forEach((file) => {
      const lower = file.toLowerCase();
      const url = textureSet.dir + "/" + file;

      if (lower.includes("base_color")) {
        maps.map = url;
      } else if (lower.includes("metallic")) {
        maps.metalnessMap = url;
      } else if (lower.includes("roughness")) {
        maps.roughnessMap = url;
      } else if (lower.includes("normal")) {
        maps.normalMap = url;
      } else if (lower.includes("mixed_ao") || lower.includes("_ao")) {
        maps.aoMap = url;
      } else if (lower.includes("emissive")) {
        maps.emissiveMap = url;
      }
    });

    return maps;
  }

  function getTextureSetDefinition(textureSetId) {
    return PROP_TEXTURE_SETS.find((entry) => entry.id === textureSetId) || null;
  }

  function loadTextureSetMaps(textureSetId) {
    if (!textureSetId) {
      return Promise.resolve(null);
    }

    if (textureSetCache.has(textureSetId)) {
      return Promise.resolve(textureSetCache.get(textureSetId));
    }

    const textureSet = getTextureSetDefinition(textureSetId);
    if (!textureSet) {
      return Promise.resolve(null);
    }

    return listTextureFiles(textureSet)
      .then((files) => {
        const mapPaths = buildTextureMapPaths(textureSet, files);
        const entries = Object.entries(mapPaths);
        return Promise.all(
          entries.map(([key, url]) =>
            loadTexture(url, key === "map" || key === "emissiveMap").then((texture) => [
              key,
              texture
            ])
          )
        );
      })
      .then((loadedEntries) => {
        const loadedMaps = Object.fromEntries(loadedEntries);
        textureSetCache.set(textureSetId, loadedMaps);
        return loadedMaps;
      })
      .catch((error) => {
        console.error("Failed to load texture set:", textureSetId, error);
        return null;
      });
  }

  function createTexturedMaterial(sourceMaterial, loadedMaps, geometry) {
    const material = new THREE.MeshStandardMaterial({
      color: sourceMaterial && sourceMaterial.color ? sourceMaterial.color.clone() : new THREE.Color(0xffffff),
      side:
        sourceMaterial && sourceMaterial.side !== undefined
          ? sourceMaterial.side
          : THREE.FrontSide
    });

    if (loadedMaps.map) {
      material.map = loadedMaps.map;
    }

    if (loadedMaps.metalnessMap) {
      material.metalnessMap = loadedMaps.metalnessMap;
      material.metalness = 1;
    }

    if (loadedMaps.roughnessMap) {
      material.roughnessMap = loadedMaps.roughnessMap;
      material.roughness = 1;
    }

    if (loadedMaps.normalMap) {
      material.normalMap = loadedMaps.normalMap;
      material.normalScale.set(1, -1);
    }

    if (loadedMaps.aoMap) {
      ensureUv2(geometry);
      material.aoMap = loadedMaps.aoMap;
      material.aoMapIntensity = 1;
    }

    if (loadedMaps.emissiveMap) {
      material.emissiveMap = loadedMaps.emissiveMap;
      material.emissive = new THREE.Color(0xffffff);
      material.emissiveIntensity = 0.8;
    }

    material.needsUpdate = true;
    return material;
  }

  function applyTextureSetToObject(object, textureSetId) {
    if (!textureSetId) {
      return Promise.resolve();
    }

    return loadTextureSetMaps(textureSetId).then((loadedMaps) => {
      if (!loadedMaps) {
        return;
      }

      object.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        const sourceMaterial = Array.isArray(child.material)
          ? child.material[0]
          : child.material;
        child.material = createTexturedMaterial(sourceMaterial, loadedMaps, child.geometry);
        child.castShadow = true;
        child.receiveShadow = true;
      });
    });
  }

  function getDefaultTextureSetForProp(propPath) {
    return DEFAULT_PROP_TEXTURE_SETS[propPath] || null;
  }

  function loadOBJProp(path, onLoad, onError) {
    try {
      getOBJLoader().load(
        path,
        (object) => {
          applyMeshShadows(object);
          onLoad(object);
        },
        undefined,
        (error) => {
          console.error("Failed to load OBJ prop:", path, error);
          if (typeof onError === "function") {
            onError(error);
          }
        }
      );
    } catch (error) {
      console.error("OBJ prop loader unavailable:", error);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  }

  function loadFBXAvatar(path, onLoad, onError) {
    try {
      getFBXLoader().load(
        path,
        (object) => {
          applyMeshShadows(object);
          onLoad(object);
        },
        undefined,
        (error) => {
          console.error("Failed to load FBX avatar:", path, error);
          if (typeof onError === "function") {
            onError(error);
          }
        }
      );
    } catch (error) {
      console.error("FBX avatar loader unavailable:", error);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  }

  window.MASS_PROPS = MASS_PROPS;
  window.OUTDOOR_PROPS = OUTDOOR_PROPS;
  window.ALL_PROPS = ALL_PROPS;
  window.PROP_TEXTURE_SETS = PROP_TEXTURE_SETS;
  window.getDefaultTextureSetForProp = getDefaultTextureSetForProp;
  window.applyTextureSetToObject = applyTextureSetToObject;
  window.MALE_AVATARS = MALE_AVATARS;
  window.MOVE_SFX = MOVE_SFX;
  window.loadOBJProp = loadOBJProp;
  window.loadFBXAvatar = loadFBXAvatar;
})();
