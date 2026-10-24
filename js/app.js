(function () {
  const screens = window.YUI_SCREENS;
  const groupOrder = window.YUI_GROUP_ORDER;
  const toEnglish = window.YUI_TO_ENGLISH;
  const phone = document.querySelector("#phone-screen");
  const treeNav = document.querySelector("#tree-nav");
  const previewTitle = document.querySelector("#preview-title");
  const routeLabel = document.querySelector("#route-label");
  const purpose = document.querySelector("#screen-purpose");
  const entry = document.querySelector("#screen-entry");
  const exits = document.querySelector("#screen-exits");
  const events = document.querySelector("#screen-events");
  const eventLog = document.querySelector("#event-log");
  const screenCount = document.querySelector("#screen-count");
  const languageToggle = document.querySelector("#language-toggle");

  const state = {
    current: "devices/list",
    connectionModel: "s601",
    wifiStatus: "progress",
    wifiSession: 0,
    lightOn: true,
    brightness: 3,
    deviceName: "客厅的 S601",
    deviceNameEdited: false,
    deviceNames: {},
    deviceLights: { s602: { lightOn: true, brightness: 3 } },
    removedDevices: [],
    connections: { s601: true, s602: false, n86: false },
    discoveredDevices: [],
    discoveryActive: false,
    discoverySession: 0,
    carouselPositions: {},
    language: "en",
    log: []
  };
  const bluetoothDeviceIds = ["s601", "s602", "n86"];
  const searchProductLibrary = [
    { id: "s601", label: "S601", name: "YUI S601", art: "./assets/s601-empty-state.svg?v=5", opticalScale: .96, icon: "S6", route: "bluetooth/connecting", protocol: "Bluetooth" },
    { id: "s602", label: "S602", name: "YUI S602", art: "./assets/s602-shape.svg?v=5", opticalScale: 1.06, icon: "S6", route: "bluetooth/connecting-s602", protocol: "Bluetooth" },
    { id: "n86", label: "N86", name: "YUI N86", art: "./assets/n86-shape.svg?v=10", opticalScale: 1.08, icon: "N", route: "bluetooth/connecting-n86", protocol: "Bluetooth" }
  ];
  const searchTiming = {
    firstResult: 9000,
    nodeExit: 680,
    foundEntrance: 850,
    timeout: 12000,
    foundPreviewStart: 360,
    foundPreviewGap: 1050,
    subsequentGap: 3000,
    subsequentJitter: 1600
  };
  const discoveryTimers = new Set();
  let renderedRoute = null;
  let connectionCleanup = null;
  let homeSceneCleanup = null;
  let wifiCleanup = null;
  let wifiResult = null;
  let searchRadarCleanup = null;
  let searchRadarController = null;

  const localize = value => state.language === "en" ? toEnglish(value) : value;
  const controlModel = () => state.current.startsWith("device/") ? state.current.split("/")[1] : "s601";
  const currentLighting = () => controlModel() === "s602" ? state.deviceLights.s602 : state;
  const defaultDeviceName = model => ({s601:"Sunset · YUI 601",s602:"Sunset · YUI 602",n86:"Speaker · YUI N86"})[model];
  const shuffle = values => [...values].sort(() => Math.random() - .5);

  function syncLanguageToggle() {
    const isEnglish = state.language === "en";
    languageToggle.textContent = isEnglish ? "中文" : "EN";
    languageToggle.setAttribute("aria-label", isEnglish ? "切换为中文" : "Switch to English");
    document.documentElement.lang = isEnglish ? "en" : "zh-CN";
  }

  function buildTree() {
    const grouped = Object.entries(screens).reduce((acc, [id, screen]) => {
      (acc[screen.group] ||= []).push([id, screen]);
      return acc;
    }, {});

    treeNav.innerHTML = groupOrder.map(group => `
      <section class="tree-group">
        <button class="tree-group-title" type="button">${group}</button>
        <div class="tree-items">
          ${(grouped[group] || []).map(([id, screen]) => id === "wifi/progress"
            ? [["progress", "N86 配网中"], ["success", "N86 配网成功"], ["timeout", "N86 配网失败"]].map(([status, label]) => `
              <button class="tree-link" type="button" data-wifi-preview="${status}"><span>${label}</span><span class="tree-state" aria-hidden="true"></span></button>`).join("")
            : `
            <button class="tree-link" type="button" data-tree-nav="${id}">
              <span>${screen.title}</span><span class="tree-state" aria-hidden="true"></span>
            </button>`).join("")}
        </div>
      </section>`).join("");

    screenCount.textContent = `${Object.keys(screens).length + 2} 个页面与状态`;
  }

  function currentFromHash() {
    let id = location.hash.replace(/^#\/?/, "");
    if (id === "device/s601-offline") {
      id = "bluetooth/connecting";
      history.replaceState(null, "", `#/${id}`);
    }
    const legacy = { "wifi/ready": "wifi/list", "wifi/success": "wifi/progress", "wifi/timeout": "wifi/progress" };
    if (legacy[id]) {
      state.wifiStatus = id === "wifi/success" ? "success" : id === "wifi/timeout" ? "timeout" : "progress";
      id = legacy[id];
      history.replaceState(null, "", `#/${id}`);
    }
    return screens[id] ? id : "devices/list";
  }

  function navigate(id, options = {}) {
    if (!screens[id]) return;
    if (id === "wifi/progress" && !options.preserveWifiState) state.wifiStatus = "progress";
    if (options.replace) {
      history.replaceState(null, "", `#/${id}`);
      render();
    } else if (currentFromHash() === id) {
      render();
    } else {
      location.hash = `/${id}`;
    }
  }

  function render() {
    wifiCleanup?.();
    wifiCleanup = null;
    wifiResult = null;
    const id = currentFromHash();
    const screen = screens[id];
    if (renderedRoute === null && /^device\/(s601|s602|n86)$/.test(id)) state.connections[id.split("/")[1]] = true;
    const routeChanged = renderedRoute !== id;
    if (renderedRoute === "wifi/progress" && id !== "wifi/progress") {
      if (state.wifiStatus === "progress") addLog("wifi.provision.cancel", "session=" + state.wifiSession);
      state.wifiSession += 1;
    }
    connectionCleanup?.();
    connectionCleanup = null;
    homeSceneCleanup?.();
    homeSceneCleanup = null;
    searchRadarCleanup?.();
    searchRadarCleanup = null;
    searchRadarController = null;
    state.current = id;
    phone.innerHTML = localize(screen.render(state));
    phone.querySelectorAll("[data-control-name], [data-device-name-key]").forEach(node => {
      const model = node.dataset.controlName || node.dataset.deviceNameKey;
      if (state.deviceNames[model]) node.textContent = state.deviceNames[model];
      else if (node.hasAttribute("data-control-name")) node.textContent = defaultDeviceName(model);
    });
    previewTitle.textContent = localize(screen.title);
    routeLabel.textContent = `#/${id}`;
    purpose.textContent = screen.purpose;
    renderHandoff(screen);
    entry.textContent = screen.entry;
    exits.innerHTML = screen.exits.map(item => `<span class="tag">${item}</span>`).join("");
    events.innerHTML = screen.events.map(item => `<span class="code-chip">${item}</span>`).join("");
    syncFoundDevices();
    document.querySelectorAll("[data-tree-nav]").forEach(button => {
      button.classList.toggle("active", button.dataset.treeNav === id);
    });
    const activeTreeItem = document.querySelector(`[data-tree-nav="${CSS.escape(id)}"]`);
    activeTreeItem?.scrollIntoView({ block: "nearest" });
    bindScreenEvents();
    const homeScene = phone.querySelector(".s602-home-scene, .device-tile.device-n86");
    if (homeScene) {
      // Inline only our authored scene assets, keeping the static image as a fallback.
      // Parent CSS can then pause every SVG animation with the scene lifecycle.
      const sceneImage = homeScene.querySelector("img[data-animate-scene]");
      if (sceneImage) fetch(sceneImage.src)
        .then(response => { if (!response.ok) throw new Error("Scene unavailable"); return response.text(); })
        .then(source => {
          if (!sceneImage.isConnected) return;
          const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
          if (parsed.querySelector("parsererror")) return;
          const svg = parsed.documentElement;
          svg.setAttribute("class", "s602-home-background");
          svg.setAttribute("aria-hidden", "true");
          svg.setAttribute("preserveAspectRatio", "none");
          sceneImage.replaceWith(document.importNode(svg, true));
        }).catch(() => { /* The original static scene stays visible. */ });
      let visible = false;
      let duckTimer = null;
      let duckAnimation = null;
      let disposed = false;
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
      const head = homeScene.querySelector(".reading-head");
      const canDuck = () => head && visible && !document.hidden && state.connections.n86 && !reducedMotion.matches;
      const scheduleDuck = () => {
        if (disposed || !canDuck() || duckTimer || duckAnimation) return;
        duckTimer = setTimeout(() => {
          duckTimer = null;
          if (!canDuck()) return;
          homeScene.classList.add("is-peeking");
          duckAnimation = head.animate([
            { transform: "translateY(0)", offset: 0, easing: "ease-in-out" },
            { transform: "translateY(27px)", offset: .3 },
            { transform: "translateY(27px)", offset: .7, easing: "ease-in-out" },
            { transform: "translateY(0)", offset: 1 }
          ], { duration: 2500 });
          duckAnimation.onfinish = () => {
            duckAnimation = null;
            homeScene.classList.remove("is-peeking");
            scheduleDuck();
          };
        }, 3000 + Math.random() * 3000);
      };
      const sync = () => {
        homeScene.classList.toggle("is-scene-visible", visible && !document.hidden);
        if (!canDuck()) {
          clearTimeout(duckTimer); duckTimer = null;
          if (reducedMotion.matches || !state.connections.n86) {
            duckAnimation?.cancel(); duckAnimation = null;
            homeScene.classList.remove("is-peeking");
          } else { duckAnimation?.pause(); }
        } else {
          if (duckAnimation?.playState === "paused") duckAnimation.play();
          scheduleDuck();
        }
      };
      reducedMotion.addEventListener("change", sync);
      homeScene.addEventListener("connection-state-change", sync);
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
      });
      observer.observe(homeScene);
      const look = event => {
        if (!head || !state.connections.n86) return;
        const box = head.ownerSVGElement.getBoundingClientRect();
        const dx = Math.max(-5, Math.min(5, (event.clientX - box.left - box.width / 2) / 24));
        const dy = Math.max(-3, Math.min(3, (event.clientY - box.top - box.height / 3) / 30));
        homeScene.style.setProperty("--gaze-x", dx + "px");
        homeScene.style.setProperty("--gaze-y", dy + "px");
      };
      const center = () => {
        homeScene.style.setProperty("--gaze-x", "0px");
        homeScene.style.setProperty("--gaze-y", "0px");
      };
      phone.addEventListener("pointermove", look);
      phone.addEventListener("pointerleave", center);
      phone.addEventListener("pointerup", center);
      document.addEventListener("visibilitychange", sync);
      homeSceneCleanup = () => {
        disposed = true;
        clearTimeout(duckTimer);
        duckAnimation?.cancel();
        reducedMotion.removeEventListener("change", sync);
        homeScene.removeEventListener("connection-state-change", sync);
        phone.removeEventListener("pointermove", look);
        phone.removeEventListener("pointerleave", center);
        phone.removeEventListener("pointerup", center);
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
      };
    }
    searchRadarCleanup = startSearchRadar();
    if (id === "add/search" && routeChanged) startAutomaticDiscovery({ reset: true });
    if (id === "add/found" && routeChanged) startFoundDevicePreview();
    if (routeChanged) {
      const routeHeading = phone.querySelector(".screen-topbar h2, .sunset-product-copy h2, .center-state h3, .empty-state h3");
      if (routeHeading) {
        routeHeading.classList.add("route-focus-target");
        routeHeading.tabIndex = -1;
        requestAnimationFrame(() => routeHeading.focus({ preventScroll: true }));
      }
    }
    renderedRoute = id;
    connectionCleanup = startConnectionPreview();
    if (id === "wifi/progress") {
      if (routeChanged && state.wifiStatus === "progress") {
        state.wifiSession += 1;
        addLog("wifi.provision.start", "session=" + state.wifiSession);
      }
      wifiCleanup = startWifiPreview(state.wifiStatus);
    }
    syncWifiPreview();
  }

  function renderHandoff(screen) {
    for (const key of ['conditions', 'behavior', 'exceptions', 'demo']) {
      document.getElementById('handoff-' + key).textContent = screen.handoff?.[key] || '待补充';
    }
  }

  function syncWifiPreview() {
    const selectedState = phone.querySelector("[data-wifi-flow]")?.dataset.wifiPreview || state.wifiStatus;
    document.querySelectorAll("[data-wifi-preview]").forEach(button => {
      button.classList.toggle("active", state.current === "wifi/progress" && button.dataset.wifiPreview === selectedState);
    });
  }

  function setWifiState(status, preview = false) {
    if (!["progress", "success", "timeout"].includes(status)) return;
    if (!preview && status !== "progress" && state.wifiStatus !== "progress") return;
    if (!preview && status !== "progress" && wifiResult) { wifiResult(status); return; }
    const previous = state.wifiStatus;
    state.wifiStatus = status;
    const page = phone.querySelector("[data-wifi-flow]");
    if (!page) { navigate("wifi/progress", { preserveWifiState: true }); return; }
    if (status === "progress") {
      state.wifiSession += 1;
      if (previous === "timeout") addLog("wifi.provision.retry");
      addLog("wifi.provision.start", "session=" + state.wifiSession);
    } else {
      addLog("wifi.provision." + status, "session=" + state.wifiSession + (preview ? "; preview=true" : "; simulated=true"));
    }
    // Keep the flow root and URL stable; only swap the existing state's content.
    wifiCleanup?.();
    wifiCleanup = startWifiPreview(status);
    syncWifiPreview();
    const heading = page.querySelector(".center-state h3");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }

  function startWifiPreview(initial) {
    const page = phone.querySelector("[data-wifi-flow]");
    if (!page) return null;
    // Keep the selected failure preview highlighted during its lead-in animation.
    page.dataset.wifiPreview = initial === "timeout" ? "timeout" : "";
    const stage = page.querySelector(".connection-art-stage");
    const water = page.querySelector(".connection-water-rise");
    const active = page.querySelector(".connection-active-art");
    const title = page.querySelector("[data-wifi-title]");
    const body = page.querySelector("[data-wifi-body]");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let eyes = stage.querySelector(".wifi-eyes");
    if (!eyes) {
      stage.insertAdjacentHTML("beforeend", `<svg class="wifi-eyes" viewBox="0 0 240 190" aria-hidden="true"><circle cx="96" cy="52" r="20" fill="#FFFDF8"/><circle cx="144" cy="52" r="20" fill="#FFFDF8"/><g class="wifi-pupils"><circle cx="96" cy="52" r="8" fill="#2E2A26"/><circle cx="144" cy="52" r="8" fill="#2E2A26"/><circle cx="99" cy="49" r="2" fill="#FFFDF8"/><circle cx="147" cy="49" r="2" fill="#FFFDF8"/></g></svg>`);
      eyes = stage.querySelector(".wifi-eyes");
    }
    const pupils = eyes.querySelector(".wifi-pupils");
    if (!eyes.querySelector(".wifi-crying")) {
      eyes.insertAdjacentHTML("beforeend", `<g class="wifi-crying">
        <g class="wifi-watery-gaze"><ellipse cx="97" cy="52" rx="11" ry="12" fill="#2E2A26"/><ellipse cx="143" cy="52" rx="11" ry="12" fill="#2E2A26"/>
        <g class="wifi-watery-glints" fill="#FFFDF8"><circle cx="94" cy="47" r="4"/><circle cx="101" cy="54" r="2.5"/><circle cx="93" cy="58" r="1.5"/><circle cx="140" cy="47" r="4"/><circle cx="147" cy="54" r="2.5"/><circle cx="139" cy="58" r="1.5"/></g></g>
        <g class="wifi-tear wifi-tear-left"><path d="M87 58C85 61 81 64 82 68C83 72 89 72 91 68C93 64 89 61 87 58Z" fill="#A7CDD7"/></g>
        <g class="wifi-tear wifi-tear-right"><path d="M153 58C151 61 147 64 148 68C149 72 155 72 157 68C159 64 155 61 153 58Z" fill="#A7CDD7"/></g>
      </g>`);
    }
    const look = event => {
      if (reduced || page.classList.contains("is-failed")) return;
      const box = eyes.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height * 52 / 190);
      const length = Math.max(1, Math.hypot(dx, dy));
      const amount = Math.min(6, length / 30);
      pupils.style.transform = `translate(${dx / length * amount}px, ${dy / length * amount}px)`;
    };
    const center = () => { pupils.style.transform = "translate(0px,0px)"; };
    phone.addEventListener("pointermove", look);
    phone.addEventListener("pointerleave", center);
    phone.addEventListener("pointerup", center);
    let frame = 0, timer = 0, stopped = false, result = null, y = 195, speed = 0, previousTime = 0, onlineStage = false;
    let confettiCleanup = () => {};
    const began = performance.now();
    page.classList.remove("is-connected", "is-failed", "is-drained");
    active.classList.remove("device-on");
    const show = status => {
      state.wifiStatus = status;
      page.dataset.wifiStatus = status;
      syncWifiPreview();
      if (status === "progress") {
        title.textContent = state.language === "en" ? "Connecting…" : "正在连接网络";
        body.innerHTML = localize(`<p>请保持手机、音箱和路由器距离较近。</p><div class="progress-steps"><div class="progress-step complete"><span class="progress-dot">✓</span><div class="progress-copy"><strong>连接设备</strong><span>已完成</span></div></div><div class="progress-step active"><span class="progress-dot">2</span><div class="progress-copy"><strong>配置网络</strong><span>正在将网络信息发送到 N86</span></div></div><div class="progress-step"><span class="progress-dot">3</span><div class="progress-copy"><strong>确认在线</strong><span>等待开始</span></div></div></div>`);
      } else {
        const success = status === "success";
        title.textContent = state.language === "en" ? (success ? "N86 is connected" : "Couldn't connect") : (success ? "N86 已连接网络" : "配网没有成功");
        body.innerHTML = `<p role="status">${state.language === "en" ? (success ? "Connected to YUI_Studio_WiFi." : "Check Wi-Fi and keep N86 near your router, then try again.") : (success ? "已连接到 YUI_Studio_WiFi。" : "请确认 Wi-Fi 可用，并让 N86 靠近路由器后重试。")}</p><div class="button-stack"><button class="primary-button" type="button" data-wifi-main>${state.language === "en" ? (success ? "Open" : "Try Again") : (success ? "进入设备" : "再试一次")}</button>${success ? "" : `<button class="text-button" type="button" data-wifi-other>${state.language === "en" ? "Choose another network" : "选择其他网络"}</button>`}</div>`;
        body.querySelector("[data-wifi-main]").onclick = () => success ? navigate("device/n86") : setWifiState("progress");
        body.querySelector("[data-wifi-other]")?.addEventListener("click", () => navigate("wifi/list"));
        page.classList.toggle("is-failed", !success);
        if (success) {
          state.connections.n86 = true;
          state.removedDevices = state.removedDevices.filter(id => id !== "n86");
          page.classList.add("is-connected"); active.classList.add("device-on");
          confettiCleanup = celebrateConnection(page);
        }
        addLog("wifi.provision." + status, "session=" + state.wifiSession + "; simulated=true");
      }
    };
    const accept = status => {
      if (stopped || result || !["success", "timeout"].includes(status)) return;
      clearTimeout(timer);
      result = { status, start: performance.now(), y, speed };
    };
    wifiResult = accept;
    const tick = now => {
      if (stopped) return;
      if (!onlineStage && !result && initial !== "timeout" && now - began >= 1500) {
        onlineStage = true;
        const steps = body.querySelectorAll(".progress-step");
        steps[1]?.classList.replace("active", "complete");
        if (steps[1]) {
          steps[1].querySelector(".progress-dot").textContent = "✓";
          steps[1].querySelector(".progress-copy span").textContent = state.language === "en" ? "Done" : "已完成";
        }
        steps[2]?.classList.add("active");
        if (steps[2]) steps[2].querySelector(".progress-copy span").textContent = state.language === "en" ? "Checking connection…" : "正在确认设备在线…";
      }
      const oldY = y;
      if (!result) {
        const t = Math.min(1, (now - began) / 3850);
        y = 195 - 153 * (1 - (1-t)*(1-t));
      } else if (result.status === "success") {
        const t = Math.min(1, (now-result.start)/800), m = result.speed*800;
        y = (2*t*t*t-3*t*t+1)*result.y+(t*t*t-2*t*t+t)*m+(-2*t*t*t+3*t*t)*(-12);
        if (t === 1) { water.style.transform = "translateY(-12px)"; show("success"); return; }
      } else {
        const elapsed = now-result.start, t = Math.min(1, elapsed/200);
        y = result.y+result.speed*200*(t-t*t/2);
        if (t === 1) {
          if (!result.shown) { result.shown = true; show("timeout"); }
          const d = reduced ? 1 : Math.min(1,(elapsed-200)/900);
          y += (205-y)*d*d*(3-2*d);
          if (d === 1) { water.style.transform = "translateY(205px)"; page.classList.add("is-drained"); return; }
        }
      }
      if (previousTime) speed = (y-oldY)/(now-previousTime);
      previousTime = now;
      water.style.transform = `translateY(${reduced ? 42 : y}px)`;
      frame = requestAnimationFrame(tick);
    };
    if (initial === "success") { water.style.transform = "translateY(-12px)"; show("success"); }
    else {
      show("progress"); water.style.transform = "translateY(195px)";
      timer = setTimeout(() => accept(initial === "timeout" ? "timeout" : "success"), initial === "timeout" ? 1500 : 2200);
      frame = requestAnimationFrame(tick);
    }
    return () => { stopped = true; clearTimeout(timer); cancelAnimationFrame(frame); confettiCleanup(); phone.removeEventListener("pointermove", look); phone.removeEventListener("pointerleave", center); phone.removeEventListener("pointerup", center); wifiResult = null; };
  }

  // A real adapter can deliver a result for the active attempt; stale attempts are ignored.
  phone.addEventListener("wifi-provision-result", event => {
    if (state.current !== "wifi/progress" || event.detail?.session !== state.wifiSession) return;
    setWifiState(event.detail.status);
  });


  function celebrateConnection(page) {
    if (!window.confetti || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
    const canvas = document.createElement("canvas");
    canvas.className = "connection-confetti";
    canvas.setAttribute("aria-hidden", "true");
    page.appendChild(canvas);
    const burst = window.confetti.create(canvas, { resize: true, disableForReducedMotion: true });
    const bounds = canvas.getBoundingClientRect();
    const art = page.querySelector(".connection-art-stage").getBoundingClientRect();
    const center = (art.left + art.width / 2 - bounds.left) / bounds.width;
    const y = (art.top + art.height * .72 - bounds.top) / bounds.height;
    const paper = window.confetti.shapeFromPath({ path: "M-4-2H4Q5-2 5-1V1Q5 2 4 2H-4Q-5 2-5 1V-1Q-5-2-4-2Z" });
    const options = { particleCount: 22, spread: 58, startVelocity: 12, gravity: .38, decay: .94, ticks: 120, scalar: .95, colors: ["#FF8500", "#FFCF55", "#EAB889"], shapes: ["circle", paper], disableForReducedMotion: true };
    const stop = () => { burst.reset(); canvas.remove(); document.removeEventListener("visibilitychange", onVisibility); };
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVisibility);
    Promise.all([
      burst({ ...options, angle: 120, origin: { x: Math.max(.15, center - .18), y } }),
      burst({ ...options, angle: 60, origin: { x: Math.min(.85, center + .18), y } })
    ]).then(stop);
    return stop;
  }

  function startConnectionPreview() {
    const page = phone.querySelector("[data-connection-model]");
    if (!page) return null;
    const model = page.dataset.connectionModel;
    state.connectionModel = model;
    const active = page.querySelector(".connection-active-art");
    let eyesVisible = false;
    const syncEyes = () => page.classList.toggle("is-eye-visible", eyesVisible && !document.hidden);
    const eyeObserver = new IntersectionObserver(entries => { eyesVisible = entries[0].isIntersecting; syncEyes(); });
    eyeObserver.observe(page.querySelector(".connection-art-stage"));
    document.addEventListener("visibilitychange", syncEyes);
    const stopEyes = () => { eyeObserver.disconnect(); document.removeEventListener("visibilitychange", syncEyes); };
    if (page.dataset.connectionComplete === "true") {
      active.classList.add("device-on");
      return stopEyes;
    }
    const water = page.querySelector(".connection-water-rise");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0, stopped = false, completion = null, failure = null, lastY = 195, lastTime = 0, speed = 0;
    let celebrationCleanup = () => {};
    const began = performance.now();
    const finish = () => {
      page.dataset.connectionComplete = "true";
      page.classList.add("is-connected");
      active.classList.add("device-on");
      celebrationCleanup = celebrateConnection(page);
      page.querySelector("[data-connection-title]").textContent = model.toUpperCase() + (state.language === "en" ? " · Connected" : " · 已连接");
      page.querySelector("[data-connection-copy]").textContent = state.language === "en" ? "Ready when you are." : "设备已就绪，开始使用吧。";
      const button = page.querySelector("[data-action]");
      button.dataset.action = "open-connected";
      button.textContent = state.language === "en" ? "Open" : "进入设备";
      button.classList.replace("secondary-button", "primary-button");
      bluetoothDeviceIds.forEach(id => state.connections[id] = id === model);
      state.removedDevices = state.removedDevices.filter(id => id !== model);
      // replaceState updates the route without replacing the phone DOM.
      history.replaceState(null, "", "#/bluetooth/success");
      state.current = renderedRoute = "bluetooth/success";
      const screen = screens[state.current];
      previewTitle.textContent = localize(screen.title);
      routeLabel.textContent = "#/bluetooth/success";
      purpose.textContent = screen.purpose;
      renderHandoff(screen);
      entry.textContent = screen.entry;
      exits.innerHTML = screen.exits.map(x => `<span class="tag">${x}</span>`).join("");
      events.innerHTML = screen.events.map(x => `<span class="code-chip">${x}</span>`).join("");
      treeNav.querySelectorAll("[data-tree-nav]").forEach(b => b.classList.toggle("active", b.dataset.treeNav === state.current));
      addLog("bluetooth.connect.success", "model=" + model.toUpperCase());
    };
    const fail = () => {
      page.classList.add("is-failed");
      page.querySelector("[data-connection-title]").textContent = state.language === "en" ? "Couldn't connect" : "没有连接成功";
      page.querySelector("[data-connection-copy]").textContent = state.language === "en" ? "Keep your device nearby and ready to connect, then try again." : "请让设备保持在附近并准备好连接，然后重试。";
      const button = page.querySelector("[data-action]");
      button.dataset.action = "retry-bluetooth";
      button.textContent = state.language === "en" ? "Try Again" : "再试一次";
      button.classList.replace("secondary-button", "primary-button");
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "text-button connection-cancel";
      cancel.dataset.action = "cancel-bluetooth";
      cancel.textContent = state.language === "en" ? "Cancel" : "取消";
      cancel.addEventListener("click", event => handleAction("cancel-bluetooth", event));
      button.parentElement.appendChild(cancel);
      history.replaceState(null, "", "#/bluetooth/error");
      state.current = renderedRoute = "bluetooth/error";
      const screen = screens[state.current];
      previewTitle.textContent = localize(screen.title);
      routeLabel.textContent = "#/bluetooth/error";
      purpose.textContent = screen.purpose;
      renderHandoff(screen);
      entry.textContent = screen.entry;
      exits.innerHTML = screen.exits.map(x => `<span class="tag">${x}</span>`).join("");
      events.innerHTML = screen.events.map(x => `<span class="code-chip">${x}</span>`).join("");
      treeNav.querySelectorAll("[data-tree-nav]").forEach(b => b.classList.toggle("active", b.dataset.treeNav === state.current));
      addLog("bluetooth.connect.failed", "model=" + model.toUpperCase());
    };
    const onFailure = event => {
      if (stopped || failure || page.dataset.connectionComplete === "true" || (event.detail?.model && event.detail.model !== model)) return;
      clearTimeout(timer);
      completion = null;
      failure = { start: performance.now(), y: lastY, velocity: speed };
    };
    const onResult = event => {
      if (stopped || completion || failure || (event.detail?.model && event.detail.model !== model)) return;
      // Hermite interpolation preserves the existing upward velocity at handoff.
      completion = { start: performance.now(), y: lastY, velocity: speed, duration: 800 };
    };
    const tick = now => {
      if (stopped) return;
      let y;
      if (failure) {
        const elapsed = now - failure.start;
        const t = Math.min(1, elapsed / 200);
        y = failure.y + failure.velocity * 200 * (t - t*t/2);
        if (t === 1) {
          if (!failure.presented) { failure.presented = true; fail(); }
          const drain = reduced ? 1 : Math.min(1, (elapsed - 200) / 900);
          const eased = drain * drain * (3 - 2 * drain);
          y += (205 - y) * eased;
          if (drain === 1) {
            water.style.transform = "translateY(205px)";
            page.classList.add("is-drained");
            return;
          }
        }
      } else if (completion) {
        const t = Math.min(1, (now - completion.start) / completion.duration);
        const m = completion.velocity * completion.duration;
        y = (2*t*t*t-3*t*t+1)*completion.y + (t*t*t-2*t*t+t)*m + (-2*t*t*t+3*t*t)*(-12);
        if (t === 1) { water.style.transform = "translateY(-12px)"; finish(); return; }
      } else {
        const t = Math.min(1, (now-began)/3850);
        y = 195 - 153*(1-Math.pow(1-t,2));
      }
      if (lastTime) speed = (y-lastY)/(now-lastTime);
      lastTime = now; lastY = y;
      water.style.transform = `translateY(${reduced ? (completion ? -12 : 42) : y}px)`;
      frame = requestAnimationFrame(tick);
    };
    page.addEventListener("bluetooth-connected", onResult);
    page.addEventListener("bluetooth-failed", onFailure);
    const failureDemo = page.dataset.failureDemo === "true";
    const timer = setTimeout(() => page.dispatchEvent(new CustomEvent(failureDemo ? "bluetooth-failed" : "bluetooth-connected", {detail:{model}})), failureDemo ? 1500 : 2200);
    frame = requestAnimationFrame(tick);
    addLog("bluetooth.connect.start", "model=" + model.toUpperCase());
    return () => { stopped = true; stopEyes(); clearTimeout(timer); cancelAnimationFrame(frame); celebrationCleanup(); page.removeEventListener("bluetooth-connected", onResult); page.removeEventListener("bluetooth-failed", onFailure); };
  }

  function addLog(eventName, payload = "") {
    const now = new Date();
    const time = now.toLocaleTimeString(state.language === "en" ? "en-GB" : "zh-CN", { hour12: false });
    state.log.unshift({ time, eventName, payload });
    state.log = state.log.slice(0, 12);
    eventLog.innerHTML = state.log.map(item => `<li><time>${item.time}</time>${item.eventName}${item.payload ? ` · ${item.payload}` : ""}</li>`).join("");
  }

  function showToast(message) {
    phone.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    phone.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  function syncConnectionCards() {
    phone.querySelectorAll("[data-device-card]").forEach(card => {
      const deviceId = card.dataset.deviceCard;
      const connected = Boolean(state.connections[deviceId]);
      card.classList.toggle("device-on", connected);
      card.classList.toggle("device-off", !connected);
      card.dispatchEvent(new Event("connection-state-change"));

      const control = card.querySelector('[data-action="toggle-connection"]');
      control?.classList.toggle("on", connected);
      control?.setAttribute("aria-pressed", String(connected));

      const art = card.querySelector("[data-device-art]");
      if (!art) return;
      const nextSource = connected && art.dataset.artOn ? art.dataset.artOn : art.dataset.artOff;
      if (nextSource && art.getAttribute("src") !== nextSource) art.setAttribute("src", nextSource);
    });
  }

  function syncFoundDevices() {
    const list = phone.querySelector("[data-found-device-list]");
    if (!list) return;
    const foundProducts = state.discoveredDevices
      .map(id => searchProductLibrary.find(product => product.id === id))
      .filter(Boolean);
    const summary = phone.querySelector("[data-found-summary]");
    const status = phone.querySelector("[data-found-scan-status]");
    if (summary) {
      summary.textContent = state.language === "en"
        ? `${foundProducts.length} nearby ${foundProducts.length === 1 ? "device" : "devices"} found.`
        : `已发现 ${foundProducts.length} 台附近设备。`;
    }
    const foundIds = new Set(foundProducts.map(product => product.id));
    list.querySelectorAll("[data-found-product]").forEach(row => {
      if (!foundIds.has(row.dataset.foundProduct)) row.remove();
    });
    foundProducts.forEach(product => {
      if (list.querySelector(`[data-found-product="${product.id}"]`)) return;
      list.insertAdjacentHTML("beforeend", `
        <button class="list-row found-device-row" type="button" data-found-product="${product.id}" data-found-nav="${product.route}">
          <span class="list-icon found-device-art found-device-art--${product.id}" aria-hidden="true"><img src="${product.art}" alt="" /></span>
          <span class="list-copy"><strong>${product.name}</strong><span>${state.language === "en" ? `Nearby · ${product.protocol}` : `附近 · ${product.protocol}`}</span></span>
          <span class="list-arrow">›</span>
        </button>`);
    });
    list.querySelectorAll("[data-found-nav]:not([data-found-bound])").forEach(button => {
      button.dataset.foundBound = "true";
      button.addEventListener("click", () => {
        addLog("device.select", button.dataset.foundNav);
        navigate(button.dataset.foundNav);
      });
    });
    if (status) status.textContent = state.discoveryActive
      ? (state.language === "en" ? "Scanning for more devices…" : "正在后台继续搜索…")
      : (state.language === "en" ? "Search complete" : "搜索完成");
    phone.querySelector(".found-scan-status")?.classList.toggle("is-complete", !state.discoveryActive);
  }

  function clearDiscoveryTimers() {
    discoveryTimers.forEach(timer => window.clearTimeout(timer));
    discoveryTimers.clear();
  }

  function scheduleDiscovery(callback, delay, session) {
    const timer = window.setTimeout(() => {
      discoveryTimers.delete(timer);
      if (state.discoverySession === session) callback();
    }, delay);
    discoveryTimers.add(timer);
  }

  function startAutomaticDiscovery({ reset = false, retry = false } = {}) {
    clearDiscoveryTimers();
    const session = ++state.discoverySession;
    if (reset) state.discoveredDevices = [];
    state.discoveryActive = true;
    syncFoundDevices();
    addLog(retry ? "device.scan.retry" : "device.scan.start");

    const simulateTimeout = new URLSearchParams(location.search).get("search-result") === "timeout";
    const remaining = simulateTimeout
      ? []
      : shuffle(searchProductLibrary.filter(product => !state.discoveredDevices.includes(product.id)));
    let elapsed = searchTiming.firstResult;
    remaining.forEach((product, index) => {
      if (index > 0) elapsed += searchTiming.subsequentGap + Math.round(Math.random() * searchTiming.subsequentJitter);
      scheduleDiscovery(() => {
        if (!state.discoveredDevices.includes(product.id)) state.discoveredDevices.push(product.id);
        addLog("device.scan.result", `model=${product.label}`);
        const isFirst = state.discoveredDevices.length === 1;
        if (isFirst && state.current === "add/search") {
          searchRadarController?.lockFound(product.id);
        }
        if (state.discoveredDevices.length === searchProductLibrary.length) state.discoveryActive = false;
        syncFoundDevices();
      }, elapsed, session);
    });

    scheduleDiscovery(() => {
      if (state.discoveredDevices.length || state.current !== "add/search") return;
      state.discoveryActive = false;
      addLog("device.scan.timeout");
      navigate("add/not-found");
    }, searchTiming.timeout, session);
  }

  function startFoundDevicePreview() {
    clearDiscoveryTimers();
    const session = ++state.discoverySession;
    state.discoveredDevices = [];
    state.discoveryActive = true;
    syncFoundDevices();

    searchProductLibrary.forEach((product, index) => {
      const delay = searchTiming.foundPreviewStart + index * searchTiming.foundPreviewGap;
      scheduleDiscovery(() => {
        state.discoveredDevices.push(product.id);
        state.discoveryActive = index < searchProductLibrary.length - 1;
        addLog("device.scan.result", `model=${product.label}`);
        syncFoundDevices();
      }, delay, session);
    });
  }

  function startSearchRadar() {
    const lineup = phone.querySelector(".search-lineup");
    const layer = lineup?.querySelector("[data-search-product-layer]");
    if (!lineup || !layer) return null;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = new Set();
    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    };
    const playFoundSpring = node => {
      if (reducedMotion || typeof node.animate !== "function") return;

      const spring = { stiffness: 220, damping: 10, mass: 1, amplitude: 22 };
      const duration = 1550;
      const entryEnd = .22;
      const samples = 72;
      const springSeconds = duration * (1 - entryEnd) / 1000;
      const decay = spring.damping / (2 * spring.mass);
      const angularFrequency = Math.sqrt((spring.stiffness / spring.mass) - decay ** 2);
      const frames = [
        { offset: 0, opacity: 0, filter: "blur(4px)", transform: "translate3d(0, 3px, 0) rotate(0deg) scale(.86)" },
        { offset: entryEnd, opacity: 1, filter: "blur(0)", transform: "translate3d(0, -5px, 0) rotate(0deg) scale(1.08)" }
      ];

      for (let index = 1; index <= samples; index += 1) {
        const progress = index / samples;
        const time = progress * springSeconds;
        const displacement = index === samples
          ? 0
          : spring.amplitude * Math.exp(-decay * time) * Math.sin(angularFrequency * time);
        frames.push({
          offset: entryEnd + (1 - entryEnd) * progress,
          opacity: 1,
          filter: "blur(0)",
          transform: `translate3d(${displacement.toFixed(3)}px, -5px, 0) rotate(${(displacement * .16).toFixed(3)}deg) scale(1.08)`
        });
      }

      node.dataset.spring = `k${spring.stiffness}-d${spring.damping}-m${spring.mass}-a${spring.amplitude}`;
      node.animate(frames, { duration, easing: "linear", fill: "both" });
    };
    const createNode = (product, order = 0) => {
      const node = document.createElement("span");
      node.className = "search-product-node";
      node.dataset.productId = product.id;
      node.dataset.label = product.label;
      node.setAttribute("aria-hidden", "true");
      node.style.setProperty("--scan-delay", `${order * -1.8}s`);
      node.style.setProperty("--optical-scale", product.opticalScale);
      node.innerHTML = `<span class="search-product-medallion"><img class="search-product-art" src="${product.art}" alt="" /></span>`;
      layer.appendChild(node);
      requestAnimationFrame(() => node.classList.add("is-visible"));
      return node;
    };
    const populate = () => {
      layer.replaceChildren();
      searchProductLibrary.forEach((product, index) => createNode(product, index));
    };
    const pinFound = productId => {
      const product = searchProductLibrary.find(item => item.id === productId) || searchProductLibrary[0];
      const node = createNode(product, 0);
      node.classList.remove("is-leaving");
      node.classList.add("is-visible", "is-found");
      requestAnimationFrame(() => playFoundSpring(node));
      return node;
    };

    const lockFound = (productId, onLocked) => {
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();

      lineup.classList.add("is-resolving");
      const visibleNodes = [...layer.querySelectorAll(".search-product-node")];
      visibleNodes.forEach(node => node.classList.add("is-leaving"));

      schedule(() => {
        visibleNodes.forEach(node => node.remove());
        const foundNode = pinFound(productId);
        lineup.classList.remove("is-resolving");
        lineup.classList.add("is-locked");
        schedule(() => onLocked?.(foundNode), reducedMotion ? 0 : searchTiming.foundEntrance);
      }, reducedMotion ? 0 : searchTiming.nodeExit);
    };

    const reset = () => {
      lineup.classList.remove("is-locked");
      lineup.classList.remove("is-resolving");
      populate();
    };

    populate();
    searchRadarController = { lockFound, reset };

    return () => {
      timers.forEach(timer => window.clearTimeout(timer));
      timers.clear();
    };
  }

  function openSheet(kind) {
    const model = controlModel();
    phone.querySelector(".sheet-layer")?.remove();
    const isRename = kind === "rename";
    const layer = document.createElement("div");
    layer.className = "sheet-layer";
    layer.innerHTML = localize(`
      <button class="sheet-scrim" type="button" data-sheet-action="close" aria-label="关闭弹层"></button>
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <span class="sheet-handle" aria-hidden="true"></span>
        ${isRename ? `
          <span class="eyebrow">设备设置</span><h3 id="sheet-title">重命名设备</h3>
          <p>使用一个容易辨认房间和产品的名称。</p>
          <div class="input-wrap sheet-input"><input id="rename-input" maxlength="24" aria-label="设备名称" /></div>
          <div class="button-stack"><button class="primary-button" type="button" data-sheet-action="save-name">保存名称</button><button class="secondary-button" type="button" data-sheet-action="close">取消</button></div>` : `
          <span class="eyebrow">设备设置</span><h3 id="sheet-title">移除此设备？</h3>
          <p>再次使用设备控制前，需要重新连接此设备。</p>
          <div class="sheet-device"><span class="permission-badge">S6</span><div><strong data-sheet-device-name></strong><small>YUI S601</small></div></div>
          <div class="button-stack"><button class="danger-button solid" type="button" data-sheet-action="confirm-remove">移除设备</button><button class="secondary-button" type="button" data-sheet-action="close">取消</button></div>`}
      </section>`);
    phone.appendChild(layer);
    const displayedName = state.deviceNames[model] || defaultDeviceName(model);
    if (isRename) layer.querySelector("#rename-input").value = displayedName;
    else layer.querySelector("[data-sheet-device-name]").textContent = displayedName;
    if (!isRename) {
      layer.querySelector(".sheet-device small").textContent = "YUI " + model.toUpperCase();
      layer.querySelector(".permission-badge").textContent = model.toUpperCase();
    }
    requestAnimationFrame(() => layer.classList.add("visible"));
    layer.querySelectorAll("[data-sheet-action]").forEach(button => {
      button.addEventListener("click", () => {
        const action = button.dataset.sheetAction;
        if (action === "close") {
          layer.classList.remove("visible");
          window.setTimeout(() => layer.remove(), 180);
        }
        if (action === "save-name") {
          const value = layer.querySelector("#rename-input").value.trim();
          if (!value) return;
          state.deviceNames[model] = value;
          if (model === "s601") { state.deviceName = value; state.deviceNameEdited = true; }
          addLog("device.rename", `name=${value}`);
          render();
          showToast(localize("设备名称已更新"));
        }
        if (action === "confirm-remove") {
          addLog("device.remove.confirm", "model=" + model.toUpperCase());
          state.connections[model] = false;
          if (!state.removedDevices.includes(model)) state.removedDevices.push(model);
          navigate("devices/list");
          window.setTimeout(() => showToast(localize("设备已从原型中移除")), 30);
        }
      });
    });
    if (isRename) window.setTimeout(() => layer.querySelector("#rename-input")?.select(), 220);
  }

  function bindScreenEvents() {
    phone.querySelectorAll("[data-wifi-state]").forEach(button => {
      button.addEventListener("click", () => setWifiState(button.dataset.wifiState));
    });
    const carousel = phone.querySelector("[data-device-carousel]");
    if (carousel) {
      const route = state.current;
      const cards = [...carousel.querySelectorAll(".device-tile")];
      const step = () => cards[0].getBoundingClientRect().width + 12;
      const sync = () => {
        const index = Math.max(0, Math.min(cards.length - 1, Math.round(carousel.scrollLeft / step())));
        state.carouselPositions[route] = index;
        phone.querySelectorAll("[data-carousel-index]").forEach(button => {
          const active = Number(button.dataset.carouselIndex) === index;
          button.classList.toggle("active", active);
          if (active) button.setAttribute("aria-current", "true");
          else button.removeAttribute("aria-current");
        });
      };
      carousel.scrollLeft = (state.carouselPositions[route] || 0) * step();
      sync();
      carousel.addEventListener("scroll", sync, { passive: true });
      let drag = null;
      let suppressClick = false;
      carousel.addEventListener("pointerdown", event => {
        if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button")) return;
        drag = { x: event.clientX, scroll: carousel.scrollLeft, moved: false };
        suppressClick = false;
      });
      carousel.addEventListener("pointermove", event => {
        if (!drag) return;
        const distance = event.clientX - drag.x;
        if (Math.abs(distance) > 6 && !drag.moved) {
          drag.moved = true;
          carousel.setPointerCapture(event.pointerId);
          carousel.style.scrollSnapType = "none";
        }
        if (drag.moved) carousel.scrollLeft = drag.scroll - distance;
      });
      const endDrag = event => {
        if (!drag) return;
        suppressClick = drag.moved;
        drag = null;
        carousel.style.scrollSnapType = "";
        if (carousel.hasPointerCapture(event.pointerId)) carousel.releasePointerCapture(event.pointerId);
        if (suppressClick) {
          carousel.scrollTo({ left: Math.round(carousel.scrollLeft / step()) * step(), behavior: "smooth" });
          setTimeout(() => { suppressClick = false; }, 0);
        }
      };
      carousel.addEventListener("pointerup", endDrag);
      carousel.addEventListener("pointercancel", endDrag);
      carousel.addEventListener("pointerleave", event => { if (drag && !drag.moved) endDrag(event); });
      carousel.addEventListener("click", event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
      const move = delta => carousel.scrollTo({ left: (state.carouselPositions[route] + delta) * step(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      phone.querySelectorAll("[data-carousel-index]").forEach(button => button.addEventListener("click", () => {
        carousel.scrollTo({ left: Number(button.dataset.carouselIndex) * step(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      }));
      carousel.addEventListener("keydown", event => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      });
    }
    phone.querySelectorAll("[data-nav]").forEach(element => {
      element.addEventListener("click", event => {
        event.preventDefault();
        if (event.target.closest("[data-action]")) return;
        const cardId = element.closest("[data-device-card]")?.dataset.deviceCard;
        const target = cardId && !state.connections[cardId]
          ? searchProductLibrary.find(product => product.id === cardId).route : element.dataset.nav;
        addLog("prototype.navigate", `${state.current} → ${target}`);
        navigate(target);
      });
      element.addEventListener("keydown", event => {
        if (event.target.closest("[data-action]")) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          const cardId = element.closest("[data-device-card]")?.dataset.deviceCard;
          navigate(cardId && !state.connections[cardId]
            ? searchProductLibrary.find(product => product.id === cardId).route : element.dataset.nav);
        }
      });
    });

    phone.querySelectorAll("[data-action]").forEach(element => {
      element.addEventListener("click", event => handleAction(element.dataset.action, event));
    });

    phone.querySelectorAll("[data-brightness-range]").forEach(element => {
      const updateBrightness = () => {
        const lighting = currentLighting();
        if (!state.connections[controlModel()] || !lighting.lightOn) return;
        lighting.brightness = Number(element.value);
        phone.querySelector(".s602-home-scene")?.style.setProperty("--scene-intensity", 0.22 + lighting.brightness * 0.14);
        element.closest(".range-shell").style.setProperty("--level-pct", `${(lighting.brightness - 1) * 25}%`);
        phone.querySelectorAll("[data-brightness-value]").forEach(value => value.textContent = lighting.brightness);
        phone.querySelector("[data-light-summary]").textContent = state.language === "en" ? "Light ON" : `已开启 · ${lighting.brightness}档`;
        phone.querySelectorAll(".range-ticks span").forEach((tick, index) => tick.classList.toggle("filled", index < lighting.brightness));
        const hero = phone.querySelector(".light-hero");
        hero?.style.setProperty("--glow-scale", 0.72 + state.brightness * 0.07);
        hero?.classList.remove("light-adjusting");
        requestAnimationFrame(() => hero?.classList.add("light-adjusting"));
      };
      element.addEventListener("input", updateBrightness);
      element.addEventListener("change", () => addLog("light.brightness.set", `model=${controlModel()}; level=${currentLighting().brightness}`));
    });
  }

  function handleAction(action, event) {
    event.stopPropagation();
    switch (action) {
      case "retry-bluetooth": {
        connectionCleanup?.();
        const page = phone.querySelector("[data-connection-model]");
        page.dataset.failureDemo = "false";
        page.classList.remove("is-failed", "is-drained");
        page.querySelector(".connection-water-rise").style.transform = "translateY(195px)";
        page.querySelector(".connection-cancel")?.remove();
        page.querySelector("[data-connection-title]").textContent = state.connectionModel.toUpperCase() + (state.language === "en" ? " · Connecting" : " · 连接中");
        page.querySelector("[data-connection-copy]").textContent = state.language === "en" ? "Keep your device close." : "请保持音箱开启，并将手机靠近设备。";
        const button = page.querySelector("[data-action]");
        button.dataset.action = "cancel-bluetooth";
        button.textContent = state.language === "en" ? "Cancel" : "取消";
        button.classList.replace("primary-button", "secondary-button");
        addLog("bluetooth.connect.retry", "model=" + state.connectionModel.toUpperCase());
        connectionCleanup = startConnectionPreview();
        break;
      }
      case "toggle-light":
        if (!state.connections[controlModel()]) break;
        currentLighting().lightOn = !currentLighting().lightOn;
        addLog("light.toggle", `model=${controlModel()}; on=${currentLighting().lightOn}`);
        if (["s601", "s602"].includes(controlModel()) && phone.querySelector(".s602-home-scene")) {
          const on = currentLighting().lightOn;
          phone.querySelector(".s602-home-scene").classList.toggle("is-lit", on);
          phone.querySelector('[data-action="toggle-light"]').classList.toggle("on", on);
          phone.querySelector("[data-light-summary]").textContent = state.language === "en" ? (on ? "Light ON" : "Light OFF") : (on ? "已开启" : "已关闭");
          phone.querySelector("[data-brightness-range]").disabled = !on;
          phone.querySelector(".brightness-control").classList.toggle("disabled", !on);
          break;
        }
        render();
        break;
      case "open-connected":
        navigate(`device/${state.connectionModel}`);
        break;
      case "cancel-bluetooth":
        connectionCleanup?.();
        addLog("bluetooth.connect.cancel");
        navigate("add/found");
        break;
      case "grant-bluetooth":
        addLog("permission.bluetooth.request", "simulated=granted");
        navigate("bluetooth/connecting");
        break;
      case "quick-light":
        state.lightOn = !state.lightOn;
        addLog("light.quickToggle", `on=${state.lightOn}`);
        render();
        showToast(localize(state.lightOn ? "夕阳灯已开启" : "夕阳灯已关闭"));
        break;
      case "toggle-connection": {
        const deviceId = event.currentTarget.dataset.device;
        const nextConnected = !state.connections[deviceId];
        if (bluetoothDeviceIds.includes(deviceId)) {
          bluetoothDeviceIds.forEach(id => { state.connections[id] = false; });
        }
        state.connections[deviceId] = nextConnected;
        addLog("device.connection.toggle", `device=${deviceId}, on=${state.connections[deviceId]}`);
        syncConnectionCards();
        break;
      }
      case "restart-device-search": {
        searchRadarController?.reset();
        startAutomaticDiscovery({ reset: true, retry: true });
        showToast(state.language === "en" ? "Searching again" : "正在重新搜索");
        break;
      }
      case "toggle-password": {
        const input = phone.querySelector("input");
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
        event.currentTarget.textContent = localize(input.type === "password" ? "显示" : "隐藏");
        break;
      }
      case "submit-wifi": {
        const input = phone.querySelector("#wifi-password");
        if (!input || input.value.length < 8) {
          addLog("wifi.password.invalid", "too_short");
          navigate("wifi/password-error");
        } else {
          addLog("wifi.password.submit", "network=YUI_Studio_WiFi");
          navigate("wifi/progress");
        }
        break;
      }
      case "wifi-rescan":
        addLog("wifi.scan.retry");
        showToast(localize("正在重新扫描附近网络"));
        break;
      case "rename-device":
        addLog("device.rename.open");
        openSheet("rename");
        break;
      case "remove-device":
        addLog("device.remove.confirm.open");
        openSheet("remove");
        break;
      default:
        break;
    }
  }

  treeNav.addEventListener("click", event => {
    const wifiPreview = event.target.closest("[data-wifi-preview]");
    if (wifiPreview) {
      setWifiState(wifiPreview.dataset.wifiPreview, true);
      return;
    }
    const treeLink = event.target.closest("[data-tree-nav]");
    if (treeLink) {
      if (/^device\/(s601|s602|n86)$/.test(treeLink.dataset.treeNav)) {
        const model = treeLink.dataset.treeNav.split("/")[1];
        bluetoothDeviceIds.forEach(id => state.connections[id] = id === model);
      }
      addLog("prototype.tree.select", treeLink.dataset.treeNav);
      navigate(treeLink.dataset.treeNav);
      return;
    }
    const groupTitle = event.target.closest(".tree-group-title");
    if (groupTitle) groupTitle.closest(".tree-group").classList.toggle("collapsed");
  });

  document.querySelector("#clear-log").addEventListener("click", () => {
    state.log = [];
    eventLog.innerHTML = "";
  });

  document.querySelector("#reset-prototype").addEventListener("click", () => {
    state.lightOn = true;
    state.brightness = 3;
    state.deviceName = "客厅的 S601";
    state.deviceNameEdited = false;
    state.deviceNames = {};
    state.deviceLights = { s602: { lightOn: true, brightness: 3 } };
    state.removedDevices = [];
    state.connections = { s601: true, s602: false, n86: false };
    clearDiscoveryTimers();
    state.discoveredDevices = [];
    state.discoveryActive = false;
    state.discoverySession += 1;
    state.carouselPositions = {};
    state.log = [];
    eventLog.innerHTML = "";
    navigate("overview", { replace: true });
  });

  languageToggle.addEventListener("click", () => {
    state.language = state.language === "en" ? "zh" : "en";
    syncLanguageToggle();
    render();
    addLog("prototype.language.change", `language=${state.language}`);
  });

  const syncPageVisibility = () => {
    document.documentElement.classList.toggle("is-page-hidden", document.hidden);
  };
  document.addEventListener("visibilitychange", syncPageVisibility);
  syncPageVisibility();

  window.addEventListener("hashchange", render);
  phone.addEventListener("device-disconnected", event => {
    const model = event.detail?.model;
    if (!bluetoothDeviceIds.includes(model)) return;
    state.connections[model] = false;
    if (state.current === `device/${model}`) render();
    else syncConnectionCards();
  });
  buildTree();
  syncLanguageToggle();
  if (!location.hash) navigate("devices/list", { replace: true });
  else render();
  addLog("prototype.ready", "v0.3.1");
})();
