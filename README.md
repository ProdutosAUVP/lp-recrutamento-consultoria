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
- `assets/img/` — logo AUVP Advisors, olhos AUVP e a foto do hero
- `scripts/` — ferramentas de desenvolvimento: `auditar-classes.js` (auditoria de CSS) e `planilha-apps-script.gs` (o receptor do formulário, que roda no Google, não aqui). A pasta é excluída do deploy

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
| `FORM_ENDPOINT` | URL do Web App do Apps Script que grava na planilha de leads (ver "Planilha de leads") | O formulário valida os campos normalmente e avisa que o destino não foi configurado |
| `TERMS_URL` | Página de Termos de Uso | Os links ficam inertes e visivelmente desabilitados |
| `PRIVACY_URL` | Página de Política de Privacidade | Idem |
| `VIDEO_URL` | Embed do vídeo de lançamento | A dobra do vídeo fica oculta |

Além dessas, duas constantes no mesmo bloco governam o simulador de repasse:

| Constante | O que é | Valor atual |
|---|---|---|
| `TAXA_FEE_ANUAL` | Fee anual médio sobre o patrimônio sob custódia, usado para transformar tamanho de carteira em receita | `0.01` (1% ao ano) — referência de mercado, **a confirmar com o time comercial** |
| `REPASSE_TETO` | **Teto** do repasse do fee ao advisor, espelho do comissionamento mínimo de 30% da AUVP | `0.7` (até 70%) |

O aviso ao lado dos números é escrito a partir dessas duas, então mudar um número mantém conta e texto alinhados. Os percentuais da legenda da barra de divisão (até 70% e 30%) estão no HTML e precisam ser ajustados junto.

> **`REPASSE_TETO` é teto, não valor fixo.** O simulador projeta o melhor caso, e é por isso que o rótulo do valor leva asterisco e o aviso abre com "* SIMULAÇÃO" em destaque, dentro do painel escuro, colado no número. Não é letra miúda decorativa: é o que qualifica o resultado. Se um dia existir um piso definido, ele entra como segunda constante e o resultado volta a ser faixa.

### Formulário de interesse

Coleta os cinco campos definidos no escopo — WhatsApp, e-mail, registro na CVM, metodologias e anos de experiência — mais o **nome completo** e o consentimento de LGPD. O `POST` envia JSON com as chaves `nome`, `whatsapp`, `email`, `registro`, `metodologias`, `experiencia`, `consentimento` e `origem`.

O nome não consta da lista do escopo; foi acrescentado porque sem ele o time não tem como abrir o primeiro contato. É o único campo além do que o documento especifica.

Quem responde "sem registro na CVM" recebe na hora uma mensagem dizendo que ainda pode se cadastrar e que o time envia o tutorial de registro — a pergunta qualifica o lead sem descartá-lo.

## Planilha de leads (Google Sheets)

O destino do formulário é uma planilha do Google, alimentada por um **Web App do Google Apps Script**. Não há servidor nem serviço de terceiros no meio: a LP faz `POST` direto no Web App, e ele grava a linha.

O código do receptor está em **`scripts/planilha-apps-script.gs`**. Ele não roda no site — é colado no editor do Apps Script vinculado à planilha.

### Como publicar (uma vez só)

1. **Crie a planilha** no Google Drive, com o nome que o time preferir. Não precisa criar aba nem cabeçalho: o script cria a aba `Leads` e o cabeçalho no primeiro envio.
2. Nela, vá em **Extensões → Apps Script**.
3. Apague o `function myFunction() {}` que vem de exemplo e **cole o conteúdo de `scripts/planilha-apps-script.gs`**. Salve.
4. **Implantar → Nova implantação**, engrenagem → **App da Web**, e configure:
   - **Executar como:** `Eu`
   - **Quem pode acessar:** `Qualquer pessoa`
5. Na primeira implantação o Google pede autorização. A tela de "app não verificado" é esperada, por ser um script próprio: **Avançado → Acessar (nome do projeto)**.
6. Copie a **URL do app da Web**, que termina em `/exec`.
7. Cole essa URL em `FORM_ENDPOINT`, no topo de `assets/js/main.js`, e publique na `main`.

### Três armadilhas que custam tempo

| Armadilha | O que acontece | O certo |
|---|---|---|
| **"Qualquer pessoa com Conta do Google"** em vez de "Qualquer pessoa" | O Google devolve tela de login em vez de gravar, e todo envio falha | Tem que ser **Qualquer pessoa**, sem login. O script não expõe dado nenhum: só aceita `POST` e responde `{ok:true}` |
| **Editar o script e não reimplantar** | A URL continua servindo a versão antiga. É o erro mais comum, e o mais difícil de perceber, porque nada dá erro | Toda alteração no `.gs` pede **Implantar → Gerenciar implantações → editar (lápis) → Versão: Nova versão**. A URL não muda |
| **Trocar o `Content-Type` para `application/json`** | O navegador dispara um preflight `OPTIONS`, que Web App do Apps Script não responde, e o envio morre em CORS antes de sair | Manter `text/plain;charset=utf-8`. O corpo continua sendo JSON, lido em `e.postData.contents` |

### Conferindo se está no ar

