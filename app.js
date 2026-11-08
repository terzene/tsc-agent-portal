(function () {
  "use strict";

  const DISMISS_KEY = "tsc-portal-install-dismissed";
  const TABS = ["forms", "resources", "truths"];

  const panel = document.getElementById("panel");
  const meta = document.getElementById("meta");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("q");
  const clearButton = document.getElementById("clear");
  const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
  const install = document.getElementById("install");
  const installCopy = document.getElementById("install-copy");
  const installGo = document.getElementById("install-go");
  const installDismiss = document.getElementById("install-dismiss");
  const installLink = document.getElementById("install-link");
  const status = document.getElementById("status");

  const state = {
    data: null,
    tab: tabFromHash(),
    query: "",
  };

  let deferredPrompt = null;

  registerServiceWorker();
  bind();
  syncOnline();
  syncTabs();
  setupInstall();
  boot();

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  function bind() {
    searchForm.addEventListener("submit", (event) => event.preventDefault());

    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      clearButton.hidden = state.query.length === 0;
      render();
    });

    clearButton.addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      clearButton.hidden = true;
      searchInput.focus();
      render();
    });

    tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => selectTab(button.dataset.tab));
      button.addEventListener("keydown", (event) => {
        const next = tabIndexFromKey(event.key, index);
        if (next === null) return;
        event.preventDefault();
        tabButtons[next].focus();
        selectTab(tabButtons[next].dataset.tab);
      });
    });

    window.addEventListener("hashchange", () => {
      state.tab = tabFromHash();
      syncTabs();
      render();
    });

    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);

    installGo.addEventListener("click", promptInstall);
    installDismiss.addEventListener("click", () => {
      storageSet(DISMISS_KEY, "1");
      install.hidden = true;
    });
    installLink.addEventListener("click", () => {
      storageSet(DISMISS_KEY, "");
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch (error) {
        /* private mode */
      }
      renderInstall(true);
      install.scrollIntoView({ block: "nearest" });
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      renderInstall(false);
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      install.hidden = true;
      installLink.hidden = true;
    });
  }

  function tabFromHash() {
    const id = location.hash.replace("#", "");
    return TABS.includes(id) ? id : "forms";
  }

  function tabIndexFromKey(key, index) {
    if (key === "ArrowRight") return (index + 1) % tabButtons.length;
    if (key === "ArrowLeft") return (index - 1 + tabButtons.length) % tabButtons.length;
    if (key === "Home") return 0;
    if (key === "End") return tabButtons.length - 1;
    return null;
  }

  function selectTab(id) {
    if (!TABS.includes(id)) return;
    if (location.hash === "#" + id) {
      state.tab = id;
      syncTabs();
      render();
      return;
    }
    location.hash = id;
  }

  function syncTabs() {
    tabButtons.forEach((button) => {
      const selected = button.dataset.tab === state.tab;
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "tab-" + state.tab);
    const placeholders = {
      forms: "Search forms",
      resources: "Search resources",
      truths: "Search BOLD Truths",
    };
    searchInput.placeholder = placeholders[state.tab];
  }

  async function boot() {
    panel.replaceChildren(loadingNode());
    try {
      const response = await fetch("data/portal.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Could not load portal data");
      const data = await response.json();
      validateData(data);
      state.data = data;
      applyColors(data.siteColors);
      syncTabs();
      render();
    } catch (error) {
      showError();
    }
  }

  function validateData(data) {
    if (!data || !Array.isArray(data.forms) || !Array.isArray(data.resources) || !Array.isArray(data.boldTruths)) {
      throw new Error("portal.json is missing forms, resources, or boldTruths");
    }
  }

  function applyColors(colors) {
    if (!Array.isArray(colors) || colors.length < 4) return;
    const hex = /^#[0-9a-fA-F]{6}$/;
    const [red, white, black, ink] = colors;
    if (![red, white, black, ink].every((color) => hex.test(color))) return;
    const root = document.documentElement;
    root.style.setProperty("--red", red);
    root.style.setProperty("--white", white);
    root.style.setProperty("--black", black);
    root.style.setProperty("--ink", ink);
    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute("content", black);
  }

  function render() {
    if (!state.data) return;
    const items = currentItems();
    const shown = filterItems(items);
    meta.textContent = metaText(items.length, shown.length);
    panel.replaceChildren();

    if (!shown.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = state.query.trim()
        ? "No matches for “" + state.query.trim() + "”."
        : "Nothing is listed in this section yet.";
      panel.append(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "list";
    if (state.tab === "truths") {
      shown.forEach((entry) => list.append(truthCard(entry)));
    } else {
      shown.forEach((entry) => list.append(linkCard(entry)));
    }
    panel.append(list);
  }

  function currentItems() {
    if (state.tab === "resources") {
      return state.data.resources.map((item, index) => ({ ...item, index }));
    }
    if (state.tab === "truths") {
      return state.data.boldTruths.map((text, index) => ({ text, index }));
    }
    return state.data.forms.map((item, index) => ({ ...item, index }));
  }

  function filterItems(items) {
    const query = state.query.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const title = (item.title || item.text || "").toLowerCase();
      const kind = item.url ? linkKind(item.url).toLowerCase() : "";
      return title.includes(query) || kind.includes(query);
    });
  }

  function metaText(total, shown) {
    const noun = sectionNoun(total);
    if (!state.query.trim()) return total + " " + noun;
    return shown + " of " + total + " " + noun;
  }

  function sectionNoun(count) {
    if (state.tab === "forms") return count === 1 ? "form" : "forms";
    if (state.tab === "resources") return count === 1 ? "resource" : "resources";
    return count === 1 ? "BOLD Truth" : "BOLD Truths";
  }

  function linkCard(item) {
    const title = item.title || "Untitled";
    const kind = linkKind(item.url);
    if (!openable(item.url)) {
      const row = document.createElement("div");
      row.className = "link-card";
      row.append(cardCopy(title, "Missing link"));
      return row;
    }

    const link = document.createElement("a");
    link.className = "link-card";
    link.setAttribute("href", item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", title + ". Opens in a new tab.");
    link.append(cardCopy(title, kind), chevron());
    return link;
  }

  function cardCopy(title, kind) {
    const copy = document.createElement("div");
    copy.className = "card-copy";
    const heading = document.createElement("p");
    heading.className = "card-title";
    heading.textContent = title;
    const label = document.createElement("p");
    label.className = "card-kind";
    label.textContent = kind;
    copy.append(heading, label);
    return copy;
  }

  function truthCard(entry) {
    const row = document.createElement("article");
    row.className = "truth";
    const number = document.createElement("span");
    number.className = "truth-num";
    number.textContent = String(entry.index + 1).padStart(2, "0");
    const text = document.createElement("p");
    text.className = "truth-text";
    text.textContent = entry.text;
    row.append(number, text);
    return row;
  }

  function linkKind(url) {
    let host = "";
    let path = "";
    try {
      const parsed = new URL(url);
      host = parsed.hostname;
      path = parsed.pathname;
    } catch (error) {
      return "Link";
    }
    if (host === "docs.google.com" && path.includes("/forms/")) return "Form";
    if (host === "docs.google.com" && path.includes("/spreadsheets/")) return "Sheet";
    if (host === "docs.google.com" && path.includes("/document/")) return "Doc";
    if (host === "drive.google.com" && path.includes("/folders/")) return "Folder";
    if (host === "drive.google.com" && path.includes("/file/")) return "File";
    if (host === "script.google.com") return "Page";
    return "Link";
  }

  function openable(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url);
  }

  function chevron() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("chevron");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M9 5l7 7-7 7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2.2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  function loadingNode() {
    const node = document.createElement("p");
    node.className = "loading";
    node.textContent = "Loading portal…";
    return node;
  }

  function showError() {
    meta.textContent = "";
    panel.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty";
    message.textContent = "The portal data did not load. Reconnect, then try again.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry";
    retry.textContent = "Retry";
    retry.addEventListener("click", boot);
    panel.append(message, retry);
  }

  function syncOnline() {
    status.hidden = navigator.onLine;
  }

  function setupInstall() {
    const standalone = isStandalone();
    installLink.hidden = standalone;
    if (standalone) {
      install.hidden = true;
      return;
    }
    renderInstall(false);
  }

  function renderInstall(force) {
    if (isStandalone()) {
      install.hidden = true;
      installLink.hidden = true;
      return;
    }
    installLink.hidden = false;
    if (!force && storageGet(DISMISS_KEY) === "1") {
      install.hidden = true;
      return;
    }
    const platform = installPlatform();
    installCopy.textContent = platform.message;
    installGo.hidden = !platform.canPrompt;
    install.hidden = false;
  }

  function installPlatform() {
    const ua = navigator.userAgent || "";
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) {
      const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
      return {
        canPrompt: false,
        message: safari
          ? "To install on your iPhone, tap the Share button, then Add to Home Screen."
          : "On iPhone, open this page in Safari. Tap Share, then Add to Home Screen.",
      };
    }
    if (deferredPrompt) {
      return {
        canPrompt: true,
        message: "Install TSC Portal on your home screen.",
      };
    }
    if (/Android/i.test(ua)) {
      return {
        canPrompt: false,
        message: "To install on Android, open the Chrome menu and tap Install app.",
      };
    }
    return {
      canPrompt: false,
      message: "To install, use the install icon in the address bar, or the browser menu.",
    };
  }

  async function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installGo.hidden = true;
    if (choice && choice.outcome === "accepted") install.hidden = true;
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      /* private mode */
    }
  }
})();
