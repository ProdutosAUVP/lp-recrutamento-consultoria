/* AUVP Advisors — LP de recrutamento de consultores */

/**
 * URL de destino do CTA principal ("Quero ser um consultor AUVP").
 * TODO: apontar para a URL real de cadastro quando estiver definida.
 * Enquanto for "#interesse", os CTAs rolam até a seção final da página.
 */
const SIGNUP_URL = "#interesse";

document.addEventListener("DOMContentLoaded", () => {
  // CTAs — todos os botões .js-cta apontam para o mesmo destino
  document.querySelectorAll(".js-cta").forEach((el) => {
    el.setAttribute("href", SIGNUP_URL);
  });

  // Menu mobile
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.hasAttribute("data-open");
      if (open) {
        menu.removeAttribute("data-open");
        menu.setAttribute("hidden", "");
      } else {
        menu.setAttribute("data-open", "");
        menu.removeAttribute("hidden");
      }
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.removeAttribute("data-open");
        menu.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Colunas do repasse — sobem em cascata quando o gráfico entra na tela
  const fee = document.querySelector("[data-fee]");
  if (fee && "IntersectionObserver" in window) {
    const feeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-on", "");
            feeIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );
    feeIo.observe(fee);
  } else if (fee) {
    fee.setAttribute("data-on", "");
  }

  // Ano do rodapé
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
});
