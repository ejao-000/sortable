const API_URL =
  "https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json";

window.appState = window.appState || {
  heroes: [],
  filtered: [],
  currentPage: 1,
  pageSize: 20,
  sortKey: "name",
  sortDirection: "asc",
  searchQuery: "",
  searchField: "name",
  searchOperator: "include",
  conditions: [],
  activeHeroId: null,
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

const TYPE_BY_KEY = COLUMNS.reduce((map, column) => {
  map[column.key] = column.type;
  return map;
}, {});

const KEY_LABELS = COLUMNS.reduce((map, column) => {
  map[column.key] = column.key.split(".").pop();
  return map;
}, {});

const FIELD_LABELS = {
  name: "Name",
  "biography.fullName": "Full Name",
  "biography.placeOfBirth": "Place of Birth",
  "appearance.race": "Race",
  "appearance.gender": "Gender",
  "biography.alignment": "Alignment",
  "appearance.height": "Height",
  "appearance.weight": "Weight",
  all: "All fields",
};

const TEXT_SEARCH_FIELDS = [
  "name",
  "biography.fullName",
  "biography.placeOfBirth",
  "appearance.race",
  "appearance.gender",
  "biography.alignment",
];

const SEARCH_FIELDS = [
  { key: "all", label: "All fields", type: "text" },
  { key: "name", label: "Name", type: "text" },
  { key: "biography.fullName", label: "Full Name", type: "text" },
  { key: "biography.placeOfBirth", label: "Place of Birth", type: "text" },
  { key: "appearance.race", label: "Race", type: "text" },
  { key: "appearance.gender", label: "Gender", type: "text" },
  { key: "biography.alignment", label: "Alignment", type: "text" },
  { key: "appearance.height", label: "Height", type: "number" },
  { key: "appearance.weight", label: "Weight", type: "number" },
  { key: "powerstats.intelligence", label: "Intelligence", type: "number" },
  { key: "powerstats.strength", label: "Strength", type: "number" },
  { key: "powerstats.speed", label: "Speed", type: "number" },
  { key: "powerstats.durability", label: "Durability", type: "number" },
  { key: "powerstats.power", label: "Power", type: "number" },
  { key: "powerstats.combat", label: "Combat", type: "number" },
];

const FIELD_TYPE = SEARCH_FIELDS.reduce((map, item) => {
  map[item.key] = item.type;
  return map;
}, {});

const OPERATORS = {
  text: [
    { value: "include", label: "include", example: "e.g. man", hint: "contains text" },
    { value: "exclude", label: "exclude", example: "e.g. man", hint: "does not contain" },
    { value: "fuzzy", label: "fuzzy", example: "e.g. sprmn", hint: "letters in order" },
    { value: "eq", label: "= equal", example: "exact text", hint: "exact match" },
    { value: "neq", label: "!= not equal", example: "exact text", hint: "not exact match" },
  ],
  number: [
    { value: "eq", label: "= equal", example: "e.g. 100", hint: "equal to" },
    { value: "neq", label: "!= not equal", example: "e.g. 100", hint: "not equal to" },
    { value: "gt", label: "> greater than", example: "e.g. 200", hint: "greater than" },
    { value: "lt", label: "< lesser than", example: "e.g. 50", hint: "lesser than" },
  ],
};

function operatorsForField(field) {
  return FIELD_TYPE[field] === "number" ? OPERATORS.number : OPERATORS.text;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function getNestedValue(source, path) {
  return path.split(".").reduce((value, part) => {
    if (value === null || value === undefined) return value;
    return value[part];
  }, source);
}

function isMissing(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "number") return Number.isNaN(value);
  if (typeof value === "string") {
    const cleaned = value.trim().toLowerCase();
    return (
      cleaned === "" ||
      cleaned === "-" ||
      cleaned === "null" ||
      cleaned === "n/a"
    );
  }
  return false;
}

function parseMeasure(value) {
  let target = value;
  if (Array.isArray(target)) {
    // The dataset stores [imperial, metric]; prefer the metric entry.
    const metric = target[1];
    target =
      typeof metric === "string" && /\d/.test(metric) && !isMissing(metric)
        ? metric
        : target.find(
            (item) => typeof item === "string" && /\d/.test(item)
          );
  }
  if (target === null || target === undefined) return null;

  const cleaned = String(target)
    .trim()
    .toLowerCase()
    .replace(/,/g, "");
  if (isMissing(cleaned)) return null;

  // Feet/inches notation, e.g. 6'8" or 6'8.
  const feetInches = cleaned.match(/(\d+)\s*['′]\s*(\d+(?:\.\d+)?)?/);
  if (feetInches) {
    const feet = parseInt(feetInches[1], 10);
    const inches = parseFloat(feetInches[2] || "0");
    const total = feet * 30.48 + inches * 2.54;
    return total === 0 ? null : total;
  }

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  let number = parseFloat(match[0]);
  if (Number.isNaN(number)) return null;

  // Normalise to cm (height) or kg (weight) so mixed units sort correctly.
  const unit = cleaned.slice(match.index + match[0].length).trim();
  if (/^(?:km|kilometers?|kilometres?)$/.test(unit)) number *= 100000;
  else if (/^(?:m|meters?|metres?)$/.test(unit)) number *= 100;
  else if (/^(?:cm|centimeters?|centimetres?)$/.test(unit)) number *= 1;
  else if (/^(?:mm|millimeters?|millimetres?)$/.test(unit)) number *= 0.1;
  else if (/^(?:t|tons?|tonnes?)$/.test(unit)) number *= 1000;
  else if (/^(?:kg|kilograms?|kilogrammes?)$/.test(unit)) number *= 1;
  else if (/^(?:g|grams?|grammes?)$/.test(unit)) number *= 0.001;
  else if (/^(?:lb|lbs|pounds?)$/.test(unit)) number *= 0.453592;
  else if (/^(?:ft|feet|foot)$/.test(unit)) number *= 30.48;
  else if (/^(?:in|inch|inches)$/.test(unit)) number *= 2.54;

  return number === 0 ? null : number;
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  const cleaned = String(value).trim();
  if (
    cleaned === "" ||
    cleaned === "-" ||
    cleaned === "null" ||
    cleaned === "n/a"
  ) {
    return null;
  }
  const number = parseFloat(cleaned);
  return Number.isNaN(number) ? null : number;
}

function displayValue(type, value) {
  if (type === "measure") {
    if (Array.isArray(value)) return value[1] || value[0] || "N/A";
    return value === null || value === undefined || value === ""
      ? "N/A"
      : value;
  }
  if (isMissing(value)) return "N/A";
  return value;
}

function alignmentClass(hero) {
  const alignment = String(
    getNestedValue(hero, "biography.alignment") || ""
  ).toLowerCase();
  if (alignment === "good") return "good";
  if (alignment === "bad") return "bad";
  return "neutral";
}

function statLevel(value) {
  if (value === null || value === undefined) return "low";
  if (value < 34) return "low";
  if (value < 67) return "mid";
  return "high";
}

/* ------------------------------------------------------------------ */
/* Cell rendering                                                      */
/* ------------------------------------------------------------------ */

function createImageCell(hero, raw, cell) {
  if (!raw) {
    cell.textContent = "N/A";
    cell.classList.add("muted");
    return;
  }
  const img = document.createElement("img");
  img.src = raw;
  img.alt = hero.name || "hero";
  img.className = `hero-icon ${alignmentClass(hero)}`;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    img.replaceWith(document.createTextNode("N/A"));
  });
  cell.appendChild(img);
}

function createNumberCell(raw, cell) {
  const value = toNumber(raw);
  if (value === null) {
    cell.textContent = "N/A";
    cell.classList.add("muted");
    return;
  }
  const meter = document.createElement("div");
  meter.className = `stat-meter level-${statLevel(value)}`;

  const fill = document.createElement("span");
  fill.className = "stat-meter-fill";
  fill.style.width = `${Math.max(0, Math.min(100, value))}%`;

  const number = document.createElement("span");
  number.className = "stat-meter-value";
  number.textContent = String(value);

  meter.append(fill, number);
  cell.appendChild(meter);
}

function createMeasureCell(raw, cell) {
  const parts = Array.isArray(raw) ? raw : [raw];
  const main = displayValue("measure", raw);
  const alt = parts.find((part) => part && part !== main);

  if (main === "N/A") {
    cell.textContent = "N/A";
    cell.classList.add("muted");
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "measure";
  const mainEl = document.createElement("span");
  mainEl.className = "measure-main";
  mainEl.textContent = main;
  wrap.appendChild(mainEl);

  if (alt) {
    const altEl = document.createElement("span");
    altEl.className = "measure-alt";
    altEl.textContent = alt;
    wrap.appendChild(altEl);
  }
  cell.appendChild(wrap);
}

function createCell(column, hero) {
  const cell = document.createElement("td");
  const raw = getNestedValue(hero, column.key);

  if (column.type === "image") {
    createImageCell(hero, raw, cell);
    return cell;
  }

  if (column.type === "alignment") {
    const span = document.createElement("span");
    span.className = `pill ${alignmentClass(hero)}`;
    span.textContent = raw || "N/A";
    cell.appendChild(span);
    return cell;
  }

  if (column.type === "number") {
    cell.classList.add("num");
    createNumberCell(raw, cell);
    return cell;
  }

  if (column.type === "measure") {
    createMeasureCell(raw, cell);
    return cell;
  }

  cell.textContent = displayValue(column.type, raw);
  if (column.key === "name") cell.classList.add("cell-name");
  if (isMissing(raw)) cell.classList.add("muted");
  return cell;
}

function createRow(hero) {
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  COLUMNS.forEach((column) => row.appendChild(createCell(column, hero)));
  row.addEventListener("click", () => openProfile(hero));
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProfile(hero);
    }
  });
  return row;
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

