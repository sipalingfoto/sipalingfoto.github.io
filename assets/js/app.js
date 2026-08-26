import { decodeId, extractBlob, deobfuscate } from "./codec.js";

const REPO_API =
  "https://api.github.com/repos/sipalingfoto/sipalingfoto.github.io/issues/";

const BRAND_META = {
  instagram: { label: "Instagram", color: "#E4405F", icon: "instagram" },
  facebook: { label: "Facebook", color: "#1877F2", icon: "facebook" },
  tiktok: { label: "TikTok", color: "#111111", icon: "tiktok" },
  twitter: { label: "Twitter / X", color: "#111111", icon: "x" },
  threads: { label: "Threads", color: "#111111", icon: "threads" },
  whatsapp: { label: "WhatsApp", color: "#25D366", icon: "whatsapp" },
  telegram: { label: "Telegram", color: "#229ED9", icon: "telegram" },
};
const LINK_ORDER = Object.keys(BRAND_META);

const ICONS = {
  badgeCamera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true"><circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 22a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="22" height="22" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><path d="M14 17h4"/><path d="M17 14v4"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.5L3 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1.2" width="13" height="13" aria-hidden="true"><path d="M12 21s-6.2-4.1-8.4-7.2A5 5 0 0 1 12 6a5 5 0 0 1 8.4 7.8C18.2 16.9 12 21 12 21z"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="44" height="44" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="44" height="44" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="44" height="44" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="44" height="44" aria-hidden="true"><path d="M12 20h.01"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M2 8.5a15 15 0 0 1 20 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="44" height="44" aria-hidden="true"><path d="M10.3 3.3 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>',
};

const ERROR_ICON = {
  invalid: ICONS.link,
  notfound: ICONS.search,
  ratelimit: ICONS.clock,
  network: ICONS.wifi,
  corrupt: ICONS.alert,
};

const ERROR_COPY = {
  invalid: {
    title: "Link tidak valid",
    desc: "Kode pada URL tidak dikenali. Pastikan kamu memakai link lengkap yang diberikan.",
  },
  notfound: {
    title: "Microsite tidak ditemukan",
    desc: "Data untuk link ini tidak ada atau sudah dihapus.",
  },
  ratelimit: {
    title: "Terlalu banyak permintaan",
    desc: "Server sedang sibuk. Tunggu sebentar lalu coba lagi.",
  },
  network: {
    title: "Gagal memuat",
    desc: "Periksa koneksi internetmu lalu coba lagi.",
  },
  corrupt: {
    title: "Data microsite rusak",
    desc: "Isu data tidak dapat dibaca. Hubungi pemilik link untuk memperbaiki.",
  },
};

const app = document.getElementById("app");

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function init() {
  initTheme();
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
  const raw = new URLSearchParams(location.search).get("_");
  const code = raw ? raw.trim().toLowerCase() : null;
  if (code) renderMicrosite(code);
  else renderLanding();
}

/* ---------- Tema light/dark ---------- */

function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');

  const apply = () => {
    const theme = root.getAttribute("data-theme") === "light" ? "light" : "dark";
    if (meta) meta.setAttribute("content", theme === "light" ? "#f6f6f8" : "#0e1014");
  };
  apply();

  btn?.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sf-theme", next);
    } catch (e) {}
    apply();
  });
}

/* ---------- Landing ---------- */

function renderLanding() {
  document.title = "SiPaling Foto — Fotobooth Profesional";
  app.innerHTML = `
    <main class="container">
      <section class="hero fade-up">
        <img class="logo" src="https://sipalingfoto.my.id/sipalingfoto.svg" alt="SiPaling Foto" onerror="this.style.display='none'">
        <span class="badge">${ICONS.badgeCamera} Fotobooth Profesional</span>
        <h1>Abadikan Setiap Momen, Tanpa Ribet.</h1>
        <p class="tagline">Photobooth instan untuk wedding, ulang tahun, dan acara korporat. Cetak langsung, hasil rapi, harga bersahabat.</p>
      </section>
      <section class="features">
        <div class="feature fade-up">
          <span class="feature-icon">${ICONS.zap}</span>
          <div><h3>Cetak Instan</h3><p>Foto langsung dicetak dalam hitungan detik di lokasi acara.</p></div>
        </div>
        <div class="feature fade-up">
          <span class="feature-icon">${ICONS.palette}</span>
          <div><h3>Custom Tema</h3><p>Frame dan backdrop disesuaikan dengan tema acaramu.</p></div>
        </div>
        <div class="feature fade-up">
          <span class="feature-icon">${ICONS.qr}</span>
          <div><h3>Softcopy Online</h3><p>Semua foto bisa diunduh lewat scan pada QR Code</p></div>
        </div>
      </section>
      <div class="cta-group fade-up">
        <a class="btn-primary" href="https://wa.me/628979000017?text=Halo%20SiPaling%20Foto%2C%20saya%20mau%20tanya%20paket%20fotobooth" target="_blank" rel="noopener">${ICONS.chat} Konsultasi via WhatsApp</a>
      </div>
      <footer class="footer fade-up">Dibuat dengan <span class="heart-icon">${ICONS.heart}</span> oleh <a href="https://sipalingfoto.my.id" target="_blank" rel="noopener">SiPaling Foto</a></footer>
    </main>
  `;
}

