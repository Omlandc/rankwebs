const SUPPORTED_LANGUAGES = ["zh", "en", "fr", "de", "it", "es"];

const UI = {
  zh: {
    searchPlaceholder: "搜索域名，例如 google、cloud、edu",
    loading: "正在加载全球网站排行数据...",
    loaded: "已加载",
    websites: "个网站",
    showing: "显示",
    of: "共",
    matching: "个匹配结果",
    noResults: "没有找到匹配的网站",
    allSites: "全部网站",
    page: "第",
    pageOf: "页 / 共",
    previous: "上一页",
    next: "下一页",
    currentView: "当前视图",
    tldAll: "全部后缀",
    tldFilter: "后缀",
    loadError: "数据加载失败。部署到 GitHub Pages 后可正常读取 CSV；本地预览请使用静态服务器打开。"
  },
  en: {
    searchPlaceholder: "Search domains, e.g. google, cloud, edu",
    loading: "Loading global website ranking data...",
    loaded: "Loaded",
    websites: "websites",
    showing: "Showing",
    of: "of",
    matching: "matching results",
    noResults: "No matching websites found",
    allSites: "All websites",
    page: "Page",
    pageOf: "of",
    previous: "Previous",
    next: "Next",
    currentView: "Current view",
    tldAll: "All TLDs",
    tldFilter: "TLD",
    loadError: "Failed to load data. It will work on GitHub Pages; for local preview, open it with a static server."
  },
  fr: {
    searchPlaceholder: "Rechercher un domaine, ex. google, cloud, edu",
    loading: "Chargement du classement mondial...",
    loaded: "Chargé",
    websites: "sites",
    showing: "Affichage",
    of: "sur",
    matching: "résultats",
    noResults: "Aucun site correspondant",
    allSites: "Tous les sites",
    page: "Page",
    pageOf: "sur",
    previous: "Précédent",
    next: "Suivant",
    currentView: "Vue actuelle",
    tldAll: "Tous les TLD",
    tldFilter: "TLD",
    loadError: "Impossible de charger les données. GitHub Pages les servira correctement; en local, utilisez un serveur statique."
  },
  de: {
    searchPlaceholder: "Domains suchen, z. B. google, cloud, edu",
    loading: "Globale Website-Rangliste wird geladen...",
    loaded: "Geladen",
    websites: "Websites",
    showing: "Zeige",
    of: "von",
    matching: "Treffern",
    noResults: "Keine passenden Websites gefunden",
    allSites: "Alle Websites",
    page: "Seite",
    pageOf: "von",
    previous: "Zurück",
    next: "Weiter",
    currentView: "Aktuelle Ansicht",
    tldAll: "Alle TLDs",
    tldFilter: "TLD",
    loadError: "Daten konnten nicht geladen werden. Auf GitHub Pages funktioniert es; lokal bitte einen statischen Server verwenden."
  },
  it: {
    searchPlaceholder: "Cerca domini, es. google, cloud, edu",
    loading: "Caricamento classifica globale...",
    loaded: "Caricati",
    websites: "siti",
    showing: "Mostra",
    of: "di",
    matching: "risultati",
    noResults: "Nessun sito corrispondente",
    allSites: "Tutti i siti",
    page: "Pagina",
    pageOf: "di",
    previous: "Precedente",
    next: "Successivo",
    currentView: "Vista attuale",
    tldAll: "Tutti i TLD",
    tldFilter: "TLD",
    loadError: "Impossibile caricare i dati. Su GitHub Pages funzionerà; in locale usa un server statico."
  },
  es: {
    searchPlaceholder: "Buscar dominios, p. ej. google, cloud, edu",
    loading: "Cargando ranking global...",
    loaded: "Cargados",
    websites: "sitios",
    showing: "Mostrando",
    of: "de",
    matching: "resultados",
    noResults: "No se encontraron sitios",
    allSites: "Todos los sitios",
    page: "Página",
    pageOf: "de",
    previous: "Anterior",
    next: "Siguiente",
    currentView: "Vista actual",
    tldAll: "Todos los TLD",
    tldFilter: "TLD",
    loadError: "No se pudieron cargar los datos. Funcionará en GitHub Pages; para vista local usa un servidor estático."
  }
};

