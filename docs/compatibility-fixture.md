# Fixture de compatibilidade Obsidian

Esta fixture é sintética, técnica e não científica. Ela fica fora de `content/` para não entrar no conteúdo publicável nem no grafo do Atlas.

## Cobertura

`tests/fixtures/obsidian/` exercita YAML properties, alias de wikilink, link ausente, callout, destaque, tarefas, tabela GFM, código, matemática, Mermaid, imagem SVG, embed de arquivo, transclusão, referência de bloco, footnote, âncora de heading e Canvas.

## Execução

```powershell
npx quartz build -d tests/fixtures/obsidian -o tmp/compatibility-public
```

O build executado em 31/08/2026 terminou sem erro (`Quartz v5.0.0`, 2 Markdown, 66 arquivos emitidos) e gerou HTML para as duas notas Markdown e a página Canvas. A inspeção do HTML confirmou properties, alias, link ausente, callout, destaque, checkbox, tabela, código, KaTeX, Mermaid, SVG, transclusão, referência de bloco, footnote, âncora e Canvas. O HTML gerado é descartável e fica em `tmp/`, que está no `.gitignore`.

## Limite

O resultado desta fixture prova a capacidade do pipeline Quartz para os formatos exercitados; não altera nem afirma que o vault real usa esses recursos. Qualquer conteúdo científico continua vindo byte a byte do vault.