function sortValue(hero, key) {
  const type = TYPE_BY_KEY[key];
  const raw = getNestedValue(hero, key);

  if (type === "measure") return parseMeasure(raw);
  if (type === "number") return toNumber(raw);
  if (isMissing(raw)) return null;
  return String(raw).trim();
}

function compareValues(a, b, direction) {
  const missingA = a === null || a === undefined;
  const missingB = b === null || b === undefined;

  if (missingA && missingB) return 0;
  if (missingA) return 1;
  if (missingB) return -1;

  let comparison;
  if (typeof a === "number" && typeof b === "number") {
    comparison = a - b;
  } else {
    comparison = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  return direction === "desc" ? -comparison : comparison;
}

function applySort(data) {
  const key = state.sortKey;
  const direction = state.sortDirection;
  return data
    .slice()
    .sort((a, b) =>
      compareValues(sortValue(a, key), sortValue(b, key), direction)
    );
}

/* ------------------------------------------------------------------ */
/* Filtering                                                           */
/* ------------------------------------------------------------------ */

function fieldText(field, hero) {
  if (field === "all") {
    return TEXT_SEARCH_FIELDS.map((path) =>
      String(getNestedValue(hero, path) ?? "")
    )
      .join(" ")
      .toLowerCase();
  }
  const raw = getNestedValue(hero, field);
  if (Array.isArray(raw)) return raw.join(" ").toLowerCase();
  return String(raw ?? "").toLowerCase();
}

function numericFieldValue(field, hero) {
  if (field === "appearance.height" || field === "appearance.weight") {
    return parseMeasure(getNestedValue(hero, field));
  }
  return toNumber(getNestedValue(hero, field));
}

function fuzzyMatch(haystack, needle) {
  let index = 0;
  for (let i = 0; i < haystack.length && index < needle.length; i++) {
    if (haystack[i] === needle[index]) index++;
  }
  return index === needle.length;
}

function matchQuery(field, operator, rawQuery, hero) {
  const query = String(rawQuery ?? "").trim().toLowerCase();
  if (!query) return true;

  if (
    operator === "eq" ||
    operator === "neq" ||
    operator === "gt" ||
    operator === "lt"
  ) {
    const numeric = numericFieldValue(field, hero);
    const target = parseFloat(query);

    if (numeric !== null && !Number.isNaN(target)) {
      if (operator === "eq") return numeric === target;
      if (operator === "neq") return numeric !== target;
      if (operator === "gt") return numeric > target;
      if (operator === "lt") return numeric < target;
    }

    const text = fieldText(field, hero);
    if (operator === "eq") return text === query;
    if (operator === "neq") return text !== query;
    return false;
  }

  const text = fieldText(field, hero);
  if (operator === "exclude") return !text.includes(query);
  if (operator === "fuzzy") return fuzzyMatch(text, query);
  return text.includes(query);
}

function matchesHero(hero) {
  const quickMatch = matchQuery(
    state.searchField,
    state.searchOperator,
    state.searchQuery,
    hero
  );
  if (!quickMatch) return false;

  return state.conditions.every((condition) =>
    matchQuery(condition.field, condition.operator, condition.value, hero)
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

function currentPageSize() {
  if (state.pageSize === "all") return state.filtered.length || 1;
  return Number(state.pageSize) || 20;
}

function totalPages() {
  if (state.pageSize === "all") return 1;
  return Math.max(1, Math.ceil(state.filtered.length / currentPageSize()));
}

function clampCurrentPage() {
  const max = totalPages();
  state.currentPage = Math.min(Math.max(1, state.currentPage), max);
  return state.currentPage;
}

function goToPage(page) {
  state.currentPage = page;
  clampCurrentPage();
  renderTable();
  renderMeta();
  syncURL();
}

function pageWindow(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result = [];
  let previous = 0;
  sorted.forEach((page) => {
    if (previous && page - previous > 1) result.push("...");
    result.push(page);
    previous = page;
  });
  return result;
}

function renderPagination() {
  const nav = document.getElementById("pagination");
  if (!nav) return;
  nav.textContent = "";

  if (state.pageSize === "all" || state.filtered.length === 0) return;

  const current = clampCurrentPage();
  const maxPage = totalPages();

  const makeButton = (label, targetPage, disabled) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-btn";
    button.textContent = label;
    button.disabled = disabled;
    if (!disabled) button.addEventListener("click", () => goToPage(targetPage));
    return button;
  };

  nav.append(makeButton("\u00AB First", 1, current <= 1));
  nav.append(makeButton("\u2039 Prev", current - 1, current <= 1));

  pageWindow(current, maxPage).forEach((page) => {
    if (page === "...") {
      const dots = document.createElement("span");
      dots.className = "page-ellipsis";
      dots.textContent = "\u2026";
      nav.append(dots);
      return;
    }
    const button = makeButton(String(page), page, false);
    if (page === current) button.classList.add("active");
    nav.append(button);
  });

  nav.append(makeButton("Next \u203A", current + 1, current >= maxPage));
  nav.append(makeButton("Last \u00BB", maxPage, current >= maxPage));
}

/* ------------------------------------------------------------------ */
/* Table + meta rendering                                              */
/* ------------------------------------------------------------------ */

function renderTable() {
  const tbody = document.getElementById("heroes-body");
  if (!tbody) return;

  const showAll = state.pageSize === "all";
  const pageSize = currentPageSize();
  const currentPage = showAll ? 1 : clampCurrentPage();
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  tbody.textContent = "";
  state.filtered.slice(start, end).forEach((hero) => {
    tbody.appendChild(createRow(hero));
  });

  toggleEmpty(state.filtered.length === 0);
  renderPagination();
}

function toggleEmpty(isEmpty) {
  const empty = document.getElementById("table-empty");
  if (empty) empty.classList.toggle("hidden", !isEmpty);
}

function toggleLoading(isLoading) {
  const loading = document.getElementById("table-loading");
  if (loading) loading.classList.toggle("hidden", !isLoading);
}

function renderMeta() {
  const total = state.heroes.length;
  const shown = state.filtered.length;
  const all = state.pageSize === "all";
  const pageSize = currentPageSize();
  const pages = totalPages();
  const current = all ? 1 : clampCurrentPage();

  const statTotal = document.getElementById("stat-total");
  const statShown = document.getElementById("stat-shown");
  const statPages = document.getElementById("stat-pages");
  if (statTotal) statTotal.textContent = String(total);
  if (statShown) statShown.textContent = String(shown);
  if (statPages) statPages.textContent = String(pages);

  const info = document.getElementById("results-info");
  if (info) {
    if (shown === 0) {
      info.textContent = "No targets match the current filters";
    } else {
      const first = all ? 1 : (current - 1) * pageSize + 1;
      const last = all ? shown : Math.min(current * pageSize, shown);
      const label = shown === total ? "targets" : "matching targets";
      info.innerHTML = `Showing <strong>${first}\u2013${last}</strong> of <strong>${shown}</strong> ${label}`;
    }
  }

  updateFilterCount();
  renderChips();
}

function createChip(key, value, onRemove) {
  const chip = document.createElement("span");
  chip.className = "chip";

  const keyEl = document.createElement("span");
  keyEl.className = "chip-key";
  keyEl.textContent = key;

  const valueEl = document.createElement("span");
  valueEl.textContent = value;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.setAttribute("aria-label", `Remove ${key} filter`);
  remove.textContent = "\u00D7";
  remove.addEventListener("click", onRemove);

  chip.append(keyEl, valueEl, remove);
  return chip;
}

function renderChips() {
  const container = document.getElementById("active-filters");
  if (!container) return;
  container.textContent = "";

  if (state.searchQuery) {
    container.appendChild(
      createChip("search", state.searchQuery, () => {
        state.searchQuery = "";
        syncControlsFromState();
        recompute(true);
      })
    );
  }

  if (state.searchField !== "name") {
    container.appendChild(
      createChip("in", FIELD_LABELS[state.searchField] || state.searchField, () => {
        state.searchField = "name";
        syncControlsFromState();
        recompute(true);
      })
    );
  }

  if (state.searchOperator !== "include") {
    container.appendChild(
      createChip("op", state.searchOperator, () => {
        state.searchOperator = "include";
        syncControlsFromState();
        recompute(true);
      })
    );
  }

  if (state.sortKey !== "name" || state.sortDirection !== "asc") {
    container.appendChild(
      createChip(
        "sort",
        `${KEY_LABELS[state.sortKey] || state.sortKey} ${state.sortDirection}`,
        () => {
          state.sortKey = "name";
          state.sortDirection = "asc";
          state.filtered = applySort(state.filtered);
          updateHeaderUI();
          renderTable();
          renderMeta();
          syncURL();
        }
      )
    );
  }
}

/* ------------------------------------------------------------------ */
/* Interactions                                                        */
/* ------------------------------------------------------------------ */

function updateHeaderUI() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
    if (th.dataset.sortKey === state.sortKey) {
      const ascending = state.sortDirection === "asc";
      th.classList.add(ascending ? "sort-asc" : "sort-desc");
      th.setAttribute("aria-sort", ascending ? "ascending" : "descending");
    } else {
      th.setAttribute("aria-sort", "none");
    }
  });
}

