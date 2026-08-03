(function () {
  "use strict";

  var dataUrl = "./data/public-roadmap.json";
  var timeline = document.getElementById("timeline");
  var legend = document.getElementById("category-legend");
  var stickyLegend = document.getElementById("sticky-category-legend");
  var loading = document.getElementById("loading-state");
  var errorState = document.getElementById("error-state");
  var dialog = document.getElementById("initiative-dialog");
  var closeButton = document.getElementById("dialog-close");
  var lastTrigger = null;

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
      var item = element("div", "legend-item");
      item.dataset.token = category.visualToken;
      item.appendChild(element("span", "legend-dot"));
      item.appendChild(element("span", "", category.title));
      legend.appendChild(item);

      var compactItem = element("span", "sticky-legend-item");
      compactItem.dataset.token = category.visualToken;
      compactItem.appendChild(element("span", "legend-dot"));
      compactItem.appendChild(element("span", "", category.abbreviation));
      compactItem.title = category.title;
      stickyLegend.appendChild(compactItem);
    });
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
    stages.forEach(function (stage) {
      var initiatives = data.initiatives.filter(function (item) { return item.stage === stage.id; }).sort(bySequence);
      if (!initiatives.length) return;

      var section = element("section", "stage");
      section.setAttribute("aria-labelledby", "stage-" + stage.id);
      section.appendChild(element("span", "stage-marker"));

      var header = element("div", "stage-header");
      var headingCopy = element("div");
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
      renderTimeline(data);
      loading.hidden = true;
      timeline.hidden = false;
    })
    .catch(function () {
      loading.hidden = true;
      errorState.hidden = false;
    });
})();