/* ---------- Microsite ---------- */

async function renderMicrosite(code) {
  renderSkeleton();
  const result = await loadProfile(code);
  if (!result.ok) {
    showError(result.kind, () => renderMicrosite(code));
    return;
  }
  renderProfile(result.profile);
}

function renderSkeleton() {
  app.innerHTML = `
    <main class="container skeleton">
      <div class="skel-avatar"></div>
      <div class="skel-line w60"></div>
      <div class="skel-line w80"></div>
      <div class="skel-line w80"></div>
    </main>
  `;
}

async function loadProfile(code) {
  const n = decodeId(code);
  if (!n) return { ok: false, kind: "invalid" };

  let res;
  try {
    res = await fetch(`${REPO_API}${n}`);
  } catch {
    return { ok: false, kind: "network" };
  }
  if (res.status === 404) return { ok: false, kind: "notfound" };
  if (res.status === 403 || res.status === 429) return { ok: false, kind: "ratelimit" };
  if (!res.ok) return { ok: false, kind: "network" };

  const issue = await res.json().catch(() => null);
  if (!issue || typeof issue.body !== "string") return { ok: false, kind: "corrupt" };

  const blob = extractBlob(issue.body);
  if (!blob) return { ok: false, kind: "corrupt" };

  let profile;
  try {
    profile = deobfuscate(blob);
  } catch {
    return { ok: false, kind: "corrupt" };
  }
  if (typeof profile?.name !== "string" || !profile.name.trim()) {
    return { ok: false, kind: "corrupt" };
  }
  return { ok: true, profile };
}

function renderProfile(p) {
  document.title = `${p.name} — SiPaling Foto`;
  const links = LINK_ORDER.filter((k) => {
    const v = p.links?.[k];
    return typeof v === "string" && v.trim() !== "";
  });

  const linkButtons = links
    .map((k) => {
      const meta = BRAND_META[k];
      const url = esc(p.links[k]);
      return `
        <a class="btn-link fade-up" href="${url}" target="_blank" rel="noopener">
          <span class="chip" style="background:${meta.color}">
            <img class="chip-icon" src="assets/icons/${meta.icon}.svg" alt="" width="20" height="20">
          </span>
          <span class="chip-label">${meta.label}</span>
          <span class="chip-arrow">›</span>
        </a>`;
    })
    .join("");

  app.innerHTML = `
    <main class="container">
      <header class="profile-head">
        ${p.avatar
          ? `<img class="avatar fade-up" src="${esc(p.avatar)}" alt="${esc(p.name)}">`
          : `<div class="avatar-fallback fade-up">${esc(initialOf(p.name))}</div>`}
        <h1 class="fade-up">${esc(p.name)}</h1>
        ${p.bio ? `<p class="bio fade-up">${esc(p.bio)}</p>` : ""}
      </header>
      <nav class="links">${linkButtons}</nav>
      <footer class="footer fade-up">Dibuat dengan <span class="heart-icon">${ICONS.heart}</span> oleh <a href="https://sipalingfoto.my.id" target="_blank" rel="noopener">SiPaling Foto</a></footer>
    </main>
  `;

  const img = app.querySelector(".avatar");
  img?.addEventListener("error", () => {
    const fb = document.createElement("div");
    fb.className = "avatar-fallback";
    fb.textContent = initialOf(p.name);
    img.replaceWith(fb);
  });
}

function initialOf(name) {
  return String(name).trim().charAt(0).toUpperCase() || "?";
}

/* ---------- Error ---------- */

function showError(kind, retryFn) {
  const copy = ERROR_COPY[kind] ?? ERROR_COPY.network;
  document.title = "SiPaling Foto";
  app.innerHTML = `
    <main class="container">
      <div class="error-box fade-up">
        <span class="icon">${ERROR_ICON[kind] ?? ERROR_ICON.network}</span>
        <h2>${esc(copy.title)}</h2>
        <p>${esc(copy.desc)}</p>
        <button class="btn-retry" type="button">Coba lagi</button>
        <a class="btn-link" style="min-height:48px" href="/">← Ke halaman utama</a>
      </div>
    </main>
  `;
  app.querySelector(".btn-retry").addEventListener("click", retryFn);
}

init();