function recompute(resetPage) {
  state.filtered = applySort(state.heroes.filter(matchesHero));
  if (resetPage) state.currentPage = 1;
  clampCurrentPage();
  updateHeaderUI();
  renderTable();
  renderMeta();
  syncURL();
}

function setHeroes(heroes) {
  state.heroes = Array.isArray(heroes) ? heroes : [];
  recompute(false);
}

function handleHeaderClick(event) {
  const key = event.currentTarget.dataset.sortKey;
  if (!key) return;

  if (state.sortKey === key) {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  } else {
    state.sortKey = key;
    state.sortDirection = "asc";
  }

  state.filtered = applySort(state.filtered);
  updateHeaderUI();
  renderTable();
  renderMeta();
  syncURL();
}

function handleSearchInput(event) {
  state.searchQuery = String((event && event.target && event.target.value) || "")
    .trim()
    .toLowerCase();
  recompute(true);
}

function handleFieldChange(event) {
  state.searchField = event.target.value;
  recompute(true);
}

function handleOperatorChange(event) {
  state.searchOperator = event.target.value;
  recompute(true);
}

function handlePageSizeChange(event) {
  state.pageSize =
    event.target.value === "all" ? "all" : Number(event.target.value);
  state.currentPage = 1;
  renderTable();
  renderMeta();
  syncURL();
}

