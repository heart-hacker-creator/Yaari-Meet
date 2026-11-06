// Builds the public SEO pages, sitemap.xml and robots.txt into ./public.
// Edit site/pages.mjs, then run `npm run build` (deploy runs it too).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { SITE, NAME, pages } from "./pages.mjs";

const root = join(import.meta.dirname, "..", "public");
const today = new Date().toISOString().slice(0, 10);
const url = (path) => SITE + path;

const nav = [
  ["/omegle-alternative/", "Omegle alternative"],
  ["/pricing/", "Pricing"],
  ["/safety/", "Safety"],
];

function jsonLd(page) {
  const graph = [...(page.schema ?? [])];
  if (page.path !== "/" && page.path !== "/hi/" && !page.noindex) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: NAME, item: url("/") },
        { "@type": "ListItem", position: 2, name: page.crumb ?? page.h1, item: url(page.path) },
      ],
    });
  }
  if (page.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    });
  }
  if (!graph.length) return "";
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

function render(page) {
  const lang = page.lang ?? "en";
  const alternates = page.alternates
    ? page.alternates.map(([hl, path]) => `<link rel="alternate" hreflang="${hl}" href="${url(path)}">`).join("\n  ")
    : "";
  const faq = page.faq?.length
    ? `<section class="faq"><h2>${lang === "hi" ? "अक्सर पूछे जाने वाले सवाल" : "Frequently asked questions"}</h2>
      ${page.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}</section>`
    : "";

  return `<!doctype html>
<html lang="${lang === "hi" ? "hi-IN" : "en-IN"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <link rel="canonical" href="${url(page.path)}">
  ${alternates}
  <meta name="robots" content="${page.noindex ? "noindex" : "index, follow, max-image-preview:large"}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${NAME}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${url(page.path)}">
  <meta property="og:image" content="${url("/og.png")}">
  <meta property="og:locale" content="${lang === "hi" ? "hi_IN" : "en_IN"}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#fbf6ee">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icon-180.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800${lang === "hi" ? "&family=Mukta:wght@400;600;800" : ""}&display=swap">
  <link rel="stylesheet" href="/site.css">
  ${jsonLd(page)}
</head>
<body>
<div id="banner" class="banner" hidden></div>
<header class="nav">
  <a class="logo" href="/">Yaari<span>Meet</span></a>
  <nav>${nav.map(([href, text]) => `<a href="${href}">${text}</a>`).join("")}</nav>
  <a class="btn primary" href="/chat/">${lang === "hi" ? "चैट शुरू करें" : "Start chat"}</a>
</header>
<main>
${page.body}
${faq}
<section class="cta-band">
  <div>
    <h2>${lang === "hi" ? "किसी नए से मिलने के लिए तैयार?" : "Someone new is one tap away."}</h2>
    <p>${lang === "hi" ? "मुफ़्त · कोई डाउनलोड नहीं · Google से साइन इन" : "Free random chat. No download. Sign in with Google."}</p>
  </div>
  <a class="btn primary big" href="/chat/">${lang === "hi" ? "अभी चैट शुरू करें" : "Start chatting"}</a>
</section>
</main>
<footer>
  <div class="cols">
    <div>
      <a class="logo" href="/">Yaari<span>Meet</span></a>
      <p class="about-line">Random video and text chat for India. Meet someone new in seconds — free, with verified profiles and real moderation.</p>
    </div>
    <div><b>Chat</b>
      <a href="/">Random video chat</a>
      <a href="/talk-to-strangers/">Talk to strangers</a>
      <a href="/video-chat-with-strangers-india/">Video chat India</a>
      <a href="/chat-with-girls-online/">Chat with girls online</a>
      <a href="/random-chat-app/">Random chat app</a>
      <a href="/omegle-alternative/">Omegle alternative</a>
      <a href="/hi/">हिंदी में</a>
    </div>
    <div><b>${NAME}</b>
      <a href="/about/">About</a>
      <a href="/pricing/">Pricing</a>
      <a href="/safety/">Safety</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy policy</a>
      <a href="/terms/">Terms of use</a>
    </div>
  </div>
  <p class="copy">© ${new Date().getFullYear()} ${NAME} · For adults 18+ only · Made in India</p>
</footer>
<script>
  // Once per browser session: tells the server about the visit and gets the banner text.
  (() => {
    let first = true;
    try { first = !sessionStorage.ymVisit; sessionStorage.ymVisit = 1; } catch {}
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first, path: location.pathname, referrer: document.referrer }),
    })
      .then((r) => r.json())
      .then(({ banner }) => {
        const el = document.getElementById("banner");
        if (banner) { el.textContent = banner; el.hidden = false; }
      })
      .catch(() => {});
  })();
</script>
</body>
</html>
`;
}

for (const page of pages) {
  const file = page.file ?? join(page.path, "index.html");
  const out = join(root, file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(page));
}

const indexed = pages.filter((p) => !p.noindex);
writeFileSync(
  join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexed.map((p) => `  <url><loc>${url(p.path)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`,
);
writeFileSync(
  join(root, "robots.txt"),
  `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${url("/sitemap.xml")}
`,
);

console.log(`Built ${pages.length} pages`);

