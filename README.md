# Nutriwork Atlas

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

O Atlas é o grafo de conceitos do Nutriwork. O produto tem uma única superfície: acesso, onboarding curto, exploração do grafo e leitura das notas científicas.

As notas vivem em `content/atlas/` e permanecem imutáveis. A classificação por área fica em `data/atlas-areas.json`; o índice compacto é gerado no build em `quartz/static/atlas-index.json`.

### Desenvolvimento e validação

```bash
npm ci
npm run atlas:index
npm run check
npm test
npm run vault:check
npm run build
```

Rotas do MVP: `/` para exploração e `/atlas/<conceito>` para leitura. Não há dashboards, páginas analíticas, biblioteca pessoal, trilhas, revisão, favoritos ou busca paralela.

O índice é derivado de wikilinks reais e usado somente para navegação, filtros, previews e minimapa. O script `npm run vault:check` compara o checkout com o vault Nutriwork antes da entrega. O relatório atual está em [`docs/qa-hardening.md`](docs/qa-hardening.md), com o inventário em [`docs/route-inventory.md`](docs/route-inventory.md).

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