function resetFilters() {
  state.searchQuery = "";
  state.searchField = "name";
  state.searchOperator = "include";
  state.sortKey = "name";
  state.sortDirection = "asc";
  state.currentPage = 1;
  clearConditions();
  syncControlsFromState();
  recompute(true);
}

function syncControlsFromState() {
  const search = document.getElementById("global-search");
  if (search) search.value = state.searchQuery;
  const field = document.getElementById("search-field");
  if (field) field.value = state.searchField;
  const operator = document.getElementById("search-operator");
  if (operator) operator.value = state.searchOperator;
  const pageSize = document.getElementById("page-size");
  if (pageSize) pageSize.value = String(state.pageSize);
}

/* ------------------------------------------------------------------ */
/* Advanced filters                                                    */
/* ------------------------------------------------------------------ */

let conditionSeq = 0;

function operatorMeta(field, operator) {
  const operators = operatorsForField(field);
  return operators.find((item) => item.value === operator) || operators[0];
}

function createConditionRow(condition) {
  const row = document.createElement("div");
  row.className = "condition";
  row.dataset.id = condition.id;

  const fieldSelect = document.createElement("select");
  fieldSelect.className = "cond-field";
  fieldSelect.setAttribute("aria-label", "Filter field");
  SEARCH_FIELDS.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.key;
    option.textContent = item.label;
    fieldSelect.appendChild(option);
  });
  fieldSelect.value = condition.field;

  const operatorSelect = document.createElement("select");
  operatorSelect.className = "cond-operator";
  operatorSelect.setAttribute("aria-label", "Filter operator");

  const valueInput = document.createElement("input");
  valueInput.className = "cond-value";
  valueInput.type = "text";
  valueInput.autocomplete = "off";
  valueInput.value = condition.value || "";
  valueInput.setAttribute("aria-label", "Filter value");

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "cond-remove";
  remove.setAttribute("aria-label", "Remove condition");
  remove.textContent = "\u00D7";

  const syncOperators = () => {
    const operators = operatorsForField(condition.field);
    operatorSelect.textContent = "";
    operators.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      operatorSelect.appendChild(option);
    });
    if (!operators.some((item) => item.value === condition.operator)) {
      condition.operator = operators[0].value;
    }
    operatorSelect.value = condition.operator;
    valueInput.placeholder = operatorMeta(condition.field, condition.operator).example;
  };

  syncOperators();

  fieldSelect.addEventListener("change", () => {
    condition.field = fieldSelect.value;
    syncOperators();
    recompute(true);
  });

  operatorSelect.addEventListener("change", () => {
    condition.operator = operatorSelect.value;
    valueInput.placeholder = operatorMeta(condition.field, condition.operator).example;
    recompute(true);
  });

  valueInput.addEventListener("input", () => {
    condition.value = valueInput.value;
    recompute(true);
  });

  remove.addEventListener("click", () => removeCondition(condition.id));

  row.append(fieldSelect, operatorSelect, valueInput, remove);
  return row;
}

