# LP — Recrutamento de Advisors (AUVP Advisors)

Landing page para atrair consultores de valores mobiliários para a plataforma da **AUVP Advisors**.

**CTA principal:** Quero me tornar um advisor AUVP.

## Vocabulário da página

Quatro regras valem para todo texto novo:

1. **Advisor**, não "consultor". A única exceção é o termo regulado — *consultor de valores mobiliários*, *consultoria de valores mobiliários* — que aparece nos avisos de CVM e no formulário porque é assim que a Resolução CVM 19/2021 nomeia a atividade. Trocar ali diria algo que não existe juridicamente.
2. **AUVP Advisors é substantivo feminino:** "a AUVP Advisors", "da AUVP Advisors", "na AUVP Advisors".
3. **Nada de "catálogo" nem "vitrine":** o produto é a **plataforma** ou o **sistema**.
4. **Sem travessão no texto visível.** Onde ele aparecia, a frase foi reescrita com ponto, vírgula ou dois-pontos. Vale para copy, `<title>`, `og:title` e `aria-label`; comentários de código seguem livres.

> **As regras acima valem inclusive sobre copy aprovada.** A rodada de copy dos benefícios chegou com três desvios — "destaque máximo na *vitrine*", "sua página oficial *no* AUVP Advisors" e "metodologia que faz sentido para o *membro*" —, e os três foram ajustados para *plataforma*, *na* e *cliente*. Se um desvio for intencional, mude a regra aqui primeiro; enquanto ela estiver escrita, a página inteira a segue.

## Stack

Página estática, sem build e sem dependências:

- `index.html` — todo o conteúdo, em seções semânticas
- `assets/css/styles.css` — estilos (paleta clara institucional derivada do design system AUVP)
- `assets/js/main.js` — configuração, formulário de interesse, menu mobile, reveal on scroll, timeline de entrada, destaque progressivo da lista de benefícios e calculadora de repasse
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

Além dessas, três constantes no mesmo bloco governam a calculadora de repasse:

| Constante | O que é | Valor atual |
|---|---|---|
| `TAXA_FEE_ANUAL` | Fee anual médio sobre o patrimônio sob custódia, usado para transformar tamanho de carteira em receita | `0.01` (1% ao ano) — referência de mercado, **a confirmar com o time comercial** |
| `REPASSE_MIN` | Piso do repasse ao advisor, derivado do comissionamento máximo da AUVP (30% do fee) | `0.7` (70%) |
| `REPASSE_MAX` | Teto do repasse ao advisor | `0.8` (80%) |

A observação exibida abaixo do controle é escrita a partir dessas três, então mudar um número mantém conta e texto alinhados. Os percentuais que aparecem na legenda da barra de divisão (70%, +10%, 20% a 30%) estão no HTML e precisam ser ajustados junto se a faixa mudar.

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

1. **Fotos** — a foto do hero é própria e está hospedada no repositório (`assets/img/hero-advisor.jpg`, 880×1012, ~120 KB). Veio como PNG de 2,3 MB e 1023×1537, foi recortada em torno do centro do corpo (x = 578 no original) **na mesma proporção da moldura, 4/4.6**, e convertida para JPEG. Isso é o que centraliza o rosto: o `object-fit: cover` só desloca a imagem no eixo em que ela sobra, então com a proporção batendo não há corte nenhum a mais. Se a foto for trocada, recorte na mesma proporção ou o enquadramento volta a fugir do centro. O PNG original segue no histórico do Git. Carrega com `fetchpriority="high"` por ser a primeira imagem da página.
2. **Razão social no rodapé** — o escopo prevê uma PJ específica para a AUVP Advisors. Quando ela existir, o rodapé precisa da razão social e do CNPJ.
3. **Taxa da calculadora** — a calculadora parte do patrimônio sob custódia, não do fee. A conversão de patrimônio em receita usa `TAXA_FEE_ANUAL`, hoje em 1% ao ano; enquanto o número não for confirmado, a obs. abaixo do controle deixa a premissa visível para o visitante.
4. **Benefícios em lista, não em cartões** — a dobra já passou por abas, grade de três colunas e bento; todas as versões esbarravam no mesmo problema: seis caixas do mesmo tamanho viram seis blocos de texto. Hoje é uma **coluna fixa à esquerda** (título, resumo e contador do item em leitura) com a **lista rolando à direita**, itens separados por filete. O movimento vem da leitura — o item que cruza a faixa central da tela recebe `is-ativo` e tem o número preenchido —, não de um clique, então nada fica escondido. **Cada item tem um teto de conteúdo:** título curto, uma frase de até duas linhas e uma fila de palavras-chave (`.tags`). O que não couber aí vira palavra-chave, não parágrafo. Um benefício novo é só mais um `<li>`: a lista não tem grade para fechar
5. **O que define o repasse entre 70% e 80%** — a página diz que o repasse vai de 70% a 80% e que o comissionamento da AUVP fica entre 20% e 30%, mas **não diz o que move o percentual dentro dessa faixa** (volume de carteira, tempo de casa, nota técnica?). Enquanto a regra não for definida, a calculadora mostra sempre as duas pontas. Quando existir, vale trocar a faixa por um resultado único — a mudança fica em `REPASSE_MIN`/`REPASSE_MAX` e na legenda da barra.
6. **Verba de marketing** — o bloco de R$ 10.000 em verba de marketing para os primeiros advisors aprovados está de volta à página, logo abaixo da calculadora. **Confirmar antes de publicar:** a última informação registrada era de que o benefício seguia em validação. A comissão fixa de 80% que acompanhava esse bloco na versão antiga **não voltou** — 80% hoje é o teto do repasse para todo mundo, e reintroduzir a condição especial contradiria o resto da dobra.
7. **Conteúdo que segue fora** — o quadro "Como você assina" (chancela *consultor AUVP* × *advisor*) saiu da dobra de benefícios e a regra permanece apenas no aviso legal do rodapé. **Pendente de validação do jurídico**, ainda mais agora que a página trata todo mundo por *advisor*.

