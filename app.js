(function () {
  "use strict";

  const DISMISS_KEY = "tsc-portal-install-dismissed";
  const THEME_KEY = "tsc-portal-theme";
  const PINS_KEY = "tsc-portal-pins";
  const RECENT_KEY = "tsc-portal-recent";
  const GROUPS_KEY = "tsc-portal-groups";
  const NAME_KEY = "tsc-portal-name";
  const NAME_ASKED_KEY = "tsc-portal-name-asked";
  const VIEWS = ["home", "resources", "team", "search"];
  const RECENT_LIMIT = 4;
  const TONES = {
    buyers: { ink: "#A56B76", bright: "#C9A3AB", tint: "#FBF7F8", dark: "#2A2828" },
    listings: { ink: "#CA0516", bright: "#E7A3A8", tint: "#FBF7F7", dark: "#2A2828" },
    rentals: { ink: "#A6845A", bright: "#CDB48A", tint: "#FBF8F4", dark: "#2A2828" },
    ideas: { ink: "#7A7194", bright: "#B3A9C9", tint: "#F8F7FA", dark: "#2A2828" },
    start: { ink: "#A56B76", bright: "#C9A3AB", tint: "#FBF7F8", dark: "#2A2828" },
    playbooks: { ink: "#5F7F6E", bright: "#9BB5A6", tint: "#F6F8F7", dark: "#2A2828" },
    tools: { ink: "#5E7394", bright: "#A7B6CC", tint: "#F6F8FB", dark: "#2A2828" },
    market: { ink: "#5E807C", bright: "#9BB8B4", tint: "#F6F8F8", dark: "#2A2828" },
    dash: { ink: "#6A6794", bright: "#B0ADC9", tint: "#F7F7FA", dark: "#2A2828" },
  };
  const MODEL_LINE =
    "Use the newest, most capable model available and turn on its thinking / extended reasoning mode (sometimes labeled Thinking, Pro, Deep Think or complex problems) before pasting this prompt.";
  const PROMPT_PACKS = {
    "home-eval": {
      id: "home-eval",
      label: "Home Eval",
      file: "data/home-eval.json",
      resourceTitle: "AI Prompt Home Price Eval",
      sourceName: "AI Prompt Home Price Eval",
      icon: "Spark",
      tileHelp: "Copy the home price prompt, then paste it into Gemini.",
    },
    "appt-prep": {
      id: "appt-prep",
      label: "Appt Prep",
      file: "data/appt-prep.json",
      resourceTitle: "AI Prompt Listing Appt Prep",
      sourceName: "AI Prompt Listing Appt Prep",
      icon: "Calendar",
      tileHelp: "Copy the listing appointment prompt, then paste it into Gemini.",
    },
  };
  const QUICK_GROUPS = [
    {
      id: "forms",
      title: "Forms",
      actions: [
        { label: "Listing Intake", intake: true, tone: "listings" },
        { label: "Offer to Purchase", title: "Offer to Purchase", tone: "listings" },
        { label: "BAA / CIS & Disclosures", title: "BAA / CIS & Disclosures", tone: "buyers" },
        { label: "New Listing Paperwork", title: "New Listing Paperwork", tone: "listings" },
      ],
    },
    {
      id: "prompts",
      title: "AI Prompts",
      actions: [
        { label: "Home Eval", promptId: "home-eval", tone: "rentals" },
        { label: "Quick Comps", title: "Quick Comps", tone: "playbooks" },
        { label: "Local Market", title: "Local Market", tone: "market" },
        { label: "Appt Prep", promptId: "appt-prep", tone: "tools" },
      ],
    },
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
  const welcome = document.getElementById("welcome");

  const state = {
    data: null,
    quotes: [],
    prompts: {},
    view: "home",
    query: "",
    scrollTruths: false,
    focusSearch: false,
  };

  let deferredPrompt = null;
  let toastTimer = 0;
  let intakeRecognizer = null;
  let intakeAttached = [];

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
    welcome.addEventListener("submit", (event) => {
      if (!event.target || event.target.id !== "name-form") return;
      event.preventDefault();
      const field = document.getElementById("first-name");
      const value = field ? field.value.trim() : "";
      if (!value) return;
      storageSet(NAME_KEY, value.slice(0, 40));
      storageSet(NAME_ASKED_KEY, "1");
      render();
    });
    welcome.addEventListener("click", (event) => {
      if (!event.target || event.target.id !== "name-skip") return;
      storageSet(NAME_ASKED_KEY, "1");
      render();
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
    if (id === "resources" || id === "search" || id === "team") return id;
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
    if (sticky) sticky.hidden = (state.view === "resources" || state.view === "team") && !state.query;
    const labelled = state.view === "resources" || state.view === "team" ? state.view : current;
    panel.setAttribute("aria-labelledby", "nav-" + labelled);
  }

  async function loadData(options) {
    const silent = options && options.silent && state.data;
    if (!silent) {
      meta.textContent = "";
      panel.replaceChildren(loadingNode());
    }
    try {
      const promptIds = Object.keys(PROMPT_PACKS);
      const [response, quoteResponse, ...promptResponses] = await Promise.all([
        fetch("data/portal.json", { cache: "no-cache" }),
        fetch("data/stoic-quotes.json", { cache: "no-cache" }),
        ...promptIds.map((id) => fetch(PROMPT_PACKS[id].file, { cache: "no-cache" })),
      ]);
      if (!response.ok) throw new Error("Could not load portal data");
      const data = await response.json();
      validateData(data);
      state.data = data;
      state.quotes = quoteResponse.ok ? validQuotes(await quoteResponse.json()) : [];
      state.prompts = {};
      for (let i = 0; i < promptIds.length; i += 1) {
        const promptResponse = promptResponses[i];
        state.prompts[promptIds[i]] = promptResponse.ok ? validPromptPack(await promptResponse.json()) : null;
      }
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
    renderWelcome();
    if (state.view === "team" && !query) renderTeam();
    else if (state.view === "resources" && !query) renderResources();
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
    panel.append(sectionLabel("Pinned", pinned.length ? String(pinned.length) : ""));
    if (pinned.length) panel.append(stack(pinned.map((item) => formTile(item))));
    else panel.append(emptyShelf("pin", "Pin a form with the star and it stays on this phone."));
    panel.append(sectionLabel("Recent", recent.length ? String(recent.length) : ""));
    if (recent.length) panel.append(stack(recent.map((item) => formTile(item))));
    else panel.append(emptyShelf("clock", "Forms you open will show up here."));
    panel.append(actionGrid());
    FORM_GROUPS.forEach((group) => {
      const items = group.titles.map(findForm).filter(Boolean);
      if (items.length) panel.append(groupBlock(group, items, formTile));
      if (group.id === "listings") panel.append(dashboardsBlock());
    });
    const stoic = stoicCard(state.quotes);
    if (stoic) panel.append(stoic);
  }

  function renderWelcome() {
    if (!welcome) return;
    welcome.replaceChildren();
    const show = state.view === "home" && state.data && !state.query.trim();
    welcome.hidden = !show;
    if (!show) return;
    const greet = document.createElement("h1");
    greet.className = "greet";
    const name = (storageGet(NAME_KEY) || "").trim();
    greet.textContent = greeting() + (name ? ", " + name : "");
    welcome.append(greet);
    if (!name && storageGet(NAME_ASKED_KEY) !== "1") welcome.append(namePrompt());
    welcome.append(heroCard(state.data.boldTruths));
  }

  function greeting(date) {
    const hour = (date || new Date()).getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function namePrompt() {
    const form = document.createElement("form");
    form.id = "name-form";
    form.className = "name-ask";
    const label = document.createElement("label");
    label.htmlFor = "first-name";
    label.textContent = "What's your first name?";
    const input = document.createElement("input");
    input.id = "first-name";
    input.name = "first-name";
    input.type = "text";
    input.maxLength = 40;
    input.autocomplete = "given-name";
    input.enterKeyHint = "done";
    const actions = document.createElement("div");
    actions.className = "name-ask-actions";
    const save = document.createElement("button");
    save.type = "submit";
    save.textContent = "Save";
    const skip = document.createElement("button");
    skip.type = "button";
    skip.id = "name-skip";
    skip.className = "ghost";
    skip.textContent = "Not now";
    actions.append(save, skip);
    form.append(label, input, actions);
    return form;
  }

  function heroCard(truths) {
    const index = dayIndex(truths.length);
    const card = document.createElement("article");
    card.className = "hero";
    card.id = "truths";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = "Bold Truth of the day";
    const when = document.createElement("p");
    when.className = "when";
    when.textContent = nyDateLabel();
    const quote = document.createElement("p");
    quote.className = "truth-text";
    quote.textContent = truths[index];
    card.append(kicker, when, quote);
    return card;
  }

  function stoicCard(quotes) {
    if (!quotes.length) return null;
    const item = quotes[dayIndex(quotes.length)];
    const card = document.createElement("article");
    card.className = "stoic";
    card.id = "stoic-of-the-day";
    const kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = "Stoic quote of the day";
    const quote = document.createElement("p");
    quote.className = "truth-text";
    quote.textContent = item.text;
    const byline = document.createElement("p");
    byline.className = "byline";
    byline.textContent = item.source ? item.author + " · " + item.source : item.author;
    card.append(kicker, quote, byline);
    return card;
  }

  function validQuotes(parsed) {
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.text === "string" && item.text.trim() && typeof item.author === "string" && item.author.trim());
  }

  function emptyShelf(kind, message) {
    const row = document.createElement("div");
    row.className = "empty-card";
    row.append(emptyArt(kind));
    const text = document.createElement("p");
    text.textContent = message;
    row.append(text);
    return row;
  }

  function emptyArt(kind) {
    const svg = svgEl();
    svg.classList.add("empty-art");
    svg.setAttribute("width", "36");
    svg.setAttribute("height", "36");
    const paths = kind === "pin"
      ? ["M12 21s-6-4.4-6-9a6 6 0 1 1 12 0c0 4.6-6 9-6 9z", "M12 11.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z"]
      : ["M12 7v5l3 2", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"];
    paths.forEach((d) => {
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
    const dashboards = dashboardItems().filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const help = String(item.help || "").toLowerCase();
      return title.includes(needle) || help.includes(needle);
    });
    const total = forms.length + resources.length + truths.length + dashboards.length;
    meta.textContent = total + (total === 1 ? " match" : " matches");
    if (!total) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No matches for “" + query + "”.";
      panel.append(empty);
      return;
    }
    if (dashboards.length) panel.append(sectionLabel("Dashboards", String(dashboards.length)), stack(dashboards.map((item) => dashboardTile(item))));
    if (forms.length) panel.append(sectionLabel("Forms", String(forms.length)), stack(forms.map((item) => formTile(item))));
    if (resources.length) panel.append(sectionLabel("Resources", String(resources.length)), stack(resources.map((item) => resourceTile(item))));
    if (truths.length) panel.append(sectionLabel("BOLD Truths", String(truths.length)), stack(truths.map((item) => truthTile(item))));
  }

  function actionGrid() {
    const wrap = document.createElement("div");
    wrap.className = "quick-actions";
    wrap.append(sectionLabel("Quick actions"));
    QUICK_GROUPS.forEach((group) => {
      const section = document.createElement("section");
      section.className = "quick-group" + (group.id === "prompts" ? " quick-group-split" : "");
      const heading = document.createElement("h3");
      heading.className = "quick-subhead";
      heading.textContent = group.title;
      const grid = document.createElement("div");
      grid.className = "action-grid";
      group.actions.forEach((spec) => {
        const tile = quickActionTile(spec);
        if (tile) grid.append(tile);
      });
      section.append(heading, grid);
      wrap.append(section);
    });
    return wrap;
  }

  function quickActionTile(spec) {
    if (spec.placeholder) return placeholderTile(spec);
    if (spec.intake) return intakeActionTile(spec);
    if (spec.promptId && PROMPT_PACKS[spec.promptId]) return promptTile(spec);
    const item = findQuickAction(spec.title);
    if (!item || !openable(item.url)) return null;
    const link = document.createElement("a");
    link.className = "action-tile";
    link.setAttribute("href", item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const labelText = spec.label || item.title;
    link.setAttribute("aria-label", labelText + ". Opens in a new tab.");
    applyTone(link, TONES[spec.tone] || toneForTitle(item.title));
    const name = document.createElement("p");
    name.className = "card-title";
    name.textContent = labelText;
    link.append(glyph(item.icon || itemIcon(item, "Form")), name);
    if (item.help) {
      const help = document.createElement("p");
      help.className = "card-help";
      help.textContent = item.help;
      link.append(help);
    }
    if (findForm(item.title)) link.addEventListener("click", () => remember(item.url));
    return link;
  }

  function promptTile(spec) {
    const packSpec = PROMPT_PACKS[spec.promptId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-tile";
    button.setAttribute("aria-label", packSpec.label + ". " + packSpec.tileHelp);
    applyTone(button, TONES[spec.tone] || TONES.rentals);
    const name = document.createElement("p");
    name.className = "card-title";
    name.textContent = spec.label;
    const help = document.createElement("p");
    help.className = "card-help";
    help.textContent = packSpec.tileHelp;
    button.append(glyph(packSpec.icon), name, help);
    button.addEventListener("click", () => openPromptSheet(packSpec));
    return button;
  }

  function validPromptPack(parsed) {
    if (!parsed || typeof parsed.prompt !== "string" || !parsed.prompt.trim()) return null;
    if (!Array.isArray(parsed.fields) || !parsed.fields.length) return null;
    if (typeof parsed.sourceUrl !== "string" || !openable(parsed.sourceUrl)) return null;
    if (typeof parsed.geminiUrl !== "string" || !openable(parsed.geminiUrl)) return null;
    return parsed;
  }

  function promptFieldValues(form) {
    const values = {};
    form.querySelectorAll("[data-eval-field]").forEach((input) => {
      values[input.dataset.evalField] = input.value;
    });
    return values;
  }

  function fillPrompt(pack, values) {
    let text = pack.prompt;
    pack.fields.forEach((field) => {
      const value = String(values[field.id] || "").replace(/\s+/g, " ").trim();
      if (!value || !field.token || !text.includes(field.token)) return;
      text = text.replace(field.token, value);
    });
    return text;
  }

  function promptToCopy(pack, values) {
    return MODEL_LINE + "\n\n" + fillPrompt(pack, values);
  }

  function openPromptSheet(spec) {
    document.querySelectorAll(".eval-sheet").forEach((node) => node.remove());
    const pack = state.prompts[spec.id];
    const resource = findResource(spec.resourceTitle);
    const sourceUrl = (pack && pack.sourceUrl) || (resource && resource.url) || "";
    const sheet = document.createElement("div");
    sheet.id = spec.id;
    sheet.className = "eval-sheet";
    const card = document.createElement("div");
    card.className = "eval-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", spec.id + "-title");
    const head = document.createElement("div");
    head.className = "eval-head";
    const title = document.createElement("h2");
    title.id = spec.id + "-title";
    title.textContent = spec.label;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-btn";
    close.setAttribute("aria-label", "Close " + spec.label);
    close.textContent = "Close";
    close.addEventListener("click", () => sheet.remove());
    head.append(title, close);
    card.append(head);
    if (!pack) {
      const missing = document.createElement("p");
      missing.className = "eval-note";
      missing.textContent = "The prompt text could not be loaded, so nothing was copied. Open the original doc instead.";
      card.append(missing);
      if (openable(sourceUrl)) card.append(evalLink(sourceUrl, "Open the original doc"));
      sheet.append(card);
      document.body.append(sheet);
      close.focus();
      return;
    }
    const note = document.createElement("p");
    note.className = "eval-note";
    note.textContent =
      "This is the prompt from " +
      spec.sourceName +
      ". " +
      MODEL_LINE +
      " Copy it, then paste it into Gemini. This app does not paste it for you.";
    card.append(note);
    const guide = document.createElement("details");
    guide.className = "eval-guide";
    const summary = document.createElement("summary");
    summary.textContent = "Notes from the original doc";
    const guideText = document.createElement("p");
    guideText.textContent = pack.intro || "";
    guide.append(summary, guideText);
    card.append(guide);
    const form = document.createElement("form");
    form.className = "eval-fields";
    form.addEventListener("submit", (event) => event.preventDefault());
    pack.fields.forEach((field) => {
      const label = document.createElement("label");
      const labelText = document.createElement("span");
      labelText.textContent = field.label;
      const input = document.createElement(field.multiline ? "textarea" : "input");
      input.dataset.evalField = field.id;
      if (!field.multiline) input.type = "text";
      input.placeholder = field.token;
      if (field.multiline) input.rows = 3;
      input.addEventListener("input", () => {
        promptBox.value = promptToCopy(pack, promptFieldValues(form));
      });
      label.append(labelText, input);
      form.append(label);
    });
    card.append(form);
    const promptLabel = document.createElement("p");
    promptLabel.className = "eval-label";
    promptLabel.textContent = "Prompt to copy";
    const promptBox = document.createElement("textarea");
    promptBox.id = spec.id + "-prompt";
    promptBox.className = "eval-prompt";
    promptBox.readOnly = true;
    promptBox.value = promptToCopy(pack, {});
    card.append(promptLabel, promptBox);
    const status = document.createElement("p");
    status.className = "eval-status";
    status.setAttribute("role", "status");
    const modelLine = document.createElement("p");
    modelLine.className = "eval-note";
    modelLine.textContent = MODEL_LINE;
    const actions = document.createElement("div");
    actions.className = "eval-actions";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "eval-primary";
    openButton.textContent = "Copy & open Gemini";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ghost";
    copyButton.textContent = "Copy prompt";
    actions.append(openButton, copyButton);
    const links = document.createElement("div");
    links.className = "eval-links";
    links.append(evalLink(pack.geminiUrl, "Open Gemini"));
    if (openable(sourceUrl)) links.append(evalLink(sourceUrl, "Original doc"));
    card.append(status, modelLine, actions, links);
    copyButton.addEventListener("click", () => copyPrompt(promptBox, status, false, pack.geminiUrl));
    openButton.addEventListener("click", () => copyPrompt(promptBox, status, true, pack.geminiUrl));
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) sheet.remove();
    });
    sheet.addEventListener("keydown", (event) => {
      if (event.key === "Escape") sheet.remove();
    });
    sheet.append(card);
    document.body.append(sheet);
    const first = form.querySelector("input, textarea");
    if (first) first.focus();
  }

  function evalLink(url, label) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
  }

  async function copyPrompt(promptBox, status, openGemini, geminiUrl) {
    const text = promptBox.value;
    const writePromise = startClipboardWrite(text);
    let popup = null;
    if (openGemini) {
      popup = window.open(geminiUrl, "_blank");
      if (popup) popup.opener = null;
    }
    const copied = await finishClipboardWrite(writePromise, promptBox);
    const blocked = openGemini && !popup;
    if (copied && openGemini && popup) {
      setEvalStatus(status, "Prompt copied. Gemini is open in a new tab. Paste the prompt there. This app does not paste it for you.");
    } else if (copied && blocked) {
      setEvalStatus(status, "Prompt copied, but Gemini did not open. Use Open Gemini below, then paste the prompt there.");
    } else if (copied) {
      setEvalStatus(status, "Prompt copied. Open Gemini and paste it there. This app does not paste it for you.");
    } else if (blocked) {
      setEvalStatus(status, "Clipboard was blocked, and Gemini did not open. The prompt below is selected. Copy it, then use Open Gemini and paste it there.");
    } else if (openGemini && popup) {
      setEvalStatus(status, "Gemini is open, but the clipboard was blocked. The prompt below is selected. Copy it, then paste it into Gemini.");
    } else {
      setEvalStatus(status, "Clipboard was blocked. The prompt below is selected. Copy it, then paste it into Gemini.");
    }
    showToast(copied ? "Prompt copied" : "Select the prompt and copy it");
  }

  function setEvalStatus(status, message) {
    status.textContent = message;
  }

  function startClipboardWrite(text) {
    if (!navigator.clipboard || !window.isSecureContext || typeof navigator.clipboard.writeText !== "function") return null;
    try {
      return navigator.clipboard.writeText(text);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function finishClipboardWrite(writePromise, promptBox) {
    if (writePromise) {
      try {
        await writePromise;
        return true;
      } catch (error) {
        /* Fall through to a manual selection. */
      }
    }
    return selectPrompt(promptBox);
  }

  function selectPrompt(promptBox) {
    promptBox.focus();
    promptBox.select();
    if (typeof promptBox.setSelectionRange === "function") {
      promptBox.setSelectionRange(0, promptBox.value.length);
    }
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    return copied;
  }

  function placeholderTile(spec) {
    const tile = document.createElement("div");
    tile.className = "action-tile action-placeholder";
    tile.setAttribute("role", "group");
    tile.setAttribute("aria-label", spec.label + ". Placeholder. No link yet.");
    applyTone(tile, TONES[spec.tone] || TONES.rentals);
    const badge = document.createElement("p");
    badge.className = "placeholder-flag";
    badge.textContent = "Placeholder";
    const name = document.createElement("p");
    name.className = "card-title";
    name.textContent = spec.label;
    const help = document.createElement("p");
    help.className = "card-help";
    help.textContent = "No link yet";
    tile.append(glyph("Tag"), badge, name, help);
    return tile;
  }

  function dashboardItems() {
    return Array.isArray(state.data.dashboards) ? state.data.dashboards : [];
  }

  function findQuickAction(title) {
    return findForm(title) || findResource(title) || dashboardItems().find((item) => item.title === title);
  }

  function dashboardsBlock() {
    const items = dashboardItems().filter((item) => item && openable(item.url));
    if (!items.length) return document.createDocumentFragment();
    const wrap = document.createElement("section");
    wrap.id = "dashboards";
    applyTone(wrap, TONES.dash);
    const heading = document.createElement("h2");
    heading.className = "section-label";
    const title = document.createElement("span");
    title.className = "section-with-icon";
    title.append(glyph("Market"), document.createTextNode("Dashboards"));
    const count = document.createElement("span");
    count.textContent = String(items.length);
    heading.append(title, count);
    const list = document.createElement("div");
    list.className = "dash-list";
    items.forEach((item) => list.append(dashboardTile(item)));
    wrap.append(heading, list);
    return wrap;
  }

  function dashboardTile(item) {
    const link = document.createElement("a");
    link.className = "dash-tile";
    link.setAttribute("href", item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", item.title + ". Opens in a new tab.");
    const copy = document.createElement("div");
    copy.className = "card-copy";
    const name = document.createElement("p");
    name.className = "card-title";
    name.textContent = item.title;
    copy.append(name);
    if (item.help) {
      const help = document.createElement("p");
      help.className = "card-help";
      help.textContent = item.help;
      copy.append(help);
    }
    applyTone(link, item.title === "Local Market" ? TONES.market : TONES.dash);
    link.append(glyph(item.icon || "Market"), copy, chevron());
    return link;
  }

  function renderTeam() {
    meta.textContent = "";
    const people = Array.isArray(state.data.team) ? state.data.team : [];
    const helpEmail = String(state.data.helpEmail || "").trim();
    if (helpEmail.includes("@")) {
      const help = document.createElement("a");
      help.className = "help-btn";
      help.href = "mailto:" + helpEmail;
      help.textContent = "Need help?";
      panel.append(help);
    }
    if (!people.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "Team contacts are not in the portal data yet.";
      panel.append(empty);
      return;
    }
    people.forEach((person, index) => panel.append(personCard(person, index)));
  }

  function personCard(person, index) {
    const card = document.createElement("article");
    card.className = "person";
    applyTone(card, index % 2 ? TONES.tools : TONES.start);
    const name = document.createElement("h2");
    name.className = "person-name";
    name.textContent = person.name || "Team member";
    card.append(name);
    if (person.role) {
      const role = document.createElement("p");
      role.className = "person-role";
      role.textContent = person.role;
      card.append(role);
    }
    const row = document.createElement("div");
    row.className = "contact-row";
    if (digits(person.cell)) {
      row.append(contactLink("tel:" + digits(person.cell), "Call " + person.cell, "Phone"));
      row.append(contactLink("sms:" + digits(person.cell), "Text " + person.cell, "Text"));
    }
    if (person.email && String(person.email).includes("@")) row.append(contactLink("mailto:" + String(person.email).trim(), person.email, "Mail"));
    if (row.childNodes.length) card.append(row);
    if (String(person.address || "").trim()) {
      const address = document.createElement("p");
      address.className = "address-line";
      address.append(miniGlyph("Listings"), document.createTextNode(person.address));
      card.append(address);
    }
    return card;
  }

  function contactLink(href, label, iconName) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    link.prepend(miniGlyph(iconName));
    return link;
  }

  function digits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function groupBlock(group, items, makeTile) {
    const section = document.createElement("section");
    section.className = "group";
    applyTone(section, TONES[group.id] || TONES.listings);
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
    const heading = sectionLabel("BOLD Truths", String(truths.length));
    heading.id = "truths-heading";
    const list = stack(
      truths.map((text, index) => truthTile({ text, index })).filter((_, index) => index !== featureIndex)
    );
    wrap.append(heading, list);
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
    applyTone(tile, toneForTitle(item.title));
    const link = linkCard(item, "Form", itemIcon(item, "Form"));
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
    if (window.TSCIntake && item.title === window.TSCIntake.PDF_TITLE) return intakeResourceTile(item);
    const tile = document.createElement("article");
    tile.className = "tile";
    applyTone(tile, toneForTitle(item.title));
    tile.append(linkCard(item, linkKind(item.url), itemIcon(item, linkKind(item.url))));
    return tile;
  }

  function linkCard(item, kind, iconName) {
    const title = item.title || "Untitled";
    const iconKey = iconName || kind;
    if (!openable(item.url)) {
      const row = document.createElement("div");
      row.className = "tile-link";
      row.append(glyph(iconKey), cardCopy(title, "Missing link", item.help));
      return row;
    }
    const link = document.createElement("a");
    link.className = "tile-link";
    link.setAttribute("href", item.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", title + ". Opens in a new tab.");
    link.append(glyph(iconKey), cardCopy(title, kind, item.help), chevron());
    return link;
  }

  function truthTile(entry) {
    const row = document.createElement("article");
    row.className = "tile truth";
    applyTone(row, TONES.buyers);
    const number = document.createElement("span");
    number.className = "truth-num";
    number.textContent = String(entry.index + 1).padStart(2, "0");
    const text = document.createElement("p");
    text.className = "truth-text";
    text.textContent = entry.text;
    row.append(number, text);
    return row;
  }

  function cardCopy(title, kind, help) {
    const copy = document.createElement("div");
    copy.className = "card-copy";
    const heading = document.createElement("p");
    heading.className = "card-title";
    heading.textContent = title;
    const label = document.createElement("p");
    label.className = "card-kind";
    label.textContent = kind;
    copy.append(heading, label);
    if (help) {
      const note = document.createElement("p");
      note.className = "card-help";
      note.textContent = help;
      copy.append(note);
    }
    return copy;
  }

  function toneForTitle(title) {
    const group = FORM_GROUPS.concat(RESOURCE_GROUPS).find((item) => item.titles.includes(title));
    if (group && TONES[group.id]) return TONES[group.id];
    if (title === "Team Pipeline" || title === "Local Market") return TONES.dash;
    return TONES.listings;
  }

  function applyTone(el, tone) {
    if (!el || !tone) return el;
    el.style.setProperty("--tone", tone.ink);
    el.style.setProperty("--tone-bright", tone.bright);
    el.style.setProperty("--tone-tint", tone.tint);
    el.style.setProperty("--tone-dark", tone.dark);
    return el;
  }

  function itemIcon(item, fallback) {
    const icons = {
      "BAA / CIS & Disclosures": "UserCheck",
      "Offer to Purchase": "Handshake",
      "NY Offer / NJ LOI": "FilePen",
      "New Listing Paperwork": "Listings",
      "Upload In Person Listing Paperwork": "Upload",
      "Tenant Agency Agreement": "Rentals",
      "Rental Application": "Clipboard",
      "Lease Request": "FileText",
      "Mastermind Topic/Ideas": "Buyers",
      "Content Ideas!": "Ideas",
      "Quick Comps": "Market",
      "Local Market": "Market",
      "TSC Bible (Vision & Core Values)": "Playbooks",
      "Lead Gen": "Megaphone",
      "Sellers": "Listings",
      "Buyers": "Buyers",
      "Admin/Docs": "Folder",
      "TSC Books/Pods": "Library",
      "AI Prompt Home Price Eval": "Tag",
      "AI Prompt Listing Appt Prep": "Calendar",
      "Ways To Increase Conversion!": "Trend",
      "Listing Intake Form (Fill In)": "Clipboard",
      "AI Prompt Turns Notes Into Listing Intake Form": "Spark",
      "TSC Local Market Stats": "Market",
    };
    return icons[item && item.title] || fallback;
  }

  function glyph(kind) {
    const wrap = document.createElement("span");
    wrap.className = "glyph";
    wrap.append(icon(kind));
    return wrap;
  }

  function miniGlyph(kind) {
    const wrap = glyph(kind);
    wrap.classList.add("glyph-sm");
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
      Gauge: ["M6 16a6 6 0 1 1 12 0", "M12 16l3.2-4.2", "M12 16h.01", "M5 19h14"],
      UserCheck: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M16 11l2 2 4-4"],
      Handshake: ["M8 13l3 3 5-6", "M4 12l4-4 3 2 2-2 7 6", "M14 14l2 2 4-3"],
      FilePen: ["M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v5h5", "M9 16l6-4"],
      Upload: ["M12 16V6", "M8 10l4-4 4 4", "M5 19h14"],
      Clipboard: ["M9 4h6v3H9z", "M8 6H6v14h12V6h-2"],
      FileText: ["M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z", "M14 3v5h5", "M9 13h6", "M9 17h4"],
      Megaphone: ["M4 10v4a2 2 0 0 0 2 2h1l4 4V6L7 8H6a2 2 0 0 0-2 2z", "M14 9a4 4 0 0 1 0 6", "M17 7a7 7 0 0 1 0 10"],
      Library: ["M4 5h5v14H4z", "M9 5h6v14H9z", "M15 7h5v12h-5z"],
      Tag: ["M12 3H5v7l8 8 7-7z", "M8 8h.01"],
      Calendar: ["M5 5h14v14H5z", "M5 9h14", "M8 3v4", "M16 3v4"],
      Trend: ["M4 16l5-5 3 3 7-7", "M14 7h5v5"],
      Spark: ["M12 3l1.2 4.2L17.5 8.5 13.2 9.8 12 14l-1.2-4.2L6.5 8.5l4.3-1.3z", "M18 14l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6z"],
      Phone: ["M7 3h3l1.5 4-2 1.2a12 12 0 0 0 6.3 6.3L17 12.5 21 14v3a2 2 0 0 1-2.2 2A17 17 0 0 1 5 5.2 2 2 0 0 1 7 3z"],
      Text: ["M5 6h14v9H8l-3 3z"],
      Office: ["M5 21V5h9v16", "M14 9h5v12", "M8 9h3", "M8 13h3", "M8 17h3"],
      Mail: ["M4 6h16v12H4z", "M4 7l8 6 8-6"],
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

  function nyParts(date) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date || new Date());
    const value = (type) => Number(parts.find((part) => part.type === type).value);
    return { year: value("year"), month: value("month"), day: value("day") };
  }

  function nyDayOfYear(date) {
    const { year, month, day } = nyParts(date);
    const current = Date.UTC(year, month - 1, day);
    const start = Date.UTC(year, 0, 1);
    return Math.floor((current - start) / 86400000) + 1;
  }

  function nyDateLabel(date) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date || new Date());
  }

  function dayIndex(length, date) {
    if (!length) return 0;
    return (nyDayOfYear(date) - 1) % length;
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
    if (themeMeta) themeMeta.setAttribute("content", theme === "dark" ? "#211F1F" : "#ffffff");
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  function intakeActionTile(spec) {
    const fromNotes = spec.intake === "notes";
    const help = fromNotes
      ? "Add your notes or a file, then send it to Miranda."
      : "Fill it out here and send it to Miranda.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-tile";
    button.setAttribute("aria-label", spec.label + ". " + help);
    applyTone(button, TONES[spec.tone] || TONES.listings);
    const name = document.createElement("p");
    name.className = "card-title";
    name.textContent = spec.label;
    const note = document.createElement("p");
    note.className = "card-help";
    note.textContent = help;
    button.append(glyph(fromNotes ? "Spark" : "Clipboard"), name, note);
    button.addEventListener("click", () => openIntakeSheet({ focusNotes: fromNotes }));
    return button;
  }

  function intakeResourceTile(item) {
    const tile = document.createElement("article");
    tile.className = "tile intake-resource";
    applyTone(tile, toneForTitle(item.title));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile-link";
    button.setAttribute("aria-label", "Listing Intake Form. Fill it out in the app and send it to Miranda.");
    button.append(glyph("Clipboard"), cardCopy("Listing Intake Form", "In the app", "Fill it out here and send it to Miranda."));
    button.addEventListener("click", () => openIntakeSheet());
    const pdf = document.createElement("a");
    pdf.className = "intake-pdf";
    pdf.href = item.url;
    pdf.target = "_blank";
    pdf.rel = "noopener noreferrer";
    pdf.textContent = "PDF form";
    tile.append(button, pdf);
    return tile;
  }

  function stopIntakeSpeech() {
    if (!intakeRecognizer) return;
    try {
      intakeRecognizer.abort();
    } catch (error) {
      /* already stopped */
    }
    intakeRecognizer = null;
  }

  function openIntakeSheet(options) {
    const Intake = window.TSCIntake;
    if (!Intake) {
      showToast("The listing intake form did not load. Reload the app.");
      return;
    }
    stopIntakeSpeech();
    document.querySelectorAll(".eval-sheet").forEach((node) => node.remove());
    const day = Intake.today();
    let stored = null;
    try {
      stored = JSON.parse(storageGet(Intake.DRAFT_KEY) || "null");
    } catch (error) {
      stored = null;
    }
    const draft = Intake.normalizeDraft(stored, day);
    const values = draft.values;
    const restored = !!(stored && Intake.draftHasContent(draft, day));
    const wraps = {};
    const msgs = {};
    const hints = {};
    const inputs = {};
    const chipSets = {};

    const sheet = document.createElement("div");
    sheet.className = "eval-sheet intake-sheet";
    sheet.id = "listing-intake";
    const card = document.createElement("div");
    card.className = "eval-card intake-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "listing-intake-title");

    const head = document.createElement("div");
    head.className = "intake-head";
    const title = document.createElement("h2");
    title.id = "listing-intake-title";
    title.textContent = "Listing Intake";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "icon-btn";
    close.setAttribute("aria-label", "Close Listing Intake");
    close.textContent = "Close";
    head.append(title, close);

    const scroller = document.createElement("div");
    scroller.className = "intake-scroll";
    const notesLabel = document.createElement("p");
    notesLabel.className = "intake-notes-label";
    notesLabel.id = "intake-notes-label";
    notesLabel.textContent = "Add your notes";
    const notesBox = document.createElement("textarea");
    notesBox.id = "intake-notes";
    notesBox.rows = 5;
    notesBox.placeholder = "Paste notes, or add a photo or file below.";
    notesBox.value = draft.rawNotes;
    notesBox.setAttribute("aria-labelledby", "intake-notes-label");
    notesBox.autocomplete = "off";
    const stepLinks = document.createElement("p");
    stepLinks.className = "intake-mini";
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    let dictate = null;
    if (Speech) {
      dictate = document.createElement("button");
      dictate.type = "button";
      dictate.className = "intake-text-btn";
      dictate.textContent = "Dictate";
      stepLinks.append(dictate);
    }
    const fileLabel = document.createElement("label");
    fileLabel.className = "intake-add-file";
    fileLabel.append(document.createTextNode("Add photo / file"));
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "intake-file-input";
    fileInput.multiple = true;
    fileInput.accept = "image/*,.pdf,.doc,.docx,.txt,.heic,.heif,application/pdf";
    fileLabel.append(fileInput);
    const fileList = document.createElement("ul");
    fileList.className = "intake-files";
    const fillButton = document.createElement("button");
    fillButton.type = "button";
    fillButton.className = "eval-primary";
    fillButton.textContent = "Fill it in";
    const orDivider = document.createElement("p");
    orDivider.className = "intake-or";
    orDivider.textContent = "OR";
    const diyLabel = document.createElement("p");
    diyLabel.className = "intake-diy";
    diyLabel.textContent = "Do it yourself in Gemini";
    const geminiButton = document.createElement("button");
    geminiButton.type = "button";
    geminiButton.className = "intake-gemini";
    geminiButton.textContent = "Copy prompt & open Gemini";
    const geminiHint = document.createElement("p");
    geminiHint.className = "intake-gemini-hint";
    geminiHint.textContent = "Paste, then attach your photos/files in Gemini.";
    const promptBox = document.createElement("textarea");
    promptBox.className = "intake-prompt-fallback";
    promptBox.readOnly = true;
    promptBox.tabIndex = -1;
    promptBox.setAttribute("aria-hidden", "true");
    const spinner = document.createElement("p");
    spinner.className = "intake-spinner";
    spinner.hidden = true;
    const spinnerDot = document.createElement("span");
    spinnerDot.className = "intake-spinner-dot";
    spinnerDot.setAttribute("aria-hidden", "true");
    spinner.append(spinnerDot, document.createTextNode("Reading your notes\u2026 up to a minute"));
    const aiStatus = document.createElement("p");
    aiStatus.className = "eval-status";
    aiStatus.setAttribute("role", "status");
    const review = document.createElement("div");
    review.className = "intake-review";
    review.hidden = true;
    const myself = document.createElement("button");
    myself.type = "button";
    myself.className = "intake-text-btn";
    myself.textContent = "Fill it in myself";
    const blankPdf = document.createElement("a");
    blankPdf.className = "intake-text-btn";
    blankPdf.href = "forms/listing-intake-v2.pdf";
    blankPdf.setAttribute("download", "TSC Listing Intake Form V2.pdf");
    blankPdf.textContent = "Download blank PDF form";
    const altRow = document.createElement("p");
    altRow.className = "intake-mini";
    altRow.append(myself, blankPdf);
    const formWrap = document.createElement("div");
    formWrap.id = "intake-form";
    formWrap.hidden = true;
    scroller.append(notesLabel, notesBox, stepLinks, fileLabel, fileList, fillButton, orDivider, diyLabel, geminiButton, geminiHint, promptBox, spinner, aiStatus, review, altRow, formWrap);

    Intake.sections.forEach((section) => {
      const block = document.createElement("section");
      block.className = "intake-section";
      const heading = document.createElement("h3");
      heading.textContent = section.title;
      const grid = document.createElement("div");
      grid.className = "intake-fields";
      section.fields.forEach((field) => grid.append(renderIntakeField(field)));
      block.append(heading, grid);
      formWrap.append(block);
    });
    if (formHasAnswers()) formWrap.hidden = false;

    const sendBar = document.createElement("div");
    sendBar.className = "intake-send";
    const sendStatus = document.createElement("p");
    sendStatus.className = "eval-status";
    sendStatus.setAttribute("role", "status");
    const sendButton = document.createElement("button");
    sendButton.type = "button";
    sendButton.className = "intake-send-btn";
    sendButton.textContent = "Send to Miranda";
    const sendRow = document.createElement("div");
    sendRow.className = "intake-row";
    const shareIntake = document.createElement("button");
    shareIntake.type = "button";
    shareIntake.className = "ghost";
    shareIntake.textContent = "Share";
    const copyIntake = document.createElement("button");
    copyIntake.type = "button";
    copyIntake.className = "ghost";
    copyIntake.textContent = "Copy";
    sendRow.append(shareIntake, copyIntake);
    const preview = document.createElement("div");
    preview.className = "intake-preview-wrap";
    preview.hidden = true;
    const previewTo = document.createElement("p");
    previewTo.className = "intake-preview-to";
    const previewSubject = document.createElement("p");
    previewSubject.className = "intake-preview-subject";
    const previewBody = document.createElement("textarea");
    previewBody.id = "intake-email-body";
    previewBody.className = "intake-preview";
    previewBody.readOnly = true;
    previewBody.rows = 14;
    const clearRow = document.createElement("div");
    clearRow.className = "intake-row";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Clear draft";
    const keepButton = document.createElement("button");
    keepButton.type = "button";
    keepButton.className = "ghost";
    keepButton.textContent = "Keep editing";
    clearRow.append(clearButton, keepButton);
    preview.append(previewTo, previewSubject, previewBody, clearRow);
    scroller.append(preview);
    sendBar.append(sendStatus, sendButton, sendRow);
    card.append(head, scroller, sendBar);
    sheet.append(card);
    refreshConditions();
    document.body.append(sheet);
    document.body.style.overflow = "hidden";

    let saveTimer = 0;
    function scheduleSave() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveDraft, 200);
    }
    function saveDraft() {
      storageSet(Intake.DRAFT_KEY, JSON.stringify({
        values: values,
        rawNotes: notesBox.value,
        aiPaste: "",
      }));
    }
    function closeSheet() {
      window.clearTimeout(saveTimer);
      stopIntakeSpeech();
      document.body.style.overflow = "";
      sheet.remove();
    }
    function renderIntakeField(field) {
      const wrap = document.createElement("div");
      wrap.className = "intake-field" + (field.half ? "" : " wide");
      wrap.dataset.intakeField = field.id;
      wraps[field.id] = wrap;
      const hint = document.createElement("p");
      hint.className = "intake-hint";
      hints[field.id] = hint;
      const msg = document.createElement("p");
      msg.className = "intake-msg";
      msg.id = "intake-msg-" + field.id;
      msgs[field.id] = msg;
      if (field.type === "multi" || field.type === "single") wrap.append(renderChips(field), hint, msg);
      else wrap.append(renderControl(field), hint, msg);
      hint.textContent = hintText(field);
      if (!hint.textContent) hint.hidden = true;
      return wrap;
    }
    function renderControl(field) {
      const label = document.createElement("label");
      label.className = "intake-label";
      if (field.type !== "notes") {
        const text = document.createElement("span");
        text.textContent = fieldLabel(field);
        label.append(text);
      }
      const input = document.createElement(field.type === "notes" ? "textarea" : "input");
      inputs[field.id] = input;
      input.value = values[field.id] || "";
      if (field.type === "notes") {
        input.rows = 5;
        input.setAttribute("aria-label", field.label);
      } else if (field.type === "date") {
        input.type = "date";
      } else if (field.type === "number") {
        input.type = "text";
        input.inputMode = "numeric";
        input.pattern = "[0-9]*";
        input.autocomplete = "off";
        input.enterKeyHint = "done";
      } else {
        input.type = "text";
        input.autocomplete = field.autocomplete || "off";
        input.enterKeyHint = "next";
      }
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.id === "address") input.autocapitalize = "words";
      input.addEventListener("input", () => {
        let next = input.value;
        if (field.type === "number") {
          next = next.replace(/[^\d]/g, "");
          if (next !== input.value) input.value = next;
        }
        values[field.id] = next;
        clearFieldState(field.id);
        refreshConditions();
        scheduleSave();
      });
      label.append(input);
      return label;
    }
    function renderChips(field) {
      const group = document.createElement("div");
      const legend = document.createElement("p");
      legend.className = "intake-legend";
      legend.id = "intake-legend-" + field.id;
      legend.textContent = fieldLabel(field);
      const chips = document.createElement("div");
      chips.className = "intake-chips" + (field.options.length === 2 ? " choice-two" : "");
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-labelledby", legend.id);
      const buttons = [];
      field.options.forEach((option) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "intake-chip";
        chip.textContent = option;
        chip.setAttribute("aria-pressed", selected(field, option) ? "true" : "false");
        chip.addEventListener("click", () => toggleChip(field, option));
        chips.append(chip);
        buttons.push(chip);
      });
      chipSets[field.id] = buttons;
      group.append(legend);
      if (field.options.length > 8) {
        const filter = document.createElement("input");
        filter.type = "search";
        filter.className = "intake-filter";
        filter.placeholder = "Find one";
        filter.setAttribute("aria-label", "Filter " + field.label);
        filter.autocomplete = "off";
        filter.addEventListener("input", () => {
          const query = filter.value.trim().toLowerCase();
          let shown = 0;
          buttons.forEach((chip) => {
            const on = chip.getAttribute("aria-pressed") === "true";
            const match = chip.textContent.toLowerCase().includes(query);
            chip.hidden = !!query && !on && !match;
            if (!chip.hidden) shown += 1;
          });
          empty.hidden = shown > 0;
        });
        const empty = document.createElement("p");
        empty.className = "intake-hint";
        empty.hidden = true;
        empty.textContent = "No matching options.";
        group.append(filter, chips, empty);
      } else group.append(chips);
      return group;
    }
    function toggleChip(field, option) {
      if (field.type === "single") {
        values[field.id] = values[field.id] === option ? "" : option;
      } else {
        const current = (values[field.id] || []).slice();
        const index = current.indexOf(option);
        if (index >= 0) current.splice(index, 1);
        else if (field.max && current.length >= field.max) {
          msgs[field.id].textContent = "Up to " + field.max + ". Unselect one to add another.";
          wraps[field.id].classList.add("is-invalid");
          return;
        } else current.push(option);
        values[field.id] = current;
      }
      clearFieldState(field.id);
      syncChips(field);
      hints[field.id].textContent = hintText(field);
      hints[field.id].hidden = !hints[field.id].textContent;
      refreshConditions();
      scheduleSave();
    }
    function syncChips(field) {
      (chipSets[field.id] || []).forEach((chip) => {
        chip.setAttribute("aria-pressed", selected(field, chip.textContent) ? "true" : "false");
      });
    }
    function selected(field, option) {
      if (field.type === "single") return values[field.id] === option;
      return (values[field.id] || []).indexOf(option) !== -1;
    }
    function fieldLabel(field) {
      return (field.num ? field.num + ") " : "") + field.label;
    }
    function hintText(field) {
      const base = field.hint || "";
      if (field.type !== "multi") return base;
      const count = (values[field.id] || []).length;
      return (base ? base + " " : "") + count + " selected.";
    }
    function clearFieldState(id) {
      if (!wraps[id]) return;
      wraps[id].classList.remove("is-invalid", "is-needs");
      msgs[id].textContent = "";
    }
    function refreshConditions() {
      Intake.fields.forEach((field) => {
        if (!wraps[field.id]) return;
        wraps[field.id].hidden = !Intake.isVisible(field, values);
      });
    }
    function showErrors(errors) {
      Intake.fields.forEach((field) => clearFieldState(field.id));
      Object.keys(errors).forEach((id) => {
        if (!wraps[id] || wraps[id].hidden) return;
        wraps[id].classList.add("is-invalid");
        msgs[id].textContent = errors[id];
      });
    }
    function applyNeeds(needs) {
      Object.keys(needs).forEach((id) => {
        if (!wraps[id] || wraps[id].hidden) return;
        wraps[id].classList.add("is-needs");
        msgs[id].textContent = needs[id];
      });
    }
    function syncAll() {
      Intake.fields.forEach((field) => {
        if (inputs[field.id]) inputs[field.id].value = values[field.id] || "";
        syncChips(field);
        if (hints[field.id]) {
          hints[field.id].textContent = hintText(field);
          hints[field.id].hidden = !hints[field.id].textContent;
        }
      });
      refreshConditions();
    }
    function showReview(lines) {
      review.replaceChildren();
      if (!lines.length) {
        review.hidden = true;
        return;
      }
      review.hidden = false;
      const heading = document.createElement("p");
      heading.className = "intake-review-title";
      heading.textContent = "Review before you send";
      review.append(heading);
      lines.forEach((line) => {
        const item = document.createElement("p");
        item.textContent = line;
        review.append(item);
      });
    }
    function applyParsedText(text) {
      const before = {};
      Intake.fields.forEach((field) => {
        before[field.id] = Array.isArray(values[field.id]) ? values[field.id].slice() : values[field.id];
      });
      const result = Intake.parse(text, values, Intake.today());
      if (!result.ok) return false;
      Intake.fields.forEach((field) => {
        values[field.id] = result.values[field.id];
      });
      Intake.fields.forEach((field) => clearFieldState(field.id));
      syncAll();
      applyNeeds(result.needs);
      showReview(result.review);
      scheduleSave();
      const filled = countChangedFields(before, result.values);
      const highlights = Object.keys(result.needs).length;
      let line = filled === 1 ? "Filled 1 field." : "Filled " + filled + " fields.";
      if (!filled && !highlights) line = "Nothing new was filled in. Try again.";
      else if (highlights) line += " Check the highlighted ones.";
      aiStatus.textContent = line;
      showForm();
      const highlighted = scroller.querySelector(".is-needs");
      if (highlighted) highlighted.scrollIntoView({ block: "center" });
      return true;
    }
    function countChangedFields(before, after) {
      let count = 0;
      Intake.fields.forEach((field) => {
        const next = fieldSnapshot(field, after[field.id]);
        if (!next || next === fieldSnapshot(field, before[field.id])) return;
        count += 1;
      });
      return count;
    }
    function fieldSnapshot(field, value) {
      if (field.type === "multi") return (value || []).join("\n");
      return String(value || "").trim();
    }
    function showForm() {
      formWrap.hidden = false;
      formWrap.scrollIntoView({ block: "start" });
    }
    function formHasAnswers() {
      return Intake.fields.some((field) => {
        if (field.type === "date") return false;
        if (field.type === "multi") return (values[field.id] || []).length > 0;
        return String(values[field.id] || "").trim().length > 0;
      });
    }
    function friendlyError(payload) {
      const text = payload && typeof payload.error === "string" ? payload.error.replace(/\s+/g, " ").trim() : "";
      if (!text || text.length > 280 || /gemini/i.test(text) || /<[a-z!]/i.test(text)) {
        return "Couldn't fill it this time. Try again, use Gemini, or fill it in yourself.";
      }
      return text;
    }
    function readServerPayload(raw) {
      const text = String(raw || "").trim();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch (error) {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
          try {
            return JSON.parse(text.slice(start, end + 1));
          } catch (inner) {
            return null;
          }
        }
        return null;
      }
    }
    function renderFiles() {
      fileList.replaceChildren();
      intakeAttached.forEach((item, index) => {
        const row = document.createElement("li");
        if (item.url) {
          const thumb = document.createElement("img");
          thumb.src = item.url;
          thumb.alt = "";
          row.append(thumb);
        }
        const name = document.createElement("span");
        name.textContent = item.file.name;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "intake-file-x";
        remove.setAttribute("aria-label", "Remove " + item.file.name);
        remove.textContent = "\u00d7";
        remove.addEventListener("click", () => {
          if (item.url) URL.revokeObjectURL(item.url);
          intakeAttached.splice(index, 1);
          renderFiles();
          refreshGeminiChoice();
        });
        row.append(name, remove);
        fileList.append(row);
      });
      fileList.hidden = intakeAttached.length === 0;
    }
    function addIntakeFiles(list) {
      Array.from(list || []).forEach((file) => {
        const duplicate = intakeAttached.some((item) => item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified);
        if (duplicate) return;
        const url = file.type.indexOf("image/") === 0 ? URL.createObjectURL(file) : "";
        intakeAttached.push({ file: file, url: url });
      });
      renderFiles();
      refreshGeminiChoice();
    }
    function mimeForFile(file) {
      const name = String(file.name || "").toLowerCase();
      if (name.endsWith(".pdf")) return "application/pdf";
      if (file.type === "application/pdf") return "application/pdf";
      if (name.endsWith(".png")) return "image/png";
      if (name.endsWith(".jpg") || name.endsWith(".jpeg") || file.type === "image/jpg") return "image/jpeg";
      if (name.endsWith(".webp")) return "image/webp";
      if (name.endsWith(".gif")) return "image/gif";
      if (name.endsWith(".heic")) return "image/heic";
      if (name.endsWith(".heif")) return "image/heif";
      if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (name.endsWith(".doc")) return "application/msword";
      if (name.endsWith(".txt")) return "text/plain";
      if (file.type && file.type.indexOf("image/") === 0) return file.type;
      return file.type || "application/octet-stream";
    }
    function isCompressibleImage(file) {
      const mime = mimeForFile(file);
      return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp" || mime === "image/gif";
    }
    function compressImage(file) {
      return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          const max = 1600;
          let width = image.naturalWidth || image.width;
          let height = image.naturalHeight || image.height;
          const tooWide = width > max || height > max;
          if (!tooWide && mimeForFile(file) === "image/jpeg" && file.size < 900000) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }
          const scale = tooWide ? Math.min(max / width, max / height) : 1;
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }
          context.drawImage(image, 0, 0, width, height);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              resolve(file);
              return;
            }
            const base = String(file.name || "photo").replace(/\.[^.]+$/, "");
            resolve(new File([blob], base + ".jpg", { type: "image/jpeg", lastModified: Date.now() }));
          }, "image/jpeg", 0.8);
        };
        image.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(file);
        };
        image.src = url;
      });
    }
    function fileToPayload(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || "");
          const base64 = raw.indexOf(",") >= 0 ? raw.split(",")[1] : raw;
          resolve({
            name: file.name,
            mimeType: mimeForFile(file),
            base64: base64,
          });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }
    function intakePromptText() {
      return MODEL_LINE + "\n\n" + Intake.plainPrompt(notesBox.value, intakeAttached.map((item) => item.file.name));
    }
    function canShareIntakeFiles() {
      if (!intakeAttached.length || !navigator.share || typeof navigator.canShare !== "function") return false;
      try {
        return navigator.canShare({ files: intakeAttached.map((item) => item.file) });
      } catch (error) {
        return false;
      }
    }
    function refreshGeminiChoice() {
      const share = canShareIntakeFiles();
      geminiButton.textContent = share ? "Copy prompt & share files to Gemini" : "Copy prompt & open Gemini";
      geminiHint.textContent = share
        ? "Then paste the prompt in Gemini."
        : "Paste, then attach your photos/files in Gemini.";
    }
    async function openGeminiYourself(text) {
      if (canShareIntakeFiles()) {
        try {
          await navigator.share({
            title: "Listing intake",
            text: text,
            files: intakeAttached.map((item) => item.file),
          });
          aiStatus.textContent = "Prompt copied. In Gemini, tap the message box, paste, then send.";
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
      await copyPrompt(promptBox, aiStatus, true, Intake.GEMINI_URL);
    }
    async function filesForUpload() {
      const prepared = [];
      for (let i = 0; i < intakeAttached.length; i += 1) {
        const original = intakeAttached[i].file;
        const file = isCompressibleImage(original) ? await compressImage(original) : original;
        prepared.push(await fileToPayload(file));
      }
      return prepared;
    }
    async function fillWithAi() {
      if (!notesBox.value.trim() && !intakeAttached.length) {
        aiStatus.textContent = "Add notes or a file first.";
        notesBox.focus();
        return;
      }
      const config = Intake.aiConfig || {};
      const url = String(config.url || "").trim();
      if (!url) {
        aiStatus.textContent = "Couldn't fill it this time. Try again, use Gemini, or fill it in yourself.";
        return;
      }
      const total = intakeAttached.reduce((sum, item) => sum + item.file.size, 0);
      if (total > 15 * 1024 * 1024) {
        aiStatus.textContent = "Those files are over 15 MB. Remove one and try again.";
        return;
      }
      fillButton.disabled = true;
      spinner.hidden = false;
      aiStatus.textContent = "";
      try {
        const files = await filesForUpload();
        const fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            secret: String(config.secret || ""),
            origin: location.origin,
            notes: notesBox.value,
            files: files,
          }),
        };
        if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
          fetchOptions.signal = AbortSignal.timeout(150000);
        }
        const response = await fetch(url, fetchOptions);
        const raw = await response.text();
        const payload = readServerPayload(raw);
        if (!payload || payload.ok === false || !payload.intake) {
          aiStatus.textContent = friendlyError(payload);
          return;
        }
        if (!applyParsedText(JSON.stringify(payload.intake))) {
          aiStatus.textContent = "Couldn't fill it this time. Try again, use Gemini, or fill it in yourself.";
        }
      } catch (error) {
        const name = error && error.name;
        aiStatus.textContent = name === "TimeoutError" || name === "AbortError"
          ? "That took too long. Try again, use Gemini, or fill it in yourself."
          : "Couldn't fill it this time. Try again, use Gemini, or fill it in yourself.";
      } finally {
        fillButton.disabled = false;
        spinner.hidden = true;
      }
    }
    function showPreview(mail, truncated) {
      preview.hidden = false;
      previewTo.textContent = "To: " + Intake.EMAIL;
      previewSubject.textContent = "Subject: " + mail.subject;
      previewBody.value = mail.body;
      previewBody.rows = Math.min(48, Math.max(14, mail.body.split("\n").length + 1));
      sendStatus.textContent = truncated
        ? "This intake is too long for an email link, so the full summary was copied. Paste it into the email to Miranda, then hit Send. After you send it, you can clear this draft."
        : "Your email app should be open, addressed to Miranda. Hit Send there. If the body is missing, tap Copy. After you send it, you can clear this draft.";
      preview.scrollIntoView({ block: "start" });
    }
    function openMailto(href) {
      const link = document.createElement("a");
      link.href = href;
      document.body.append(link);
      link.click();
      link.remove();
    }
    async function copySummary(mail) {
      const text = "To: " + Intake.EMAIL + "\nSubject: " + mail.subject + "\n\n" + mail.body;
      previewBody.value = mail.body;
      const copied = await finishClipboardWrite(startClipboardWrite(text), previewBody);
      showToast(copied ? "Intake copied" : "Select the email and copy it");
      return copied;
    }
    async function sendIntake() {
      const errors = Intake.validate(values);
      showErrors(errors);
      const ids = Object.keys(errors);
      if (ids.length) {
        sendStatus.textContent = "A few answers are still needed before this can go to Miranda.";
        const wrap = wraps[ids[0]];
        if (wrap) wrap.scrollIntoView({ block: "center" });
        return;
      }
      const mail = Intake.summary(values);
      const packed = Intake.fitMailto(mail.subject, mail.body);
      showPreview(mail, packed.truncated);
      if (packed.truncated) {
        const copied = await copySummary(mail);
        if (!copied) {
          sendStatus.textContent = "This intake is too long for an email link, and the clipboard was blocked. The email below is selected. Copy it, paste it into the email to Miranda, then send.";
        }
      }
      openMailto(packed.href);
    }
    async function shareSummary() {
      const errors = Intake.validate(values);
      showErrors(errors);
      if (Object.keys(errors).length) {
        sendStatus.textContent = "A few answers are still needed before this can go to Miranda.";
        const wrap = wraps[Object.keys(errors)[0]];
        if (wrap) wrap.scrollIntoView({ block: "center" });
        return;
      }
      const mail = Intake.summary(values);
      const text = "To: " + Intake.EMAIL + "\nSubject: " + mail.subject + "\n\n" + mail.body;
      if (!navigator.share) {
        showPreview(mail, false);
        const copied = await copySummary(mail);
        sendStatus.textContent = copied
          ? "Sharing isn't available here. The intake was copied instead."
          : "Sharing isn't available here. The email below is selected. Copy it.";
        return;
      }
      try {
        await navigator.share({ title: mail.subject, text: text });
      } catch (error) {
        if (error && error.name === "AbortError") return;
        showPreview(mail, false);
        const copied = await copySummary(mail);
        sendStatus.textContent = copied
          ? "Share didn't open. The intake was copied instead."
          : "Share didn't open. The email below is selected. Copy it.";
      }
    }

    renderFiles();
    refreshGeminiChoice();
    notesBox.addEventListener("input", scheduleSave);
    function onPickFiles(event) {
      addIntakeFiles(event.target.files);
      event.target.value = "";
    }
    fileInput.addEventListener("change", onPickFiles);
    fillButton.addEventListener("click", () => {
      fillWithAi();
    });
    geminiButton.addEventListener("click", () => {
      const text = intakePromptText();
      promptBox.value = text;
      startClipboardWrite(text);
      selectPrompt(promptBox);
      openGeminiYourself(text);
    });
    myself.addEventListener("click", showForm);
    if (dictate) {
      dictate.addEventListener("click", () => {
        if (intakeRecognizer) {
          stopIntakeSpeech();
          dictate.textContent = "Dictate";
          return;
        }
        intakeRecognizer = new Speech();
        intakeRecognizer.lang = "en-US";
        intakeRecognizer.continuous = true;
        intakeRecognizer.interimResults = false;
        intakeRecognizer.onresult = (event) => {
          let said = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            if (event.results[i].isFinal) said += event.results[i][0].transcript;
          }
          said = said.trim();
          if (!said) return;
          notesBox.value = notesBox.value.trim() ? notesBox.value.replace(/\s*$/, " ") + said : said;
          notesBox.dispatchEvent(new Event("input"));
        };
        intakeRecognizer.onerror = () => {
          aiStatus.textContent = "The microphone was blocked. Use the keyboard microphone, or paste the notes.";
        };
        intakeRecognizer.onend = () => {
          intakeRecognizer = null;
          dictate.textContent = "Dictate";
        };
        dictate.textContent = "Stop dictation";
        try {
          intakeRecognizer.start();
        } catch (error) {
          stopIntakeSpeech();
          dictate.textContent = "Dictate";
          aiStatus.textContent = "Dictation didn't start. Use the keyboard microphone, or paste the notes.";
        }
      });
    }
    sendButton.addEventListener("click", () => {
      sendIntake();
    });
    shareIntake.addEventListener("click", () => {
      shareSummary();
    });
    copyIntake.addEventListener("click", async () => {
      const mail = Intake.summary(values);
      showPreview(mail, false);
      const copied = await copySummary(mail);
      const errors = Intake.validate(values);
      showErrors(errors);
      if (Object.keys(errors).length) {
        sendStatus.textContent = copied
          ? "Copied. A few answers are still needed before you send it to Miranda."
          : "The email text is selected. A few answers are still needed before you send it.";
        return;
      }
      sendStatus.textContent = copied
        ? "Copied. Paste it into an email to " + Intake.EMAIL + "."
        : "The email text is selected. Copy it, then paste it into an email to Miranda.";
    });
    clearButton.addEventListener("click", () => {
      intakeAttached.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
      intakeAttached = [];
      try {
        localStorage.removeItem(Intake.DRAFT_KEY);
      } catch (error) {
        /* private mode */
      }
      closeSheet();
      openIntakeSheet(options);
    });
    keepButton.addEventListener("click", () => {
      preview.hidden = true;
      sendStatus.textContent = "";
    });
    close.addEventListener("click", closeSheet);
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) closeSheet();
    });
    sheet.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSheet();
    });

    if (options && options.focusNotes) notesBox.focus({ preventScroll: true });
    else if (inputs.address && !values.address) inputs.address.focus({ preventScroll: true });
    else close.focus({ preventScroll: true });
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
