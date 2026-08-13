# LP — Recrutamento de Consultores (AUVP Advisors)

Landing page para atrair consultores de valores mobiliários para o catálogo do **AUVP Advisors**.

**CTA principal:** Quero ser um consultor AUVP.

## Stack

Página estática, sem build e sem dependências:

- `index.html` — todo o conteúdo, em seções semânticas
- `assets/css/styles.css` — estilos (paleta clara institucional derivada do design system AUVP)
- `assets/js/main.js` — configuração, formulário de interesse, menu mobile, reveal on scroll e animação do gráfico de repasse
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

### Formulário de interesse

Coleta exatamente os cinco campos definidos no escopo — WhatsApp, e-mail, registro na CVM, metodologias e anos de experiência — mais o consentimento de LGPD. O `POST` envia JSON com as chaves `whatsapp`, `email`, `registro`, `metodologias`, `experiencia`, `consentimento` e `origem`.

Quem responde "sem registro na CVM" recebe na hora uma mensagem dizendo que ainda pode se cadastrar e que o time envia o tutorial de registro — a pergunta qualifica o lead sem descartá-lo.

O escopo não pede o nome do consultor, então o formulário não o coleta. Se o time quiser, é um campo a mais no HTML e no JSON.

## Outros pontos de atenção

1. **Fotos** — as fotos de pessoas são **placeholders do Unsplash referenciados por URL** (hotlink). Substituir por fotos próprias (hospedadas em `assets/img/`) antes do lançamento. O ambiente de desenvolvimento remoto bloqueia esses hosts, mas no navegador dos visitantes elas carregam normalmente.
2. **Números do ecossistema** — a faixa de stats usa apenas números que constam do escopo. Há um comentário no HTML reservando o espaço para métricas do ecossistema (alunos, patrimônio acompanhado, NPS etc.) quando houver dados atualizados e comprováveis.
3. **Perfis ilustrativos** — os chips do hero e o card de perfil da vitrine usam nomes fictícios, sinalizados como ilustrativos. As certificações exibidas são as seis realmente aceitas.
4. **Razão social no rodapé** — o escopo prevê uma PJ específica para o AUVP Advisor. Quando ela existir, o rodapé precisa da razão social e do CNPJ.

## Decisões adotadas a partir do documento de escopo

A página foi originalmente construída a partir do briefing de comunicação. Onde o documento *AUVP Advisor: Resumo Completo do Projeto* diverge dele, **o documento prevaleceu**, por ser posterior e por conter as decisões comerciais e jurídicas. As premissas:

- **Repasse de 70% ou mais**, não 50%. O escopo define comissionamento da AUVP de até 30% do fee, o que fixa o piso do consultor em 70%. O briefing dizia "repasse inicial de 50%" — tratado como desatualizado.
- **Os 80% são a condição fixa dos 20 primeiros**, não o topo de uma progressão aberta a todos. O gráfico mostra as duas condições lado a lado.
- **Critérios do incentivo não são enumerados.** O escopo registra que ainda não foram definidos (pendência do Matheus Malheiros), então a página diz apenas que existem critérios a divulgar. Os números que estavam no ar (carteira de R$ 10 milhões, média ≥ 8) saíram.
- **Certificações limitadas à lista aceita:** CPA, CPRO-R, CPRO-I, CNPI-T, CNPI-P e CGE. As que apareciam nos perfis de exemplo (CFP®, CGA, CFA) não constam da lista e foram trocadas.
- **A exclusividade de marca está na página.** O escopo trata como ponto em aberto se ela entra no *onboarding*, mas a regra em si está definida — quem atende 100% dentro da plataforma usa a chancela "consultor AUVP", quem mantém clientes fora se apresenta como "advisor". Omitir isso de uma página dirigida a quem já tem carteira própria criaria frustração previsível. **Pendente de validação do jurídico.**

## Design

- **Logo:** AUVP Capital horizontal (versão preferencial do design system), preta na navegação e branca no rodapé. Os SVGs vêm de [armandocustodio-ds/designsystemauvp](https://github.com/armandocustodio-ds/designsystemauvp) — o manifesto C2PA embutido foi removido para reduzir o arquivo de ~22 KB para ~4 KB
- **Fontes:** Anek Latin (display), Roboto (corpo), Sora (UI/labels) — todas sem serifa, iguais às do design system
- **Cores:** as dobras alternam entre `#FFFFFF` e `#F6F6F6`; as dobras escuras ("Sua carteira" e rodapé) são pretas. Verde AUVP Capital `hsl(155 93% 11%)` e dourado do olho `#F0BF4F` ficam como acento (botões, ênfases, gráfico do repasse), nunca como fundo de dobra
- **Superfícies:** cada dobra declara `.surface-white` ou `.surface-gray`, que definem as variáveis `--surface` (fundo da dobra) e `--surface-raised` (tom oposto). Os cartões usam `--surface-raised`, então sempre contrastam com a dobra em que estão — inverta a classe da dobra e os cartões se ajustam sozinhos
- **Formas:** raios contidos (3–6px) na interface — leitura sóbria e institucional. Três exceções deliberadas: o **arco das fotos**, sempre em um lado só e com os outros três retos (topo no hero, direita na banda "Sua carteira"); os **chips de consultor** sobre as fotos, em pílula; e os **rostos**, sempre circulares
- **Componentes:** hero em duas colunas com foto em frame arqueado e chips/cards sobrepostos, bento grid de benefícios com card fotográfico, mock de perfil do catálogo e etapas numeradas — com base nas referências visuais do briefing
- **Compliance:** benefícios de lançamento marcados como limitados aos 20 primeiros e sujeitos a critérios, vinculação BTG sinalizada como sujeita a critérios, suporte jurídico diferenciado de garantia de registro, regra de uso da marca no rodapé, e disclaimers da Resolução CVM 19/2021 no hero, no formulário e no rodapé
