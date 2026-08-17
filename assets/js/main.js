/* AUVP Advisors — LP de recrutamento de consultores */

/* ==========================================================================
   CONFIGURAÇÃO — preencher antes do lançamento
   ========================================================================== */

/**
 * Endpoint que recebe o formulário de interesse (POST em JSON).
 * Enquanto estiver vazio, o formulário valida os campos normalmente mas
 * avisa que o destino não foi configurado, em vez de fingir que enviou.
 */
const FORM_ENDPOINT = "";

/** Páginas de Termos de Uso e Política de Privacidade (entrega do jurídico). */
const TERMS_URL = "";
const PRIVACY_URL = "";

/**
 * Vídeo de lançamento (URL de embed, ex.: https://www.youtube.com/embed/ID).
 * Vazio mantém a seção do vídeo oculta.
 */
const VIDEO_URL = "";

/**
 * Fee anual médio cobrado sobre o patrimônio sob custódia, usado para
 * transformar o tamanho da carteira em receita na calculadora de repasse.
 * 0.01 = 1% ao ano. A observação exibida abaixo do controle é escrita a
 * partir daqui, então mudar este número mantém texto e conta alinhados.
 */
const TAXA_FEE_ANUAL = 0.01;

/**
 * Faixa de repasse do fee para o advisor. O piso vem do comissionamento
 * máximo da AUVP declarado no escopo (30% do fee) e o teto é o repasse de
 * 80%. A calculadora mostra as duas pontas — não existe condição especial
 * para quem se cadastra primeiro.
 */
const REPASSE_MIN = 0.7;
const REPASSE_MAX = 0.8;

/* ========================================================================== */

const MSG = {
  nome: "Informe seu nome completo.",
  whatsapp: "Informe um WhatsApp com DDD.",
  email: "Informe um e-mail válido.",
  registro: "Selecione uma das opções.",
  experiencia: "Selecione uma das opções.",
  metodologias: "Conte em poucas palavras como você atende.",
  consentimento: "É preciso aceitar para continuar.",
};

/** Aceita 10 ou 11 dígitos (DDD + número), ignorando máscara. */
function whatsappValido(valor) {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11;
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
}

function validarCampo(campo) {
  const nome = campo.name;
  if (nome === "consentimento") return campo.checked;
  if (nome === "whatsapp") return whatsappValido(campo.value);
  if (nome === "email") return emailValido(campo.value);
  // Uma letra solta não é nome; evita "a" passar como preenchimento válido.
  if (nome === "nome") return campo.value.trim().length >= 2;
  return campo.value.trim() !== "";
}

function mostrarErro(form, campo, mostrar) {
  const alvo = form.querySelector(`[data-error-for="${campo.name}"]`);
  if (alvo) alvo.textContent = mostrar ? MSG[campo.name] || "Campo obrigatório." : "";
  campo.setAttribute("aria-invalid", mostrar ? "true" : "false");
  campo.closest(".field")?.classList.toggle("field--invalid", mostrar);
}

function aplicarMascaraTelefone(campo) {
  const d = campo.value.replace(/\D/g, "").slice(0, 11);
  if (!d) return (campo.value = "");
  if (d.length <= 2) campo.value = `(${d}`;
  else if (d.length <= 6) campo.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  else if (d.length <= 10) campo.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  else campo.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function iniciarFormulario() {
  const form = document.querySelector("[data-form]");
  if (!form) return;

  const status = form.querySelector("[data-status]");
  const botao = form.querySelector("[data-submit]");
  const campos = Array.from(form.querySelectorAll("input, select"));

  const telefone = form.querySelector("#whatsapp");
  if (telefone) {
    telefone.addEventListener("input", () => aplicarMascaraTelefone(telefone));
  }

  // Quem não tem registro na CVM vê que ainda pode se cadastrar.
  const registro = form.querySelector("#registro");
  const dica = form.querySelector("[data-registro-hint]");
  if (registro && dica) {
    registro.addEventListener("change", () => {
      dica.hidden = !registro.value.endsWith("sem-registro");
    });
  }

  // Só limpa o erro depois que o campo passa a estar válido.
  campos.forEach((campo) => {
    campo.addEventListener("blur", () => mostrarErro(form, campo, !validarCampo(campo)));
    campo.addEventListener("input", () => {
      if (validarCampo(campo)) mostrarErro(form, campo, false);
    });
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const invalidos = campos.filter((campo) => !validarCampo(campo));
    campos.forEach((campo) => mostrarErro(form, campo, invalidos.includes(campo)));

    if (invalidos.length) {
      status.textContent = "Revise os campos destacados.";
      status.dataset.state = "erro";
      invalidos[0].focus();
      return;
    }

    if (!FORM_ENDPOINT) {
      status.textContent =
        "Formulário ainda não conectado: defina FORM_ENDPOINT em assets/js/main.js.";
      status.dataset.state = "erro";
      return;
    }

    const dados = Object.fromEntries(new FormData(form).entries());
    dados.consentimento = form.querySelector("#consentimento").checked;
    dados.origem = window.location.href;

    botao.disabled = true;
    status.textContent = "Enviando…";
    status.dataset.state = "";

    try {
      const resposta = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!resposta.ok) throw new Error(String(resposta.status));

      form.reset();
      status.textContent = "Recebemos seu cadastro. O time entra em contato em breve.";
      status.dataset.state = "ok";
    } catch {
      status.textContent =
        "Não foi possível enviar agora. Tente de novo em instantes.";
      status.dataset.state = "erro";
    } finally {
      botao.disabled = false;
    }
  });
}

