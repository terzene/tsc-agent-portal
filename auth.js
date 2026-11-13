/* Google sign-in for the TSC Agent Portal.
   The gate stays off until authConfig.clientId and authConfig.url are both set
   in index.html. A signed-in session is kept on this device and reused offline
   until it expires. */
(function (root) {
  "use strict";

  var STORAGE_KEY = "tsc-portal-session";
  var DEVICE_KEY = "tsc-portal-device";
  var NOT_ALLOWED = "This account isn't on the TSC team list. Ask Miranda for access.";
  var listeners = [];
  var gisPromise = null;
  var gisReady = false;

  function authConfig() {
    var raw = root.TSCAuthConfig || {};
    return {
      clientId: String(raw.clientId || "").trim(),
      url: String(raw.url || "").trim(),
    };
  }

  function required() {
    var cfg = authConfig();
    return !!(cfg.clientId && cfg.url);
  }

  function read() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object" || !parsed.token) return null;
      var role = parsed.role === "admin" ? "admin" : parsed.role === "guest" ? "guest" : "agent";
      var exp = Number(parsed.exp);
      if (role !== "guest" && (!exp || exp * 1000 <= Date.now())) return null;
      return {
        token: String(parsed.token),
        email: String(parsed.email || "").toLowerCase(),
        name: String(parsed.name || ""),
        role: role,
        exp: role === "guest" ? null : exp,
      };
    } catch (error) {
      return null;
    }
  }

  function write(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      /* private mode */
    }
  }

  function current() {
    return required() ? read() : null;
  }

  function emit() {
    var session = current();
    listeners.forEach(function (fn) {
      try {
        fn(session);
      } catch (error) {
        /* a listener failed */
      }
    });
  }

  function setStatus(message, isError) {
    var status = document.getElementById("sign-in-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", !!(isError && message));
  }

  function parsePayload(raw) {
    var text = String(raw || "").trim();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      var start = text.indexOf("{");
      var end = text.lastIndexOf("}");
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

  function post(body) {
    return fetch(authConfig().url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    }).then(function (response) {
      return response.text();
    }).then(parsePayload);
  }

  function applyPayload(payload) {
    if (!payload || payload.ok === false || !payload.token) return false;
    var role = payload.role === "admin" ? "admin" : payload.role === "guest" ? "guest" : "agent";
    var exp = Number(payload.exp);
    if (role !== "guest" && (!exp || exp * 1000 <= Date.now())) return false;
    write({
      token: String(payload.token),
      email: String(payload.email || "").toLowerCase(),
      name: String(payload.name || ""),
      role: role,
      exp: role === "guest" ? null : exp,
    });
    document.documentElement.classList.add("auth-ready");
    setStatus("");
    emit();
    return true;
  }

  function loadGis() {
    if (root.google && root.google.accounts && root.google.accounts.id) return Promise.resolve();
    if (gisPromise) return gisPromise;
    gisPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        gisPromise = null;
        reject(new Error("gis"));
      };
      document.head.appendChild(script);
    });
    return gisPromise;
  }

  function mountButton() {
    var slot = document.getElementById("google-button");
    if (!required()) return;
    if (!navigator.onLine) {
      if (slot) slot.replaceChildren();
      setStatus("You're offline. Sign in when you're back online.", true);
      return;
    }
    loadGis().then(function () {
      var cfg = authConfig();
      root.google.accounts.id.initialize({
        client_id: cfg.clientId,
        callback: function (response) {
          exchange(response && response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      gisReady = true;
      if (!slot) return;
      slot.replaceChildren();
      root.google.accounts.id.renderButton(slot, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 280,
        logo_alignment: "left",
      });
    }).catch(function () {
      var status = document.getElementById("sign-in-status");
      if (status && status.textContent === NOT_ALLOWED) return;
      setStatus("Google sign-in didn't load. Check your connection and try again.", true);
    });
  }

  function exchange(credential) {
    if (!credential) {
      setStatus("Google sign-in didn't go through. Try again.", true);
      return;
    }
    setStatus("Checking your account…", false);
    post({
      action: "session",
      credential: credential,
      origin: location.origin,
    }).then(function (payload) {
      if (payload && payload.code === "not_allowed") {
        clear();
        document.documentElement.classList.remove("auth-ready");
        setStatus(NOT_ALLOWED, true);
        emit();
        return;
      }
      if (!applyPayload(payload)) {
        setStatus("Google sign-in didn't go through. Try again.", true);
      }
    }).catch(function () {
      setStatus("Google sign-in didn't go through. Check your connection and try again.", true);
    });
  }

  function refresh() {
    var session = read();
    if (!session || !navigator.onLine || !required()) return Promise.resolve(session);
    return post({
      action: "refresh",
      token: session.token,
      origin: location.origin,
    }).then(function (payload) {
      if (!payload) return read();
      if (payload.code === "not_allowed") {
        clear();
        document.documentElement.classList.remove("auth-ready");
        setStatus(NOT_ALLOWED, true);
        emit();
        mountButton();
        return null;
      }
      if (payload.code === "unauthorized") {
        clear();
        document.documentElement.classList.remove("auth-ready");
        emit();
        mountButton();
        return null;
      }
      if (payload.ok && payload.token) applyPayload(payload);
      return read();
    }).catch(function () {
      return read();
    });
  }

  function signOut(message) {
    clear();
    document.documentElement.classList.remove("auth-ready");
    try {
      if (gisReady && root.google && root.google.accounts && root.google.accounts.id) {
        root.google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      /* GIS was not ready */
    }
    emit();
    if (!required()) return;
    setStatus(message || "", !!message);
    hideGuestForm();
    mountButton();
    loadGuestOption();
  }

  function deviceId() {
    try {
      var existing = localStorage.getItem(DEVICE_KEY) || "";
      if (/^[A-Za-z0-9-]{16,80}$/.test(existing)) return existing;
      var id = root.crypto && typeof root.crypto.randomUUID === "function"
        ? root.crypto.randomUUID()
        : "d" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
      return id;
    } catch (error) {
      return "device-unavailable";
    }
  }

  function hideGuestForm() {
    var form = document.getElementById("guest-form");
    var input = document.getElementById("guest-code");
    if (form) form.hidden = true;
    if (input) input.value = "";
  }

  function loadGuestOption() {
    var link = document.getElementById("guest-link");
    if (!link || !required() || !navigator.onLine) {
      if (link) link.hidden = true;
      hideGuestForm();
      return;
    }
    link.hidden = true;
    post({ action: "config", origin: location.origin }).then(function (payload) {
      link.hidden = !(payload && payload.guest === true);
      if (link.hidden) hideGuestForm();
    }).catch(function () {
      link.hidden = true;
      hideGuestForm();
    });
  }

  function submitGuest(event) {
    if (event) event.preventDefault();
    var input = document.getElementById("guest-code");
    var code = input ? String(input.value || "") : "";
    if (!code.trim()) {
      setStatus("Enter the guest code.", true);
      return;
    }
    setStatus("Checking the guest code…", false);
    post({
      action: "guest",
      code: code,
      device: deviceId(),
      origin: location.origin,
    }).then(function (payload) {
      if (payload && payload.code === "rate_limited") {
        setStatus("Too many tries. Wait a few minutes and try again.", true);
        return;
      }
      if (payload && payload.code === "unavailable") {
        var link = document.getElementById("guest-link");
        if (link) link.hidden = true;
        hideGuestForm();
        setStatus("");
        return;
      }
      if (!payload || payload.code === "bad_code" || !applyPayload(payload)) {
        setStatus("That guest code didn't work.", true);
        return;
      }
      hideGuestForm();
    }).catch(function () {
      setStatus("That guest code didn't work. Check your connection and try again.", true);
    });
  }

  function bindGuest() {
    var link = document.getElementById("guest-link");
    var form = document.getElementById("guest-form");
    if (link && !link.dataset.bound) {
      link.dataset.bound = "1";
      link.addEventListener("click", function () {
        if (!form) return;
        form.hidden = false;
        var input = document.getElementById("guest-code");
        if (input) input.focus();
      });
    }
    if (form && !form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", submitGuest);
    }
  }

  function start() {
    if (!required()) {
      document.documentElement.classList.remove("auth-required");
      document.documentElement.classList.remove("auth-ready");
      emit();
      return;
    }
    document.documentElement.classList.add("auth-required");
    if (read()) document.documentElement.classList.add("auth-ready");
    else document.documentElement.classList.remove("auth-ready");
    bindGuest();
    emit();
    if (read()) refresh();
    else {
      mountButton();
      loadGuestOption();
    }
    root.addEventListener("online", function () {
      if (!required()) return;
      if (read()) refresh();
      else {
        mountButton();
        loadGuestOption();
      }
    });
  }

  root.TSCAuth = {
    authConfig: authConfig(),
    required: required,
    getSession: current,
    canUsePersonal: function () {
      if (!required()) return true;
      var session = current();
      return !!(session && session.role !== "guest");
    },
    signOut: signOut,
    start: start,
    onChange: function (fn) {
      if (typeof fn === "function") listeners.push(fn);
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
