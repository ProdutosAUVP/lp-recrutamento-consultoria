/* AUVP Advisors — LP de recrutamento de consultores */

/* ==========================================================================
   CONFIGURAÇÃO — preencher antes do lançamento
   ========================================================================== */

/**
 * Endpoint que recebe o formulário de interesse (POST com corpo em JSON).
 * Enquanto estiver vazio, o formulário valida os campos normalmente mas
 * avisa que o destino não foi configurado, em vez de fingir que enviou.
 *
 * Hoje o destino é um webhook do n8n.
 */
const FORM_ENDPOINT =
  "https://n8n.prod.asupernova.com.br/webhook/ce73b3b7-5b64-4d59-bdfe-a7e09de6446c";

/**
 * Termos de Uso e Política de Privacidade do programa (entrega do jurídico).
 * São PDFs hospedados no CDN; os links abrem em nova aba.
 */
const TERMS_URL =
  "https://cdn.asupernova.com.br/termos/auvp%20advisors/AUVP_Advisor_Termos_v1.pdf";
const PRIVACY_URL =
  "https://cdn.asupernova.com.br/termos/auvp%20advisors/AUVP_Advisor_PP_v1.pdf";

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
 * Tabela progressiva do repasse, da pergunta 9 da FAQ ("Como sou
 * remunerado?"). A faixa é escolhida pela receita bruta mensal total gerada
 * na plataforma, e o percentual da faixa vale sobre a receita inteira (não é
 * alíquota marginal). `ate` é o limite superior da faixa, em reais por mês.
 *
 * O último percentual é o teto (70%), que a página cita em outros lugares.
 * O simulador projeta a faixa em que a carteira cai e diz qual é; por isso
 * todo texto ao redor carrega o asterisco e a palavra "simulação".
 */
const FAIXAS_REPASSE = [
  { ate: 10000, pct: 0.5 },
  { ate: 30000, pct: 0.55 },
  { ate: 50000, pct: 0.6 },
  { ate: 80000, pct: 0.65 },
  { ate: Infinity, pct: 0.7 },
];
const REPASSE_TETO = FAIXAS_REPASSE[FAIXAS_REPASSE.length - 1].pct;

/* ========================================================================== */

const MSG = {
  nome: "Informe seu nome completo.",
  whatsapp: "Informe um WhatsApp com DDD.",
  email: "Informe um e-mail válido.",
  registro: "Selecione uma das opções.",
  experiencia: "Selecione uma das opções.",
  patrimonio: "Selecione uma faixa.",
  corretoras: "Marque pelo menos uma corretora.",
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

/** Nome do campo: o input tem `name`; o grupo de checkboxes, `data-grupo`. */
function nomeDoCampo(campo) {
  return campo.name || campo.dataset.grupo;
}

/** Nas múltiplas escolhas, o que vale é o conjunto de caixas marcadas. */
function marcadas(grupo) {
  return Array.from(grupo.querySelectorAll("input:checked")).map((c) => c.value);
}

function validarCampo(campo) {
  const nome = nomeDoCampo(campo);
  if (campo.dataset.grupo !== undefined) {
    return !campo.hasAttribute("data-obrigatorio") || marcadas(campo).length > 0;
  }
  if (nome === "consentimento") return campo.checked;
  if (nome === "whatsapp") return whatsappValido(campo.value);
  if (nome === "email") return emailValido(campo.value);
  // Uma letra solta não é nome; evita "a" passar como preenchimento válido.
  if (nome === "nome") return campo.value.trim().length >= 2;
  return campo.value.trim() !== "";
}

function mostrarErro(form, campo, mostrar) {
  const nome = nomeDoCampo(campo);
  const alvo = form.querySelector(`[data-error-for="${nome}"]`);
  if (alvo) alvo.textContent = mostrar ? MSG[nome] || "Campo obrigatório." : "";
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
  // Os checkboxes das múltiplas escolhas não entram um a um: o fieldset do
  // grupo é o campo, e é ele que valida e mostra erro.
  const campos = Array.from(
    form.querySelectorAll("input:not([data-hp]):not([data-grupo] input), select, [data-grupo]")
  );

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

  // Só limpa o erro depois que o campo passa a estar válido. O grupo não
  // recebe blur: revalida a cada caixa marcada ou desmarcada.
  campos.forEach((campo) => {
    if (campo.dataset.grupo !== undefined) {
      campo.addEventListener("change", () => {
        if (validarCampo(campo)) mostrarErro(form, campo, false);
      });
      return;
    }
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
      // No grupo, o foco vai para a primeira caixa; o fieldset em si não recebe foco.
      (invalidos[0].querySelector("input") || invalidos[0]).focus();
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
    // As múltiplas escolhas vão como uma string só ("BTG, XP"), na ordem em
    // que aparecem no formulário. Vazio quando nada foi marcado.
    form.querySelectorAll("[data-grupo]").forEach((grupo) => {
      dados[grupo.dataset.grupo] = marcadas(grupo).join(", ");
    });
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

/** A faixa da tabela em que uma receita mensal cai. */
function faixaDoRepasse(receitaMensal) {
  return FAIXAS_REPASSE.find((f) => receitaMensal <= f.ate);
}

/**
 * Calculadora do repasse. O patrimônio sob custódia é informado pelo próprio
 * advisor; daí sai o fee anual pela taxa de TAXA_FEE_ANUAL, a receita mensal
 * escolhe a faixa em FAIXAS_REPASSE e o percentual da faixa vale sobre o fee
 * inteiro. Nenhum número aqui é promessa de faturamento.
 */
function ligarSimulador(fee) {
  const range = fee.querySelector("[data-sim]");
  const valor = fee.querySelector("[data-sim-valor]");
  const saidaFee = fee.querySelector("[data-sim-fee]");
  const saidaAno = fee.querySelector("[data-sim-ano]");
  const saidaMes = fee.querySelector("[data-sim-mes]");
  const saidaFaixa = fee.querySelector("[data-sim-faixa]");
  const obs = fee.querySelector("[data-sim-obs]");
  const barra = fee.querySelector("[data-split-bar]");
  const segBase = fee.querySelector("[data-split-base]");
  const segAuvp = fee.querySelector("[data-split-auvp]");
  const pctBase = fee.querySelector("[data-split-pct-base]");
  const pctAuvp = fee.querySelector("[data-split-pct-auvp]");
  if (!range || !valor || !saidaFee || !saidaAno || !saidaMes) return;

  /** O controle anda em milhões de reais de patrimônio. */
  const emMilhoes = (mi) =>
    "R$ " +
    mi.toLocaleString("pt-BR", { maximumFractionDigits: 0 }) +
    (mi === 1 ? " milhão" : " milhões");

  const emReais = (n) =>
    "R$ " + Math.round(n).toLocaleString("pt-BR", { maximumFractionDigits: 0 });

  const emPorcento = (n) =>
    (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";

  /** "até R$ 10 mil", "de R$ 10 mil a R$ 30 mil", "acima de R$ 80 mil". */
  const descreverFaixa = (faixa) => {
    const mil = (n) => "R$ " + Math.round(n / 1000).toLocaleString("pt-BR") + " mil";
    const i = FAIXAS_REPASSE.indexOf(faixa);
    if (i === 0) return "receita mensal até " + mil(faixa.ate);
    if (faixa.ate === Infinity) return "receita mensal acima de " + mil(FAIXAS_REPASSE[i - 1].ate);
    return "receita mensal de " + mil(FAIXAS_REPASSE[i - 1].ate) + " a " + mil(faixa.ate);
  };

  function atualizar() {
    const milhoes = Number(range.value);
    const feeAnual = milhoes * 1e6 * TAXA_FEE_ANUAL;
    const faixa = faixaDoRepasse(feeAnual / 12);

    valor.textContent = emMilhoes(milhoes);
    saidaFee.textContent = emReais(feeAnual);
    const repasse = feeAnual * faixa.pct;
    saidaAno.textContent = emReais(repasse);
    saidaMes.textContent = emReais(repasse / 12);
    if (saidaFaixa) {
      saidaFaixa.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = emPorcento(faixa.pct) + " do fee";
      saidaFaixa.append(b, document.createTextNode(" · " + descreverFaixa(faixa)));
    }

    // A barra de divisão segue a faixa: é ela que mostra a parte de cada um.
    const pctVoce = emPorcento(faixa.pct);
    const pctAuvpTxt = emPorcento(1 - faixa.pct);
    if (segBase && segAuvp) {
      segBase.style.setProperty("--w", pctVoce);
      segAuvp.style.setProperty("--w", pctAuvpTxt);
    }
    if (pctBase) pctBase.textContent = pctVoce;
    if (pctAuvp) pctAuvp.textContent = pctAuvpTxt;
    if (barra) {
      barra.setAttribute(
        "aria-label",
        `Barra da divisão do fee: ${pctVoce} ficam com o advisor e ${pctAuvpTxt} com a AUVP.`
      );
    }

    // Preenche o trilho até a posição escolhida.
    const min = Number(range.min);
    const max = Number(range.max);
    const pct = ((milhoes - min) / (max - min)) * 100;
    range.style.setProperty("--pct", `${pct}%`);
  }

  if (obs) {
    // O selo "* Simulação" é estático no HTML; aqui vai só a parte que
    // depende das constantes, para número e texto nunca saírem de sincronia.
    const primeira = FAIXAS_REPASSE[0];
    obs.textContent =
      `o repasse segue a tabela progressiva da plataforma, de ${emPorcento(primeira.pct)} a ` +
      `${emPorcento(REPASSE_TETO)} do fee conforme a sua receita bruta mensal, e a projeção ` +
      `mostra a faixa em que a carteira informada cai. A conta parte do patrimônio sob custódia ` +
      `que você informou, considerando um fee de referência de ${emPorcento(TAXA_FEE_ANUAL)} ao ano ` +
      `(o fee real é definido com cada cliente, dentro da faixa por patrimônio). Os valores são ` +
      `brutos: não descontam nenhum tipo de tributação, então o valor real pode ser menor. Não é ` +
      `estimativa de faturamento nem promessa de resultado.`;
  }

  range.addEventListener("input", atualizar);
  atualizar();
}

/**
 * Cadeia da dobra de operação. Os quatro nós entram em sequência e as setas
 * são desenhadas depois deles — é a ordem que conta a história, com a seta
 * da AUVP apontando para o cliente sem tocar no advisor. Anima uma vez.
 */
function iniciarFluxo() {
  const bloco = document.querySelector("[data-fluxo]");
  if (!bloco) return;

  if (!("IntersectionObserver" in window) || semMovimento) {
    bloco.setAttribute("data-on", "");
    return;
  }

  const io = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.setAttribute("data-on", "");
        io.unobserve(e.target);
      });
    },
    { threshold: 0.2 }
  );
  io.observe(bloco);
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

/**
 * Abas dos macrotemas da FAQ. Os temas sem pergunta chegam com `hidden` no
 * botão e no painel e ficam de fora. Sem JS, todos os temas aparecem
 * empilhados com o próprio título; com JS, só o escolhido, e o título some
 * porque repete o botão.
 */
function iniciarFaq() {
  const faq = document.querySelector("[data-faq]");
  if (!faq) return;
  const abas = Array.from(faq.querySelectorAll('[role="tab"]:not([hidden])'));
  const paineis = Array.from(faq.querySelectorAll("[data-tema]:not([hidden])"));
  if (abas.length < 2) return;

  function escolher(aba) {
    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute("aria-selected", String(ativa));
      a.tabIndex = ativa ? 0 : -1;
    });
    paineis.forEach((p) => {
      p.hidden = p.id !== aba.getAttribute("aria-controls");
    });
  }

  abas.forEach((aba, i) => {
    aba.addEventListener("click", () => escolher(aba));
    // Setas andam entre as abas, como num tablist: para baixo/direita
    // avança, para cima/esquerda volta (a lista é vertical no desktop e
    // horizontal no celular).
    aba.addEventListener("keydown", (e) => {
      const passo = ["ArrowDown", "ArrowRight"].includes(e.key) ? 1
        : ["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 0;
      if (!passo) return;
      e.preventDefault();
      const proxima = abas[(i + passo + abas.length) % abas.length];
      escolher(proxima);
      proxima.focus();
    });
  });

  faq.setAttribute("data-abas", "");
  escolher(abas[0]);
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
  iniciarFluxo();
  iniciarTimeline();
  iniciarParallax();
  iniciarFaq();

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
