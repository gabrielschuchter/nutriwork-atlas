# Nutriwork Atlas — inventário de assets

**Data:** 2026-08-31  
**Escopo:** assets do ecossistema Nutriwork auditado para possível reutilização no Atlas.  
**Regra:** inventário não é autorização de publicação; direitos, finalidade e otimização ainda precisam ser confirmados.

## Fontes e classificação

| Fonte | Evidência atual | Decisão de uso |
| --- | --- | --- |
| `C:\Users\gabsc\Documents\Codex\nutriwork-plus\public` | 42 arquivos raster, 3.918.895 bytes | Fonte digital oficial mais próxima do Atlas UI; reutilizar seletivamente |
| `D:\Nutriwork` | 9 SVGs Canva, 3.096.122–54.624.337 bytes | Referência visual/original; não copiar integralmente para o bundle sem otimizar |
| `D:\ID VISUAL NUTRIWORK.pdf` | 11 páginas de identidade, inspeção visual feita | Autoridade para símbolo/lockup/editorial até validação humana |
| `D:\Nutriwork Design System.pdf` | 33 páginas, WeasyPrint | Documento de método/auditoria; não substitui assets finais |
| Vault `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork` | 140 Markdown, sem imagens/attachments | Fonte de conteúdo; não possui assets para publicação |

## Assets oficiais raster encontrados em `nutriwork-plus/public`

| Grupo | Arquivos | Dimensões observadas | Uso indicado |
| --- | --- | --- | --- |
| Cursos | `course-behavior.jpg`, `course-biochemistry.jpg`, `course-clinical.jpg`, `course-community.jpg`, `course-evidence.jpg`, `course-intro.jpg`, `course-maternal.jpg`, `course-physiology.jpg`, `course-sports.jpg` | Capas verticais; principais entre 1066×1599 e 1076×1609; algumas 320×480 | Referência do ecossistema de aprendizagem; só importar se uma página Atlas precisar de contexto de produto |
| Marca/UI | `favicon-nutriwork.png` (500×500), `og-nutriwork.jpg` (1200×630) | Raster | Favicon/metadata após validação do lockup |
| Produto | `estude-cover.webp`, `evidence-shape.webp`, `mentor-gabriel.webp`, `nutriwork-banner-pc.webp`, `featured-badge-labeled.webp` | Formatos verticais, transparentes e banner; dimensões devem ser confirmadas no pipeline | Hero/edição somente quando a função estiver no escopo |
| Eventos | `assets/partners-events/event-01.webp`, `02`, `03`, `05`, `06`, `07`, `08`, `10`, `11`, `13`, `14` | 1400/1800 px; horizontais e verticais | Não publicar automaticamente no Atlas de conhecimento; referência de identidade e futura página institucional |
| Referências | `assets/references-drive/beatriz-gracia.webp`, `davi-costa.webp`, `grazieli-benedetti.webp`, `guilherme-costa.webp`, `guilherme-moreira.webp`, `guilherme-villas.webp`, `igor-eckert.webp`, `laura-luna.webp`, `mariana-whelan.webp`, `rodrigo-pabrica.webp`, `rose-borba.webp`, `thales-faccin.webp`, `victor-pimenta.webp`, `vini-meraki.webp`, `wyllian-oliveira.webp` | Retratos verticais | Não usar como conteúdo editorial do Atlas sem finalidade e autorização confirmadas |

Os arquivos raster do pacote são compactos para o site atual, mas a dimensão/uso deve ser preservada com `width`, `height`, `loading` e `object-fit` adequados. Não aplicar `object-fit: cover` a arte com texto sem inspeção, pois isso corta informação editorial.

## SVGs em `D:\Nutriwork`

| Arquivo | Bytes | SHA-256 | Dimensão declarada |
| --- | ---: | --- | --- |
| `2.svg` | 15.833.330 | `82d3e635444438d7990fc12382bd02b283e3c94fa368c4eebc9341818400a4dd` | 1366×1529; viewBox `0 0 1024.5 1146.749971` |
| `3.svg` | 3.096.122 | `7f4478b99819e9dd829dc42e792a9cff487d26c52c0e575fefbe9c7e774f2586` | 1366×902; viewBox `0 0 1024.5 676.49998` |
| `4.svg` | 11.687.546 | `5436206d9b830e51927312ea07518d3c99c22af41ccda03282632fc042015ed5` | 1366×1714; viewBox `0 0 1024.5 1285.500006` |
| `6.svg` | 4.236.657 | `56c61c61e4a6de24906e3985b3a6769d6937a98a7bfbaa7e39a57463c16794a1` | 1366×1494; viewBox `0 0 1024.5 1120.500006` |
| `7.svg` | 11.939.219 | `db6f100975b488b9b0b3080d55a19386cf02b787d474a0780994fdfa561717a9` | 1366×1018; viewBox `0 0 1024.5 763.499972` |
| `8.svg` | 15.461.941 | `8653cf23ea2c32f2c70f23c6a874f305674b37a80ec50cc31572c73d6a28d31e` | 1366×5880; viewBox `0 0 1024.5 4409.99979` |
| `9.svg` | 27.537.847 | `ad077fad029a98037aa7a470f970f36c5353950f2e52643f19f7dca8e3fbcfd4` | 1366×768; viewBox `0 0 1024.5 576` |
| `ESTUDE! - Nutriwork.svg` | 33.584.351 | `626dceb389223c113ce723f4ae2c4f6682186bb2ea88f0cfd70eb92f7789c3ef` | 1366×4254; viewBox `0 0 1024.5 3190.499983` |
| `ESTUDE! - Nutriwork (2).svg` | 54.624.337 | `80c436bedc4961af57e443d3fb239ae0b7567115de5f33f017991dacf97b7091` | 1366×5567; viewBox `0 0 1024.5 4175.249759` |

São exports grandes com conteúdo embutido. Devem permanecer fora do fluxo inicial até haver decisão sobre compressão, licenciamento e necessidade real.

## Identidade visual observada

- O PDF de identidade mostra um símbolo de anéis orgânicos sobrepostos e um lockup `NUTRIWORK / GRUPO DE ESTUDOS`; há versões preta/azul e material editorial com placeholders.
- O `favicon-nutriwork.png` é um símbolo azul sobre transparência/escuro; não deve ser tratado automaticamente como lockup completo.
- A arte `estude-cover.webp` contém texto; qualquer uso precisa manter proporção intrínseca e inspeção visual em cada viewport.
- As imagens de pessoas e eventos são evidência da marca atual, não conteúdo científico do vault.

## Ações antes de publicar assets

1. Confirmar com o responsável quais arquivos possuem autorização de publicação no Atlas.
2. Definir lockup e favicon oficiais para o produto Atlas; não reconstruir o logo com texto arbitrário.
3. Gerar versões web otimizadas apenas para os assets realmente usados e registrar hashes/arquivos derivados.
4. Validar contraste, foco, `alt`, lazy loading, proporção, `prefers-reduced-motion` e ausência de crop em arte com texto.
5. Manter os originais fora do bundle e sem alterar os arquivos fonte.

