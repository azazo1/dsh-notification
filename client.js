/* dsh-notification — client bundle (hand-written, matches the official
 * tsdown output shape, so no build step is needed).
 *
 * Browser-side half of dsh-notification: watches the client session list
 * (ctx.sessions.list from @deepseek-ai/dsh-client-runtime) and fires browser
 * Notification popups on the machine VIEWING the Web UI — which is what you
 * want when the dsh server runs on a remote box and the host-side desktop
 * notifications would fire where nobody sees them.
 *
 *   - a session finishes (running true→false with nothing pending)  → "Agent finished"
 *   - a session starts waiting on you (pendingInteraction appears)  → "Waiting for you"
 *
 * Permission is requested on the first user gesture (browsers reject
 * programmatic prompts without one). By default popups show only while the
 * tab is hidden — a visible tab already has your attention.
 */
window.__ModuleLoader__.load({
  id: "dsh-notification",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

    var inject = ["sessions"];

    function canNotify() {
      return typeof Notification !== "undefined";
    }

    function ensurePermission() {
      // Prompt once, on the first gesture; never block on the result.
      if (!canNotify() || Notification.permission !== "default") return;
      function ask() {
        window.removeEventListener("pointerdown", ask, true);
        window.removeEventListener("keydown", ask, true);
        try { Notification.requestPermission().catch(function () {}); } catch (e) {}
      }
      window.addEventListener("pointerdown", ask, true);
      window.addEventListener("keydown", ask, true);
    }

    function formatDuration(ms) {
      if (ms < 1000) return ms + "ms";
      var s = Math.round(ms / 1000);
      if (s < 60) return s + "s";
      return Math.floor(s / 60) + "m " + (s % 60) + "s";
    }

    function apply(ctx, config) {
      var cfg = config || {};
      if (cfg.browser === false) return;
      var title = typeof cfg.title === "string" && cfg.title ? cfg.title : "DeepSeek Harness";
      var notifyOnIdle = cfg.notifyOnIdle !== false;
      var notifyOnApproval = cfg.notifyOnApproval !== false;
      var onlyWhenHidden = cfg.browserOnlyWhenHidden !== false;
      var minTurnMs = typeof cfg.minTurnDurationMs === "number" ? cfg.minTurnDurationMs : 5000;

      if (!canNotify()) return;
      ensurePermission();

      function show(body) {
        if (Notification.permission !== "granted") return;
        if (onlyWhenHidden && document.visibilityState === "visible") return;
        try {
          var n = new Notification(title, { body: body, tag: "dsh-notification" });
          n.onclick = function () {
            try { window.focus(); } catch (e) {}
            n.close();
          };
        } catch (e) {}
      }

      var sessions = ctx.get("sessions");
      if (!sessions || !sessions.list) return;
      var list = sessions.list;

      // sessionId -> { pending, running, runningSince }
      var prev = new Map();
      function snapshotRow(row) {
        return { pending: row.pendingInteraction, running: !!row.running, runningSince: 0 };
      }
      function seed() {
        prev.clear();
        var snap = list.getSnapshot();
        var ids = snap.ids || [];
        for (var i = 0; i < ids.length; i++) {
          var row = snap.byId[ids[i]];
          if (row) prev.set(ids[i], snapshotRow(row));
        }
      }
      seed();

      var unsub = list.subscribe(function () {
        var snap = list.getSnapshot();
        var ids = snap.ids || [];
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i];
          var row = snap.byId[id];
          if (!row) continue;
          if (row.origin === "subagent") continue;
          var p = prev.get(id);
          if (!p) {
            prev.set(id, snapshotRow(row));
            continue;
          }
          // Track when a run started so short turns stay quiet, mirroring
          // the host side's minTurnDurationMs gate.
          if (!p.running && row.running) p.runningSince = Date.now();
          // Waiting on the user: pendingInteraction appeared.
          if (notifyOnApproval && p.pending === undefined && row.pendingInteraction !== undefined) {
            var kind = typeof row.pendingInteraction === "string" ? row.pendingInteraction : "input";
            show("Waiting for you — " + kind);
          }
          // Turn finished: running flipped off with nothing pending.
          if (notifyOnIdle && p.running && !row.running && row.pendingInteraction === undefined) {
            var elapsed = p.runningSince ? Date.now() - p.runningSince : null;
            if (elapsed === null || elapsed >= minTurnMs) {
              show(elapsed === null ? "Agent finished" : "Agent finished — " + formatDuration(elapsed));
            }
          }
          p.pending = row.pendingInteraction;
          p.running = !!row.running;
          prev.set(id, p);
        }
      });

      ctx.effect(function () {
        return function () { unsub(); };
      }, "dsh-notification: session watch");
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
