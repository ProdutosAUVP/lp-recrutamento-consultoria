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
 * Fee anual médio cobrado sobre o patrimônio sob consultoria, usado para
 * transformar o tamanho da carteira em receita no simulador de repasse.
 * 0.01 = 1% ao ano. A observação exibida abaixo do simulador é escrita a
 * partir daqui, então mudar este número mantém texto e conta alinhados.
 */
const TAXA_FEE_ANUAL = 0.01;

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

  // Com o vídeo no ar entra mais uma dobra branca antes do CTA, que também
  // é branco. Empurrar o CTA para o cinza mantém a alternância.
  const cta = document.querySelector(".cta-final");
  if (cta) {
    cta.classList.remove("surface-white");
    cta.classList.add("surface-gray");
  }
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

        // O número pode vir com prefixo e sufixo ("+45 mil"): os dois ficam
        // parados enquanto só o miolo conta.
        const partes = e.target.textContent.match(/^(\D*)(\d+)(.*)$/);
        if (!partes) return;
        const [, prefixo, digitos, sufixo] = partes;
        const numero = parseInt(digitos, 10);
        if (!Number.isFinite(numero)) return;

        const duracao = 900;
        const inicio = performance.now();
        const passo = (agora) => {
          const p = Math.min((agora - inicio) / duracao, 1);
          // easeOutCubic: rápido no começo, assenta no fim
          const valor = Math.round(numero * (1 - Math.pow(1 - p, 3)));
          e.target.textContent = prefixo + valor + sufixo;
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

  ligarSimulador(fee);
}

/**
 * Simulador do repasse. O tamanho da carteira é informado pelo próprio
 * advisor; daí sai o fee anual pela taxa de TAXA_FEE_ANUAL e, dele, as
 * proporções de 70% e 80%. Nenhum número aqui é promessa de faturamento.
 */
function ligarSimulador(fee) {
  const range = fee.querySelector("[data-sim]");
  const valor = fee.querySelector("[data-sim-valor]");
  const saida = fee.querySelector("[data-sim-saida]");
  const obs = fee.querySelector("[data-sim-obs]");
  if (!range || !valor || !saida) return;

  /** O controle anda em milhões de reais de patrimônio. */
  const emMilhoes = (mi) =>
    "R$ " +
    mi.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
    (mi === 1 ? " milhão" : " milhões");

  const emReais = (n) =>
    "R$ " + Math.round(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  function atualizar() {
    const carteira = Number(range.value) * 1e6;
    const feeAnual = carteira * TAXA_FEE_ANUAL;
    const padrao = feeAnual * 0.7;
    const primeiros = feeAnual * 0.8;

    valor.textContent = emMilhoes(Number(range.value));
    saida.innerHTML =
      `Uma carteira desse tamanho gera <b>${emReais(feeAnual)}</b> de fee no ano: ` +
      `você fica com <b>${emReais(padrao)}</b> no repasse padrão e ` +
      `<b>${emReais(primeiros)}</b> como um dos 20 primeiros — ` +
      `<span class="sim__delta">${emReais(primeiros - padrao)} a mais por ano</span>.`;
  }

  if (obs) {
    const taxa = (TAXA_FEE_ANUAL * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    obs.textContent =
      `Obs.: os valores levam em conta o patrimônio líquido sob consultoria, ` +
      `considerando um fee de ${taxa}% ao ano.`;
  }

  range.addEventListener("input", atualizar);
  atualizar();
}

/**
 * Abas dos benefícios. Os tópicos ficam numa linha horizontal e a troca
 * substitui o painel abaixo — sem recarregar a página e sem levar o
 * visitante para outro lugar da rolagem.
 */
function iniciarAbas() {
  const bloco = document.querySelector("[data-tabs]");
  if (!bloco) return;

  const botoes = Array.from(bloco.querySelectorAll("[role='tab']"));
  const paineis = Array.from(bloco.querySelectorAll("[role='tabpanel']"));
  if (!botoes.length || botoes.length !== paineis.length) return;

  function ativar(indice) {
    botoes.forEach((botao, i) => {
      const ativo = i === indice;
      botao.classList.toggle("is-active", ativo);
      botao.setAttribute("aria-selected", String(ativo));
      // Só a aba ativa entra na ordem de tabulação; as outras vêm pelas setas.
      botao.tabIndex = ativo ? 0 : -1;
    });
    paineis.forEach((painel, i) => {
      const ativo = i === indice;
      painel.classList.toggle("is-active", ativo);
      painel.hidden = !ativo;
    });
  }

  botoes.forEach((botao, i) => {
    botao.addEventListener("click", () => ativar(i));
    botao.addEventListener("keydown", (evento) => {
      const passo =
        evento.key === "ArrowRight" ? 1 : evento.key === "ArrowLeft" ? -1 : 0;
      if (!passo) return;
      evento.preventDefault();
      const proximo = (i + passo + botoes.length) % botoes.length;
      ativar(proximo);
      botoes[proximo].focus();
    });
  });

  ativar(0);
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
  iniciarAbas();
  iniciarGrafico();
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
