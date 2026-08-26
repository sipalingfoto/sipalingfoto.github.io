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

const ERROR_COPY = {
  invalid: {
    icon: "🔗",
    title: "Link tidak valid",
    desc: "Kode pada URL tidak dikenali. Pastikan kamu memakai link lengkap yang diberikan.",
  },
  notfound: {
    icon: "🔍",
    title: "Microsite tidak ditemukan",
    desc: "Data untuk link ini tidak ada atau sudah dihapus.",
  },
  ratelimit: {
    icon: "⏳",
    title: "Terlalu banyak permintaan",
    desc: "Server sedang sibuk. Tunggu sebentar lalu coba lagi.",
  },
  network: {
    icon: "📡",
    title: "Gagal memuat",
    desc: "Periksa koneksi internetmu lalu coba lagi.",
  },
  corrupt: {
    icon: "🧩",
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
        <span class="badge">📷 Fotobooth Profesional</span>
        <h1>Abadikan Setiap Momen, Tanpa Ribet.</h1>
        <p class="tagline">Photobooth instan untuk wedding, ulang tahun, dan acara korporat. Cetak langsung, hasil rapi, harga bersahabat.</p>
      </section>
      <section class="features">
        <div class="feature fade-up">
          <span class="emoji">⚡</span>
          <div><h3>Cetak Instan</h3><p>Foto langsung dicetak dalam hitungan detik di lokasi acara.</p></div>
        </div>
        <div class="feature fade-up">
          <span class="emoji">🎨</span>
          <div><h3>Custom Tema</h3><p>Frame dan backdrop disesuaikan dengan tema acaramu.</p></div>
        </div>
        <div class="feature fade-up">
          <span class="emoji">📱</span>
          <div><h3>Softcopy Online</h3><p>Semua foto bisa diunduh lewat scan pada QR Code</p></div>
        </div>
      </section>
      <div class="cta-group fade-up">
        <a class="btn-primary" href="https://wa.me/628979000017?text=Halo%20SiPaling%20Foto%2C%20saya%20mau%20tanya%20paket%20fotobooth" target="_blank" rel="noopener">💬 Konsultasi via WhatsApp</a>
      </div>
      <footer class="footer fade-up">Dibuat dengan ❤️ oleh <a href="https://sipalingfoto.my.id" target="_blank" rel="noopener">SiPaling Foto</a></footer>
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
      <footer class="footer fade-up">Dibuat dengan ❤️ oleh <a href="https://sipalingfoto.my.id" target="_blank" rel="noopener">SiPaling Foto</a></footer>
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
        <span class="icon">${copy.icon}</span>
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
