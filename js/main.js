document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");
  const mindarSystem = scene.systems["mindar-image"]; // MindAR system reference

  Object.keys(MEDIA_MAP).forEach((key) => {
    const media = MEDIA_MAP[key];
    const index = parseInt(key);

    let assetEl;

    // --- Create asset (video or audio) ---
    if (media.type === "video") {
      assetEl = document.createElement("video");
      assetEl.setAttribute("id", `media-${index}`);
      assetEl.setAttribute("src", media.url);
      assetEl.setAttribute("preload", "auto");
      assetEl.setAttribute("playsinline", "true");
      assetEl.setAttribute("webkit-playsinline", "true");
      assetEl.setAttribute("crossorigin", "anonymous");
      assetEl.setAttribute("loop", "true");
      assetEl.style.display = "none";
    } else if (media.type === "audio") {
      assetEl = document.createElement("audio");
      assetEl.setAttribute("id", `media-${index}`);
      assetEl.setAttribute("src", media.url);
      assetEl.setAttribute("preload", "auto");
      assetEl.setAttribute("crossorigin", "anonymous");
      assetEl.setAttribute("loop", "true");
    }

    scene.appendChild(assetEl);

    // --- Marker entity ---
    const marker = document.createElement("a-entity");
    marker.setAttribute("mindar-image-target", `targetIndex: ${index}`);

    let playButton;
    let mediaPlane;

    if (media.type === "video") {
      // --- Video plane ---
      mediaPlane = document.createElement("a-plane");
      mediaPlane.setAttribute("id", `media-plane-${index}`);
      mediaPlane.setAttribute("material", `src: #media-${index}; transparent: true; opacity: 1`);
      mediaPlane.setAttribute("width", "1");
      mediaPlane.setAttribute("height", "0.6");
      mediaPlane.object3D.visible = false;
      marker.appendChild(mediaPlane);

      // --- Play button overlay ---
      playButton = document.createElement("a-image");
      playButton.setAttribute("src", "#preview-image");
      playButton.setAttribute("class", "clickable");
      playButton.setAttribute("position", "0 0 0.01");
      playButton.setAttribute("scale", "0.2 0.2 0.2");
      playButton.object3D.visible = false;
      marker.appendChild(playButton);

      // --- Click handler ---
      playButton.addEventListener("click", async () => {
        if (assetEl.paused) {
          try {
             playButton.setAttribute("visible", "false");
            await assetEl.play();
          } catch (err) {
            console.warn("Autoplay error:", err);
          }
        }
      });

      // Sync button with actual play state
      assetEl.addEventListener("playing", () => {
        playButton.setAttribute("visible", "false");
      });
      assetEl.addEventListener("pause", () => {
        if (mediaPlane.object3D.visible) {
          playButton.setAttribute("visible", "true");
        }
      });
    }

    // --- Marker logic ---
    marker.addEventListener("targetFound", () => {
  if (media.type === "video") {
    mediaPlane.object3D.visible = true;
    mediaPlane.setAttribute("material", `src: #media-${index}; transparent: true; opacity: 1`);

    // --- FIX: check if video is already playing ---
    if (assetEl.paused) {
      playButton.object3D.visible = true;
    } else {
      playButton.object3D.visible = false;
    }
  } else if (media.type === "audio") {
    assetEl.play();
  }
});

    marker.addEventListener("targetLost", () => {
      // (Still used as backup in case heartbeat missed a frame)
      hideMedia();
    });

    // --- Instant hide heartbeat check ---
    const hideMedia = () => {
      assetEl.pause();
      assetEl.currentTime = 0;
      if (media.type === "video") {
        mediaPlane.object3D.visible = false;
        playButton.object3D.visible = false;
        mediaPlane.removeAttribute("material");
        mediaPlane.setAttribute("material", "transparent: true; opacity: 0;");
      }
    };

    // Check each frame if marker is actually visible
    scene.addEventListener("renderstart", () => {
      scene.addEventListener("tick", () => {
        const target = mindarSystem?.controller?.imageTrackers?.[index];
        const isVisible = target?.visible;
        if (!isVisible && mediaPlane?.object3D.visible) {
          hideMedia();
        }
      });
    });

    scene.appendChild(marker);
  });
});