## Decisões adotadas a partir do documento de escopo

A página foi originalmente construída a partir do briefing de comunicação. Onde o documento *AUVP Advisor: Resumo Completo do Projeto* diverge dele, **o documento prevaleceu**, por ser posterior e por conter as decisões comerciais e jurídicas. As premissas:

- **Repasse de 70% ou mais**, não 50%. O escopo define comissionamento da AUVP de até 30% do fee, o que fixa o piso do consultor em 70%. O briefing dizia "repasse inicial de 50%" — tratado como desatualizado.
- **Os 80% são o teto do repasse, aberto a todos.** Não existe condição especial para os 20 primeiros: a faixa vai de 70% a 80% e a página trata todo advisor pela mesma régua. As menções ao benefício de quem chegasse primeiro — comissão fixa de 80% e verba de R$ 10 mil em marketing — foram removidas da dobra de benefícios, do texto do processo de entrada e do aviso legal do rodapé.
- **O que move o repasse dentro da faixa ainda não está definido.** Por isso a calculadora mostra piso e teto juntos, nunca um número só.
- **A calculadora parte do patrimônio sob custódia.** O controle anda de R$ 1 mi a R$ 250 mi (começando em R$ 20 mi); o fee anual sai daí por `TAXA_FEE_ANUAL` e o repasse, por `REPASSE_MIN`/`REPASSE_MAX`. A barra de divisão é demonstrada sobre R$ 100 de fee.
- **O advisor não recebe suporte de banking, e o fluxo é o inverso.** O segundo cartão da dobra de operação prometia "suporte operacional e em Banking" ao advisor — leitura errada do modelo. Quem oferece conta, cartão e os demais produtos é a **AUVP, diretamente ao cliente**; o advisor não distribui, não intermedia e não é remunerado por eles, e a consultoria de valores mobiliários segue independente. A copy passou a ser "possibilite que seus clientes usufruam do ecossistema AUVP", com a ressalva de compliance no rodapé do cartão. A palavra-chave "Banking" também saiu da lista de benefícios pelo mesmo motivo.
- **A calculadora declara que os valores são brutos.** A observação abaixo do controle diz, com todas as letras, que a projeção não desconta nenhum tipo de tributação e que por isso os valores reais podem variar. O aviso legal do rodapé repete a mesma ressalva.
- **A faixa de números do ecossistema saiu da página** (+1 Mi alcançados, +45 mil contas, +60 mil alunos). Com ela foram embora o CSS de `.stats`/`.stat` e a função `iniciarContadores()` do `main.js`.
- **O BTG aparece só em texto, nunca como marca.** A cláusula 33a do acordo operacional é explícita: *"As Partes não poderão utilizar a marca e/ou nome da outra Parte, salvo se expressamente autorizado, por escrito, pela Parte detentora da marca e/ou nome."* Enquanto a autorização prévia do BTG não existir, **não entra logo, lockup nem qualquer aplicação da marca deles na página** — os arquivos do co-brand foram removidos do repositório justamente para que não fiquem servidos publicamente pelo Pages. A menção textual à instituição permanece, acompanhada do aviso de que a vinculação depende do compliance dela.
  > A mesma cláusula cobre "marca **e/ou nome**", então a menção em texto depende da mesma autorização. Tirar o logo ameniza, mas não zera — vale confirmar com o jurídico antes de publicar.
