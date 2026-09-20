/* BN Inventions — shared site behaviour */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- Header */
  var header = document.querySelector(".site-header");
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;

    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle("is-stuck", y > 12);

      // Hide on scroll down, reveal on scroll up — but never while the menu is open.
      if (!header.classList.contains("is-open")) {
        if (y > 320 && y > lastY + 6) header.classList.add("is-hidden");
        else if (y < lastY - 6) header.classList.remove("is-hidden");
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();
  }

  /* ------------------------------------------------------------- Mobile nav */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.querySelector(".nav__links");

  var setMenu = function (open) {
    if (!toggle || !links) return;
    links.classList.toggle("is-open", open);
    if (header) header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector("use").setAttribute("href", open ? "#i-close" : "#i-menu");
    document.body.style.overflow = open && window.innerWidth <= 1024 ? "hidden" : "";
  };

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // On small screens the "Solutions" parent toggles its submenu instead of navigating.
    links.querySelectorAll(".has-menu > .nav__link").forEach(function (parent) {
      parent.addEventListener("click", function (e) {
        if (window.innerWidth > 1024) return;
        e.preventDefault();
        parent.parentElement.classList.toggle("is-expanded");
      });
    });

    links.querySelectorAll("a:not(.has-menu > .nav__link)").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024) setMenu(false);
    });
  }

  /* --------------------------------------------------------- Reveal on scroll */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach(function (el) {
        el.classList.add("is-in");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );

      revealables.forEach(function (el, i) {
        // Stagger siblings that share a parent so grids cascade rather than pop.
        var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.hasAttribute && c.hasAttribute("data-reveal");
        });
        var index = siblings.indexOf(el);
        el.style.setProperty("--reveal-delay", Math.min(index, 5) * 70 + "ms");
        observer.observe(el);
      });
    }
  }

  /* ------------------------------------------------------------ Hero slider */
  var slides = document.querySelectorAll(".hero__slide");
  if (slides.length > 1 && !reduceMotion) {
    var current = 0;
    setInterval(function () {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      // Restart the ken-burns animation on the incoming slide.
      slides[current].style.animation = "none";
      void slides[current].offsetWidth;
      slides[current].style.animation = "";
      slides[current].classList.add("is-active");
    }, 7000);
  }

  /* ----------------------------------------------------------- Back to top */
  var toTop = document.querySelector(".dock__btn--top");
  if (toTop) {
    window.addEventListener(
      "scroll",
      function () {
        toTop.classList.toggle("is-visible", window.scrollY > 700);
      },
      { passive: true }
    );
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------------ Year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
