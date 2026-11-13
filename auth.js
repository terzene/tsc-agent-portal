/* Google sign-in for the TSC Agent Portal.
   The gate stays off until authConfig.clientId and authConfig.url are both set
   in index.html. A signed-in session is kept on this device and reused offline
   until it expires. */
(function (root) {
  "use strict";

  var STORAGE_KEY = "tsc-portal-session";
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
      var exp = Number(parsed.exp);
      if (!exp || exp * 1000 <= Date.now()) return null;
      return {
        token: String(parsed.token),
        email: String(parsed.email || "").toLowerCase(),
        name: String(parsed.name || ""),
        role: parsed.role === "admin" ? "admin" : "agent",
        exp: exp,
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
    var exp = Number(payload.exp);
    if (!exp || exp * 1000 <= Date.now()) return false;
    write({
      token: String(payload.token),
      email: String(payload.email || "").toLowerCase(),
      name: String(payload.name || ""),
      role: payload.role === "admin" ? "admin" : "agent",
      exp: exp,
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
    mountButton();
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
    emit();
    if (read()) refresh();
    else mountButton();
    root.addEventListener("online", function () {
      if (!required()) return;
      if (read()) refresh();
      else mountButton();
    });
  }

  root.TSCAuth = {
    authConfig: authConfig(),
    required: required,
    getSession: current,
    signOut: signOut,
    start: start,
    onChange: function (fn) {
      if (typeof fn === "function") listeners.push(fn);
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
