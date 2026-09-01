# Quartz v5

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Nutriwork Atlas

Este checkout contém o Atlas protegido do Nutriwork, publicado sobre Quartz v5. As notas científicas vivem em `content/atlas/`; a classificação por área fica no sidecar `data/atlas-areas.json`, o índice de navegação é gerado no build e `/atlas/` é a Home orientada à experiência de estudo.

### Desenvolvimento e validação

```bash
npm ci
npm run atlas:index
npm run check
npm test
npm run vault:check
npm run build
```

Rotas de estudo: `/`, `/atlas/`, `/hoje`, `/revisar`, `/trilhas`, `/biblioteca`, `/mais-conectados`, `/lacunas-da-rede`, `/mapa-do-atlas`, `/estrutura-da-rede`, `/favoritos`, `/recentes`, `/busca-avancada` e `/grafo`. Favoritos, histórico, retomada, sessões, reviews, destaques, cartões, listas e preferências ficam somente no navegador; não há backend nem sincronização pessoal.

O índice é derivado de wikilinks reais. Links ausentes são apresentados como diagnóstico e não geram conceitos automaticamente. O script `npm run vault:check` compara o checkout com o vault Nutriwork antes da entrega. O relatório da rodada de QA está em [`docs/qa-hardening.md`](docs/qa-hardening.md), com o inventário completo em [`docs/route-inventory.md`](docs/route-inventory.md).

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