function renderConditionsEmpty() {
  const container = document.getElementById("conditions");
  if (!container) return;
  if (!container.querySelector(".condition")) {
    container.innerHTML =
      '<div class="condition-empty">No conditions yet \u2014 click "Add condition" to build a query.</div>';
  }
}

function addCondition(partial) {
  const condition = {
    id: `c${++conditionSeq}`,
    field: (partial && partial.field) || "name",
    operator: (partial && partial.operator) || "include",
    value: (partial && partial.value) || "",
  };
  state.conditions.push(condition);

  const container = document.getElementById("conditions");
  if (container) {
    const placeholder = container.querySelector(".condition-empty");
    if (placeholder) placeholder.remove();
    container.appendChild(createConditionRow(condition));
  }
  return condition;
}

function removeCondition(id) {
  state.conditions = state.conditions.filter((item) => item.id !== id);
  const container = document.getElementById("conditions");
  const row = container && container.querySelector(`[data-id="${id}"]`);
  if (row) row.remove();
  renderConditionsEmpty();
  recompute(true);
}

function clearConditions() {
  state.conditions = [];
  const container = document.getElementById("conditions");
  if (container) container.textContent = "";
  renderConditionsEmpty();
}

function renderOperatorLegend() {
  const container = document.getElementById("operator-legend");
  if (!container) return;
  container.textContent = "";
  [
    ["include", "text contains \u2014 man"],
    ["exclude", "text does not contain \u2014 man"],
    ["fuzzy", "letters in order \u2014 sprmn"],
    ["=", "equals number \u2014 100"],
    ["!=", "not equal \u2014 100"],
    [">", "greater than \u2014 200"],
    ["<", "lesser than \u2014 50"],
  ].forEach(([operator, description]) => {
    const item = document.createElement("span");
    item.className = "legend-item";
    const code = document.createElement("code");
    code.textContent = operator;
    item.appendChild(code);
    item.appendChild(document.createTextNode(` ${description}`));
    container.appendChild(item);
  });
}