- **A exclusividade de marca ficou só no rodapé.** A regra segue definida — quem atende 100% dentro da plataforma usa a chancela "consultor AUVP", quem mantém clientes fora se apresenta como "advisor" —, mas o quadro que a explicava saiu com a reformulação da dobra de benefícios. Hoje ela aparece apenas no aviso legal. **Pendente de validação do jurídico.**

## Design

- **Logo:** AUVP Advisors (`assets/img/auvp-advisors.svg`). O desenho é `fill="currentColor"`, então **não existe versão preta e versão branca do arquivo** — a cor sai do token `--logo`, que cada superfície declara como branco ou preto puro, o extremo oposto do fundo. Ele é embutido uma vez no topo do `index.html` como `<symbol>` e reusado por `<use>` na navegação e no rodapé.
  > Detalhe que custa meia hora de depuração: o `<use>` ancora o símbolo em `(0,0)` do sistema de coordenadas de quem o instancia. A `viewBox` **externa** precisa começar em `0 0`; quem carrega o recorte real do desenho (`19.6 37.4 …`) é a `viewBox` do `<symbol>`. Repetir o recorte nas duas empurra o logo para fora do quadro e corta o topo.
- **Fontes:** **Satoshi** (Fontshare/ITF) em toda a página. Os três tokens `--font-display`, `--font-body` e `--font-ui` continuam existindo porque marcam intenção, mas hoje os três apontam para a mesma família.
  - **Só os pesos que a Satoshi tem: 300, 400, 500, 700 e 900.** Ela não tem 600 nem 800 — pedir esses valores faz o navegador arredondar para cima (600 → 700, 800 → 900) e engordar o texto sem aviso. Todo o CSS foi normalizado para 400/500/700
  - A fonte vem do CDN da fundição por `<link>`. A licença permite hospedar os arquivos junto do site, o que é preferível (menos uma dependência de terceiros no caminho crítico) — não foi feito porque o ambiente de desenvolvimento remoto bloqueia hosts externos e não dá para baixar os `.woff2` de dentro dele
