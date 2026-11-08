(function () {
  "use strict";

  const DISMISS_KEY = "tsc-portal-install-dismissed";
  const THEME_KEY = "tsc-portal-theme";
  const PINS_KEY = "tsc-portal-pins";
  const RECENT_KEY = "tsc-portal-recent";
  const GROUPS_KEY = "tsc-portal-groups";
  const VIEWS = ["home", "resources", "search"];
  const RECENT_LIMIT = 4;
  const MOST_USED = [
    "Offer to Purchase",
    "New Listing Paperwork",
    "BAA / CIS & Disclosures",
    "Quick Comps",
  ];
  const FORM_GROUPS = [
    {
      id: "buyers",
      title: "Buyers",
      icon: "Buyers",
      titles: ["BAA / CIS & Disclosures", "Offer to Purchase", "NY Offer / NJ LOI"],
    },
    {
      id: "listings",
      title: "Listings",
      icon: "Listings",
      titles: ["New Listing Paperwork", "Upload In Person Listing Paperwork", "Quick Comps"],
    },
    {
      id: "rentals",
      title: "Rentals",
      icon: "Rentals",
      titles: ["Tenant Agency Agreement", "Rental Application", "Lease Request"],
    },
    {
      id: "ideas",
      title: "Team & Ideas",
      icon: "Ideas",
      titles: ["Mastermind Topic/Ideas", "Content Ideas!"],
    },
  ];
  const RESOURCE_GROUPS = [
    {
      id: "start",
      title: "Start Here",
      icon: "Start",
      titles: ["TSC Bible (Vision & Core Values)", "TSC Books/Pods"],
    },
    {
      id: "playbooks",
      title: "Playbooks",
      icon: "Playbooks",
      titles: ["Lead Gen", "Sellers", "Buyers", "Ways To Increase Conversion!", "Admin/Docs"],
    },
    {
      id: "tools",
      title: "Listing Tools",
      icon: "Tools",
      titles: [
        "Listing Intake Form (Fill In)",
        "AI Prompt Turns Notes Into Listing Intake Form",
        "AI Prompt Listing Appt Prep",
      ],
    },
    {
      id: "market",
      title: "Market & Pricing",
      icon: "Market",
      titles: ["AI Prompt Home Price Eval", "TSC Local Market Stats"],
    },
  ];

  const panel = document.getElementById("panel");
  const meta = document.getElementById("meta");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("q");
  const clearButton = document.getElementById("clear");
  const sticky = document.querySelector(".sticky");
  const navButtons = Array.from(document.querySelectorAll("[data-view]"));
  const install = document.getElementById("install");
  const installCopy = document.getElementById("install-copy");
  const installGo = document.getElementById("install-go");
  const installDismiss = document.getElementById("install-dismiss");
  const installLink = document.getElementById("install-link");
  const status = document.getElementById("status");
  const shareButton = document.getElementById("share");
  const themeButton = document.getElementById("theme");
  const toast = document.getElementById("toast");

  const state = {
    data: null,
    view: "home",
    query: "",
    scrollTruths: false,
    focusSearch: false,
  };

  let deferredPrompt = null;
  let toastTimer = 0;

  state.view = viewFromHash();
  applyTheme(resolveTheme());
  registerServiceWorker();
  bind();
  syncOnline();
  syncNav();
  setupInstall();
  loadData();

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      window.location.reload();
    });
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  function bind() {
    searchForm.addEventListener("submit", (event) => event.preventDefault());

    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      clearButton.hidden = state.query.length === 0;
      if (state.query && state.view !== "search") {
        state.view = "search";
        history.replaceState(null, "", "#search");
      }
      syncNav();
      render();
    });

    clearButton.addEventListener("click", () => {
      state.query = "";
      searchInput.value = "";
      clearButton.hidden = true;
      searchInput.focus();
      syncNav();
      render();
    });

    navButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        const view = button.dataset.view;
        selectView(view, { focusSearch: view === "search" });
      });
      button.addEventListener("keydown", (event) => {
        const next = navIndexFromKey(event.key, index);
        if (next === null) return;
        event.preventDefault();
        navButtons[next].focus();
        navButtons[next].click();
      });
    });

    window.addEventListener("hashchange", () => {
      state.view = viewFromHash();
      syncNav();
      render();
      if (state.focusSearch) {
        state.focusSearch = false;
        searchInput.focus();
      }
    });

    window.addEventListener("online", () => {
      syncOnline();
      loadData({ silent: true });
    });
    window.addEventListener("offline", syncOnline);
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) loadData({ silent: true });
    });

    installGo.addEventListener("click", promptInstall);
    installDismiss.addEventListener("click", () => {
      storageSet(DISMISS_KEY, "1");
      install.hidden = true;
    });
    installLink.addEventListener("click", () => {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch (error) {
        /* private mode */
      }
      renderInstall(true);
      install.scrollIntoView({ block: "nearest" });
    });

    shareButton.addEventListener("click", shareApp);
    themeButton.addEventListener("click", toggleTheme);

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

    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (scheme.addEventListener) {
      scheme.addEventListener("change", () => {
        if (storageGet(THEME_KEY)) return;
        applyTheme(resolveTheme());
      });
    }
  }

  function viewFromHash() {
    const id = location.hash.replace("#", "");
    if (id === "truths") {
      state.scrollTruths = true;
      return "home";
    }
    state.scrollTruths = false;
    if (id === "resources" || id === "search") return id;
    return "home";
  }

  function navIndexFromKey(key, index) {
    if (key === "ArrowRight") return (index + 1) % navButtons.length;
    if (key === "ArrowLeft") return (index - 1 + navButtons.length) % navButtons.length;
    if (key === "Home") return 0;
    if (key === "End") return navButtons.length - 1;
    return null;
  }

  function selectView(id, options) {
    if (!VIEWS.includes(id)) return;
    if (id !== "search") {
      state.query = "";
      searchInput.value = "";
      clearButton.hidden = true;
    }
    const hash = "#" + id;
    const already = location.hash === hash || (id === "home" && (location.hash === "" || location.hash === "#forms" || location.hash === "#truths"));
    if (already) {
      state.view = id;
      state.scrollTruths = location.hash === "#truths";
      syncNav();
      render();
      if (!(options && options.keepScroll) && location.hash !== "#truths") window.scrollTo(0, 0);
      if (options && options.focusSearch) searchInput.focus();
      return;
    }
    if (options && options.focusSearch) state.focusSearch = true;
    location.hash = id;
    if (!(options && options.keepScroll)) window.scrollTo(0, 0);
  }

  function syncNav() {
    const current = state.query && state.view !== "resources" ? "search" : state.view;
    navButtons.forEach((button) => {
      const selected = button.dataset.view === current;
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (sticky) sticky.hidden = state.view === "resources" && !state.query;
    panel.setAttribute("aria-labelledby", "nav-" + (state.view === "resources" ? "resources" : current));
  }

  async function loadData(options) {
    const silent = options && options.silent && state.data;
    if (!silent) {
      meta.textContent = "";
      panel.replaceChildren(loadingNode());
    }
    try {
      const response = await fetch("data/portal.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Could not load portal data");
      const data = await response.json();
      validateData(data);
      state.data = data;
      applyColors(data.siteColors);
      syncNav();
      render();
    } catch (error) {
      if (!state.data) showError();
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
    if (!hex.test(colors[0]) || !hex.test(colors[3])) return;
    document.documentElement.style.setProperty("--red", colors[0]);
    document.documentElement.style.setProperty("--ink", colors[3]);
  }

  function render() {
    if (!state.data) return;
    const query = state.query.trim();
    panel.replaceChildren();
    if (state.view === "resources" && !query) renderResources();
    else if (state.view === "search" || query) renderSearch(query);
    else renderHome();
    if (state.scrollTruths) {
      const truths = document.getElementById("truths");
      if (truths) truths.scrollIntoView({ block: "start" });
      state.scrollTruths = false;
    }
  }

  function renderHome() {
    const forms = formItems();
    const pinned = forms.filter((item) => isPinned(item.url));
    const recent = recentForms().filter((item) => !isPinned(item.url));
    meta.textContent = "";
    if (pinned.length) {
      panel.append(sectionLabel("Pinned", String(pinned.length)), stack(pinned.map((item) => formTile(item))));
    }
    if (recent.length) {
      panel.append(sectionLabel("Recent", String(recent.length)), stack(recent.map((item) => formTile(item))));
    }
    panel.append(mostUsedRow());
    FORM_GROUPS.forEach((group) => {
      const items = group.titles.map(findForm).filter(Boolean);
      if (items.length) panel.append(groupBlock(group, items, formTile));
    });
    panel.append(truthsBlock(state.data.boldTruths));
  }

  function renderResources() {
    meta.textContent = "";
    RESOURCE_GROUPS.forEach((group) => {
      const items = group.titles.map(findResource).filter(Boolean);
      if (items.length) panel.append(groupBlock(group, items, resourceTile));
    });
  }

  function renderSearch(query) {
    if (!query) {
      meta.textContent = "";
      const hint = document.createElement("p");
      hint.className = "empty";
      hint.textContent = "Search forms, resources, and BOLD Truths.";
      panel.append(hint);
      return;
    }
    const needle = query.toLowerCase();
    const forms = formItems().filter((item) => item.title.toLowerCase().includes(needle));
    const resources = state.data.resources
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        const kind = linkKind(item.url).toLowerCase();
        return item.title.toLowerCase().includes(needle) || (needle.length >= 3 && kind.includes(needle));
      });
    const truths = state.data.boldTruths
      .map((text, index) => ({ text, index }))
      .filter((item) => item.text.toLowerCase().includes(needle));
    const total = forms.length + resources.length + truths.length;
    meta.textContent = total + (total === 1 ? " match" : " matches");
    if (!total) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No matches for “" + query + "”.";
      panel.append(empty);
      return;
    }
    if (forms.length) panel.append(sectionLabel("Forms", String(forms.length)), stack(forms.map((item) => formTile(item))));
    if (resources.length) panel.append(sectionLabel("Resources", String(resources.length)), stack(resources.map((item) => resourceTile(item))));
    if (truths.length) panel.append(sectionLabel("BOLD Truths", String(truths.length)), stack(truths.map((item) => truthTile(item))));
  }

  function mostUsedRow() {
    const label = sectionLabel("Most used");
    const row = document.createElement("div");
    row.className = "quick-row";
    MOST_USED.forEach((title) => {
      const item = findForm(title);
      if (!item || !openable(item.url)) return;
      const link = document.createElement("a");
      link.className = "quick-card";
      link.setAttribute("href", item.url);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", item.title + ". Opens in a new tab.");
      const name = document.createElement("p");
      name.className = "card-title";
      name.textContent = item.title;
      link.append(glyph("Form"), name);
      link.addEventListener("click", () => remember(item.url));
      row.append(link);
    });
    const wrap = document.createElement("div");
    wrap.append(label, row);
    return wrap;
  }

  function groupBlock(group, items, makeTile) {
    const section = document.createElement("section");
    section.className = "group";
    const open = isGroupOpen(group.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-toggle";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    button.setAttribute("aria-controls", "group-" + group.id);
    const title = document.createElement("span");
    title.className = "group-title";
    title.textContent = group.title;
    const count = document.createElement("span");
    count.className = "group-count";
    count.textContent = String(items.length);
    button.append(glyph(group.icon), title, count, twistIcon());
    button.addEventListener("click", () => toggleGroup(group.id));
    const body = document.createElement("div");
    body.id = "group-" + group.id;
    body.className = "stack group-body";
    body.hidden = !open;
    items.forEach((item) => body.append(makeTile(item)));
    section.append(button, body);
    return section;
  }

  function findForm(title) {
    return formItems().find((item) => item.title === title);
  }

  function findResource(title) {
    return state.data.resources.map((item, index) => ({ ...item, index })).find((item) => item.title === title);
  }

  function isGroupOpen(id) {
    const saved = readMap(GROUPS_KEY);
    return saved[id] !== false;
  }

  function toggleGroup(id) {
    const saved = readMap(GROUPS_KEY);
    saved[id] = !isGroupOpen(id);
    storageSet(GROUPS_KEY, JSON.stringify(saved));
    render();
  }

  function readMap(key) {
    try {
      const parsed = JSON.parse(storageGet(key) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function formItems() {
    return state.data.forms.map((item, index) => ({ ...item, index }));
  }

  function truthsBlock(truths) {
    const wrap = document.createElement("section");
    wrap.id = "truths";
    wrap.setAttribute("aria-labelledby", "truths-heading");
    const featureIndex = dayIndex(truths.length);
    const feature = document.createElement("article");
    feature.className = "feature";
    feature.id = "truth-of-the-day";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = "Truth of the day · " + String(featureIndex + 1).padStart(2, "0");
    const when = document.createElement("p");
    when.className = "when";
    when.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
    const quote = document.createElement("p");
    quote.className = "truth-text";
    quote.textContent = truths[featureIndex];
    feature.append(kicker, when, quote);

    const heading = sectionLabel("BOLD Truths", String(truths.length));
    heading.id = "truths-heading";
    const list = stack(
      truths.map((text, index) => truthTile({ text, index })).filter((_, index) => index !== featureIndex)
    );
    wrap.append(heading, feature, list);
    return wrap;
  }

  function sectionLabel(title, count) {
    const heading = document.createElement("h2");
    heading.className = "section-label";
    heading.append(document.createTextNode(title));
    if (count) {
      const note = document.createElement("span");
      note.textContent = count;
      heading.append(note);
    }
    return heading;
  }

  function stack(nodes) {
    const list = document.createElement("div");
    list.className = "stack";
    nodes.forEach((node) => list.append(node));
    return list;
  }

  function formTile(item) {
    const tile = document.createElement("article");
    tile.className = "tile";
    const link = linkCard(item, "Form");
    link.addEventListener("click", () => remember(item.url));
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "icon-btn pin";
    const pinned = isPinned(item.url);
    pin.setAttribute("aria-pressed", pinned ? "true" : "false");
    pin.setAttribute("aria-label", (pinned ? "Unpin " : "Pin ") + (item.title || "form"));
    pin.append(starIcon(pinned));
    pin.addEventListener("click", () => {
      togglePin(item.url);
      render();
    });
    tile.append(link, pin);
    return tile;
  }

  function resourceTile(item) {
    const tile = document.createElement("article");
    tile.className = "tile";
    tile.append(linkCard(item, linkKind(item.url)));
    return tile;
  }

  function linkCard(item, kind) {
    const title = item.title || "Untitled";
    if (!openable(item.url)) {
      const row = document.createElement("div");
      row.className = "tile-link";
      row.append(glyph(kind), cardCopy(title, "Missing link"));
      return row;
    }
    const link = document.createElement("a");
    link.className = "tile-link";
    link.setAttribute("href", item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", title + ". Opens in a new tab.");
    link.append(glyph(kind), cardCopy(title, kind), chevron());
    return link;
  }

  function truthTile(entry) {
    const row = document.createElement("article");
    row.className = "tile truth";
    const number = document.createElement("span");
    number.className = "truth-num";
    number.textContent = String(entry.index + 1).padStart(2, "0");
    const text = document.createElement("p");
    text.className = "truth-text";
    text.textContent = entry.text;
    row.append(number, text);
    return row;
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

  function glyph(kind) {
    const wrap = document.createElement("span");
    wrap.className = "glyph";
    wrap.append(icon(kind));
    return wrap;
  }

  function icon(kind) {
    const paths = {
      Form: ["M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v5h5", "M9 13h6M9 17h6"],
      Buyers: ["M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M16.5 10.5a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z", "M3.5 19c.4-2.4 2.4-4 5-4s4.6 1.6 5 4", "M14 15.2c1.8.2 3.4 1.3 3.8 3.8"],
      Listings: ["M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"],
      Rentals: ["M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M11 11.2 16 16.2", "M14.2 14.4l1.6 1.6", "M16.2 16.4l1.4 1.4"],
      Ideas: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.2 11.1c.5.4 1.2 1.1 1.2 2h4c0-.9.7-1.6 1.2-2A6 6 0 0 0 12 3z"],
      Start: ["M7 4h10a1 1 0 0 1 1 1v15l-6-3.2L6 20V5a1 1 0 0 1 1-1z"],
      Playbooks: ["M5 5.2A2.2 2.2 0 0 1 7.2 3H19v15.5H7.2A2.2 2.2 0 0 0 5 20.7z", "M5 5.2v15.5"],
      Tools: ["M8 3h8v4H8z", "M7 7h10v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z", "M10 12h4", "M10 16h4"],
      Market: ["M4 19V5", "M4 19h16", "M8 15l3-4 3 2 5-7"],
      Folder: ["M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"],
      File: ["M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v5h5"],
      Sheet: ["M5 4h14v16H5z", "M5 9h14M5 14h14M10 4v16"],
      Doc: ["M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v5h5", "M9 12h6M9 16h4"],
      Page: ["M4 19V5", "M4 19h16", "M8 15l3-4 3 2 5-7"],
      Link: ["M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.1", "M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"],
    };
    return strokeIcon(paths[kind] || paths.Link);
  }

  function starIcon(filled) {
    const svg = svgEl();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M12 3.4l2.1 4.4 4.8.7-3.5 3.4.8 4.8L12 14.6 7.8 16.7l.8-4.8L5.1 8.5l4.8-.7z");
    path.setAttribute("fill", filled ? "currentColor" : "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.4");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  function strokeIcon(commands) {
    const svg = svgEl();
    commands.forEach((d) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.7");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      svg.append(path);
    });
    return svg;
  }

  function svgEl() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "22");
    svg.setAttribute("height", "22");
    svg.setAttribute("aria-hidden", "true");
    return svg;
  }

  function twistIcon() {
    const svg = svgEl();
    svg.classList.add("twist");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M6 9l6 6 6-6");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.append(path);
    return svg;
  }

  function chevron() {
    const svg = svgEl();
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M9 5l7 7-7 7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.classList.add("chevron");
    svg.append(path);
    return svg;
  }

  function dayIndex(length) {
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = Math.floor(localMidnight / 86400000);
    return ((day % length) + length) % length;
  }

  function isPinned(url) {
    return readList(PINS_KEY).includes(url);
  }

  function togglePin(url) {
    const pins = readList(PINS_KEY).filter((item) => item !== url);
    if (!isPinned(url)) pins.unshift(url);
    storageSet(PINS_KEY, JSON.stringify(pins));
  }

  function remember(url) {
    const recent = readRecent().filter((item) => item.url !== url);
    recent.unshift({ url, at: Date.now() });
    storageSet(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
  }

  function recentForms() {
    const byUrl = new Map(formItems().map((item) => [item.url, item]));
    return readRecent()
      .map((item) => byUrl.get(item.url))
      .filter(Boolean);
  }

  function readRecent() {
    try {
      const parsed = JSON.parse(storageGet(RECENT_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && typeof item.url === "string");
    } catch (error) {
      return [];
    }
  }

  function readList(key) {
    try {
      const parsed = JSON.parse(storageGet(key) || "[]");
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch (error) {
      return [];
    }
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
    message.textContent = "The portal data did not load. Reconnect, then pull to refresh or try again.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry";
    retry.textContent = "Retry";
    retry.addEventListener("click", () => loadData());
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
          ? "Add TSC Portal to your iPhone: tap Share, then Add to Home Screen."
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
        message: "On Android, open the Chrome menu and tap Install app.",
      };
    }
    return {
      canPrompt: false,
      message: "Install from the browser menu, or the install icon in the address bar.",
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

  async function shareApp() {
    const url = new URL(location.href);
    url.hash = "";
    const payload = {
      title: "TSC Agent Portal",
      text: "The Sold Collective agent portal",
      url: url.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      showToast("Link copied");
    } catch (error) {
      showToast(url.href);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  function resolveTheme() {
    const saved = storageGet(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    storageSet(THEME_KEY, next);
    applyTheme(next);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#000000" : "#f3f0ee");
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
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