function aplicarLinksLegais() {
  const pares = [
    ["[data-terms-link]", TERMS_URL],
    ["[data-privacy-link]", PRIVACY_URL],
  ];
  pares.forEach(([seletor, url]) => {
    document.querySelectorAll(seletor).forEach((link) => {
      if (url) {
        link.setAttribute("href", url);
      } else {
        // Sem URL definida, o link não finge existir.
        link.setAttribute("aria-disabled", "true");
        link.classList.add("link--pendente");
      }
    });
  });
}

function aplicarVideo() {
  const secao = document.querySelector("[data-video-section]");
  const frame = document.querySelector("[data-video-frame]");
  if (!secao || !frame || !VIDEO_URL) return;
  frame.setAttribute("src", VIDEO_URL);
  secao.hidden = false;
  // A dobra do vídeo é .surface-dark e o CTA logo abaixo é .surface-deep:
  // os dois já se distinguem, então não há alternância a corrigir aqui.
}

/* ==========================================================================
   Interações
   ========================================================================== */

const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Agrupa leituras de scroll num único rAF por quadro. */
function aoRolar(fn) {
  let agendado = false;
  const handler = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      fn();
      agendado = false;
    });
  };
  window.addEventListener("scroll", handler, { passive: true });
  handler();
}

/**
 * O menu vira pílula só a partir da segunda dobra: enquanto o hero ainda
 * estiver passando atrás dele, segue como barra cheia. A troca é só de
 * pintura — a geometria é a mesma nos dois estados.
 */
function iniciarNavFlutuante() {
  const nav = document.querySelector(".nav");
  const hero = document.querySelector(".hero");
  if (!nav) return;

  aoRolar(() => {
    const limite = hero
      ? hero.getBoundingClientRect().bottom <= nav.offsetHeight
      : window.scrollY > 80;
    nav.classList.toggle("is-floating", limite);
  });
}

/** Calculadora do repasse: a barra da divisão preenche ao entrar na tela. */
function iniciarGrafico() {
  const fee = document.querySelector("[data-fee]");
  if (!fee) return;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.setAttribute("data-on", "");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.35 }
    );
    io.observe(fee);
  } else {
    fee.setAttribute("data-on", "");
  }

  ligarSimulador(fee);
}

/**
 * Calculadora do repasse. O patrimônio sob custódia é informado pelo próprio
 * advisor; daí sai o fee anual pela taxa de TAXA_FEE_ANUAL e, dele, as duas
 * pontas do repasse (REPASSE_MIN e REPASSE_MAX). Nenhum número aqui é
 * promessa de faturamento.
 */
