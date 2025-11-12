document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector("a-scene");
  const mindarSystem = scene.systems["mindar-image"];

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
      mediaPlane.setAttribute("visible", "false");
      marker.appendChild(mediaPlane);

      // --- Play button overlay ---
      playButton = document.createElement("a-image");
      playButton.setAttribute("src", "#preview-image");
      playButton.setAttribute("class", "clickable");
      playButton.setAttribute("position", "0 0 0.01");
      playButton.setAttribute("scale", "0.2 0.2 0.2");
      playButton.setAttribute("visible", "false");
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

      // --- Sync button with actual play state ---
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
        mediaPlane.setAttribute("visible", "true");
        mediaPlane.object3D.visible = true;
        mediaPlane.setAttribute("material", `src: #media-${index}; transparent: true; opacity: 1`);

        // FIX: proper visibility + playback check
        if (assetEl.paused || assetEl.ended) {
          playButton.setAttribute("visible", "true");
        } else {
          playButton.setAttribute("visible", "false");
        }
      } else if (media.type === "audio") {
        assetEl.play();
      }
    });

    marker.addEventListener("targetLost", () => {
      hideMedia();
    });

    // --- Hide instantly ---
    const hideMedia = () => {
      try {
        assetEl.pause();
        assetEl.currentTime = 0;
      } catch (e) {
        console.warn("pause/reset error:", e);
      }

      if (media.type === "video") {
        mediaPlane.object3D.visible = false;
        mediaPlane.setAttribute("visible", "false");

        playButton.object3D.visible = false;
        playButton.setAttribute("visible", "false");

        // clear material to remove ghost frame
        mediaPlane.removeAttribute("material");
        mediaPlane.setAttribute("material", "transparent: true; opacity: 0;");
      }
    };

    // --- Continuous check per frame ---
    scene.addEventListener("renderstart", () => {
      scene.addEventListener("tick", () => {
        const target = mindarSystem?.controller?.imageTrackers?.[index];
        const isVisible = target?.visible;

        // FIX: use correct visibility check
        const currentlyVisible =
          mediaPlane?.object3D.visible || mediaPlane?.getAttribute("visible") === "true";

        if (!isVisible && currentlyVisible) {
          hideMedia();
        }
      });
    });

    scene.appendChild(marker);
  });
});