const state = {
  domains: [],
  ranks: [],
  filtered: null,
  page: 1,
  pageSize: 100,
  query: "",
  tld: "",
  lang: document.documentElement.lang || "en"
};

const $ = (selector) => document.querySelector(selector);
const formatNumber = (value) => new Intl.NumberFormat(state.lang).format(value);

function normalizeLanguage(lang) {
  const short = String(lang || "").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(short) ? short : "en";
}

function setupLanguageSelector() {
  const selector = $("#language-select");
  if (!selector) return;
  selector.value = normalizeLanguage(state.lang);
  selector.addEventListener("change", () => {
    const target = selector.value;
    localStorage.setItem("site-language", target);
    const destination = new URL(`../${target}/`, window.location.href);
    if (state.query) destination.searchParams.set("q", state.query);
    window.location.href = destination.href;
  });
}

function getTld(domain) {
  const parts = domain.split(".");
  return parts.length > 1 ? `.${parts.at(-1)}` : "";
}

function setText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function updateMetrics() {
  setText("total-count", state.domains.length ? formatNumber(state.domains.length) : "-");
  setText("current-view", getViewLabel());
}

function computeTldCounts() {
  const counts = new Map();
  for (const domain of state.domains) {
    const tld = getTld(domain);
    if (tld) counts.set(tld, (counts.get(tld) || 0) + 1);
  }
  return counts;
}

function populateTldFilter(counts) {
  const select = $("#tld-filter");
  if (!select) return;

  const ui = UI[state.lang];
  const topTlds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  select.innerHTML = [
    `<option value="">${ui.tldAll}</option>`,
    ...topTlds.map(([tld, count]) => `<option value="${tld}">${tld} (${formatNumber(count)})</option>`)
  ].join("");
  select.value = state.tld;
}

function getViewLabel() {
  const ui = UI[state.lang];
  if (state.query && state.tld) return `${state.query} · ${state.tld}`;
  if (state.query) return state.query;
  if (state.tld) return state.tld;
  return ui.allSites;
}

function render() {
  const ui = UI[state.lang];
  const list = $("#site-list");
  const isFiltered = Boolean(state.filtered);
  const source = isFiltered ? state.filtered : state.domains;
  const total = source.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(state.page, pages);
  const start = (state.page - 1) * state.pageSize;
  const visible = source.slice(start, start + state.pageSize).map((item, offset) => {
    if (isFiltered) return item;
    const index = start + offset;
    return { domain: item, rank: state.ranks[index] || index + 1 };
  });

  if (!list) return;
  if (!state.domains.length) {
    list.innerHTML = `<div class="loading">${ui.loading}</div>`;
  } else if (!visible.length) {
    list.innerHTML = `<div class="empty">${ui.noResults}</div>`;
  } else {
    list.innerHTML = visible.map((item) => {
      const domain = item.domain;
      const safeDomain = domain.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));
      return `
        <div class="site-row">
          <div class="rank">${formatNumber(item.rank)}</div>
          <a class="domain" href="https://${safeDomain}" target="_blank" rel="nofollow noopener">${safeDomain}</a>
        </div>`;
    }).join("");
  }

  const hasFilter = Boolean(state.query || state.tld);
  const viewText = hasFilter
    ? `${ui.showing} ${formatNumber(Math.min(total, state.pageSize))} ${ui.of} ${formatNumber(total)} ${ui.matching}`
    : `${ui.loaded} ${formatNumber(state.domains.length)} ${ui.websites}`;
  setText("result-status", viewText);
  setText("page-state", `${ui.page} ${formatNumber(state.page)} ${ui.pageOf} ${formatNumber(pages)}`);
  setText("current-view", getViewLabel());

  const previous = $("#previous-page");
  const next = $("#next-page");
  if (previous) previous.disabled = state.page <= 1;
  if (next) next.disabled = state.page >= pages;
}

