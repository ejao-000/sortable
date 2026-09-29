window.appState = window.appState || {
  heroes: [],
  filtered: [],
  currentPage: 1,
  pageSize: 20,
  sortKey: "name",
  sortDirection: "asc",
  searchQuery: "",
};

const state = window.appState;

const COLUMNS = [
  { key: "images.xs", type: "image" },
  { key: "name", type: "text" },
  { key: "biography.fullName", type: "text" },
  { key: "powerstats.intelligence", type: "number" },
  { key: "powerstats.strength", type: "number" },
  { key: "powerstats.speed", type: "number" },
  { key: "powerstats.durability", type: "number" },
  { key: "powerstats.power", type: "number" },
  { key: "powerstats.combat", type: "number" },
  { key: "appearance.race", type: "text" },
  { key: "appearance.gender", type: "text" },
  { key: "appearance.height", type: "measure" },
  { key: "appearance.weight", type: "measure" },
  { key: "biography.placeOfBirth", type: "text" },
  { key: "biography.alignment", type: "alignment" },
];

function getNestedValue(source, path) {
  return path.split(".").reduce((value, part) => {
    if (value === null || value === undefined) return value;
    return value[part];
  }, source);
}

function displayValue(type, value) {
  if (type === "measure") {
    if (Array.isArray(value)) return value[1] || value[0] || "N/A";
    return value === null || value === undefined || value === "" ? "N/A" : value;
  }
  if (value === null || value === undefined || value === "" || value === "-") {
    return "N/A";
  }
  return value;
}

function createCell(column, hero) {
  const cell = document.createElement("td");
  const raw = getNestedValue(hero, column.key);

  if (column.type === "image") {
    if (raw) {
      const img = document.createElement("img");
      img.src = raw;
      img.alt = hero.name || "hero";
      img.className = "hero-icon";
      img.loading = "lazy";
      cell.appendChild(img);
    } else {
      cell.textContent = "N/A";
    }
    return cell;
  }

  if (column.type === "alignment") {
    const span = document.createElement("span");
    const alignment = raw ? String(raw).toLowerCase() : "neutral";
    span.className =
      alignment === "good" ? "good" : alignment === "bad" ? "bad" : "neutral";
    span.textContent = raw || "N/A";
    cell.appendChild(span);
    return cell;
  }

  cell.textContent = displayValue(column.type, raw);
  return cell;
}

function createRow(hero) {
  const row = document.createElement("tr");
  COLUMNS.forEach((column) => row.appendChild(createCell(column, hero)));
  return row;
}

function goToPage(page) {
  const total = state.filtered.length;
  const all = state.pageSize === "all";
  const pageSize = all ? total || 1 : Number(state.pageSize) || 20;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  state.currentPage = Math.min(Math.max(1, page), maxPage);
  renderTable();
}

function renderPagination(total, pageSize, currentPage, showAll) {
  const nav = document.getElementById("pagination");
  if (!nav) return;
  nav.textContent = "";

  const first = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const last = showAll ? total : Math.min(currentPage * pageSize, total);

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = `Showing ${first}-${last} of ${total}`;
  nav.appendChild(info);

  if (showAll) return;

  const maxPage = Math.max(1, Math.ceil(total / pageSize));

  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "Prev";
  prev.disabled = currentPage <= 1;
  prev.addEventListener("click", () => goToPage(currentPage - 1));

  const label = document.createElement("span");
  label.className = "page-label";
  label.textContent = `Page ${currentPage} of ${maxPage}`;

  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "Next";
  next.disabled = currentPage >= maxPage;
  next.addEventListener("click", () => goToPage(currentPage + 1));

  nav.append(prev, label, next);
}

function renderTable(heroes) {
  const tbody = document.getElementById("heroes-body");
  if (!tbody) return;

  const data = Array.isArray(heroes) ? heroes : state.filtered;
  const showAll = state.pageSize === "all";
  const pageSize = showAll ? data.length || 1 : Number(state.pageSize) || 20;
  const currentPage = showAll ? 1 : state.currentPage;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  tbody.textContent = "";
  data.slice(start, end).forEach((hero) => tbody.appendChild(createRow(hero)));

  renderPagination(data.length, pageSize, currentPage, showAll);
}

function filterHeroesDefault(event) {
  const query = String(
    (event && event.target && event.target.value) || ""
  ).toLowerCase();

  state.searchQuery = query;
  state.filtered = state.heroes.filter((hero) =>
    String((hero && hero.name) || "").toLowerCase().includes(query)
  );
  state.currentPage = 1;
  renderTable();
}

function setHeroes(heroes) {
  state.heroes = Array.isArray(heroes) ? heroes : [];
  state.filtered = state.heroes
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  state.currentPage = 1;
  renderTable();
}

function init() {
  const search = document.getElementById("global-search");
  if (search) search.addEventListener("input", filterHeroesDefault);

  const pageSize = document.getElementById("page-size");
  if (pageSize) {
    pageSize.value = String(state.pageSize);
    pageSize.addEventListener("change", (event) => {
      state.pageSize =
        event.target.value === "all" ? "all" : Number(event.target.value);
      state.currentPage = 1;
      renderTable();
    });
  }

  renderTable();
}

window.renderTable = renderTable;
window.filterHeroesDefault = filterHeroesDefault;
window.setHeroes = setHeroes;
window.goToPage = goToPage;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
