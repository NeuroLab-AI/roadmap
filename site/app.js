(function () {
  "use strict";

  var dataUrl = "./data/public-roadmap.json";
  var previewDataUrl = "./data/app-previews.json";
  var showcaseStage = document.getElementById("product-showcase-stage");
  var showcaseCounter = document.getElementById("showcase-counter");
  var showcaseTitle = document.getElementById("showcase-title");
  var showcaseCaption = document.getElementById("showcase-caption");
  var showcaseDots = document.getElementById("showcase-dots");
  var showcaseStatus = document.getElementById("showcase-status");
  var showcaseError = document.getElementById("showcase-error");
  var showcaseExpand = document.getElementById("showcase-expand");
  var showcasePrevious = document.getElementById("showcase-prev");
  var showcaseNext = document.getElementById("showcase-next");
  var previewDialog = document.getElementById("preview-dialog");
  var previewDialogMedia = document.getElementById("preview-dialog-media");
  var previewDialogTitle = document.getElementById("preview-dialog-title");
  var previewDialogCaption = document.getElementById("preview-dialog-caption");
  var previewDialogCounter = document.getElementById("preview-dialog-counter");
  var previewDialogClose = document.getElementById("preview-dialog-close");
  var previewDialogPrevious = document.getElementById("preview-dialog-prev");
  var previewDialogNext = document.getElementById("preview-dialog-next");
  var timeline = document.getElementById("timeline");
  var roadmapTable = document.getElementById("roadmap-table");
  var roadmapTableBody = document.getElementById("roadmap-table-body");
  var legend = document.getElementById("category-legend");
  var stickyLegend = document.getElementById("sticky-category-legend");
  var roadmapControls = document.getElementById("roadmap-controls");
  var eraNavigator = document.getElementById("era-navigator");
  var eraList = document.getElementById("era-list");
  var compactEraIndicator = document.getElementById("compact-era-indicator");
  var filterStatus = document.getElementById("filter-status");
  var initiativeSearch = document.getElementById("initiative-search");
  var resultCount = document.getElementById("result-count");
  var resetFilters = document.getElementById("reset-filters");
  var roadmapEmpty = document.getElementById("roadmap-empty");
  var roadmapViewLabel = document.getElementById("roadmap-view-label");
  var viewOptions = Array.prototype.slice.call(document.querySelectorAll("[data-view]"));
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
  var searchQuery = "";
  var currentView = "timeline";
  var totalInitiatives = 0;
  var visibleInitiatives = 0;
  var productPreviews = [];
  var activePreviewIndex = 0;
  var previewLastTrigger = null;
  var previewPointerStart = null;

  var detailLabels = {
    currentFoundation: "Current technical substrate",
    primaryUserValue: "Primary user value",
    dependencies: "Dependencies",
    validationGate: "Validation gate",
    claimBoundary: "Claim boundary"
  };

  function byOrder(a, b) { return a.order - b.order; }
  function bySequence(a, b) { return a.sequence - b.sequence; }

  function normalized(value) {
    return String(value || "").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  }

  function appendCalendarLabel(container, value) {
    var parts = String(value).trim().split(/\s+/);
    container.appendChild(element("span", "calendar-quarter", parts.shift() || ""));
    if (parts.length) container.appendChild(element("span", "calendar-year", parts.join(" ")));
  }

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

  function validatePreviewData(data) {
    if (!data || data.schemaVersion !== "1.0.0" || !Array.isArray(data.previews)) {
      throw new Error("Unsupported preview data");
    }
    if (!data.previews.length || data.previews.length > 5) throw new Error("Invalid preview count");
    var ids = new Set();
    data.previews.forEach(function (preview) {
      if (!preview || typeof preview.id !== "string" || !preview.id.trim()) throw new Error("Invalid preview id");
      if (ids.has(preview.id)) throw new Error("Duplicate preview id");
      ids.add(preview.id);
      if (typeof preview.title !== "string" || !preview.title.trim()) throw new Error("Invalid preview title");
      if (typeof preview.previewCaption !== "string" || !preview.previewCaption.trim()) throw new Error("Invalid preview caption summary");
      if (typeof preview.caption !== "string" || !preview.caption.trim()) throw new Error("Invalid preview caption");
      if (preview.image !== null && (typeof preview.image !== "string" || !preview.image.trim())) {
        throw new Error("Invalid preview image");
      }
      if (preview.image && (typeof preview.alt !== "string" || !preview.alt.trim())) throw new Error("Missing preview alt text");
    });
  }

  function previewIndex(index) {
    return String(index + 1).padStart(2, "0");
  }

  function previewPositionLabel(index) {
    return "Preview " + (index + 1) + " of " + productPreviews.length;
  }

  function renderPreviewTitle(container, title) {
    var match = String(title).match(/^\/\/\s*(.*)$/);
    if (!match) {
      container.textContent = title;
      return;
    }
    container.replaceChildren(element("span", "comment-mark", "//"), document.createTextNode(" " + match[1]));
  }

  function previewArtwork(preview, index, expanded) {
    var frame = element("div", "preview-media-frame" + (expanded ? " is-expanded" : ""));
    if (preview.image) {
      var image = document.createElement("img");
      image.src = preview.image;
      image.alt = preview.alt;
      image.loading = index === activePreviewIndex ? "eager" : "lazy";
      image.decoding = "async";
      frame.appendChild(image);
      return frame;
    }

    var artwork = element("div", "preview-placeholder");
    artwork.dataset.variant = String((index % 3) + 1);
    var motif = element("span", "preview-placeholder-motif");
    motif.appendChild(element("span", "preview-placeholder-core"));
    motif.appendChild(element("span", "preview-placeholder-orbit preview-placeholder-orbit-one"));
    motif.appendChild(element("span", "preview-placeholder-orbit preview-placeholder-orbit-two"));
    motif.appendChild(element("span", "preview-placeholder-node preview-placeholder-node-one"));
    motif.appendChild(element("span", "preview-placeholder-node preview-placeholder-node-two"));
    motif.appendChild(element("span", "preview-placeholder-node preview-placeholder-node-three"));
    artwork.appendChild(motif);
    var label = element("span", "preview-placeholder-label");
    label.appendChild(element("span", "comment-mark", "//"));
    label.appendChild(document.createTextNode(" Screenshot Asset Pending"));
    artwork.appendChild(label);
    artwork.appendChild(element("span", "preview-placeholder-title", preview.title));
    frame.appendChild(artwork);
    return frame;
  }

  function relativePreviewPosition(index) {
    var delta = index - activePreviewIndex;
    var count = productPreviews.length;
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    if (delta === 0) return "active";
    if (delta === -1) return "previous";
    if (delta === 1) return "next";
    return delta < 0 ? "far-previous" : "far-next";
  }

  function updatePreviewDialog() {
    if (!productPreviews.length) return;
    var preview = productPreviews[activePreviewIndex];
    previewDialogMedia.replaceChildren(previewArtwork(preview, activePreviewIndex, true));
    renderPreviewTitle(previewDialogTitle, preview.title);
    previewDialogCaption.textContent = preview.caption;
    previewDialogCounter.textContent = previewIndex(activePreviewIndex);
    previewDialogCounter.setAttribute("aria-label", previewPositionLabel(activePreviewIndex));
  }

  function openPreviewDialog(trigger) {
    if (!productPreviews.length) return;
    previewLastTrigger = trigger || document.activeElement;
    updatePreviewDialog();
    document.body.classList.add("modal-open");
    previewDialog.showModal();
    previewDialogClose.focus();
  }

  function renderProductShowcase(announce) {
    if (!productPreviews.length) return;
    var activePreview = productPreviews[activePreviewIndex];
    showcaseStage.replaceChildren();
    showcaseDots.replaceChildren();

    productPreviews.forEach(function (preview, index) {
      var position = relativePreviewPosition(index);
      var card = element("button", "preview-card");
      card.type = "button";
      card.dataset.position = position;
      card.dataset.previewId = preview.id;
      card.setAttribute("aria-label", (position === "active" ? "Expand " : "Show ") + preview.title);
      card.setAttribute("aria-current", position === "active" ? "true" : "false");
      if (position.indexOf("far-") === 0) {
        card.tabIndex = -1;
        card.setAttribute("aria-hidden", "true");
      }
      card.appendChild(previewArtwork(preview, index, false));
      card.addEventListener("click", function () {
        if (index === activePreviewIndex) openPreviewDialog(card);
        else setActivePreview(index, true);
      });
      showcaseStage.appendChild(card);

      var dot = element("button", "showcase-dot");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show " + preview.title);
      dot.setAttribute("aria-pressed", index === activePreviewIndex ? "true" : "false");
      dot.addEventListener("click", function () { setActivePreview(index, true); });
      showcaseDots.appendChild(dot);
    });

    showcaseCounter.textContent = previewIndex(activePreviewIndex);
    showcaseCounter.setAttribute("aria-label", previewPositionLabel(activePreviewIndex));
    renderPreviewTitle(showcaseTitle, activePreview.title);
    showcaseCaption.textContent = activePreview.previewCaption;
    showcaseExpand.setAttribute("aria-label", "Expand " + activePreview.title);
    if (previewDialog.open) updatePreviewDialog();
    if (announce) showcaseStatus.textContent = activePreview.title + ", preview " + (activePreviewIndex + 1) + " of " + productPreviews.length + ".";
  }

  function setActivePreview(index, announce) {
    if (!productPreviews.length) return;
    activePreviewIndex = (index + productPreviews.length) % productPreviews.length;
    renderProductShowcase(announce);
  }

  function stepPreview(direction, announce) {
    setActivePreview(activePreviewIndex + direction, announce);
  }

  function expandIcon(extraClass) {
    var icon = element("span", "expand-icon" + (extraClass ? " " + extraClass : ""));
    icon.setAttribute("aria-hidden", "true");
    icon.appendChild(element("span", "expand-icon-inner"));
    return icon;
  }

  function buildSearchText(initiative, category, stage) {
    return normalized([
      initiative.title,
      initiative.id,
      initiative.outcome,
      initiative.maturity,
      initiative.confidence,
      category.title,
      category.abbreviation,
      stage.title,
      stage.description
    ].concat(Object.keys(initiative.details || {}).map(function (key) {
      return initiative.details[key];
    })).join(" "));
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
    applyFilters();
  }

  function applyFilters() {
    var categoryFiltering = activeCategoryFilters.size > 0;
    var keywordFiltering = searchQuery.length > 0;
    var visibleTotal = 0;
    timeline.querySelectorAll(".initiative-item").forEach(function (item) {
      var categoryMatch = !categoryFiltering || activeCategoryFilters.has(item.dataset.categoryId);
      var keywordMatch = !keywordFiltering || item.dataset.searchText.indexOf(searchQuery) !== -1;
      var visible = categoryMatch && keywordMatch;
      item.hidden = !visible;
      if (visible) visibleTotal += 1;
    });

    roadmapTableBody.querySelectorAll(".roadmap-table-row").forEach(function (row) {
      var categoryMatch = !categoryFiltering || activeCategoryFilters.has(row.dataset.categoryId);
      var keywordMatch = !keywordFiltering || row.dataset.searchText.indexOf(searchQuery) !== -1;
      row.hidden = !(categoryMatch && keywordMatch);
    });

    timeline.querySelectorAll(".stage").forEach(function (section) {
      var visibleCount = section.querySelectorAll(".initiative-item:not([hidden])").length;
      section.hidden = visibleCount === 0;
      var eraLink = eraList.querySelector('[data-stage="' + section.dataset.stageId + '"]');
      if (eraLink) eraLink.closest("li").hidden = visibleCount === 0;
    });

    document.querySelectorAll("[data-filter-category]").forEach(function (button) {
      button.setAttribute("aria-pressed", activeCategoryFilters.has(button.dataset.filterCategory) ? "true" : "false");
    });

    resultCount.textContent = visibleTotal + (visibleTotal === 1 ? " initiative" : " initiatives");
    visibleInitiatives = visibleTotal;
    roadmapEmpty.hidden = visibleTotal !== 0;
    resetFilters.hidden = !categoryFiltering && !keywordFiltering;
    eraNavigator.hidden = currentView === "table" || visibleTotal === 0;
    compactEraIndicator.hidden = currentView === "table" || visibleTotal === 0;

    if (categoryFiltering || keywordFiltering) {
      var labels = Array.from(activeCategoryFilters).map(function (id) { return categoryLabels.get(id); });
      var statusParts = [];
      if (keywordFiltering) statusParts.push('matching "' + initiativeSearch.value.trim() + '"');
      if (categoryFiltering) statusParts.push("in " + labels.join(", "));
      filterStatus.textContent = "Showing " + visibleTotal + " of " + totalInitiatives + " initiatives " + statusParts.join(" ") + ".";
    } else {
      filterStatus.textContent = "Showing all " + visibleTotal + " roadmap initiatives.";
    }

    eraSections = Array.prototype.slice.call(timeline.querySelectorAll(".stage:not([hidden])"));
    scheduleEraState();
  }

  function setView(view) {
    currentView = view === "table" ? "table" : "timeline";
    timeline.dataset.view = currentView;
    document.body.dataset.roadmapView = currentView;
    timeline.hidden = currentView === "table";
    roadmapTable.hidden = currentView !== "table";
    roadmapViewLabel.textContent = currentView === "table"
      ? "Roadmap Table: Q3 2026 – Q3 2027"
      : "Timeline Targets: Q3 2026 – Q3 2027";
    viewOptions.forEach(function (button) {
      button.setAttribute("aria-pressed", button.dataset.view === currentView ? "true" : "false");
    });
    eraNavigator.hidden = currentView === "table" || visibleInitiatives === 0;
    compactEraIndicator.hidden = currentView === "table" || visibleInitiatives === 0;
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
      var eraTitle = element("span", "era-title");
      appendCalendarLabel(eraTitle, stage.title);
      copy.appendChild(eraTitle);
      link.appendChild(copy);
      item.appendChild(link);
      eraList.appendChild(item);
    });
    eraNavigator.hidden = false;
    compactEraIndicator.hidden = false;
  }

  function updateEraState() {
    eraFrame = null;
    if (!eraSections.length || currentView === "table") return;
    var dockRect = roadmapControls.getBoundingClientRect();
    var dockBottom = dockRect.top <= 0 && dockRect.bottom > 0 ? dockRect.bottom : 0;
    var probe = dockBottom + ((window.innerHeight - dockBottom) * 0.46);
    var activeIndex = 0;
    eraSections.forEach(function (section, index) {
      if (section.getBoundingClientRect().top <= probe) activeIndex = index;
    });

    var activeSection = eraSections[activeIndex];
    var activeRect = activeSection.getBoundingClientRect();
    var progress = Math.max(0, Math.min(1, (probe - activeRect.top) / Math.max(activeRect.height, 1)));
    var activeStageId = activeSection.dataset.stageId;
    eraList.querySelectorAll(".era-link").forEach(function (link) {
      var active = link.dataset.stage === activeStageId;
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
    var activeStage = orderedEras.find(function (stage) { return stage.id === activeStageId; });
    var compactTitle = element("span", "compact-era-title");
    appendCalendarLabel(compactTitle, activeStage.title);
    compactEraIndicator.appendChild(compactTitle);
    compactEraIndicator.appendChild(element("span", "compact-era-position", (orderedEras.indexOf(activeStage) + 1) + " of " + orderedEras.length));
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
      initiative.confidence ? initiative.confidence + " confidence" : null
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
      section.dataset.stageId = stage.id;
      section.dataset.headerSide = stageIndex % 2 === 0 ? "right" : "left";
      section.setAttribute("aria-labelledby", "stage-" + stage.id);
      section.appendChild(element("span", "stage-marker"));

      var header = element("div", "stage-header");
      var headingCopy = element("div");
      var heading = element("h3");
      heading.id = "stage-" + stage.id;
      appendCalendarLabel(heading, stage.title);
      headingCopy.appendChild(heading);
      headingCopy.appendChild(element("p", "", stage.description));
      header.appendChild(headingCopy);
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
        item.dataset.searchText = buildSearchText(initiative, category, stage);

        var button = element("button", "initiative-card");
        button.type = "button";
        button.setAttribute("aria-label", "View details for " + initiative.title);
        button.appendChild(element("span", "initiative-title", initiative.title));
        var meta = element("span", "initiative-meta");
        meta.appendChild(element("span", "initiative-category", category.abbreviation));
        meta.appendChild(element("span", "", "·"));
        meta.appendChild(element("span", "initiative-id", initiative.id));
        button.appendChild(meta);
        button.appendChild(expandIcon());
        button.addEventListener("click", function () { openDialog(initiative, category, stage, button); });
        item.appendChild(button);
        list.appendChild(item);
      });
      section.appendChild(list);
      timeline.appendChild(section);
    });
  }

  function renderTable(data) {
    var categories = new Map(data.categories.map(function (category) { return [category.id, category]; }));
    var stages = new Map(data.stages.map(function (stage) { return [stage.id, stage]; }));

    data.initiatives.slice().sort(bySequence).forEach(function (initiative) {
      var category = categories.get(initiative.categoryId);
      var stage = stages.get(initiative.stage);
      if (!category || !stage) throw new Error("Unknown roadmap table reference");

      var row = element("tr", "roadmap-table-row");
      row.tabIndex = 0;
      row.dataset.token = category.visualToken;
      row.dataset.categoryId = initiative.categoryId;
      row.dataset.searchText = buildSearchText(initiative, category, stage);
      row.setAttribute("aria-label", "View details for " + initiative.title);
      row.setAttribute("aria-haspopup", "dialog");
      row.setAttribute("aria-controls", "initiative-dialog");

      var delivery = element("td", "table-delivery-target");
      appendCalendarLabel(delivery, stage.title);
      row.appendChild(delivery);
      row.appendChild(element("td", "table-initiative-id", initiative.id));

      var titleCell = element("td", "table-initiative-title");
      var titleWrap = element("span", "table-title-wrap");
      titleWrap.appendChild(element("span", "", initiative.title));
      titleWrap.appendChild(expandIcon("table-expand-icon"));
      titleCell.appendChild(titleWrap);
      row.appendChild(titleCell);
      row.appendChild(element("td", "table-initiative-description", initiative.outcome));

      function activateRow() { openDialog(initiative, category, stage, row); }
      row.addEventListener("click", activateRow);
      row.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateRow();
        }
      });

      roadmapTableBody.appendChild(row);
    });
  }

  function closeDialog() { if (dialog.open) dialog.close(); }
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
    if (lastTrigger) lastTrigger.focus();
  });

  function closePreviewDialog() {
    if (previewDialog.open) previewDialog.close();
  }

  showcasePrevious.addEventListener("click", function () { stepPreview(-1, true); });
  showcaseNext.addEventListener("click", function () { stepPreview(1, true); });
  showcaseExpand.addEventListener("click", function () { openPreviewDialog(showcaseExpand); });

  showcaseStage.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepPreview(-1, true);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepPreview(1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActivePreview(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      setActivePreview(productPreviews.length - 1, true);
    }
  });

  showcaseStage.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "mouse") return;
    previewPointerStart = event.clientX;
  });

  function resetShowcaseParallax() {
    showcaseStage.style.setProperty("--tilt-x", "0deg");
    showcaseStage.style.setProperty("--tilt-y", "0deg");
    showcaseStage.style.setProperty("--glare-x", "50%");
    showcaseStage.style.setProperty("--glare-y", "34%");
  }

  showcaseStage.addEventListener("pointermove", function (event) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var bounds = showcaseStage.getBoundingClientRect();
    var horizontal = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    var vertical = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    showcaseStage.style.setProperty("--tilt-x", ((0.5 - vertical) * 5).toFixed(2) + "deg");
    showcaseStage.style.setProperty("--tilt-y", ((horizontal - 0.5) * 5).toFixed(2) + "deg");
    showcaseStage.style.setProperty("--glare-x", (22 + horizontal * 56).toFixed(1) + "%");
    showcaseStage.style.setProperty("--glare-y", (18 + vertical * 48).toFixed(1) + "%");
  });

  showcaseStage.addEventListener("pointerleave", resetShowcaseParallax);

  showcaseStage.addEventListener("pointerup", function (event) {
    if (previewPointerStart === null || event.pointerType === "mouse") return;
    var delta = event.clientX - previewPointerStart;
    previewPointerStart = null;
    if (Math.abs(delta) < 42) return;
    stepPreview(delta > 0 ? -1 : 1, true);
  });

  showcaseStage.addEventListener("pointercancel", function () { previewPointerStart = null; });
  previewDialogClose.addEventListener("click", closePreviewDialog);
  previewDialogPrevious.addEventListener("click", function () { stepPreview(-1, true); });
  previewDialogNext.addEventListener("click", function () { stepPreview(1, true); });
  previewDialog.addEventListener("click", function (event) {
    if (event.target === previewDialog) closePreviewDialog();
  });
  previewDialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepPreview(-1, true);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepPreview(1, true);
    }
  });
  previewDialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
    if (previewLastTrigger) previewLastTrigger.focus();
  });

  viewOptions.forEach(function (button) {
    button.addEventListener("click", function () { setView(button.dataset.view); });
  });

  initiativeSearch.addEventListener("input", function () {
    searchQuery = normalized(initiativeSearch.value);
    applyFilters();
  });

  initiativeSearch.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && initiativeSearch.value) {
      initiativeSearch.value = "";
      searchQuery = "";
      applyFilters();
    }
  });

  resetFilters.addEventListener("click", function () {
    activeCategoryFilters.clear();
    initiativeSearch.value = "";
    searchQuery = "";
    applyFilters();
    initiativeSearch.focus();
  });

  fetch(previewDataUrl, { cache: "no-store" })
    .then(function (response) { if (!response.ok) throw new Error("Preview request failed"); return response.json(); })
    .then(function (data) {
      validatePreviewData(data);
      productPreviews = data.previews;
      renderProductShowcase(false);
    })
    .catch(function () {
      showcaseError.hidden = false;
      showcaseStage.setAttribute("aria-disabled", "true");
      showcaseExpand.disabled = true;
      showcasePrevious.disabled = true;
      showcaseNext.disabled = true;
    });

  fetch(dataUrl, { cache: "no-store" })
    .then(function (response) { if (!response.ok) throw new Error("Roadmap request failed"); return response.json(); })
    .then(function (data) {
      validateData(data);
      document.getElementById("publication-version").textContent = "Version " + data.publication.version.replace(/\.0$/, "");
      document.getElementById("initiative-count").textContent = String(data.initiatives.length);
      document.getElementById("category-count").textContent = String(data.categories.length);
      document.getElementById("target-window-count").textContent = String(data.stages.length);
      totalInitiatives = data.initiatives.length;
      renderLegend(data.categories);
      renderEraNavigation(data.stages);
      renderTimeline(data);
      renderTable(data);
      loading.hidden = true;
      timeline.hidden = false;
      initializeEraTracking();
      setView(currentView);
      applyFilters();
    })
    .catch(function () {
      loading.hidden = true;
      errorState.hidden = false;
    });
})();