function runSearch(query) {
  state.query = query.trim().toLowerCase();
  applyFilters();
}

function applyFilters() {
  state.page = 1;
  if (!state.query && !state.tld) {
    state.filtered = null;
    render();
    return;
  }

  const results = [];
  for (let index = 0; index < state.domains.length; index += 1) {
    const domain = state.domains[index];
    const matchesQuery = !state.query || domain.includes(state.query);
    const matchesTld = !state.tld || getTld(domain) === state.tld;
    if (matchesQuery && matchesTld) {
      results.push({ domain, rank: state.ranks[index] || index + 1 });
    }
  }
  state.filtered = results;
  render();
}

function setupControls() {
  const ui = UI[state.lang];
  const search = $("#search");
  const pageSize = $("#page-size");
  const tldFilter = $("#tld-filter");
  const previous = $("#previous-page");
  const next = $("#next-page");
  let timer = 0;

  if (search) {
    search.placeholder = ui.searchPlaceholder;
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    search.value = initialQuery;
    search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => runSearch(search.value), 160);
    });
  }

  if (pageSize) {
    pageSize.value = String(state.pageSize);
    pageSize.addEventListener("change", () => {
      state.pageSize = Number(pageSize.value);
      state.page = 1;
      render();
    });
  }

  if (tldFilter) {
    tldFilter.setAttribute("aria-label", ui.tldFilter);
    tldFilter.addEventListener("change", () => {
      state.tld = tldFilter.value;
      applyFilters();
    });
  }

  previous?.addEventListener("click", () => {
    state.page -= 1;
    render();
  });

  next?.addEventListener("click", () => {
    state.page += 1;
    render();
  });
}

async function loadData() {
  const ui = UI[state.lang];
  setText("result-status", ui.loading);
  try {
    const dataUrl = new URL("../全球网站排行20260609.csv", document.baseURI);
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    applyParsedData(text);
    const tldCounts = computeTldCounts();
    populateTldFilter(tldCounts);
    updateMetrics();
    const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
    if (initialQuery) runSearch(initialQuery);
    else render();
  } catch (error) {
    try {
      await loadDataScriptFallback();
      const tldCounts = computeTldCounts();
      populateTldFilter(tldCounts);
      updateMetrics();
      const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
      if (initialQuery) runSearch(initialQuery);
      else render();
    } catch (fallbackError) {
      const list = $("#site-list");
      if (list) list.innerHTML = `<div class="error">${ui.loadError}</div>`;
      setText("result-status", ui.loadError);
    }
  }
}

function loadDataScriptFallback() {
  return new Promise((resolve, reject) => {
    if (window.WEBSITE_RANKING_DATA) {
      applyParsedData(window.WEBSITE_RANKING_DATA);
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = new URL("../assets/domains-data.js", document.baseURI).href;
    script.async = true;
    script.onload = () => {
      if (!window.WEBSITE_RANKING_DATA) {
        reject(new Error("Fallback data is empty"));
        return;
      }
      applyParsedData(window.WEBSITE_RANKING_DATA);
      resolve();
    };
    script.onerror = () => reject(new Error("Fallback data failed to load"));
    document.head.appendChild(script);
  });
}

function applyParsedData(text) {
  const parsed = parseDomainText(text);
  state.domains = parsed.domains;
  state.ranks = parsed.ranks;
}

function parseDomainText(text) {
  const domains = [];
  const ranks = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim().replace(/^\uFEFF/, "");
    if (!value) return;
    const comma = value.indexOf(",");
    if (comma > 0 && /^\d+$/.test(value.slice(0, comma))) {
      const domain = value.slice(comma + 1).trim().toLowerCase();
      if (!domain) return;
      domains.push(domain);
      ranks.push(Number(value.slice(0, comma)));
      return;
    }
    domains.push(value.toLowerCase());
    ranks.push(index + 1);
  });

  return { domains, ranks };
}

document.addEventListener("DOMContentLoaded", () => {
  state.lang = normalizeLanguage(document.documentElement.lang);
  setupLanguageSelector();
  setupControls();
  updateMetrics();
  render();
  loadData();
});
