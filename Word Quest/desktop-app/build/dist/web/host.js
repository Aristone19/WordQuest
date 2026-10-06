// Word Quest - desktop host bridge.
//
// Injected into the page by the native shell before any other script runs.
// It replaces the browser's LocalStorage with a version that also mirrors the
// save to a file on disk, so progress survives an app update or reinstall.
//
// If this file is not present (plain browser mode) nothing changes: the game
// keeps using the normal LocalStorage.

(function () {
  "use strict";

  // Only run inside the desktop shell.
  var host = window.chrome && window.chrome.webview;
  if (!host) return;

  var FILE = "wordQuestSave";

  // The native side pre-loads the save and injects it as WQ_INITIAL_SAVE, so the
  // first read never has to wait for a round trip. Later writes go back over the
  // message channel.
  var memory = {};
  var initial = window.WQ_INITIAL_SAVE;
  if (typeof initial === "string" && initial) memory[FILE] = initial;

  // Coalesce bursts of saves into a single write.
  var pending = null;
  function flush() {
    if (pending !== null) return;
    pending = setTimeout(function () {
      pending = null;
      if (typeof memory[FILE] === "string") {
        try { host.postMessage({ type: "save", key: FILE, value: memory[FILE] }); }
        catch (e) { }
      }
    }, 200);
  }

  // Replace the page's localStorage with the disk-backed version.
  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: function () {
        return {
          getItem: function (key) {
            var v = memory[String(key)];
            return typeof v === "string" ? v : null;
          },
          setItem: function (key, value) {
            memory[String(key)] = String(value);
            flush();
          },
          removeItem: function (key) {
            delete memory[String(key)];
            flush();
          },
          clear: function () {
            memory = {};
            flush();
          },
          key: function (i) {
            return Object.keys(memory)[i] || null;
          },
          get length() {
            return Object.keys(memory).length;
          }
        };
      }
    });
  } catch (e) {
    // A locked-down web view: fall back to leaving the native LocalStorage alone.
  }
})();
