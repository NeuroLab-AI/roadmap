(function () {
  "use strict";

  var slides = [
    { title: "Introducing NeuroLab", alt: "NeuroLab project deck cover introducing decentralized drug discovery powered by graph neural networks and neurosymbolic reasoning." },
    { title: "The Drug Discovery Baseline", alt: "Diagram of the modern drug discovery workflow from identifying a therapeutic indication through screening, assembly, and evaluation." },
    { title: "Unexpected Neuropharmacology", alt: "Examples of unexpected neuropharmacological applications for modafinil, vorinostat, and D-cycloserine." },
    { title: "NeuroLab's Unique Value", alt: "Comparison of NeuroLab's specialized inference, multiscale prediction, visualization, and knowledge graph with adjacent research tools." },
    { title: "Inference Workflow", alt: "NeuroLab inference workflow showing a live evidence-backed report generated from a compound input." },
    { title: "Addressable Outputs", alt: "NeuroLab raw payload workflow with expandable and addressable structured output fields." },
    { title: "Grounded Reporting", alt: "NeuroLab chat report presenting a detailed synopsis grounded in deterministic inference output." },
    { title: "Knowledge Graph", alt: "NeuroLab knowledge graph interface showing local evidence and support bundles." },
    { title: "Brain Explorer", alt: "NeuroLab brain explorer with mechanistic localization controls and a three-dimensional brain visualization." },
    { title: "API for Agents", alt: "NeuroLab API overview for agent-oriented autonomous research workflows." },
    { title: "Tokenomics", alt: "NeuroLab indicative working plan for token allocation and use of funds, showing the allocation split across the BioProtocol ecosystem, launch liquidity, treasury, early supporters and the ignition sale, alongside the proposed deployment of the raise across initial liquidity, direct development, and growth and operations." },
    { title: "Public Beta", alt: "NeuroLab public beta announcement for September 15, 2026 with the public roadmap address." }
  ].map(function (slide, index) {
    slide.src = "./slides/slide-" + String(index + 1).padStart(2, "0") + ".webp";
    return slide;
  });

  var stage = document.getElementById("carousel-stage");
  var counter = document.getElementById("slide-counter");
  var title = document.getElementById("slide-title");
  var previous = document.getElementById("carousel-previous");
  var next = document.getElementById("carousel-next");
  var dots = document.getElementById("carousel-dots");
  var expand = document.getElementById("expand-control");
  var openPresentation = document.getElementById("open-presentation");
  var status = document.getElementById("carousel-status");

  var dialog = document.getElementById("presentation-dialog");
  var dialogCounter = document.getElementById("presentation-counter");
  var dialogTitle = document.getElementById("presentation-title");
  var dialogImage = document.getElementById("presentation-image");
  var dialogProgress = document.getElementById("presentation-progress");
  var dialogPrevious = document.getElementById("presentation-previous");
  var dialogNext = document.getElementById("presentation-next");
  var dialogClose = document.getElementById("presentation-close");
  var dialogStage = document.getElementById("presentation-stage");
  var dialogSlide = dialogStage.querySelector(".presentation-slide");

  var currentIndex = 0;
  var lastFocus = null;
  var carouselPointerStart = null;
  var carouselDidSwipe = false;
  var dialogPointerStart = null;

  function slideNumber(index) {
    return String(index + 1).padStart(2, "0");
  }

  function positionLabel(index) {
    return "Slide " + (index + 1) + " of " + slides.length;
  }

  function relativePosition(index) {
    if (index === currentIndex) return "active";
    if (index === (currentIndex - 1 + slides.length) % slides.length) return "previous";
    if (index === (currentIndex + 1) % slides.length) return "next";
    return "far";
  }

  function buildCarousel() {
    slides.forEach(function (slide, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "deck-card";
      card.dataset.index = String(index);
      card.dataset.position = relativePosition(index);

      var image = document.createElement("img");
      image.src = slide.src;
      image.alt = slide.alt;
      image.draggable = false;
      image.decoding = "async";
      image.loading = index < 3 ? "eager" : "lazy";
      card.appendChild(image);

      card.addEventListener("click", function () {
        if (carouselDidSwipe) {
          carouselDidSwipe = false;
          return;
        }
        var position = card.dataset.position;
        if (position === "active") {
          openDialog(card);
        } else if (position === "previous") {
          showSlide(index, true);
        } else if (position === "next") {
          showSlide(index, true);
        }
      });

      stage.appendChild(card);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", "Show " + positionLabel(index));
      dot.addEventListener("click", function () { showSlide(index, true); });
      dots.appendChild(dot);
    });
  }

  function updateCarousel(announce) {
    var cards = Array.prototype.slice.call(stage.querySelectorAll(".deck-card"));
    var dotButtons = Array.prototype.slice.call(dots.querySelectorAll(".carousel-dot"));
    var activeSlide = slides[currentIndex];

    cards.forEach(function (card, index) {
      var position = relativePosition(index);
      card.dataset.position = position;
      card.tabIndex = position === "active" || position === "previous" || position === "next" ? 0 : -1;
      card.setAttribute("aria-label", position === "active"
        ? "Open " + positionLabel(index) + ", " + slides[index].title + ", in full-screen presentation mode"
        : "Show " + positionLabel(index) + ", " + slides[index].title);
      card.setAttribute("aria-hidden", position === "far" ? "true" : "false");
    });

    dotButtons.forEach(function (dot, index) {
      if (index === currentIndex) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    counter.textContent = slideNumber(currentIndex) + " / " + slides.length;
    title.textContent = activeSlide.title;
    expand.setAttribute("aria-label", "Open " + positionLabel(currentIndex) + " in full-screen presentation mode");

    if (announce) status.textContent = activeSlide.title + ", " + positionLabel(currentIndex) + ".";
    if (dialog.open) updateDialog();
  }

  function showSlide(index, announce) {
    currentIndex = (index + slides.length) % slides.length;
    updateCarousel(announce);
  }

  function step(direction, announce) {
    showSlide(currentIndex + direction, announce);
  }

  function resetDialogViewport() {
    dialogSlide.scrollTop = 0;
    dialogSlide.scrollLeft = 0;
  }

  function stepPresentation(direction) {
    step(direction, true);
    resetDialogViewport();
  }

  function updateDialog() {
    var activeSlide = slides[currentIndex];
    dialogCounter.textContent = slideNumber(currentIndex) + " / " + slides.length;
    dialogTitle.textContent = activeSlide.title;
    dialogImage.src = activeSlide.src;
    dialogImage.alt = activeSlide.alt;
    dialogProgress.style.width = (((currentIndex + 1) / slides.length) * 100).toFixed(2) + "%";
  }

  function openDialog(trigger) {
    lastFocus = trigger || document.activeElement;
    updateDialog();
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialogClose.focus();
  }

  function closeDialog() {
    if (!dialog.open) return;
    dialog.close();
    document.body.style.overflow = "";
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function pointerStart(event) {
    return { x: event.clientX, y: event.clientY, id: event.pointerId };
  }

  function pointerDirection(start, event) {
    if (!start || start.id !== event.pointerId) return 0;
    var deltaX = event.clientX - start.x;
    var deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY)) return 0;
    return deltaX > 0 ? -1 : 1;
  }

  buildCarousel();
  updateCarousel(false);

  previous.addEventListener("click", function () { step(-1, true); });
  next.addEventListener("click", function () { step(1, true); });
  expand.addEventListener("click", function () { openDialog(expand); });
  openPresentation.addEventListener("click", function () { openDialog(openPresentation); });

  stage.addEventListener("keydown", function (event) {
    if (event.target !== stage) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); step(-1, true); }
    if (event.key === "ArrowRight") { event.preventDefault(); step(1, true); }
    if (event.key === "Home") { event.preventDefault(); showSlide(0, true); }
    if (event.key === "End") { event.preventDefault(); showSlide(slides.length - 1, true); }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDialog(stage); }
  });

  stage.addEventListener("pointerdown", function (event) {
    carouselDidSwipe = false;
    carouselPointerStart = pointerStart(event);
  });

  stage.addEventListener("pointerup", function (event) {
    var direction = pointerDirection(carouselPointerStart, event);
    carouselPointerStart = null;
    if (direction) {
      carouselDidSwipe = true;
      step(direction, true);
    }
  });

  stage.addEventListener("pointercancel", function () { carouselPointerStart = null; });

  dialogPrevious.addEventListener("click", function (event) {
    event.stopPropagation();
    stepPresentation(-1);
  });
  dialogNext.addEventListener("click", function (event) {
    event.stopPropagation();
    stepPresentation(1);
  });
  dialogClose.addEventListener("click", closeDialog);

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("close", function () {
    document.body.style.overflow = "";
  });

  dialog.addEventListener("keydown", function (event) {
    if (!dialog.open) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      stepPresentation(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      stepPresentation(1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      showSlide(0, true);
      resetDialogViewport();
    }
    if (event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      showSlide(slides.length - 1, true);
      resetDialogViewport();
    }
  });

  dialogStage.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".presentation-arrow")) return;
    dialogPointerStart = pointerStart(event);
    dialogStage.setPointerCapture(event.pointerId);
  });

  dialogStage.addEventListener("pointerup", function (event) {
    var direction = pointerDirection(dialogPointerStart, event);
    dialogPointerStart = null;
    if (direction) stepPresentation(direction);
  });

  dialogStage.addEventListener("pointercancel", function () { dialogPointerStart = null; });

  slides.forEach(function (slide) {
    var image = new Image();
    image.src = slide.src;
  });
}());