- **A URL no navegador:** abrir o `/exec` direto deve devolver `{"ok":true,"servico":"AUVP Advisors — receptor de leads"}`. Se pedir login, o acesso está errado (armadilha 1).
- **Envio de verdade:** preencher o formulário no site publicado. A linha aparece na aba `Leads` na hora.
- **Quando algo falhar:** no editor do Apps Script, **Execuções** mostra cada chamada recebida e o erro, se houver. Se a página diz "não foi possível enviar" mas a linha aparece na planilha, o problema é a leitura da resposta, não a gravação.

### O que vai para a planilha

Uma coluna por campo, na ordem definida em `COLUNAS` dentro do `.gs`:

`Recebido em` · `Nome` · `WhatsApp` · `E-mail` · `Registro na CVM` · `Tempo de atuação` · `Metodologias` · `Consentimento LGPD` · `Origem`

- **`Recebido em` é carimbo do servidor**, em horário de São Paulo. O relógio do visitante não é confiável e o fuso dele muito menos.
- **Os slugs dos selects viram texto legível** (`pf-autorizada` → "Pessoa física autorizada pela CVM"). O mapa está em `ROTULOS`, no `.gs`.
- **`Origem`** guarda a URL de onde o envio partiu, útil quando houver mais de uma página ou campanha.
- Para acrescentar um campo, ele precisa entrar nos dois lados: no formulário do `index.html` e em `COLUNAS`. As linhas antigas seguem válidas, só ficam vazias na coluna nova.

### Anti-spam

O formulário tem um **campo-armadilha** (`empresa_site`) posicionado fora da tela. Pessoa nenhuma o vê ou tabula até ele, então qualquer valor preenchido veio de robô: o Apps Script responde `{ok:true}` para o robô não insistir, mas **não grava a linha**. Ele fica fora da validação por causa do atributo `data-hp`.

### LGPD

A planilha passa a conter **dado pessoal de terceiros** (nome, WhatsApp, e-mail). Antes de divulgar a LP, três coisas precisam de dono:

1. **Quem tem acesso ao arquivo** — compartilhar com as pessoas do time que trabalham o lead, não com "qualquer pessoa com o link".
2. **Por quanto tempo os dados ficam** — a página coleta o consentimento, mas não define retenção.
3. **A Política de Privacidade** — hoje `PRIVACY_URL` está vazia e o link aparece desabilitado na página. Enquanto ela não existir, o formulário coleta consentimento apontando para um documento que o visitante não consegue ler.

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
5. **O repasse é de até 70%** — teto, não valor fixo, e sem faixa declarada porque não existe piso definido. O simulador projeta o teto e diz isso no asterisco.
6. **Benefício de lançamento** — um só: **R$ 10.000 em verba de marketing** para os primeiros advisors aprovados, logo abaixo do simulador e repetido no aviso legal do rodapé. Carrega um selo de "sujeito a análise de elegibilidade" no próprio cartão, além da letra miúda que fecha o bloco: não é automático por ordem de chegada. Os critérios nunca foram definidos, então a página fala em "primeiros advisors" sem cravar quantidade. **Confirmar antes de publicar:** a última informação registrada era de que esse benefício seguia em validação. Se ele cair, sai daqui e do aviso legal ao mesmo tempo, para não sobrar promessa órfã no rodapé.
7. **Conteúdo que segue fora** — o quadro "Como você assina" (chancela *consultor AUVP* × *advisor*) saiu da dobra de benefícios e a regra permanece apenas no aviso legal do rodapé. **Pendente de validação do jurídico**, ainda mais agora que a página trata todo mundo por *advisor*.

## Decisões adotadas a partir do documento de escopo

A página foi originalmente construída a partir do briefing de comunicação. Onde o documento *AUVP Advisor: Resumo Completo do Projeto* diverge dele, **o documento prevaleceu**, por ser posterior e por conter as decisões comerciais e jurídicas. As premissas:

- **Repasse de 70% ou mais**, não 50%. O escopo define comissionamento da AUVP de até 30% do fee, o que fixa o piso do consultor em 70%. O briefing dizia "repasse inicial de 50%" — tratado como desatualizado.
- **O repasse é de até 70%, e os 80% não existem mais em lugar nenhum.** O teto é o espelho do comissionamento mínimo de 30% da AUVP. O número já mudou três vezes ao longo do projeto: 70% padrão com 80% para os 20 primeiros, depois "faixa de 70% a 80% para todos", depois padrão fixo de 70%, e enfim **até 70%, com os 80% descartados** ("essa ideia morreu"). **Ao mexer nele, mexa nos cinco lugares:** `REPASSE_TETO`, a `meta description`, o benefício 01 e suas palavras-chave, a legenda da barra de divisão e o aviso legal do rodapé.
- **A calculadora parte do patrimônio sob custódia.** O controle anda de R$ 1 mi a R$ 250 mi (começando em R$ 20 mi); o fee anual sai daí por `TAXA_FEE_ANUAL` e o repasse, por `REPASSE_TETO`. A barra de divisão é demonstrada sobre R$ 100 de fee.
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
- **Compliance:** repasse de até 70% declarado como definido em contrato, comissionamento da AUVP de no mínimo 30% declarado junto ao simulador, resultado marcado como simulação com asterisco colado no número, benefício de lançamento marcado como sujeito a análise de elegibilidade, premissa de fee exposta abaixo do controle, vinculação ao BTG sinalizada como sujeita ao compliance da instituição e sem nenhuma aplicação da marca deles, suporte à regularização diferenciado de garantia de registro, e disclaimers da Resolução CVM 19/2021 no hero, no formulário e no rodapé
