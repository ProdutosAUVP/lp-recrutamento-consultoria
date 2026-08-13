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

## Pontos de atenção antes de publicar

1. **URL do CTA** — definir em `assets/js/main.js` (`SIGNUP_URL`). Enquanto for `#interesse`, os botões rolam até a seção final.
2. **Fotos** — as fotos de pessoas são **placeholders do Unsplash referenciados por URL** (hotlink). Substituir por fotos próprias (hospedadas em `assets/img/`) antes do lançamento. O ambiente de desenvolvimento remoto bloqueia esses hosts, mas no navegador dos visitantes elas carregam normalmente.
3. **Números do ecossistema** — a seção de stats usa apenas números do briefing (repasse, incentivo, etapas). Há um comentário no HTML reservando o espaço para métricas do ecossistema (alunos, patrimônio, NPS etc.) quando houver dados atualizados e comprováveis.
4. **Perfis ilustrativos** — os chips do hero e o card de perfil da vitrine usam nomes fictícios, sinalizados como ilustrativos.

## Design

- **Fontes:** Fraunces (display serifada), Roboto (corpo), Sora (UI/labels)
- **Cores:** paleta clara institucional — creme `#F6F3EC`, verde AUVP Capital `hsl(155 93% 11%)` como cor primária (botões, títulos em itálico, banda "Sua carteira" e rodapé) e dourado do olho `#F0BF4F` em destaques
- **Componentes:** hero em duas colunas com foto em frame arqueado e chips/cards flutuantes, bento grid de benefícios com card fotográfico, mock de perfil do catálogo e etapas numeradas — com base nas referências visuais do briefing
- **Compliance:** condições do incentivo de R$ 10 mil explícitas, vinculação BTG sinalizada como sujeita a critérios, suporte jurídico diferenciado de garantia de registro, e disclaimers da Resolução CVM 19/2021 no hero, no CTA final e no rodapé
