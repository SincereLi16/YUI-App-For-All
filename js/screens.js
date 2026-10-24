(function () {
  const icon = (name, variant = "line") => {
    const paths = {
      info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"/>',
      home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
      add: '<path d="M12 5v14M5 12h14"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.03H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1.03-1.56V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9a1.7 1.7 0 0 0 1.56 1.03H21v4h-.09A1.7 1.7 0 0 0 19.4 15z"/>',
      bluetooth: '<path d="m6.5 6.5 11 11L12 22V2l5.5 4.5-11 11"/>',
      wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.2" r="1" fill="currentColor" stroke="none"/>',
      back: '<path d="m15 18-6-6 6-6"/>'
    };
    const filledPaths = {
      home: '<path d="M3 10.7 12 3l9 7.7v8.1A2.2 2.2 0 0 1 18.8 21h-4.3v-6.2h-5V21H5.2A2.2 2.2 0 0 1 3 18.8z"/>',
      add: '<path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/>',
      settings: '<rect x="3" y="5" width="18" height="3" rx="1.5"/><circle cx="8" cy="6.5" r="3"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><circle cx="16" cy="12" r="3"/><rect x="3" y="16" width="18" height="3" rx="1.5"/><circle cx="10" cy="17.5" r="3"/>'
    };
    if (variant === "filled") {
      return `<svg class="ui-icon ui-icon-filled" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${filledPaths[name]}</svg>`;
    }
    return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
  };

  const topbar = (title, backTarget, right = "") => `
    <div class="screen-topbar centered">
      <button class="icon-button" type="button" data-nav="${backTarget}" aria-label="返回">${icon("back")}</button>
      <h2>${({ "客厅的 S601": "Sunset · YUI 601", "卧室的 S602": "Sunset · YUI 602", "书房的 N86": "Speaker · YUI N86" })[title] || title}</h2>
      ${right || '<span style="width:42px" aria-hidden="true"></span>'}
    </div>`;

  const statusChip = (label, mode = "") => `<span class="status-chip ${mode}">${label}</span>`;

  const floatingDock = (active = "devices") => `
    <nav class="floating-dock" aria-label="主导航">
      <button class="dock-item ${active === "devices" ? "active" : ""}" type="button" data-nav="devices/list" aria-label="设备">${icon("home", "filled")}</button>
      <button class="dock-item dock-add ${active === "add" ? "active" : ""}" type="button" data-nav="add/search" aria-label="添加设备">${icon("add", "filled")}</button>
      <button class="dock-item ${active === "settings" ? "active" : ""}" type="button" data-nav="settings/about" aria-label="关于 YUI">${icon("info")}</button>
    </nav>`;

  const brightnessControl = (state, disabled = false) => {
    const level = state.brightness || 3;
    const isEnabled = state.lightOn && !disabled;
    const percentage = (level - 1) * 25;
    return `
      <div class="brightness-control ${isEnabled ? "" : "disabled"}">
        <div class="brightness-heading">
          <span><small>亮度</small><strong><span data-brightness-value>${level}</span> 档</strong></span>
          <span class="brightness-symbol" aria-hidden="true">☀</span>
        </div>
        <div class="range-shell" style="--level-pct:${percentage}%">
          <input class="brightness-range" type="range" min="1" max="5" step="1" value="${level}" data-brightness-range ${isEnabled ? "" : "disabled"} aria-label="夕阳灯亮度，共五档" />
          <div class="range-ticks" aria-hidden="true">${[1,2,3,4,5].map(n => `<span class="${n <= level ? "filled" : ""}"></span>`).join("")}</div>
        </div>
        <div class="range-labels" aria-hidden="true"><span>柔和</span><span>明亮</span></div>
      </div>`;
  };

  const deviceCard = ({ id, name, model, status, detail, round = false, lamp = false, lightOn = true, language = "zh" }) => {
    const compactEnglish = language === "en";
    return `
      <article class="wire-card device-card ${compactEnglish ? "compact-device-card" : ""}" data-nav="${id}" tabindex="0" role="button" aria-label="打开${name}">
        <div class="product-placeholder ${round ? "round" : ""}">
          <span class="placeholder-label">产品图</span>
        </div>
        <div class="device-copy">
          ${compactEnglish ? `
            <div class="device-heading"><h3>${name}</h3></div>
            <div class="device-card-footer">
              ${statusChip(status, status === "离线" ? "offline" : "")}
              ${lamp ? `<button class="light-state-button ${lightOn ? "" : "off"}" type="button" data-action="quick-light" aria-label="夕阳灯快捷开关">Light ${lightOn ? "ON" : "OFF"}</button>` : ""}
            </div>` : `
            <div class="device-heading"><h3>${name}</h3>${statusChip(status, status === "离线" ? "offline" : "")}</div>
            <p class="device-model">${model}</p>
            ${detail ? `<div class="status-line"><span>${detail}</span><span class="list-arrow" aria-hidden="true"></span></div>` : ""}
            ${lamp ? `<div class="quick-control"><button class="mini-switch on" type="button" data-action="quick-light" aria-label="夕阳灯快捷开关"></button><span>夕阳灯已开启 · 3档</span></div>` : ""}`}
        </div>
      </article>`;
  };

  const deviceCatalog = [
    { key: "s601", id: "device/s601", name: "Sunset", model: "YUI 601", protocol: "Bluetooth", art: "./assets/s601-empty-state.svg?v=5", artOn: "./assets/s601-body.svg?v=1" },
    { key: "s602", id: "device/s602", name: "Sunset", model: "YUI 602", protocol: "Bluetooth", art: "./assets/s602-shape.svg?v=5" },
    { key: "n86", id: "device/n86", name: "Speaker", model: "YUI N86", protocol: "Bluetooth", art: "./assets/n86-shape.svg?v=10", artOn: "./assets/n86-active.svg?v=9" }
  ];

  const n86PeekingArt = (className = "reading-product") => `<svg class="${className}" viewBox="0 0 240 190" aria-hidden="true">
          <defs><clipPath id="reading-body-clip"><rect x="0" y="81" width="240" height="109"/></clipPath></defs>
          <g class="reading-head">
          <rect x="64" y="16" width="112" height="72" rx="7" fill="#FFF9F0"/>
          <path d="M67 27a5 5 0 0 1 5-5h96a5 5 0 0 1 5 5v55H67V27Z" fill="#F3F0EB" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="96" cy="52" r="20" fill="#FFFDF8"/><circle cx="144" cy="52" r="20" fill="#FFFDF8"/>
          <g class="reading-gaze"><g class="reading-blink"><circle cx="101" cy="54" r="8" fill="#2E2A26"/><circle cx="149" cy="54" r="8" fill="#2E2A26"/><circle cx="104" cy="51" r="2" fill="#FFFDF8"/><circle cx="152" cy="51" r="2" fill="#FFFDF8"/></g></g>
          </g>
          <image href="./assets/n86-shape.svg?v=10" width="240" height="190" clip-path="url(#reading-body-clip)"/>
        </svg>`;

  const devicesPage = (state, devices) => {
    const deviceTiles = devices.filter(device => !(state.removedDevices || []).includes(device.key)).map(device => {
      const connected = state.connections[device.key];
      const stateLabel = connected ? "ON" : "OFF";
      const productArt = connected && device.artOn ? device.artOn : device.art;
      const ideaSymbols = device.key === "n86" ? `
              <span class="n86-idea-symbol idea-question">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 8.5a3.1 3.1 0 1 1 4.7 2.7c-1.4.8-2.1 1.5-2.1 3"/><path d="M12 18.2h.01"/></svg>
              </span>
              <span class="n86-idea-symbol idea-exclamation">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.2v9"/><path d="M12 18.2h.01"/></svg>
              </span>
              <span class="n86-idea-symbol idea-heart">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.1 4.7 13A4.8 4.8 0 0 1 11.5 6.2L12 6.7l.5-.5A4.8 4.8 0 0 1 19.3 13Z"/></svg>
              </span>
              <span class="n86-idea-symbol idea-star">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/></svg>
              </span>` : "";
      return `
        <article class="device-tile device-${device.key} ${connected ? "device-on" : "device-off"}" data-device-card="${device.key}">
          <a class="device-open" href="#/${device.id}" data-nav="${device.id}" aria-label="打开${device.name}${device.model}">
            <div class="device-tile-media" aria-hidden="true">
              <span class="device-effect effect-outer"></span>
              <span class="device-effect effect-middle"></span>
              <span class="device-effect effect-inner"></span>
              ${ideaSymbols}
              ${device.key === "n86" ? n86PeekingArt("tile-n86-product") : `<img src="${productArt}" data-device-art data-art-off="${device.art}"${device.artOn ? ` data-art-on="${device.artOn}"` : ""} alt="" />`}
            </div>
            <div class="device-tile-heading"><h3 data-device-name-key="${device.key}">${device.name}</h3><p>${device.model}</p></div>
          </a>
          <div class="device-tile-footer">
            <button class="connection-control ${connected ? "on" : ""}" type="button" data-action="toggle-connection" data-device="${device.key}" aria-pressed="${connected}" aria-label="${state.language === "en" ? `Toggle ${device.name} ${device.protocol}` : `切换${device.name}${device.protocol}连接`}"><span class="connection-switch" aria-hidden="true"><span></span></span></button>
          </div>
        </article>`;
    }).join("");
    return `
      <div class="app-page device-overview-page">
        <div class="screen-topbar">
          <h2>我的设备</h2>
          <div class="top-actions"><button class="icon-button" type="button" data-nav="add/search" aria-label="添加设备">${icon("add")}</button><button class="icon-button" type="button" data-nav="settings/about" aria-label="关于 YUI">${icon("info")}</button></div>
        </div>
        <div class="device-list-stack" aria-label="${state.language === "en" ? "My devices" : "我的设备"}">${deviceTiles}</div>
      </div>`;
  };


  // Shared artwork and motion keep all three connection previews consistent.
  const bluetoothConnectionPage = (model, art, complete = false, failureDemo = false) => `
    <div class="app-page bluetooth-connection-page ${complete ? "is-connected" : ""}" data-connection-model="${model.toLowerCase()}" data-connection-complete="${complete}" data-failure-demo="${failureDemo}">
      <div class="screen-topbar"><h2>连接音箱</h2></div>
      <div class="center-state bluetooth-connection-state">
        <div class="connection-art-stage connection-stage--${model.toLowerCase()}">
        <div class="connection-active-art device-${model.toLowerCase()}" aria-hidden="true">${devicesPage({connections:{[model.toLowerCase()]:true}}, deviceCatalog.filter(d => d.key === model.toLowerCase())).match(/<div class="device-tile-media"[\s\S]*?<\/div>/)[0]}</div>
        <svg class="connection-fill-art connection-fill-art--${model.toLowerCase()}" viewBox="0 0 240 190" aria-hidden="true">
          <defs>
            <clipPath id="connection-water-${model}" clipPathUnits="userSpaceOnUse">
              <path class="connection-water-rise" d="M-240 0 Q-210 -5 -180 0 T-120 0 T-60 0 T0 0 T60 0 T120 0 T180 0 T240 0 T300 0 T360 0 T420 0 T480 0 V400 H-240 Z"/>
            </clipPath>
          </defs>
          <image class="connection-art-muted" href="${art}" width="240" height="190"/>
          <image class="connection-art-color" href="${art}" width="240" height="190" clip-path="url(#connection-water-${model})"/>
          ${model.toLowerCase() === "n86" ? `<g class="connection-live-eyes">
            <circle cx="96" cy="52" r="20" fill="#FFFDF8"/><circle cx="144" cy="52" r="20" fill="#FFFDF8"/>
            <g class="connection-eye-look"><g class="connection-eye-blink">
              <circle cx="101" cy="54" r="8" fill="#2E2A26"/><circle cx="149" cy="54" r="8" fill="#2E2A26"/>
              <circle cx="104" cy="51" r="2" fill="#FFFDF8"/><circle cx="152" cy="51" r="2" fill="#FFFDF8"/>
            </g></g>
          </g>` : ""}
        </svg>
        </div>
        <h3 data-connection-title>${model} · ${complete ? "已连接" : "连接中"}</h3>
        <p role="status" data-connection-copy>${complete ? "设备已就绪，开始使用吧。" : "请保持音箱开启，并将手机靠近设备。"}</p>
        <div class="button-stack"><button class="${complete ? "primary-button" : "secondary-button"}" type="button" data-action="${complete ? "open-connected" : "cancel-bluetooth"}">${complete ? "进入设备" : "取消"}</button></div>
      </div>
    </div>`;

  const controlProductArt = (model, online) => {
    const device = deviceCatalog.find(d => d.key === model);
    return online ? `<div class="s601-control-art connection-art-stage connection-stage--${model} is-connected" role="img" aria-label="${model.toUpperCase()} 产品图"><div class="connection-active-art device-${model} device-on">${devicesPage({connections:{[model]:true}}, [device]).match(/<div class="device-tile-media"[\s\S]*?<\/div>/)[0]}</div></div>`
      : `<div class="s601-control-art connection-art-stage"><img class="s601-control-muted" src="${device.art}" alt="${model.toUpperCase()} 产品图" /></div>`;
  };

  const deviceControlPage = (state, model = "s601") => {
    const online = Boolean(state.connections[model]);
    const lighting = model === "s602" ? state.deviceLights.s602 : state;
    return `<div class="app-page device-control-page">
      <div class="screen-topbar s601-control-topbar">
        <button class="icon-button" type="button" data-nav="devices/list" aria-label="返回">${icon("back")}</button>
        <div class="s601-title-group"><h2 data-control-name="${model}">${model.toUpperCase()}</h2><button class="s601-rename-button" type="button" data-action="rename-device" aria-label="重命名设备"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m15.2 4.2 4.6 4.6 1-1a2 2 0 0 0 0-2.8L19 3.2a2 2 0 0 0-2.8 0l-1 1ZM13.8 5.6 4.3 15.1 3 21l5.9-1.3 9.5-9.5-4.6-4.6Z"/></svg></button></div>
        <button class="text-button s601-remove-button" type="button" data-action="remove-device" aria-label="移除设备"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2ZM6 9h12l-1 11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 9Z"/></svg></button>
      </div>
      ${model === "s602" ? `<div class="s602-home-scene s602-tabletop ${online && lighting.lightOn ? "is-lit" : ""}" style="--scene-intensity:${0.22 + lighting.brightness * 0.14}" role="img" aria-label="S602 暖光桌角场景示意">
        <div class="s602-home-light" aria-hidden="true"><svg viewBox="0 0 210 190" fill="none"><circle cx="103" cy="95" r="93" fill="#FE8505" opacity=".10"/><circle cx="103" cy="95" r="77" fill="#FE8505"/><circle cx="120" cy="112" r="53" fill="#FFDA66"/></svg></div>
        <img class="s602-home-background" data-animate-scene src="./assets/s602-home-vector.svg?v=9" alt="" />
        <div class="s602-home-contact" aria-hidden="true"></div>
        <img class="s602-home-product" src="./assets/s602-shape.svg?v=5" alt="" />
      </div>` : model === "s601" ? `<div class="s602-home-scene s601-bedroom ${online && lighting.lightOn ? "is-lit" : ""}" style="--scene-intensity:${0.22 + lighting.brightness * .14}" role="img" aria-label="S601 床头暖光场景">
        <div class="s602-home-light" aria-hidden="true"><svg viewBox="0 0 210 190" fill="none"><circle cx="103" cy="95" r="93" fill="#FE8505" opacity=".1"/><circle cx="103" cy="95" r="77" fill="#FE8505"/><circle cx="120" cy="112" r="53" fill="#FFDA66"/></svg></div>
        <img class="s602-home-background" data-animate-scene src="./assets/s601-bedroom-complete.svg?v=14" alt="" />
        <img class="bedroom-product" src="./assets/s601-empty-state.svg?v=5" alt="" />
      </div>` : `<div class="s602-home-scene n86-desktop n86-reading ${online ? "is-lit" : ""}" role="img" aria-label="N86 桌搭场景">
        <img class="s602-home-background" src="./assets/n86-desktop.svg?v=2" alt="" />
        <div class="scene-ideas" aria-hidden="true">
          <svg class="scene-idea scene-idea-question" viewBox="0 0 24 24"><path d="M9.4 8.5a3.1 3.1 0 1 1 4.7 2.7c-1.4.8-2.1 1.5-2.1 3M12 18.2h.01"/></svg>
          <svg class="scene-idea scene-idea-heart" viewBox="0 0 24 24"><path d="M12 20.1 4.7 13A4.8 4.8 0 0 1 11.5 6.2L12 6.7l.5-.5A4.8 4.8 0 0 1 19.3 13Z"/></svg>
          <svg class="scene-idea scene-idea-star" viewBox="0 0 24 24"><path d="m12 3.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/></svg>
        </div>
        ${n86PeekingArt()}
      </div>`}
      ${model === "n86" ? `<section class="wire-card network-card"><div class="action-row" style="gap:13px"><span class="network-icon">${icon("wifi")}</span><div class="network-copy"><strong>YUI_Studio_WiFi</strong><span>${online ? "已连接 · 网络状态正常" : "连接已断开，请重新连接"}</span></div></div></section><div class="button-stack"><button class="secondary-button" type="button" data-nav="${online ? "wifi/list" : "bluetooth/connecting-n86"}">${online ? "更换网络 / 重新配网" : "重新连接"}</button></div>` : `
      <section class="wire-card control-card light-control-card matched-control-card ${online ? "" : "offline-control"}"><div class="row-between"><div><h3>夕阳灯</h3><p data-light-summary>${online ? (lighting.lightOn ? "已开启" : "已关闭") : "连接已断开，请重新连接"}</p></div><button class="switch ${online && lighting.lightOn ? "on" : ""}" type="button" data-action="toggle-light" aria-label="切换夕阳灯" ${online ? "" : "disabled"}></button></div>${brightnessControl(lighting, !online)}</section>
      ${online ? "" : `<div class="button-stack offline-reconnect"><button class="primary-button" type="button" data-nav="${model === "s602" ? "bluetooth/connecting-s602" : "bluetooth/connecting"}">重新连接</button></div>`}`}

    </div>`;
  };

  const wifiStateContent = status => {
    const views = {
      progress: () => `${topbar("配置 N86", "wifi/password")}<div class="center-state" style="padding-top:24px"><div class="result-icon loading">↻</div><h3>正在连接网络</h3><p>请保持手机、音箱和路由器距离较近。</p></div><div class="progress-steps"><div class="progress-step complete"><span class="progress-dot">✓</span><div class="progress-copy"><strong>连接设备</strong><span>已完成</span></div></div><div class="progress-step active"><span class="progress-dot">2</span><div class="progress-copy"><strong>配置网络</strong><span>正在将网络信息发送到 N86</span></div></div><div class="progress-step"><span class="progress-dot">3</span><div class="progress-copy"><strong>确认在线</strong><span>等待开始</span></div></div></div><div class="button-stack" style="margin-top:46px"><button class="primary-button" type="button" data-wifi-state="success">模拟配网成功</button><button class="secondary-button" type="button" data-wifi-state="timeout">模拟配网超时</button></div>`,
      success: () => `<div class="center-state"><div class="result-icon">✓</div><h3>N86 已连接网络</h3><p>设备已连接到 YUI_Studio_WiFi，并添加到“我的设备”。</p><div class="button-stack"><button class="primary-button" type="button" data-nav="device/n86">进入设备</button><button class="secondary-button" type="button" data-nav="devices/list">返回我的设备</button></div></div>`,
      timeout: () => `${topbar("配置 N86", "wifi/list")}<div class="center-state"><div class="result-icon">!</div><h3>连接时间有点久</h3><p>请确认 Wi-Fi 可用，并让 N86 靠近路由器后再试一次。</p><div class="button-stack"><button class="primary-button" type="button" data-wifi-state="progress">再试一次</button><button class="secondary-button" type="button" data-nav="wifi/list">选择其他网络</button></div></div>`
    };
    return (views[status] || views.progress)();
  };
  window.YUI_WIFI_STATE_CONTENT = wifiStateContent;

  const screens = {
    "overview": {
      title: "原型总览",
      group: "00 原型总览",
      purpose: "快速理解 V0.3.1 的产品结构、完整状态和统一大色块视觉方向。",
      entry: "原型默认入口。",
      exits: ["我的设备", "S601/S602 蓝牙连接", "N86 Wi-Fi 配网"],
      events: ["prototype.open"],
      render: () => `
        <div class="app-page">
          <div class="screen-topbar"><div><span class="eyebrow">YUI APP</span><h2>统一视觉原型</h2></div><span class="mode-pill">V0.3.1</span></div>
          <section class="wire-card">
            <h3>这一版验证什么？</h3>
            <p class="helper-copy">验证页面关系、设备连接和产品专属控制，并以低信息密度、大色块和更厚的组件比例建立统一视觉。</p>
          </section>
          <span class="section-label">核心流程</span>
          <div class="product-list">
            <button class="list-row" type="button" data-nav="devices/list"><span class="list-icon">01</span><span class="list-copy"><strong>我的设备</strong><span>设备列表与状态入口</span></span><span class="list-arrow">›</span></button>
            <button class="list-row" type="button" data-nav="add/found"><span class="list-icon">02</span><span class="list-copy"><strong>S601 / S602</strong><span>蓝牙连接与夕阳灯</span></span><span class="list-arrow">›</span></button>
            <button class="list-row" type="button" data-nav="wifi/list"><span class="list-icon">03</span><span class="list-copy"><strong>N86</strong><span>Wi-Fi 配网与网络状态</span></span><span class="list-arrow">›</span></button>
          </div>
          <span class="section-label">产品能力</span>
          <section class="wire-card">
            <div class="row-between"><strong>S601 / S602</strong><span class="status-chip">夕阳灯 · 5档</span></div>
            <div class="row-between" style="margin-top:14px"><strong>N86</strong><span class="status-chip">Wi-Fi 配网</span></div>
          </section>
        </div>`
    },

    "overview/product-shapes": {
      title: "产品图形预览",
      group: "00 原型总览",
      purpose: "集中比较 S601、S602 与 N86 的简化产品图形，统一比例和视觉语言。",
      entry: "产品图形绘制与评审。",
      exits: ["原型总览", "我的设备 · 空状态"],
      events: ["product.shape.preview"],
      render: () => `
        <div class="app-page product-shape-page">
          ${topbar("产品图形", "overview")}
          <div class="product-shape-grid" aria-label="产品图形预览">
            <figure class="product-shape-item">
              <div class="product-shape-canvas"><img src="./assets/s601-empty-state.svg?v=5" alt="YUI S601 产品图形" /></div>
              <figcaption><strong>S601</strong><span>Ready</span></figcaption>
            </figure>
            <figure class="product-shape-item">
              <div class="product-shape-canvas"><img src="./assets/s602-shape.svg?v=5" alt="YUI S602 产品图形" /></div>
              <figcaption><strong>S602</strong><span>Draft</span></figcaption>
            </figure>
            <figure class="product-shape-item">
              <div class="product-shape-canvas"><img src="./assets/n86-shape.svg?v=10" alt="YUI N86 Product Shapes"></div>
              <figcaption><strong>N86</strong><span>Draft</span></figcaption>
            </figure>
          </div>
        </div>`
    },

    "devices/empty": {
      title: "我的设备 · 空状态",
      group: "01 我的设备",
      purpose: "在用户尚未添加设备时，提供唯一且明确的添加入口。",
      entry: "首次完成欢迎流程，或移除最后一台设备后。",
      exits: ["请求蓝牙权限"],
      events: ["device.add.start"],
      render: () => `
        <div class="app-page">
          <div class="screen-topbar"><h2>我的设备</h2><div class="top-actions"><button class="icon-button" type="button" data-nav="settings/about" aria-label="关于 YUI">${icon("info")}</button></div></div>
          <div class="empty-state">
            <div class="empty-illustration flat-light-art" aria-hidden="true"><span class="flat-light-halo"></span><img src="./assets/s601-body.svg?v=1" alt="" /></div>
            <h3>添加第一台 YUI 设备</h3>
            <p>连接音箱后，可以在这里查看设备状态和使用产品专属功能。</p>
            <button class="primary-button" type="button" data-nav="devices/empty-bluetooth">添加设备</button>
          </div>
        </div>`
    },

    "devices/empty-bluetooth": {
      title: "我的设备 · 等待蓝牙授权",
      group: "01 我的设备",
      purpose: "在空状态发起系统蓝牙权限申请后，就地提示用户完成授权。",
      entry: "蓝牙未开启或未授权时，用户点击空状态中的添加设备。",
      exits: ["允许后自动搜索设备"],
      events: ["permission.bluetooth.request", "permission.bluetooth.result"],
      render: () => `
        <div class="app-page">
          <div class="screen-topbar"><h2>我的设备</h2><div class="top-actions"><button class="icon-button" type="button" data-nav="settings/about" aria-label="关于 YUI">${icon("info")}</button></div></div>
          <div class="empty-state">
            <div class="empty-illustration flat-light-art" aria-hidden="true"><span class="flat-light-halo"></span><img src="./assets/s601-body.svg?v=1" alt="" /></div>
            <h3>请允许蓝牙连接</h3>
            <p>请在系统弹窗中点击“允许”，以发现并连接附近的 YUI 设备。</p>
            <button class="primary-button permission-waiting-button" type="button" disabled>等待系统授权…</button>
          </div>
        </div>`
    },

    "devices/list": {
      title: "我的设备",
      group: "01 我的设备",
      purpose: "纵向浏览已添加的设备，通过独立连接开关操作，点击设备名称或图片进入详情。",
      entry: "用户进入 App，或从设备详情和设置返回。",
      exits: ["S601 设备页", "N86 设备页", "添加设备", "App 设置"],
      events: ["device.list.view", "device.select", "device.connection.toggle"],
      render: (state) => devicesPage(state, deviceCatalog)
    },

    "add/search": {
      title: "搜索设备",
      group: "02 添加设备",
      purpose: "自动寻找附近处于连接或配网状态的 YUI 产品。",
      entry: "点击首页的添加设备。",
      exits: ["已发现设备", "未发现设备", "重新搜索", "蓝牙连接中", "我的设备"],
      events: ["device.scan.start", "device.scan.retry", "device.scan.result", "device.scan.timeout"],
      render: () => `
        <div class="app-page">
          ${topbar("添加设备", "devices/list")}
          <div class="search-stage">
            <div class="search-illustration search-lineup" aria-hidden="true">
              <span class="search-product-layer" data-search-product-layer></span>
              <span class="search-lineup-track"><span class="search-lineup-scan"></span></span>
            </div>
            <h3>正在寻找附近的设备</h3>
            <p>请打开音箱，并让设备进入连接或配网状态。</p>
            <div class="search-actions">
              <button class="secondary-button" type="button" data-action="restart-device-search">重新搜索</button>
            </div>
          </div>
        </div>`
    },

    "add/not-found": {
      title: "未发现设备",
      group: "02 添加设备",
      purpose: "搜索超时时告知用户未发现设备，并提供可继续的恢复路径。",
      entry: "自动搜索超时，且没有发现任何设备。",
      exits: ["重新搜索", "我的设备"],
      events: ["device.scan.timeout", "device.scan.retry"],
      render: () => `
        <div class="app-page">
          ${topbar("添加设备", "devices/list")}
          <div class="center-state no-device-state">
            <div class="no-device-visual no-device-trace" aria-hidden="true">
              <span class="no-device-trace-product no-device-trace-product--s601"><img src="./assets/s601-empty-state.svg?v=5" alt="" /></span>
              <span class="no-device-trace-product no-device-trace-product--s602"><img src="./assets/s602-shape.svg?v=5" alt="" /></span>
              <span class="no-device-trace-product no-device-trace-product--n86"><img src="./assets/n86-shape.svg?v=10" alt="" /></span>
              <span class="no-device-trace-line"></span>
            </div>
            <h3>暂时没有发现设备</h3>
            <p>请确认设备已开机，并已进入连接或配网状态。</p>
            <div class="button-stack no-device-actions">
              <button class="primary-button" type="button" data-nav="add/search">重新搜索</button>
              <button class="text-button" type="button" data-nav="devices/list">返回我的设备</button>
            </div>
          </div>
        </div>`
    },

    "add/found": {
      title: "已发现设备",
      group: "02 添加设备",
      purpose: "让用户确认发现的产品型号，并进入对应连接流程。",
      entry: "自动搜索返回一个或多个附近设备。",
      exits: ["S601 蓝牙连接中", "S602 蓝牙连接中", "N86 蓝牙连接中", "继续搜索"],
      events: ["device.scan.result", "device.select"],
      render: () => `
        <div class="app-page">
          ${topbar("发现设备", "devices/list")}
          <p class="muted-copy" data-found-summary></p>
          <div class="product-list found-device-list" data-found-device-list></div>
          <p class="found-scan-status"><span aria-hidden="true"></span><span data-found-scan-status></span></p>
        </div>`
    },

    "bluetooth/connecting": {
      title: "S601 · 蓝牙连接中",
      group: "03 蓝牙连接",
      purpose: "预览在第 2.2 秒模拟连接成功，约 3 秒平滑填满，原位进入成功状态并播放一次暖色撒花。",
      entry: "用户在已发现设备中选择 S601。",
      exits: ["连接成功", "连接失败", "取消连接"],
      events: ["bluetooth.connect.start", "bluetooth.connect.cancel", "bluetooth.connect.result"],
      render: () => bluetoothConnectionPage("S601", "./assets/s601-empty-state.svg?v=5")
    },

    "bluetooth/connecting-s602": {
      title: "S602 · 蓝牙连接中",
      group: "03 蓝牙连接",
      purpose: "预览在第 2.2 秒模拟连接成功，约 3 秒平滑填满，原位进入成功状态并播放一次暖色撒花。",
      entry: "用户在已发现设备中选择 S602。",
      exits: ["连接成功", "连接失败", "取消连接"],
      events: ["bluetooth.connect.start", "bluetooth.connect.cancel", "bluetooth.connect.result"],
      render: () => bluetoothConnectionPage("S602", "./assets/s602-shape.svg?v=5")
    },

    "bluetooth/connecting-n86": {
      title: "N86 · 蓝牙连接中",
      group: "03 蓝牙连接",
      purpose: "预览在第 2.2 秒模拟连接成功，约 3 秒平滑填满，原位进入成功状态并播放一次暖色撒花。",
      entry: "用户在已发现设备中选择 N86。",
      exits: ["连接成功", "连接失败", "取消连接"],
      events: ["bluetooth.connect.start", "bluetooth.connect.cancel", "bluetooth.connect.result"],
      render: () => bluetoothConnectionPage("N86", "./assets/n86-shape.svg?v=10")
    },

    "bluetooth/success": {
      title: "蓝牙连接成功",
      group: "03 蓝牙连接",
      purpose: "水满后原位显示对应产品的已连接动画，点击 Open 进入设备。",
      entry: "蓝牙连接成功并完成显色。",
      exits: ["对应设备控制页"],
      events: ["bluetooth.connect.success", "device.open"],
      render: state => {
        const device = deviceCatalog.find(d => d.key === state.connectionModel) || deviceCatalog[0];
        return bluetoothConnectionPage(device.key.toUpperCase(), device.art, true);
      }
    },

    "bluetooth/error": {
      title: "蓝牙连接失败",
      group: "03 蓝牙连接",
      purpose: "上涨 1.5 秒后演示失败：水位缓停，再用约 0.9 秒下降至产品底部以下，露出灰色产品。重试保留当前型号，约 3 秒后成功。",
      entry: "蓝牙连接超时或设备不可用。",
      exits: ["再试一次", "取消连接"],
      events: ["bluetooth.connect.failed", "bluetooth.connect.retry"],
      render: state => {
        const device = deviceCatalog.find(d => d.key === state.connectionModel) || deviceCatalog[0];
        return bluetoothConnectionPage(device.key.toUpperCase(), device.art, false, true);
      }
    },



    "wifi/list": {
      title: "选择 Wi-Fi",
      group: "04 N86 Wi-Fi 配网",
      purpose: "选择 N86 将要连接的无线网络。",
      entry: "N86 已进入配网状态。",
      exits: ["输入密码", "重新扫描"],
      events: ["wifi.scan.start", "wifi.network.select"],
      render: () => `
        <div class="app-page">${topbar("选择 Wi-Fi", "device/n86")}<p class="muted-copy">请选择 N86 要连接的网络。</p><div class="wifi-list" style="margin-top:20px"><button class="list-row" type="button" data-nav="wifi/password"><span class="list-icon">Wi</span><span class="list-copy"><strong>YUI_Studio_WiFi</strong><span>信号良好 · 需要密码</span></span><span class="list-arrow">›</span></button><button class="list-row" type="button" data-nav="wifi/password"><span class="list-icon">Wi</span><span class="list-copy"><strong>Home_5G</strong><span>信号良好 · 需要密码</span></span><span class="list-arrow">›</span></button><button class="list-row" type="button" data-nav="wifi/password"><span class="list-icon">Wi</span><span class="list-copy"><strong>Guest_WiFi</strong><span>信号一般 · 需要密码</span></span><span class="list-arrow">›</span></button></div><button class="ghost-button" type="button" data-action="wifi-rescan" style="margin-top:16px">重新扫描网络</button></div>`
    },

    "wifi/password": {
      title: "输入 Wi-Fi 密码",
      group: "04 N86 Wi-Fi 配网",
      purpose: "收集网络密码并发起配网；V0.1 使用模拟密码。",
      entry: "用户选择一个加密 Wi-Fi。",
      exits: ["配网中", "返回网络列表"],
      events: ["wifi.password.submit", "wifi.provision.start"],
      render: () => `
        <div class="app-page">${topbar("输入密码", "wifi/list")}<section class="wire-card"><span class="eyebrow">WI-FI</span><h3 style="margin-top:8px">YUI_Studio_WiFi</h3><p class="helper-copy">密码只用于将 N86 连接到此网络。</p></section><div class="form-group"><label for="wifi-password">Wi-Fi 密码</label><div class="input-wrap"><input id="wifi-password" type="password" value="YUI-demo-2026" autocomplete="off" /><button class="input-action" type="button" data-action="toggle-password">显示</button></div></div><div class="button-stack" style="margin-top:28px"><button class="primary-button" type="button" data-action="submit-wifi">开始配网</button><button class="secondary-button" type="button" data-nav="wifi/list">选择其他网络</button></div></div>`
    },

    "wifi/password-error": {
      title: "Wi-Fi 密码错误",
      group: "04 N86 Wi-Fi 配网",
      purpose: "将失败原因定位到密码，并允许用户直接修改后重试。",
      entry: "设备返回密码认证失败。",
      exits: ["重新输入密码", "选择其他网络"],
      events: ["wifi.provision.failed", "wifi.password.retry"],
      render: () => `
        <div class="app-page">${topbar("检查密码", "wifi/list")}<div class="form-group"><label for="wifi-password-error">YUI_Studio_WiFi</label><div class="input-wrap error"><input id="wifi-password-error" type="password" value="wrongpass" /><button class="input-action" type="button" data-action="toggle-password">显示</button></div><p class="error-copy">密码不正确，请修改后再试一次。</p></div><div class="button-stack"><button class="primary-button" type="button" data-nav="wifi/progress">重新配网</button><button class="secondary-button" type="button" data-nav="wifi/list">选择其他网络</button></div></div>`
    },

    "wifi/progress": {
      title: "N86 配网",
      group: "04 N86 Wi-Fi 配网",
      purpose: "N86 黑色眼睛跟随指针；水位约 3 秒填满后原位显示成功与撒花。失败预览先上涨再退水，支持重试和更换网络。",
      entry: "提交 Wi-Fi 密码，或从超时状态重试。",
      exits: ["配网成功", "配网超时", "选择其他网络", "N86 设备页"],
      events: ["wifi.provision.start", "wifi.provision.success", "wifi.provision.timeout", "wifi.provision.retry", "wifi.provision.cancel"],
      render: state => {
        const shared = bluetoothConnectionPage("N86", "./assets/n86-shape.svg?v=10");
        const stage = shared.slice(shared.indexOf('<div class="connection-art-stage'), shared.indexOf('<h3 data-connection-title'));
        return `<div class="app-page bluetooth-connection-page wifi-connection-page" data-wifi-flow data-wifi-status="${state.wifiStatus}">
          ${topbar("配置 N86", "wifi/list")}
          <div class="center-state bluetooth-connection-state">${stage}
          <h3 data-wifi-title>正在连接网络</h3>
          <div class="wifi-state-body" data-wifi-body></div></div></div>`;
      }
    },





    "device/s601": {
      title: "S601 在线",
      group: "05 设备控制",
      purpose: "控制 S601 灯光；标题旁可重命名，右侧可确认移除。断连时原位禁用控制并提供重连。",
      entry: "已连接设备或蓝牙连接成功。",
      exits: ["我的设备", "重新连接"],
      events: ["device.view", "light.toggle", "light.brightness.set", "device.rename", "device.remove.confirm"],
      render: state => deviceControlPage(state)
    },

    "device/s602": {
      title: "S602 在线",
      group: "05 设备控制",
      purpose: "统一在线设备布局，支持重命名和移除；控制夕阳灯和五档亮度。",
      entry: "已连接设备或连接成功。",
      exits: ["我的设备", "重新连接"],
      events: ["device.view", "device.rename", "device.remove.confirm"],
      render: state => deviceControlPage(state, "s602")
    },

    "device/n86": {
      title: "N86 在线",
      group: "05 设备控制",
      purpose: "统一在线设备布局，支持重命名和移除；显示网络信息并支持重新配网。",
      entry: "已连接设备或连接成功。",
      exits: ["我的设备", "重新连接"],
      events: ["device.view", "device.rename", "device.remove.confirm"],
      render: state => deviceControlPage(state, "n86")
    },

    "settings/about": {
      title: "关于 YUI",
      group: "06 关于",
      purpose: "展示品牌与版本信息，提供独立协议阅读入口。",
      entry: "我的设备右上角关于入口。",
      exits: ["我的设备", "用户协议", "隐私政策"],
      events: ["about.view"],
      render: () => `
        <div class="app-page about-page">${topbar("关于 YUI", "devices/list")}
          <div class="about-brand"><h3>YUI</h3><p>让声音与空间里的光更自然地陪伴日常。</p><span class="about-version">Prototype V0.3.1</span></div>
          <div class="settings-list about-policy-links">
            <button class="list-row" type="button" data-nav="settings/terms"><span class="list-copy"><strong>用户协议</strong></span><span class="list-arrow" aria-hidden="true"></span></button>
            <button class="list-row" type="button" data-nav="settings/privacy"><span class="list-copy"><strong>隐私政策</strong></span><span class="list-arrow" aria-hidden="true"></span></button>
          </div>
        </div>`
    },
    "settings/terms": {
      title: "用户协议", group: "06 关于",
      purpose: "用户协议阅读页；正式条款尚未提供。", entry: "关于 YUI。",
      exits: ["关于 YUI"], events: ["terms.view"],
      render: () => `<div class="app-page legal-page">${topbar("用户协议", "settings/about")}<section class="legal-copy"><h3>内容待补充</h3><p>正式用户协议尚未提供。本页仅用于预览阅读布局，不构成正式条款。</p></section></div>`
    },
    "settings/privacy": {
      title: "隐私政策", group: "06 关于",
      purpose: "隐私政策阅读页；正式政策尚未提供。", entry: "关于 YUI。",
      exits: ["关于 YUI"], events: ["privacy.view"],
      render: () => `<div class="app-page legal-page">${topbar("隐私政策", "settings/about")}<section class="legal-copy"><h3>内容待补充</h3><p>正式隐私政策尚未提供。本页仅用于预览阅读布局，不代表实际的数据处理说明。</p></section></div>`
    }
  };

  const englishPairs = [
    ["S602 在线", "S602 · Online"],
    ["N86 在线", "N86 · Online"],
    ["重命名设备", "Rename Device"],
    ["保存名称", "Save Name"],
    ["设备名称", "Device Name"],
    ["使用一个容易辨认房间和产品的名称。", "Choose a name that is easy to recognize."],
    ["再次使用设备控制前，需要重新连接此设备。", "You can reconnect this device to add it again."],
    ["移除此设备？", "Remove this device?"],
    ["移除设备", "Remove Device"],
    ["已开启", "Light ON"],
    ["已关闭", "Light OFF"],
    ["连接已断开，请重新连接", "Disconnected. Please reconnect."],
    ["移除", "Remove"],
    ["S601 在线", "S601 · Online"],
    ["S601 离线", "S601 · Offline"],
    ["设备已就绪，开始使用吧。", "Ready when you are."],
    ["连接中", "Connecting"],
    ["我的设备 · 单设备", "Single Device"],
    ["我的设备 · 多设备", "My Devices"],
    ["2 台设备", "2 devices"],
    ["1 台设备", "1 device"],
    ["客厅", "Living Room"],
    ["卧室", "Bedroom"],
    ["书房", "Study"],
    ["验证页面关系、设备连接和产品专属控制，并以低信息密度、大色块和更厚的组件比例建立统一视觉。", "Devices. Setup. Control."],
    ["连接音箱后，可以在这里查看设备状态和使用产品专属功能。", "Connect. Control. Enjoy."],
    ["请打开音箱，并让设备进入连接或配网状态。", "Power on. Enable pairing."],
    ["用于发现并连接附近的 S601 和 S602。YUI 不会借此读取与你设备无关的内容。", "Find nearby S601 / S602. Nothing else."],
    ["确认音箱已开机并处于连接状态，然后让手机靠近音箱。", "Power on. Pair. Move closer."],
    ["打开音箱，并按产品说明让网络指示灯开始闪烁。", "Power on. Wait for the network light."],
    ["打开音箱，长按蓝牙按键，直到指示灯开始闪烁。", "Power on. Hold Bluetooth until it blinks."],
    ["设备已连接到 YUI_Studio_WiFi，并添加到“我的设备”。", "Connected to YUI_Studio_WiFi."],
    ["设备已经添加到“我的设备”，现在可以控制夕阳灯。", "Added to My Devices."],
    ["请确认 Wi-Fi 可用，并让 N86 靠近路由器后再试一次。", "Check Wi-Fi. Move N86 closer."],
    ["请确认音箱仍处于配对状态，并让手机靠近设备。", "Check pairing. Move closer."],
    ["请保持手机、音箱和路由器距离较近。", "Keep devices close."],
    ["找到 2 台附近设备，请选择要添加的产品。", "2 devices nearby."],
    ["密码只用于将 N86 连接到此网络。", "Used for setup only."],
    ["密码不正确，请修改后再试一次。", "Wrong password. Try again."],
    ["设备离线，暂时无法控制", "Offline"],
    ["选择设备与连接方式查看处理建议", "Choose a topic"],
    ["检查蓝牙、距离和配对状态", "Bluetooth · Distance · Pairing"],
    ["检查 Wi-Fi、密码和设备状态", "Wi-Fi · Password · Device"],
    ["用户协议与隐私政策", "Terms & Privacy"],
    ["正在将网络信息发送到 N86", "Sending to N86"],
    ["让 N86 进入配网状态", "N86 setup mode"],
    ["让音箱进入配对状态", "Pairing mode"],
    ["添加第一台 YUI 设备", "Add a device"],
    ["请在系统弹窗中点击“允许”，以发现并连接附近的 YUI 设备。", "Tap Allow in the system prompt to find nearby YUI devices."],
    ["正在寻找附近的设备", "Searching…"],
    ["暂时没有发现设备", "Nothing nearby"],
    ["请确认设备已开机，并已进入连接或配网状态。", "Power on. Enable pairing or setup."],
    ["S601 / S602 无法连接", "S601 / S602"],
    ["N86 无法配网", "N86 Wi-Fi"],
    ["允许 YUI 使用蓝牙", "Bluetooth access"],
    ["正在连接 S601", "Connecting S601"],
    ["正在连接网络", "Connecting…"],
    ["连接时间有点久", "Timed out"],
    ["没有连接成功", "Connection failed"],
    ["更换网络 / 重新配网", "Change Wi-Fi"],
    ["我的设备 · 空状态", "My Devices"],
    ["我的设备 · 等待蓝牙授权", "My Devices · Bluetooth Access"],
    ["我的设备 · 列表", "My Devices"],
    ["S601 / S602 蓝牙连接", "S601 / S602 Bluetooth"],
    ["N86 Wi-Fi 配网", "N86 Wi-Fi"],
    ["Wi-Fi 密码错误", "Wrong Password"],
    ["蓝牙连接成功", "Connected"],
    ["蓝牙连接失败", "Connection Failed"],
    ["蓝牙连接中", "Connecting"],
    ["N86 配网成功", "N86 Connected"],
    ["N86 配网超时", "N86 Timed Out"],
    ["N86 配网准备", "N86 Setup"],
    ["N86 配网中", "Connecting N86"],
    ["N86 网络状态", "N86 Wi-Fi"],
    ["S601 夕阳灯", "S601 Light"],
    ["S602 离线状态", "S602 Offline"],
    ["原型总览", "Overview"],
    ["产品图形预览", "Product Shapes"],
    ["产品图形", "Product Shapes"],
    ["已发现设备", "Found"],
    ["未发现设备", "No Devices Found"],
    ["搜索设备", "Search"],
    ["输入 Wi-Fi 密码", "Wi-Fi Password"],
    ["选择 Wi-Fi", "Choose Wi-Fi"],
    ["设备设置", "Device Settings"],
    ["App 设置", "App Settings"],
    ["权限管理", "Permissions"],
    ["使用帮助", "Help"],
    ["关于 YUI", "About YUI"],
    ["内容待补充", "Content coming soon"],
    ["正式用户协议尚未提供。本页仅用于预览阅读布局，不构成正式条款。", "The Terms of Service have not been supplied yet. This is a layout preview, not published terms."],
    ["正式隐私政策尚未提供。本页仅用于预览阅读布局，不代表实际的数据处理说明。", "The Privacy Policy has not been supplied yet. This is a layout preview, not a description of actual data practices."],
    ["客厅的 S601", "Living Room S601"],
    ["卧室的 S602", "Bedroom S602"],
    ["书房的 N86", "Study N86"],
    ["上次在线：昨天 22:18", "Last online · 22:18"],
    ["3 台设备", "3 devices"],
    ["添加设备", "Add Device"],
    ["请允许蓝牙连接", "Allow Bluetooth"],
    ["等待系统授权…", "Waiting for permission…"],
    ["我的设备", "My Devices"],
    ["统一视觉原型", "Visual Prototype"],
    ["这一版验证什么？", "V0.3.1"],
    ["设备列表与状态入口", "Devices · Status"],
    ["蓝牙连接与夕阳灯", "Bluetooth · Light"],
    ["Wi-Fi 配网与网络状态", "Wi-Fi · Status"],
    ["产品能力", "Features"],
    ["核心流程", "Flows"],
    ["夕阳灯 · 5档", "Light · 5 levels"],
    ["请选择 N86 要连接的网络。", "Choose a network."],
    ["附近 · 蓝牙音箱", "Bluetooth · Nearby"],
    ["附近 · 联网音箱", "Wi-Fi · Nearby"],
    ["蓝牙连接 · 夕阳灯", "Bluetooth · Light"],
    ["信号良好 · 需要密码", "Strong · Locked"],
    ["信号一般 · 需要密码", "Fair · Locked"],
    ["需要系统权限", "Permission needed"],
    ["夕阳灯音箱", "Light Speakers"],
    ["联网音箱", "Wi-Fi Speakers"],
    ["指示灯正在闪烁", "Light blinking"],
    ["查看连接帮助", "Connection help"],
    ["查看配网帮助", "Setup help"],
    ["模拟连接成功", "Connected"],
    ["模拟连接失败", "Failed"],
    ["模拟配网成功", "Connected"],
    ["模拟配网超时", "Timed out"],
    ["重新搜索", "Search again"],
    ["没有设备怎么办？", "Can't find a device?"],
    ["重新扫描网络", "Scan again"],
    ["选择其他网络", "Other network"],
    ["开始配网", "Connect"],
    ["重新配网", "Reconnect"],
    ["返回我的设备", "My Devices"],
    ["进入设备", "Open"],
    ["重新连接", "Reconnect"],
    ["再试一次", "Try again"],
    ["重新查看步骤", "Setup steps"],
    ["允许并继续", "Allow"],
    ["暂不允许", "Not now"],
    ["已连接 · 网络状态正常", "Connected"],
    ["连接设备", "Device"],
    ["配置网络", "Network"],
    ["确认在线", "Online"],
    ["已完成", "Done"],
    ["等待开始", "Waiting"],
    ["正在配置 N86", "Setting up N86"],
    ["亮度", "Brightness"],
    ["柔和", "Soft"],
    ["明亮", "Bright"],
    ["已开启 · ", "ON · "],
    ["已关闭", "OFF"],
    ["夕阳灯", "Light"],
    ["产品型号", "Model"],
    ["连接状态", "Status"],
    ["固件版本", "Firmware"],
    ["设备名称", "Name"],
    ["移除设备", "Remove"],
    ["权限仅在连接和配置设备时使用。", "For setup only."],
    ["发现并连接 S601 / S602", "S601 / S602"],
    ["发现并配置 N86", "N86"],
    ["为什么需要这些权限？", "Privacy"],
    ["YUI 只在添加和管理设备时使用相应能力。", "Used only to add and manage devices."],
    ["前往系统设置", "Open Settings"],
    ["本地网络", "Local Network"],
    ["连接与配网", "Connections"],
    ["检查系统权限", "System Permissions"],
    ["查看蓝牙和本地网络权限", "Bluetooth · Local Network"],
    ["遇到了什么问题？", "Need help?"],
    ["连接和配网常见问题", "Connections"],
    ["用户协议", "Terms of Service"],
    ["隐私政策", "Privacy Policy"],
    ["让声音与空间里的光更自然地陪伴日常。", "Sound. Light. Everyday."],
    ["配置 N86", "Set Up N86"],
    ["连接音箱", "Connect"],
    ["发现设备", "Found"],
    ["检查密码", "Password"],
    ["输入密码", "Password"],
    ["密码", "Password"],
    ["显示", "Show"],
    ["隐藏", "Hide"],
    ["关闭", "Close"],
    ["取消", "Cancel"],
    ["已连接", "Connected"],
    ["需要密码", "Locked"],
    ["请保持音箱开启，并将手机靠近设备。", "Keep your phone close."],
    ["夕阳灯亮度，共五档", "Light brightness, five levels"],
    ["蓝牙、局域网等系统权限", "Bluetooth · Local Network"],
    ["连接与常见问题", "Connections"],
    ["夕阳灯快捷开关", "Light toggle"],
    ["原型版本", "Prototype"],
    ["设备信息", "Device"],
    ["主导航", "Main navigation"],
    ["连接帮助", "Connection help"],
    ["配网帮助", "Setup help"],
    ["连接准备", "Connection Setup"],
    ["产品图", "Product"],
    ["切换", "Toggle "],
    ["打开", "Open "],
    ["返回", "Back"],
    ["原型", "Prototype"],
    ["蓝牙", "Bluetooth"],
    ["在线", "Online"],
    ["离线", "Offline"],
    ["已允许", "Allowed"],
    ["待允许", "Allow"],
    ["添加", "Add"],
    ["设备", "Devices"],
    ["设置", "Settings"],
    ["配网", "Setup"],
    ["网络", "Network"],
    ["档", ""]
  ].sort((a, b) => b[0].length - a[0].length);

  const toEnglish = (value) => {
    if (typeof value !== "string") return value;
    return englishPairs.reduce((text, [source, target]) => text.replaceAll(source, target), value);
  };

  const groupOrder = [
    "00 原型总览",
    "01 我的设备",
    "02 添加设备",
    "03 蓝牙连接",
    "04 N86 Wi-Fi 配网",
    "05 设备控制",
    "06 关于"
  ];

  window.YUI_SCREENS = screens;
  window.YUI_GROUP_ORDER = groupOrder;
  window.YUI_TO_ENGLISH = toEnglish;
})();
