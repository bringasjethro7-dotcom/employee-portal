/* ══════════════════════════════════════════════════════════════════════════
   JMB PORTAL AURA — LIVE CONFIG  (portal.jmbvirtuals.com)
   --------------------------------------------------------------------------
   The LIVE endpoints. index.html and admin.html read these first and carry the
   same values as a fallback, so the portal still works if this file fails to load.
     EXEC     = live main Apps Script /exec   (portal-apps-script.gs)
     LOGIN    = live login lane /exec          (login-apps-script.gs)
     SUPA_URL = live Supabase project
     SUPA_KEY = live ANON (public) key — never the service key
   The staging copy (Portal_V2_Aura/aura-config.js) keeps the TEST values.
   ══════════════════════════════════════════════════════════════════════════ */
window.__AURA__ = {
  ENV:      "live",
  EXEC:     "https://script.google.com/macros/s/AKfycbwK8rVJlkv5YLgNLe7cGIz73KJc0hedmZcutoiRviDEowiZPglzBnznswBaZ0TVIV8t/exec",
  LOGIN:    "https://script.google.com/macros/s/AKfycbx4oekhuDA4wTo1uIE8Zb1PsI9oOnQx7yW_uWcZ9e_jtLFwFS0b64e749iN3sx5VC6ziQ/exec",
  SUPA_URL: "https://rvyrnkjqxnijxydloujk.supabase.co",
  SUPA_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eXJua2pxeG5panh5ZGxvdWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzAwODQsImV4cCI6MjA5NzE0NjA4NH0.SwkSkmbeWrhm5PZZDSZ1Z4hbjpQ0L2CRtuKQmpHshBE"
};
