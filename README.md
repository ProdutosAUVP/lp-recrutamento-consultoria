# LP — Recrutamento de Advisors (AUVP Advisors)

Landing page para atrair consultores de valores mobiliários para a plataforma da **AUVP Advisors**.

**CTA principal:** Quero me tornar um advisor AUVP.

## Vocabulário da página

Três regras valem para todo texto novo:

1. **Advisor**, não "consultor". A única exceção é o termo regulado — *consultor de valores mobiliários*, *consultoria de valores mobiliários* — que aparece nos avisos de CVM e no formulário porque é assim que a Resolução CVM 19/2021 nomeia a atividade. Trocar ali diria algo que não existe juridicamente.
2. **AUVP Advisors é substantivo feminino:** "a AUVP Advisors", "da AUVP Advisors", "na AUVP Advisors".
3. **Nada de "catálogo" nem "vitrine":** o produto é a **plataforma** ou o **sistema**.

## Stack

Página estática, sem build e sem dependências:

- `index.html` — todo o conteúdo, em seções semânticas
- `assets/css/styles.css` — estilos (paleta clara institucional derivada do design system AUVP)
- `assets/js/main.js` — configuração, formulário de interesse, menu mobile, reveal on scroll, abas dos benefícios, timeline de entrada, contadores e animação do gráfico de repasse
- `assets/img/` — logos "olho" AUVP (SVG, vindos de [ProdutosAUVP/central](https://github.com/ProdutosAUVP/central))

Para rodar localmente, basta abrir o `index.html` ou servir a pasta:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Deploy (GitHub Pages)

O deploy é automático: todo push na `main` dispara `.github/workflows/deploy.yml`, que monta o site e publica no GitHub Pages.

**URL:** https://produtosauvp.github.io/lp-recrutamento-consultoria/

O workflow copia tudo do topo do repositório para `_site/`, exceto `README.md` e os arquivos ocultos (`.git`, `.github`), e cria um `.nojekyll` para o Pages servir os arquivos como estão. Não há build — arquivos novos na raiz entram na publicação automaticamente.

Para publicar uma alteração, basta commitar na `main`. O andamento aparece na aba **Actions**; a URL final também fica em **Settings → Pages**.

### Habilitação (uma vez só)

Em **Settings → Pages**, defina **Source: GitHub Actions**. Sem isso o workflow falha no passo `configure-pages` com `Get Pages site failed … Not Found`.

Esse passo não dá para automatizar: o `GITHUB_TOKEN` do workflow publica no Pages, mas não tem permissão para criar o site (`enablement: true` na action retorna `Resource not accessible by integration`). Depois de ligado uma vez, nunca mais é preciso mexer.

## Configuração obrigatória antes de publicar

Tudo que depende de terceiros está no bloco de configuração no topo de `assets/js/main.js`. Enquanto uma variável estiver vazia, a página se comporta de forma segura em vez de fingir que funciona.

| Variável | O que é | Comportamento enquanto vazia |
|---|---|---|
| `FORM_ENDPOINT` | URL que recebe o formulário (POST em JSON) | O formulário valida os campos normalmente e avisa que o destino não foi configurado |
| `TERMS_URL` | Página de Termos de Uso | Os links ficam inertes e visivelmente desabilitados |
| `PRIVACY_URL` | Página de Política de Privacidade | Idem |
| `VIDEO_URL` | Embed do vídeo de lançamento | A dobra do vídeo fica oculta |

Além dessas, `TAXA_FEE_ANUAL` (no mesmo bloco) é o fee anual médio sobre o patrimônio sob consultoria que o simulador usa para transformar tamanho de carteira em receita. Está em **1% ao ano** — número escolhido como referência de mercado, **a confirmar com o time comercial**. A observação exibida abaixo do simulador é escrita a partir dessa constante, então mudar o valor mantém conta e texto alinhados.

### Formulário de interesse

Coleta os cinco campos definidos no escopo — WhatsApp, e-mail, registro na CVM, metodologias e anos de experiência — mais o **nome completo** e o consentimento de LGPD. O `POST` envia JSON com as chaves `nome`, `whatsapp`, `email`, `registro`, `metodologias`, `experiencia`, `consentimento` e `origem`.

O nome não consta da lista do escopo; foi acrescentado porque sem ele o time não tem como abrir o primeiro contato. É o único campo além do que o documento especifica.

Quem responde "sem registro na CVM" recebe na hora uma mensagem dizendo que ainda pode se cadastrar e que o time envia o tutorial de registro — a pergunta qualifica o lead sem descartá-lo.

## Conferindo o CSS

```bash
node scripts/auditar-classes.js
```

Compara as classes usadas no `index.html` (mais as que o JS adiciona em tempo de execução) com as que têm regra no `styles.css`, e aponta os dois lados: classe usada sem estilo e regra sem uso. Sai com código 1 se achar a primeira.

Vale rodar depois de mexer no CSS. O arquivo é grande e uma edição ampla demais pode levar junto um bloco vizinho — foi assim que os estilos das abas de perfil sumiram uma vez, deixando as fotos em tamanho natural.

## Outros pontos de atenção

1. **Fotos** — a foto do hero é um **placeholder do Unsplash referenciado por URL** (hotlink). Substituir por foto própria (hospedada em `assets/img/`) antes do lançamento. O ambiente de desenvolvimento remoto bloqueia esse host, mas no navegador dos visitantes ela carrega normalmente.
2. **Números do ecossistema** — a faixa de destaques exibe +1 Mi de investidores alcançados por mês, +45 mil contas abertas e ativas e +60 mil alunos formados. São dados de comunicação institucional: confirmar com marketing a data-base antes de publicar.
3. **Razão social no rodapé** — o escopo prevê uma PJ específica para a AUVP Advisors. Quando ela existir, o rodapé precisa da razão social e do CNPJ.
4. **Taxa do simulador** — o simulador parte do tamanho da carteira, não do fee. A conversão de patrimônio em receita usa `TAXA_FEE_ANUAL`, hoje em 1% ao ano; enquanto o número não for confirmado, a obs. abaixo do controle deixa a premissa visível para o visitante.
5. **Conteúdo que segue fora** — o quadro "Como você assina" (chancela *consultor AUVP* × *advisor*) saiu da dobra de benefícios e a regra permanece apenas no aviso legal do rodapé. **Pendente de validação do jurídico**, ainda mais agora que a página trata todo mundo por *advisor*.

## Decisões adotadas a partir do documento de escopo

A página foi originalmente construída a partir do briefing de comunicação. Onde o documento *AUVP Advisor: Resumo Completo do Projeto* diverge dele, **o documento prevaleceu**, por ser posterior e por conter as decisões comerciais e jurídicas. As premissas:

- **Repasse de 70% ou mais**, não 50%. O escopo define comissionamento da AUVP de até 30% do fee, o que fixa o piso do consultor em 70%. O briefing dizia "repasse inicial de 50%" — tratado como desatualizado.
- **Os 80% são a condição fixa dos 20 primeiros**, não o topo de uma progressão aberta a todos. O gráfico mostra as duas condições lado a lado.
- **Critérios do incentivo não são enumerados.** O escopo registra que ainda não foram definidos (pendência do Matheus Malheiros), então a página diz apenas que existem critérios a divulgar. Os números que estavam no ar (carteira de R$ 10 milhões, média ≥ 8) saíram.
- **O simulador parte da carteira.** A divisão do fee é demonstrada sobre R$ 10.000 e o controle anda em patrimônio sob consultoria (R$ 1 mi a R$ 250 mi, começando em R$ 20 mi); o fee anual sai daí por `TAXA_FEE_ANUAL`.
- **O BTG voltou à página**, agora na dobra escura "Foque no cliente" junto do suporte operacional, com o co-brand `assets/img/auvp-btg-branco.svg` e o aviso de que a vinculação depende do compliance da instituição.
- **A exclusividade de marca ficou só no rodapé.** A regra segue definida — quem atende 100% dentro da plataforma usa a chancela "consultor AUVP", quem mantém clientes fora se apresenta como "advisor" —, mas o quadro que a explicava saiu com a reformulação da dobra de benefícios. Hoje ela aparece apenas no aviso legal. **Pendente de validação do jurídico.**

## Design

- **Logo:** AUVP Capital horizontal (versão preferencial do design system), preta na navegação e branca no rodapé. Os SVGs vêm de [armandocustodio-ds/designsystemauvp](https://github.com/armandocustodio-ds/designsystemauvp) — o manifesto C2PA embutido foi removido para reduzir o arquivo de ~22 KB para ~4 KB
- **Fontes:** Anek Latin (display), Roboto (corpo), Sora (UI/labels) — todas sem serifa, iguais às do design system
- **Cores:** as dobras alternam entre `#FFFFFF` e `#F6F6F6`; os blocos escuros (dobra "Foque no cliente", destaque dos 20 primeiros e rodapé) são pretos. Verde AUVP Capital `hsl(155 93% 11%)` e dourado do olho `#F0BF4F` ficam como acento (botões, ênfases, gráfico do repasse), nunca como fundo de dobra
- **Superfícies:** cada dobra declara `.surface-white` ou `.surface-gray`, que definem as variáveis `--surface` (fundo da dobra) e `--surface-raised` (tom oposto). Os cartões usam `--surface-raised`, então sempre contrastam com a dobra em que estão — inverta a classe da dobra e os cartões se ajustam sozinhos
- **Formas:** raios contidos (3–6px) na interface — leitura sóbria e institucional. Duas exceções deliberadas: o **arco da foto do hero**, em um lado só (topo) e com os outros três retos; e os **nós da timeline**, circulares
- **Espaçamento:** escala única em `--sp-1` … `--sp-8` mais `--sp-section` (o respiro vertical das dobras). Todo padding, gap e margem sai daí — não há valores soltos
- **Responsivo:** verificado sem rolagem horizontal nem estouro de elemento em 320, 390, 834 e 1440px. Os pontos de quebra seguem o conteúdo, não o dispositivo: a linha de tópicos das abas vai de 6 para 3 e depois 2 por linha, sem nunca cortar um item; a timeline vai de 5 para 3 e depois 1 coluna; os destaques numéricos vão de 3 para 1 coluna; abaixo de 26rem os botões grandes ocupam a largura toda
- **Componentes:** hero em duas colunas com foto em frame arqueado, faixa de destaques numéricos, dobra escura de operação com o co-brand BTG, abas horizontais de benefícios com o simulador de repasse no primeiro painel, timeline horizontal do processo de entrada com o bloco de apoio à regularização e formulário de interesse
- **Compliance:** benefícios de lançamento marcados como limitados aos 20 primeiros e sujeitos a critérios, comissionamento da AUVP de até 30% declarado junto ao simulador, premissa de fee do simulador exposta abaixo do controle, vinculação ao BTG sinalizada como sujeita ao compliance da instituição, suporte à regularização diferenciado de garantia de registro, e disclaimers da Resolução CVM 19/2021 no hero, no formulário e no rodapé