function updateFilterCount() {
  const badge = document.getElementById("filter-count");
  if (!badge) return;
  const count = state.conditions.filter(
    (condition) => String(condition.value).trim() !== ""
  ).length;
  badge.textContent = String(count);
}

function toggleAdvanced() {
  const panel = document.getElementById("advanced-body");
  const button = document.getElementById("toggle-advanced");
  if (!panel) return;
  const isOpen = panel.classList.toggle("hidden") === false;
  if (button) button.setAttribute("aria-expanded", String(isOpen));
}

function openAdvanced() {
  const panel = document.getElementById("advanced-body");
  const button = document.getElementById("toggle-advanced");
  if (panel) panel.classList.remove("hidden");
  if (button) button.setAttribute("aria-expanded", "true");
}

/* ------------------------------------------------------------------ */
/* URL state                                                           */
/* ------------------------------------------------------------------ */

function syncURL() {
  const params = new URLSearchParams();
  if (state.searchQuery) params.set("search", state.searchQuery);
  if (state.searchField && state.searchField !== "name")
    params.set("field", state.searchField);
  if (state.searchOperator && state.searchOperator !== "include")
    params.set("operator", state.searchOperator);
  if (state.sortKey && state.sortKey !== "name")
    params.set("sort", state.sortKey);
  if (state.sortDirection && state.sortDirection !== "asc")
    params.set("dir", state.sortDirection);
  if (String(state.pageSize) !== "20")
    params.set("size", String(state.pageSize));
  if (state.currentPage && state.currentPage !== 1)
    params.set("page", String(state.currentPage));
  if (state.activeHeroId) params.set("id", state.activeHeroId);

  state.conditions
    .filter((condition) => String(condition.value).trim() !== "")
    .forEach((condition) => {
      params.append(
        "f",
        `${condition.field}|${condition.operator}|${condition.value}`
      );
    });

  const query = params.toString();
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState({}, "", url);
}