function ligarSimulador(fee) {
  const range = fee.querySelector("[data-sim]");
  const valor = fee.querySelector("[data-sim-valor]");
  const saidaFee = fee.querySelector("[data-sim-fee]");
  const saidaAno = fee.querySelector("[data-sim-ano]");
  const saidaMes = fee.querySelector("[data-sim-mes]");
  const obs = fee.querySelector("[data-sim-obs]");
  if (!range || !valor || !saidaFee || !saidaAno || !saidaMes) return;

  /** O controle anda em milhões de reais de patrimônio. */
  const emMilhoes = (mi) =>
    "R$ " +
    mi.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
    (mi === 1 ? " milhão" : " milhões");

  const emReais = (n) =>
    "R$ " + Math.round(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  /** Piso e teto do repasse aparecem sempre juntos, nunca um número só. */
  const faixa = (min, max) => `${emReais(min)} a ${emReais(max)}`;

  const emPorcento = (n) =>
    (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";

  function atualizar() {
    const milhoes = Number(range.value);
    const feeAnual = milhoes * 1e6 * TAXA_FEE_ANUAL;

    valor.textContent = emMilhoes(milhoes);
    saidaFee.textContent = emReais(feeAnual);
    saidaAno.textContent = faixa(feeAnual * REPASSE_MIN, feeAnual * REPASSE_MAX);
    saidaMes.textContent = faixa(
      (feeAnual * REPASSE_MIN) / 12,
      (feeAnual * REPASSE_MAX) / 12
    );

    // Preenche o trilho até a posição escolhida.
    const min = Number(range.min);
    const max = Number(range.max);
    const pct = ((milhoes - min) / (max - min)) * 100;
    range.style.setProperty("--pct", `${pct}%`);
  }

  if (obs) {
    obs.textContent =
      `Projeção sobre o patrimônio sob custódia informado por você, considerando um fee de ` +
      `${emPorcento(TAXA_FEE_ANUAL)} ao ano e repasse de ${emPorcento(REPASSE_MIN)} a ` +
      `${emPorcento(REPASSE_MAX)} do fee. Não é estimativa de faturamento nem promessa de resultado.`;
  }

  range.addEventListener("input", atualizar);
  atualizar();
}

/**
 * Timeline do caminho de entrada. Como as cinco etapas ficam lado a lado,
 * elas entram na tela praticamente juntas — amarrar o preenchimento à
 * posição do scroll dava um trilho que ia e voltava. Aqui o bloco anima uma
 * vez, ao aparecer, e os cartões entram em sequência.
 */
function iniciarTimeline() {
  const bloco = document.querySelector("[data-timeline]");
  if (!bloco) return;

  if (!("IntersectionObserver" in window) || semMovimento) {
    bloco.classList.add("is-on");
    return;
  }

  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-on");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.25 }
  );
  io.observe(bloco);
}

/**
 * Lista de benefícios. O item que estiver cruzando a faixa central da tela
 * recebe `is-ativo` e tem o número preenchido — é o que dá movimento à dobra
 * sem esconder nada atrás de clique. Sem observer, todos ficam legíveis do
 * mesmo jeito: o estado só troca a cor do número.
 */
function iniciarLista() {
  const lista = document.querySelector("[data-lista]");
  if (!lista || !("IntersectionObserver" in window)) return;

  const itens = [...lista.querySelectorAll(".lista__item")];
  if (!itens.length) return;

  const contador = document.querySelector("[data-lista-atual]");

  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        e.target.classList.toggle("is-ativo", e.isIntersecting);
      });

      // O contador segue o primeiro item ativo; se a faixa central ficar
      // vazia entre dois itens, o número anterior permanece.
      if (!contador) return;
      const ativo = itens.findIndex((i) => i.classList.contains("is-ativo"));
      if (ativo >= 0) contador.textContent = String(ativo + 1).padStart(2, "0");
    },
    // Faixa de ~10% da altura no meio da tela: só um ou dois itens por vez.
    { rootMargin: "-45% 0px -45% 0px" }
  );
  itens.forEach((item) => io.observe(item));
}

/** Parallax discreto da foto do hero. */
function iniciarParallax() {
  const media = document.querySelector(".hero__media");
  if (!media || semMovimento) return;
  aoRolar(() => {
    const y = Math.min(window.scrollY, 600);
    media.style.transform = `translateY(${y * 0.06}px)`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarNavFlutuante();
  iniciarGrafico();
  iniciarLista();
  iniciarTimeline();
  iniciarParallax();

  // CTAs — todos os botões .js-cta levam ao formulário
  document.querySelectorAll(".js-cta").forEach((el) => {
    el.setAttribute("href", "#interesse");
  });

  aplicarLinksLegais();
  aplicarVideo();
  iniciarFormulario();

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


  // Ano do rodapé
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
});
