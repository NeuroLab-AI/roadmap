(function () {
  "use strict";

  var dataUrl = "./data/public-roadmap.json";
  var timeline = document.getElementById("timeline");
  var legend = document.getElementById("category-legend");
  var stickyLegend = document.getElementById("sticky-category-legend");
  var eraNavigator = document.getElementById("era-navigator");
  var eraList = document.getElementById("era-list");
  var compactEraIndicator = document.getElementById("compact-era-indicator");
  var filterStatus = document.getElementById("filter-status");
  var loading = document.getElementById("loading-state");
  var errorState = document.getElementById("error-state");
  var dialog = document.getElementById("initiative-dialog");
  var closeButton = document.getElementById("dialog-close");
  var lastTrigger = null;
  var orderedEras = [];
  var eraSections = [];
  var eraFrame = null;
  var activeCategoryFilters = new Set();
  var categoryLabels = new Map();

  var detailLabels = {
    currentFoundation: "Current foundation",
    primaryUserValue: "Primary user value",
    dependencies: "Dependencies",
    validationGate: "Validation gate",
    claimBoundary: "Claim boundary"
  };

  function byOrder(a, b) { return a.order - b.order; }
  function bySequence(a, b) { return a.sequence - b.sequence; }

  function validateData(data) {
    if (!data || data.schemaVersion !== "2.0.0") throw new Error("Unsupported roadmap data");
    if (!Array.isArray(data.stages) || !Array.isArray(data.categories) || !Array.isArray(data.initiatives)) {
      throw new Error("Incomplete roadmap data");
    }
    var sequences = data.initiatives.map(function (item) { return item.sequence; }).sort(function (a, b) { return a - b; });
    if (sequences.some(function (value, index) { return value !== index + 1; })) throw new Error("Invalid roadmap sequence");
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderLegend(categories) {
    categories.slice().sort(byOrder).forEach(function (category) {
      categoryLabels.set(category.id, category.title);

      var item = element("button", "legend-item");
      item.type = "button";
      item.dataset.token = category.visualToken;
      item.dataset.filterCategory = category.id;
      item.setAttribute("aria-pressed", "false");
      item.setAttribute("aria-label", "Filter by " + category.title);
      item.appendChild(element("span", "legend-dot"));
      item.appendChild(element("span", "", category.title));
      item.addEventListener("click", function () { toggleCategoryFilter(category.id); });
      legend.appendChild(item);

      var compactItem = element("button", "sticky-legend-item");
      compactItem.type = "button";
      compactItem.dataset.token = category.visualToken;
      compactItem.dataset.filterCategory = category.id;
      compactItem.setAttribute("aria-pressed", "false");
      compactItem.setAttribute("aria-label", "Filter by " + category.title);
      compactItem.appendChild(element("span", "legend-dot"));
      compactItem.appendChild(element("span", "", category.abbreviation));
      compactItem.title = category.title;
      compactItem.addEventListener("click", function () { toggleCategoryFilter(category.id); });
      stickyLegend.appendChild(compactItem);
    });
  }

  function toggleCategoryFilter(categoryId) {
    if (activeCategoryFilters.has(categoryId)) activeCategoryFilters.delete(categoryId);
    else activeCategoryFilters.add(categoryId);
    applyCategoryFilters();
  }

  function applyCategoryFilters() {
    var filtering = activeCategoryFilters.size > 0;
    var visibleTotal = 0;
    timeline.querySelectorAll(".initiative-item").forEach(function (item) {
      var visible = !filtering || activeCategoryFilters.has(item.dataset.categoryId);
      item.hidden = !visible;
      if (visible) visibleTotal += 1;
    });

    timeline.querySelectorAll(".stage").forEach(function (section) {
      var visibleCount = section.querySelectorAll(".initiative-item:not([hidden])").length;
      var count = section.querySelector(".stage-count");
      count.textContent = visibleCount + (visibleCount === 1 ? " initiative" : " initiatives");
      section.classList.toggle("is-filter-empty", visibleCount === 0);
      section.querySelector(".stage-empty").hidden = visibleCount !== 0;
    });

    document.querySelectorAll("[data-filter-category]").forEach(function (button) {
      button.setAttribute("aria-pressed", activeCategoryFilters.has(button.dataset.filterCategory) ? "true" : "false");
    });

    if (filtering) {
      var labels = Array.from(activeCategoryFilters).map(function (id) { return categoryLabels.get(id); });
      filterStatus.textContent = "Showing " + visibleTotal + " initiatives in " + labels.join(", ") + ".";
    } else {
      filterStatus.textContent = "Showing all " + visibleTotal + " roadmap initiatives.";
    }
    scheduleEraState();
  }

  function renderEraNavigation(stages) {
    orderedEras = stages.slice().sort(byOrder);
    orderedEras.forEach(function (stage, index) {
      var item = element("li", "era-item");
      var link = element("a", "era-link");
      link.href = "#era-" + stage.id;
      link.dataset.stage = stage.id;
      link.setAttribute("aria-label", "Go to " + stage.title);

      var segment = element("span", "era-segment");
      segment.setAttribute("aria-hidden", "true");
      segment.appendChild(element("span", "era-progress-marker"));
      link.appendChild(segment);

      var copy = element("span", "era-link-copy");
      copy.appendChild(element("span", "era-position", (index + 1) + " of " + orderedEras.length));
      copy.appendChild(element("span", "era-title", stage.title));
      link.appendChild(copy);
      item.appendChild(link);
      eraList.appendChild(item);
    });
    eraNavigator.hidden = false;
    compactEraIndicator.hidden = false;
  }

  function updateEraState() {
    eraFrame = null;
    if (!eraSections.length) return;
    var probe = window.innerHeight * 0.42;
    var activeIndex = 0;
    eraSections.forEach(function (section, index) {
      if (section.getBoundingClientRect().top <= probe) activeIndex = index;
    });

    var activeSection = eraSections[activeIndex];
    var activeRect = activeSection.getBoundingClientRect();
    var progress = Math.max(0, Math.min(1, (probe - activeRect.top) / Math.max(activeRect.height, 1)));
    eraList.querySelectorAll(".era-link").forEach(function (link, index) {
      var active = index === activeIndex;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "step");
        link.style.setProperty("--era-progress", (progress * 100).toFixed(2) + "%");
      } else {
        link.removeAttribute("aria-current");
        link.style.removeProperty("--era-progress");
      }
    });

    compactEraIndicator.replaceChildren();
    compactEraIndicator.appendChild(element("span", "comment-mark", "//"));
    compactEraIndicator.appendChild(element("span", "", orderedEras[activeIndex].title));
    compactEraIndicator.appendChild(element("span", "compact-era-position", (activeIndex + 1) + " of " + orderedEras.length));
  }

  function scheduleEraState() {
    if (eraFrame !== null) return;
    eraFrame = window.requestAnimationFrame(updateEraState);
  }

  function initializeEraTracking() {
    eraSections = Array.prototype.slice.call(timeline.querySelectorAll(".stage"));
    updateEraState();
    window.addEventListener("scroll", scheduleEraState, { passive: true });
    window.addEventListener("resize", scheduleEraState);
  }

  function openDialog(initiative, category, stage, trigger) {
    lastTrigger = trigger;
    dialog.dataset.token = category.visualToken;
    document.getElementById("dialog-category").textContent = category.title;
    document.getElementById("dialog-id").textContent = initiative.id;
    document.getElementById("dialog-title").textContent = initiative.title;
    document.getElementById("dialog-outcome").textContent = initiative.outcome;

    var signals = document.getElementById("dialog-signals");
    signals.replaceChildren();
    [
      stage.title,
      initiative.maturity,
      initiative.confidence ? initiative.confidence + " confidence" : null,
      initiative.horizon
    ].forEach(function (value) {
      if (value) signals.appendChild(element("span", "", value));
    });

    var details = document.getElementById("dialog-details");
    details.replaceChildren();
    Object.keys(detailLabels).forEach(function (key) {
      if (!initiative.details[key]) return;
      var group = element("div");
      group.appendChild(element("dt", "", detailLabels[key]));
      group.appendChild(element("dd", "", initiative.details[key]));
      details.appendChild(group);
    });

    document.body.classList.add("modal-open");
    dialog.showModal();
    closeButton.focus();
  }

  function renderTimeline(data) {
    var categories = new Map(data.categories.map(function (category) { return [category.id, category]; }));
    var stages = data.stages.slice().sort(byOrder);
    stages.forEach(function (stage, stageIndex) {
      var initiatives = data.initiatives.filter(function (item) { return item.stage === stage.id; }).sort(bySequence);
      if (!initiatives.length) return;

      var section = element("section", "stage");
      section.id = "era-" + stage.id;
      section.setAttribute("aria-labelledby", "stage-" + stage.id);
      section.appendChild(element("span", "stage-marker"));

      var header = element("div", "stage-header");
      var headingCopy = element("div");
      headingCopy.appendChild(element("p", "stage-index", "Development era " + (stageIndex + 1) + " of " + stages.length));
      var heading = element("h3", "", stage.title);
      heading.id = "stage-" + stage.id;
      headingCopy.appendChild(heading);
      headingCopy.appendChild(element("p", "", stage.description));
      header.appendChild(headingCopy);
      header.appendChild(element("span", "stage-count", initiatives.length + (initiatives.length === 1 ? " initiative" : " initiatives")));
      section.appendChild(header);

      var list = element("ol", "initiative-list");
      initiatives.forEach(function (initiative) {
        var category = categories.get(initiative.categoryId);
        if (!category) throw new Error("Unknown category reference");
        var item = element("li", "initiative-item");
        item.dataset.token = category.visualToken;
        item.dataset.visibility = initiative.visibility;
        item.dataset.side = initiative.sequence % 2 === 1 ? "left" : "right";
        item.dataset.categoryId = initiative.categoryId;

        var button = element("button", "initiative-card");
        button.type = "button";
        button.setAttribute("aria-label", "View details for " + initiative.title);
        button.appendChild(element("span", "initiative-title", initiative.title));
        var meta = element("span", "initiative-meta");
        meta.appendChild(element("span", "initiative-category", category.abbreviation));
        meta.appendChild(element("span", "", "·"));
        meta.appendChild(element("span", "initiative-id", initiative.id));
        button.appendChild(meta);
        button.addEventListener("click", function () { openDialog(initiative, category, stage, button); });
        item.appendChild(button);
        list.appendChild(item);
      });
      section.appendChild(list);
      var emptyState = element("p", "stage-empty", "No initiatives in the selected categories.");
      emptyState.hidden = true;
      section.appendChild(emptyState);
      timeline.appendChild(section);
    });
  }

  function closeDialog() { if (dialog.open) dialog.close(); }
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  });

  fetch(dataUrl, { cache: "no-store" })
    .then(function (response) { if (!response.ok) throw new Error("Roadmap request failed"); return response.json(); })
    .then(function (data) {
      validateData(data);
      document.getElementById("publication-version").textContent = "Version " + data.publication.version.replace(/\.0$/, "");
      document.getElementById("initiative-count").textContent = String(data.initiatives.length);
      document.getElementById("category-count").textContent = String(data.categories.length);
      document.getElementById("stage-count").textContent = String(data.stages.length);
      renderLegend(data.categories);
      renderEraNavigation(data.stages);
      renderTimeline(data);
      loading.hidden = true;
      timeline.hidden = false;
      applyCategoryFilters();
      initializeEraTracking();
    })
    .catch(function () {
      loading.hidden = true;
      errorState.hidden = false;
    });
})();