- **Cores:** a página é **escura por padrão**, na identidade da plataforma. Três fundos: `--ink-0` `#0D0E10` (hero, CTA final, rodapé e painel da calculadora), `--ink-1` `#121316` (dobras escuras) e `--ink-2` `#191B1E` (cartão sobre o escuro). O **osso** `#EFEDE8` entra como pausa, não como tema — duas dobras apenas ("O que é" e "O caminho para fazer parte")
- **Um acento só:** o laranja `--accent` `#D9743F`. Ele marca tudo que é ação ou ênfase e nada mais. **Sobre o laranja o texto é sempre a tinta escura** `--ink-0` (6:1); em branco o par daria 3,2:1 e reprovaria em qualquer tamanho. Sobre o osso o laranja cheio cai para 3,4:1, então existe `--accent-ink` `#A8501F` — o token `--accent-legivel` escolhe um ou outro conforme a dobra
- **Ênfase por cor é reservada:** só o título do hero e o do CTA final levam laranja. Os títulos de dobra enfatizam por peso. É o que mantém o laranja significando "aqui" em vez de virar decoração
- **Textura:** pontilhado esmaecido com vinheta no hero e anéis concêntricos atrás do CTA final, ambos em `rgba(255,255,255,0.05–0.07)` e mascarados antes de encostar no conteúdo. A página abre e fecha com a mesma matéria
- **Superfícies:** cada dobra declara `.surface-dark`, `.surface-deep` ou `.surface-bone`, e **cada classe redeclara o conjunto inteiro de tokens** — `--surface`, `--surface-raised`, `--ink`, `--ink-muted`, `--ink-faint`, `--border`, `--border-strong`, `--tint`, `--accent-legivel`, `--danger` e `--logo`. Por isso não existe variante "clara" ou "escura" de componente: trocar a classe da dobra reescreve tudo que está dentro dela. Foi assim que `.checklist--light` e os overrides brancos de `.operacao` e `.footer` puderam sumir
- **Formas:** raios contidos (3–6px) na interface — leitura sóbria e institucional. Duas exceções deliberadas: o **arco da foto do hero**, em um lado só (topo) e com os outros três retos; e os **nós da timeline**, circulares
- **Sem ornamento solto:** a página não tem ícone decorativo nem bloco geométrico de enfeite. O que existe ou carrega informação (as marcas ✓/✕ do "é para você", o olho da marca no CTA final, os nós numerados da timeline) ou não está lá. Saíram nesta linha o retângulo cinza deslocado atrás da foto do hero, o escudo acima do bloco de regularização e os seis ícones dos benefícios
- **Alturas iguais dentro de uma fileira — quando as massas são comparáveis.** Nas cinco etapas da timeline e nos quatro nós do fluxo isso vem de `align-items: stretch` na grade, e os textos têm tamanho parecido de propósito. **A regra que importa não é "mesma altura", é "sem espaço inventado":** massa parecida fecha na mesma linha de base, com o último elemento ancorado por `margin-top: auto`; massa pela metade alinha pelo topo, porque esticar abriria um vão dentro do cartão mais curto. Foi o que derrubou a versão em dois cartões da dobra de operação — o primeiro tinha metade do conteúdo do segundo
- **Espaçamento:** escala única em `--sp-1` … `--sp-8` mais `--sp-section` (o respiro vertical das dobras). Todo padding, gap e margem de página sai daí — não há valores soltos. São duas cadências verticais e só duas: as dobras usam `--sp-section` (hero incluído) e a faixa de números usa `--sp-8`, deliberadamente mais apertada por ser uma faixa. Medidas internas de componente (altura de botão, gap de campo de formulário, respiro das palavras-chave) ficam abaixo da escala e não valem como exceção
- **Responsivo:** verificado sem rolagem horizontal nem estouro de elemento em 320, 390, 834, 1100, 1280 e 1440px. Os pontos de quebra seguem o conteúdo, não o dispositivo: os benefícios perdem a coluna fixa abaixo de 64rem — o bloco de introdução volta ao fluxo, o contador some (não há mais o que acompanhar) e a lista segue abaixo; a calculadora vai de duas colunas para uma abaixo de 64rem e empilha as três caixas de resultado abaixo de 40rem; a timeline vai de 5 para 3 e depois 1 coluna; abaixo de 26rem os botões deixam de ser `nowrap` e os grandes ocupam a largura toda — sem isso o rótulo longo do CTA estica a coluna e estoura a página
- **Componentes:** hero em duas colunas com foto em frame arqueado, cadeia do fluxo na dobra escura de operação, lista de seis benefícios com coluna fixa, calculadora de repasse logo abaixo (controle à esquerda, painel escuro de resultado à direita), timeline horizontal do processo de entrada com o bloco de apoio à regularização e formulário de interesse
- **A dobra de operação é um fluxo, não dois cartões.** O conteúdo dela sempre foi uma cadeia — quem entra por trás da operação e quem chega direto no cliente —, e descrito em duas caixas de texto isso só aparecia para quem lesse tudo. Agora são quatro nós numa linha: `BTG Pactual → Você → Seu cliente ← AUVP`. **A última seta aponta para trás de propósito, e é a única em laranja:** é ela que mostra que o ecossistema chega no cliente sem passar pelo advisor, que é justamente a regra de compliance da dobra. Empilhado, o fluxo vira coluna e as setas giram — a direção continua sendo a informação, não enfeite. Os nós são mantidos curtos e do mesmo tamanho para a fileira fechar sem vão; as duas notas de compliance ficam abaixo, onde têm espaço
- **Acento em escala na timeline:** os cinco nós usam `--etapa-1` … `--etapa-5`, do laranja lavado na primeira etapa ao laranja cheio na última — que é o tom mais fundo dos cinco —, e o trilho é um gradiente entre as duas pontas. A escala mostra o avanço antes de o texto ser lido. **A tinta dentro do nó é a escura em todas as etapas**, e os cinco passos vão de 13,6:1 a 6:1 contra `--ink-0`; com número branco o laranja cheio daria 3,2:1. Ao mexer na escala, confira o contraste antes
- **Compliance:** faixa de repasse de 70% a 80% declarada como definida em contrato, comissionamento da AUVP de até 30% declarado junto à calculadora, premissa de fee exposta abaixo do controle, vinculação ao BTG sinalizada como sujeita ao compliance da instituição e sem nenhuma aplicação da marca deles, suporte à regularização diferenciado de garantia de registro, e disclaimers da Resolução CVM 19/2021 no hero, no formulário e no rodapé