function readURL() {
  const params = new URLSearchParams(window.location.search);
  const pageSize = params.get("size") || "20";
  return {
    searchQuery: (params.get("search") || "").toLowerCase(),
    searchField: params.get("field") || "name",
    searchOperator: params.get("operator") || "include",
    sortKey: params.get("sort") || "name",
    sortDirection: params.get("dir") === "desc" ? "desc" : "asc",
    pageSize: pageSize === "all" ? "all" : Number(pageSize) || 20,
    page: parseInt(params.get("page") || "1", 10) || 1,
    activeHeroId: params.get("id") || null,
    conditions: params.getAll("f").map((raw) => {
      const [field, operator, ...rest] = raw.split("|");
      return {
        field: FIELD_TYPE[field] ? field : "name",
        operator: operator || "include",
        value: rest.join("|"),
      };
    }),
  };
}

function applyUrlState(urlState) {
  state.searchQuery = urlState.searchQuery;
  state.searchField = urlState.searchField;
  state.searchOperator = urlState.searchOperator;
  state.sortKey = urlState.sortKey;
  state.sortDirection = urlState.sortDirection;
  state.pageSize = urlState.pageSize;

  clearConditions();
  (urlState.conditions || []).forEach((condition) => addCondition(condition));

  syncControlsFromState();
}

/* ------------------------------------------------------------------ */
/* Profile modal                                                       */
/* ------------------------------------------------------------------ */

