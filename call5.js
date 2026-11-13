/* Call 5. Signed-in agents only. Guests never see this.
   The working list is least-recently-contacted first. Called and texted
   go to the back. Skip moves a person three spots back and is not a contact. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TSCCall5 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const STORAGE_KEY = "tsc-portal-call5";
  const VISIBLE = 5;
  const SKIP_SPOTS = 3;
  let painting = false;
  let host = null;
  let busy = false;

  function contactTime(person) {
    const parsed = Date.parse(person && person.lastContacted || "");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function sortPeople(people) {
    return people.slice().sort(function (a, b) {
      const diff = contactTime(a) - contactTime(b);
      if (diff) return diff;
      return String(a.id).localeCompare(String(b.id));
    });
  }

  function applyAction(people, id, kind, now) {
    const sorted = sortPeople(people);
    const index = sorted.findIndex(function (person) { return person.id === id; });
    if (index < 0) return sorted;
    const next = Object.assign({}, sorted[index]);
    if (kind === "called" || kind === "texted") {
      next.lastContacted = new Date(now).toISOString();
      next.lastAction = kind;
    } else if (kind === "skip") {
      const spot = Math.min(sorted.length - 1, index + SKIP_SPOTS);
      if (spot !== index) {
        next.lastContacted = new Date(contactTime(sorted[spot]) + 1000).toISOString();
      }
      next.lastAction = "skip";
    }
    sorted[index] = next;
    return sortPeople(sorted);
  }

  function dialable(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return "+1" + digits;
    if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
    return "+" + digits;
  }

  function contextLine(person) {
    if (person.context) return person.context;
    if (person.type) return person.type;
    return "";
  }

  function session() {
    if (!root.TSCAuth || typeof root.TSCAuth.getSession !== "function") return null;
    return root.TSCAuth.getSession();
  }

  function available() {
    if (!root.TSCAuth || typeof root.TSCAuth.required !== "function" || !root.TSCAuth.required()) return false;
    if (typeof root.TSCAuth.canUsePersonal === "function" && !root.TSCAuth.canUsePersonal()) return false;
    const current = session();
    return !!(current && current.email && current.role !== "guest");
  }

  function blank(email) {
    return { email: email || "", people: [], weekCount: 0, streak: 0, queue: [], status: "" };
  }

  function load(email) {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || parsed.email !== email) return blank(email);
      parsed.people = Array.isArray(parsed.people) ? parsed.people : [];
      parsed.queue = Array.isArray(parsed.queue) ? parsed.queue : [];
      parsed.weekCount = Number(parsed.weekCount) || 0;
      parsed.streak = Number(parsed.streak) || 0;
      return parsed;
    } catch (error) {
      return blank(email);
    }
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      /* private mode */
    }
  }

  function authUrl() {
    const config = root.TSCAuth && root.TSCAuth.authConfig;
    return config && config.url ? String(config.url) : "";
  }

  function post(body) {
    return fetch(authUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    }).then(function (response) { return response.text(); }).then(function (raw) {
      const text = String(raw || "").trim();
      if (!text) return null;
      try { return JSON.parse(text); } catch (error) {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start < 0 || end <= start) return null;
        try { return JSON.parse(text.slice(start, end + 1)); } catch (inner) { return null; }
      }
    });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function paint(state) {
    if (!host) return;
    host.replaceChildren();
    const top = el("div", "call5-top");
    top.append(el("h2", "call5-title", "Call 5"));
    const count = el("p", "call5-count");
    const week = state.weekCount === 1 ? "1 contact this week" : state.weekCount + " contacts this week";
    count.textContent = state.streak > 1 ? week + " · " + state.streak + "-week streak" : week;
    top.append(count);
    host.append(top);
    if (state.status === "offline" && !state.people.length) {
      host.append(el("p", "call5-empty", "You're offline. Your five will show up after one online visit."));
      return;
    }
    if (state.status === "unconfigured") {
      host.append(el("p", "call5-empty", "Call 5 isn't connected yet."));
      return;
    }
    if (state.status === "error" && !state.people.length) {
      host.append(el("p", "call5-empty", "Your five didn't load. Pull to refresh when you can."));
      return;
    }
    const visible = sortPeople(state.people).slice(0, VISIBLE);
    if (!visible.length && state.status !== "loading") {
      host.append(el("p", "call5-empty", "No one in your sphere yet. Add people to the sheet and they'll show up here."));
      return;
    }
    if (!visible.length) {
      host.append(el("p", "call5-empty", "Loading your five…"));
      return;
    }
    const list = el("div", "call5-list");
    visible.forEach(function (person) {
      list.append(row(person, state));
    });
    host.append(list);
  }

  function row(person, state) {
    const item = el("article", "call5-row");
    item.dataset.callId = person.id;
    const copy = el("div", "call5-copy");
    copy.append(el("p", "call5-name", person.name || "Someone"));
    const context = contextLine(person);
    if (context) copy.append(el("p", "call5-context", context));
    const number = dialable(person.phone);
    if (!number) copy.append(el("p", "call5-missing", "No number on file"));
    item.append(copy);
    const reach = el("div", "call5-actions");
    reach.append(linkOrDisabled("Call", number ? "tel:" + number : ""));
    reach.append(linkOrDisabled("Text", number ? "sms:" + number : ""));
    item.append(reach);
    const log = el("div", "call5-log");
    log.append(actionButton("Called", person, "called", state));
    log.append(actionButton("Texted", person, "texted", state));
    log.append(actionButton("Skip", person, "skip", state));
    item.append(log);
    return item;
  }

  function linkOrDisabled(label, href) {
    if (!href) {
      const button = el("button", "call5-reach", label);
      button.type = "button";
      button.disabled = true;
      return button;
    }
    const link = el("a", "call5-reach", label);
    link.href = href;
    return link;
  }

  function actionButton(label, person, kind, state) {
    const button = el("button", "call5-mark" + (kind === "skip" ? " is-skip" : ""), label);
    button.type = "button";
    button.addEventListener("click", function () {
      takeAction(state, person.id, kind);
    });
    return button;
  }

  function takeAction(state, id, kind) {
    if (busy) return;
    busy = true;
    const cardRow = host && host.querySelector('[data-call-id="' + cssEscape(id) + '"]');
    const finish = function () {
      state.people = applyAction(state.people, id, kind, Date.now());
      if (kind === "called" || kind === "texted") state.weekCount += 1;
      state.queue.push({ id: id, kind: kind, at: new Date().toISOString() });
      save(state);
      busy = false;
      paint(state);
      sync(state);
    };
    const reduce = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (cardRow && !reduce) {
      cardRow.classList.add("is-leaving");
      root.setTimeout(finish, 220);
    } else finish();
  }

  function cssEscape(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function sync(state) {
    const current = session();
    if (!current || !authUrl() || !navigator.onLine) return Promise.resolve(state);
    const token = current.token;
    let chain = Promise.resolve();
    state.queue.slice().forEach(function (item) {
      chain = chain.then(function () {
        if (!state.queue.length || state.queue[0] !== item) return null;
        return post({
          action: "call-log",
          token: token,
          origin: location.origin,
          contactId: item.id,
          kind: item.kind,
        }).then(function (payload) {
          if (!payload || payload.ok === false) return null;
          state.queue.shift();
          save(state);
          return payload;
        });
      });
    });
    return chain.then(function () {
      return post({ action: "call-list", token: token, origin: location.origin });
    }).then(function (payload) {
      if (!payload || payload.ok === false) {
        if (payload && payload.code === "unconfigured") state.status = "unconfigured";
        else if (!state.people.length) state.status = "error";
        save(state);
        paint(state);
        return state;
      }
      let people = (payload.people || []).concat(payload.reserve || []);
      state.queue.forEach(function (item) {
        people = applyAction(people, item.id, item.kind, Date.parse(item.at) || Date.now());
      });
      const pendingContacts = state.queue.filter(function (item) {
        return item.kind === "called" || item.kind === "texted";
      }).length;
      state.people = people;
      state.weekCount = (Number(payload.weekCount) || 0) + pendingContacts;
      state.streak = Number(payload.streak) || 0;
      state.status = "";
      save(state);
      paint(state);
      return state;
    }).catch(function () {
      if (!state.people.length) state.status = "offline";
      save(state);
      paint(state);
      return state;
    });
  }

  function card() {
    const current = session();
    const state = load(current && current.email);
    const section = document.createElement("section");
    section.className = "call5";
    section.setAttribute("aria-label", "Call 5");
    host = section;
    if (!navigator.onLine && !state.people.length) state.status = "offline";
    paint(state);
    if (navigator.onLine) sync(state);
    return section;
  }

  function syncNow() {
    if (!available()) return Promise.resolve();
    const state = load(session().email);
    if (host) paint(state);
    return sync(state);
  }

  return {
    available: available,
    card: card,
    sync: syncNow,
    sortPeople: sortPeople,
    applyAction: applyAction,
    dialable: dialable,
  };
});
