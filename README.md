# LP — Recrutamento de Consultores (AUVP Advisors)

Landing page para atrair consultores de valores mobiliários para o catálogo do **AUVP Advisors**.

**CTA principal:** Quero ser um consultor AUVP.

## Stack

Página estática, sem build e sem dependências:

- `index.html` — todo o conteúdo, em seções semânticas
- `assets/css/styles.css` — estilos (paleta clara institucional derivada do design system AUVP)
- `assets/js/main.js` — menu mobile, reveal on scroll, animação da barra de repasse
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

## Pontos de atenção antes de publicar

1. **URL do CTA** — definir em `assets/js/main.js` (`SIGNUP_URL`). Enquanto for `#interesse`, os botões rolam até a seção final.
2. **Fotos** — as fotos de pessoas são **placeholders do Unsplash referenciados por URL** (hotlink). Substituir por fotos próprias (hospedadas em `assets/img/`) antes do lançamento. O ambiente de desenvolvimento remoto bloqueia esses hosts, mas no navegador dos visitantes elas carregam normalmente.
3. **Números do ecossistema** — a seção de stats usa apenas números do briefing (repasse, incentivo, etapas). Há um comentário no HTML reservando o espaço para métricas do ecossistema (alunos, patrimônio, NPS etc.) quando houver dados atualizados e comprováveis.
4. **Perfis ilustrativos** — os chips do hero e o card de perfil da vitrine usam nomes fictícios, sinalizados como ilustrativos.

## Design

- **Logo:** AUVP Capital horizontal (versão preferencial do design system), preta na navegação e branca no rodapé. Os SVGs vêm de [armandocustodio-ds/designsystemauvp](https://github.com/armandocustodio-ds/designsystemauvp) — o manifesto C2PA embutido foi removido para reduzir o arquivo de ~22 KB para ~4 KB
- **Fontes:** Anek Latin (display), Roboto (corpo), Sora (UI/labels) — todas sem serifa, iguais às do design system
- **Cores:** paleta clara institucional — creme `#F6F3EC`, verde AUVP Capital `hsl(155 93% 11%)` como cor primária (botões, títulos em itálico, banda "Sua carteira" e rodapé) e dourado do olho `#F0BF4F` em destaques
- **Formas:** raios contidos (3–6px) na interface — leitura sóbria e institucional. Três exceções deliberadas: o **arco das fotos**, sempre em um lado só e com os outros três retos (topo no hero, direita na banda "Sua carteira"); os **chips de consultor** sobre as fotos, em pílula; e os **rostos**, sempre circulares
- **Componentes:** hero em duas colunas com foto em frame arqueado e chips/cards sobrepostos, bento grid de benefícios com card fotográfico, mock de perfil do catálogo e etapas numeradas — com base nas referências visuais do briefing
- **Compliance:** condições do incentivo de R$ 10 mil explícitas, vinculação BTG sinalizada como sujeita a critérios, suporte jurídico diferenciado de garantia de registro, e disclaimers da Resolução CVM 19/2021 no hero, no CTA final e no rodapé