function formatFieldValue(value) {
  if (value === null || value === undefined) return "N/A";
  if (Array.isArray(value)) {
    const parts = value.filter((item) => {
      if (item === null || item === undefined) return false;
      const text = String(item).trim();
      return text !== "" && text !== "-" && text.toLowerCase() !== "null";
    });
    return parts.length ? parts.join(" / ") : "N/A";
  }
  const text = String(value).trim();
  if (text === "" || text === "-" || text.toLowerCase() === "null") return "N/A";
  return text;
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span class="detail-label">${label}</span>
      <span class="detail-value">${formatFieldValue(value)}</span>
    </div>`;
}

function detailSection(title, items) {
  if (!items.length) return "";
  return `
    <div class="profile-section">
      <h3>${title}</h3>
      <div class="detail-grid">
        ${items.map(([label, value]) => detailItem(label, value)).join("")}
      </div>
    </div>`;
}

function openProfile(hero) {
  const modal = document.getElementById("profile-modal");
  const container = document.getElementById("modal-content");
  if (!modal || !container) return;

  if (hero.id !== undefined && hero.id !== null) {
    state.activeHeroId = String(hero.id);
  }

  const image =
    getNestedValue(hero, "images.lg") ||
    getNestedValue(hero, "images.md") ||
    getNestedValue(hero, "images.xs") ||
    "";

  const stats = getNestedValue(hero, "powerstats") || {};
  const statsRows = Object.keys(stats).length
    ? Object.entries(stats)
        .map(([name, raw]) => {
          const value = toNumber(raw);
          const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
          return `
            <div class="stat-row">
              <span class="stat-name">${name}</span>
              <span class="stat-track">
                <span class="stat-fill level-${statLevel(value)}" style="width:${pct}%"></span>
              </span>
              <span class="stat-num">${value === null ? "N/A" : value}</span>
            </div>`;
        })
        .join("")
    : '<p class="muted">No powerstats available.</p>';

  const biography = detailSection("Biography", [
    ["Full Name", getNestedValue(hero, "biography.fullName")],
    ["Alter Egos", getNestedValue(hero, "biography.alterEgos")],
    ["Aliases", getNestedValue(hero, "biography.aliases")],
    ["Place of Birth", getNestedValue(hero, "biography.placeOfBirth")],
    ["First Appearance", getNestedValue(hero, "biography.firstAppearance")],
    ["Publisher", getNestedValue(hero, "biography.publisher")],
    ["Alignment", getNestedValue(hero, "biography.alignment")],
  ]);

  const appearance = detailSection("Appearance", [
    ["Gender", getNestedValue(hero, "appearance.gender")],
    ["Race", getNestedValue(hero, "appearance.race")],
    ["Height", getNestedValue(hero, "appearance.height")],
    ["Weight", getNestedValue(hero, "appearance.weight")],
    ["Eye Color", getNestedValue(hero, "appearance.eyeColor")],
    ["Hair Color", getNestedValue(hero, "appearance.hairColor")],
  ]);

  const work = detailSection("Work", [
    ["Occupation", getNestedValue(hero, "work.occupation")],
    ["Base", getNestedValue(hero, "work.base")],
  ]);

  const connections = detailSection("Connections", [
    ["Group Affiliation", getNestedValue(hero, "connections.groupAffiliation")],
    ["Relatives", getNestedValue(hero, "connections.relatives")],
  ]);

  const publisher = formatFieldValue(getNestedValue(hero, "biography.publisher"));
  const alignment = formatFieldValue(getNestedValue(hero, "biography.alignment"));

  container.innerHTML = `
    <div class="profile-banner">
      <img src="${image}" alt="${hero.name || "hero"}" class="profile-avatar" />
      <div>
        <h2>${hero.name || "Unknown"}</h2>
        <p class="profile-id">Target #${hero.id ?? "?"} &middot; Record ${hero.slug || "n/a"}</p>
        <div class="profile-meta">
          <span class="pill neutral">${publisher}</span>
          <span class="pill ${alignmentClass(hero)}">${alignment}</span>
        </div>
      </div>
    </div>
    <div class="profile-body">
      ${biography}
      ${appearance}
      <div class="profile-section">
        <h3>Powerstats</h3>
        <div class="stats-list">${statsRows}</div>
      </div>
      ${work}
      ${connections}
      <details class="raw-record">
        <summary>Raw database record (JSON)</summary>
        <pre class="raw-json"></pre>
      </details>
    </div>
  `;

  const rawJson = container.querySelector(".raw-json");
  if (rawJson) rawJson.textContent = JSON.stringify(hero, null, 2);

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  syncURL();
}

function closeProfile() {
  const modal = document.getElementById("profile-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
  state.activeHeroId = null;
  syncURL();
}

function openProfileById(id) {
  const hero = state.heroes.find((item) => String(item.id) === String(id));
  if (hero) openProfile(hero);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

async function loadHeroes() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid dataset format");
  return data;
}

function showError(error) {
  toggleLoading(false);
  const empty = document.getElementById("table-empty");
  if (empty) {
    empty.textContent = "";
    const title = document.createElement("p");
    title.className = "empty-title";
    title.textContent = "Failed to load targets";
    const sub = document.createElement("p");
    sub.className = "empty-sub";
    sub.textContent = error.message;
    empty.append(title, sub);
  }
  const info = document.getElementById("results-info");
  if (info) info.textContent = "Could not load the hero dataset.";
  toggleEmpty(true);
}

function bindEvents() {
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.tabIndex = 0;
    th.setAttribute("role", "button");
    th.addEventListener("click", handleHeaderClick);
    th.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        th.click();
      }
    });
  });

  const search = document.getElementById("global-search");
  if (search) search.addEventListener("input", handleSearchInput);

  const field = document.getElementById("search-field");
  if (field) field.addEventListener("change", handleFieldChange);

  const operator = document.getElementById("search-operator");
  if (operator) operator.addEventListener("change", handleOperatorChange);

  const pageSize = document.getElementById("page-size");
  if (pageSize) pageSize.addEventListener("change", handlePageSizeChange);

  const reset = document.getElementById("reset-filters");
  if (reset) reset.addEventListener("click", resetFilters);

  const addConditionBtn = document.getElementById("add-condition");
  if (addConditionBtn) {
    addConditionBtn.addEventListener("click", () => {
      addCondition();
      recompute(true);
    });
  }

  const toggleAdvancedBtn = document.getElementById("toggle-advanced");
  if (toggleAdvancedBtn) {
    toggleAdvancedBtn.addEventListener("click", toggleAdvanced);
  }

  const close = document.getElementById("modal-close");
  if (close) close.addEventListener("click", closeProfile);

  const modal = document.getElementById("profile-modal");
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeProfile();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfile();
  });
}

async function init() {
  const urlState = readURL();
  renderOperatorLegend();
  applyUrlState(urlState);
  bindEvents();
  updateHeaderUI();
  if (state.conditions.length) openAdvanced();
  updateFilterCount();
  toggleLoading(true);
  toggleEmpty(false);

  try {
    const heroes = await loadHeroes();
    state.heroes = heroes;
    state.currentPage = urlState.page;
    recompute(false);
    toggleLoading(false);
    if (urlState.activeHeroId) openProfileById(urlState.activeHeroId);
  } catch (error) {
    console.error(error);
    showError(error);
  }
}

window.renderTable = renderTable;
window.filterHeroesDefault = handleSearchInput;
window.setHeroes = setHeroes;
window.goToPage = goToPage;
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.resetFilters = resetFilters;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
