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

/** Números da faixa de prova contam até o valor final ao entrar na tela. */
function iniciarContadores() {
  const alvos = document.querySelectorAll(".stat__value strong");
  if (!alvos.length || semMovimento || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);

        const texto = e.target.textContent;
        const numero = parseInt(texto.replace(/\D/g, ""), 10);
        if (!Number.isFinite(numero)) return;
        const sufixo = texto.replace(/[\d]/g, "");

        const duracao = 900;
        const inicio = performance.now();
        const passo = (agora) => {
          const p = Math.min((agora - inicio) / duracao, 1);
          // easeOutCubic: rápido no começo, assenta no fim
          const valor = Math.round(numero * (1 - Math.pow(1 - p, 3)));
          e.target.textContent = valor + sufixo;
          if (p < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      });
    },
    { threshold: 0.6 }
  );
  alvos.forEach((el) => io.observe(el));
}

/** Gráfico do repasse: anima ao entrar na tela e mostra a divisão no hover. */
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

  const leitura = fee.querySelector("[data-readout]");
  const padrao = leitura ? leitura.innerHTML : "";
  fee.querySelectorAll("[data-col]").forEach((col) => {
    const mostrar = () => {
      if (!leitura) return;
      const voce = col.dataset.voce;
      const auvp = col.dataset.auvp;
      leitura.innerHTML =
        `Em cada R$ 100 de fee: <b>R$ ${voce},00 para você</b> e R$ ${auvp},00 para a AUVP.`;
    };
    const limpar = () => { if (leitura) leitura.innerHTML = padrao; };
    col.addEventListener("mouseenter", mostrar);
    col.addEventListener("mouseleave", limpar);
    col.addEventListener("focus", mostrar);
    col.addEventListener("blur", limpar);
  });
}

/** Roadmap: trilho preenche e as etapas acendem conforme a rolagem. */
function iniciarRoadmap() {
  const lista = document.querySelector("[data-roadmap]");
  const trilho = document.querySelector("[data-rail]");
  if (!lista || !trilho) return;

  const etapas = Array.from(lista.querySelectorAll(".roadmap__step"));
  const horizontal = () => window.matchMedia("(min-width: 68.0625rem)").matches;

  aoRolar(() => {
    const r = lista.getBoundingClientRect();
    const alvo = window.innerHeight * 0.72;
    // 0 quando o topo da lista cruza a linha de leitura, 1 quando o fim cruza
    const bruto = (alvo - r.top) / Math.max(r.height, 1);
    const p = Math.min(Math.max(bruto, 0), 1);

    trilho.style[horizontal() ? "width" : "height"] = `${p * 100}%`;

    etapas.forEach((etapa, i) => {
      etapa.classList.toggle("is-reached", p >= i / etapas.length);
    });
  });
}

/** Perfis do catálogo — o visitante compara, como o cliente faz. */
const PERFIS = [
  {
    foto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop&crop=faces",
    nome: "Mariana Ribeiro",
    local: "São Paulo, SP · Atende todo o Brasil",
    nota: "9,4",
    avaliacao: "★ 4,9",
    cert: "CNPI-P",
    certs: "CPA · CGE",
    metodologia: "Acompanhamento mensal com rebalanceamento por metas. Transparência total sobre o processo.",
    pedido: "Patrimônio R$ 1,2M · Objetivo: aposentadoria · Acompanhamento trimestral",
  },
  {
    foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=300&auto=format&fit=crop&crop=faces",
    nome: "Rafael Ferraz",
    local: "Curitiba, PR · Atende todo o Brasil",
    nota: "9,1",
    avaliacao: "★ 4,8",
    cert: "CPRO-I",
    certs: "CPA · CNPI-T",
    metodologia: "Construção de renda passiva com revisão semestral e relatório aberto de cada movimentação.",
    pedido: "Patrimônio R$ 850 mil · Objetivo: renda mensal · Acompanhamento semestral",
  },
  {
    foto: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=300&auto=format&fit=crop&crop=faces",
    nome: "Beatriz Nunes",
    local: "Recife, PE · Atende todo o Brasil",
    nota: "9,7",
    avaliacao: "★ 5,0",
    cert: "CGE",
    certs: "CPRO-R · CNPI-P",
    metodologia: "Planejamento sucessório e estruturação fiscal para famílias, com revisão anual do plano.",
    pedido: "Patrimônio R$ 4,5M · Objetivo: sucessão familiar · Acompanhamento trimestral",
  },
];

function iniciarPerfis() {
  const bloco = document.querySelector("[data-profiles]");
  const card = document.querySelector("[data-profile-card]");
  if (!bloco || !card) return;

  const botoes = Array.from(bloco.querySelectorAll("[data-profile]"));

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const perfil = PERFIS[Number(botao.dataset.profile)];
      if (!perfil) return;

      botoes.forEach((b) => {
        const ativo = b === botao;
        b.classList.toggle("is-active", ativo);
        b.setAttribute("aria-selected", String(ativo));
      });

      const aplicar = () => {
        Object.entries(perfil).forEach(([chave, valor]) => {
          const campo = card.querySelector(`[data-field="${chave}"]`);
          if (!campo) return;
          if (campo.tagName === "IMG") campo.src = valor;
          else campo.textContent = valor;
        });
        card.classList.remove("is-swapping");
      };

      if (semMovimento) return aplicar();
      card.classList.add("is-swapping");
      setTimeout(aplicar, 160);
    });
  });
}

/** Letreiro precisa do conteúdo duplicado para o loop não dar salto. */
function iniciarLetreiro() {
  const trilha = document.querySelector("[data-ticker]");
  if (!trilha || semMovimento) return;
  trilha.innerHTML += trilha.innerHTML;
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
  iniciarContadores();
  iniciarGrafico();
  iniciarRoadmap();
  iniciarPerfis();
  iniciarLetreiro();
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
