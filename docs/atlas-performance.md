# Auditoria de performance do Atlas

## Escopo e método

Esta auditoria cobre o grafo explorável real do Atlas, sem remover conceitos, conexões, rótulos, hover, preview, arraste, pan, zoom ou pinch. O índice usado na medição tinha 616 conceitos e 3.125 conexões; após a validação dos endpoints, o runtime desenhou 3.124 arestas válidas.

As medições foram executadas em Chromium, em build estático local, a 1280 × 720 e DPR 1. O contador de performance só é ativado com `?atlasPerf=1`; a rota normal não expõe esse instrumento. O ponto de partida do código foi `839e9213d1bf3a719710efd425eb52c76f815655`, na branch local `perf/atlas-deep-performance`.

## Baseline e resultado

O baseline foi coletado antes do ciclo de otimização, com a simulação configurada para manter `alphaTarget` acima de zero. O intervalo de idle durou 5.004,8 ms.

| Métrica | Antes | Depois | Evidência |
| --- | ---: | ---: | --- |
| Ticks de física em idle | 53,95/s | 0/s | snapshot de 5 s |
| RAF do grafo em idle | 53,95/s | 0/s | snapshot de 5 s |
| Draws em idle | 53,95/s | 0/s | snapshot de 5 s |
| Draw p50 / p95 / p99 | 2,9 / 4,1 / 4,4 ms | 1,9 / 3,2 / 4,0 ms | 60 frames, 1× |
| Hit-test p95 | não coletado | 0,1 ms | 60 amostras |
| Script em idle | não coletado | 0 ms em 2 s | Chrome Performance API |
| Tasks em idle | não coletado | 0,415 ms em 2 s | Chrome Performance API |
| Layout/style em idle | não coletado | 0 | Chrome Performance API |
| Long tasks no idle limpo | 0 | 0 | PerformanceObserver |
| Heap usado | 14,0 MB | 3,3 MB após GC explícito | snapshot isolado; sujeito ao GC |
| Inicialização do grafo | não coletado | 24 ms | contador de inicialização |

O heap não deve ser comparado como benchmark absoluto entre as duas sessões: o baseline não teve coleta de lixo forçada, e o valor depende do ciclo de vida do Chromium, do cache e dos instrumentos ativos.

Durante um arraste de nó, a física acordou, executou cerca de 42–50 ticks/s e voltou a dormir após a convergência. Em duas execuções, não houve long task durante os 350 ms de interação; uma execução longa registrou uma tarefa isolada de 59–65 ms durante o settling posterior, portanto esse gate continua sendo um ponto a confirmar com trace do dispositivo-alvo.

## Escala sintética do renderer

O benchmark usa o mesmo renderer Canvas, estilos e caminho de desenho do produto. Ele multiplica a cena em memória apenas durante a medição; não altera a topologia real, a física, o layout persistido ou o conteúdo.

| Fator | Conceitos / arestas | p50 | p95 | p99 | Máximo |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1× | 616 / 3.124 | 1,9 ms | 3,2 ms | 4,0 ms | 4,0 ms |
| 2× | 1.232 / 6.248 | 3,0 ms | 4,1 ms | 4,3 ms | 4,3 ms |
| 4× | 2.464 / 12.496 | 5,6 ms | 6,7 ms | 6,9 ms | 6,9 ms |

O renderer permaneceu abaixo de 8 ms no desktop, inclusive no cenário sintético 4×. A API Performance do Chromium usada nesta sessão não separa rendering e paint de forma confiável; o p95 do draw Canvas é a proxy reportada.

## Alterações aplicadas

- A física mantém exatamente as forças, distâncias, colisão, gravidade, decay e `alphaMin` existentes, mas passa a ter alvo estável zero, wake explícito para interação/resize e suspensão quando converge, a aba fica oculta ou a superfície sai do viewport.
- O grafo usa um único RAF coalescido, cache de posições/estilos/adjacência, culling conservador de arestas e nós e batching de arestas por estilo.
- Pointer move e wheel acumulam somente o estado mais recente por frame. O pinch continua ancorado no centroide e não reaquece a física indevidamente. O cache geométrico também é invalidado no fim das transições de tela, evitando que a escala visual intermediária do CSS contamine o anchor após navegação.
- Busca normaliza o texto uma vez no carregamento e reutiliza uma lista estável; persistência de layout/câmera é adiada para idle e escreve somente quando há mudança.
- Resize, `visualViewport`, visibilidade do documento e `IntersectionObserver` têm lifecycle único e cleanup explícito. A superfície recebeu apenas contenção de layout/paint e isolamento; blur, sombras, vidro e identidade Nutriwork foram preservados.
- A paleta do Canvas é sincronizada com o tema inicial. No modo claro, rótulos publicados usam `#07152A`; no modo escuro, `#F5F7FF`. A troca de tema continua redesenhando a cena.
- A preferência do sistema que reduzia animações foi removida do runtime, CSS e componentes do Atlas. As transições de câmera continuam com 300 ms.

Não foi adotado Worker/OffscreenCanvas: o idle já é totalmente suspenso e o renderer 4× permaneceu abaixo do orçamento de draw, sem evidência nesta sessão de que uma migração de stack produziria ganho líquido superior a 20%.

## Matriz responsiva

As sete dimensões foram verificadas no mesmo Chromium. Em todas, o canvas acompanhou a viewport, o grafo manteve 616 conceitos/3.124 arestas válidas e não houve overflow:

`390 × 844`, `430 × 932`, `768 × 1024`, `820 × 1180`, `1024 × 768`, `1366 × 768` e `1920 × 1080`.

Também foi executado WebKit 26.5 com emulação de `iPhone 15` (`393 × 659`, DPR 3) e `iPad Pro 11` (`834 × 1194`, DPR 2). Nos dois perfis, o grafo manteve 616 conceitos/3.124 arestas, não houve overflow nem erro de console, a animação de zoom permaneceu ativa, o pinch entrou em `pinch` e voltou a `idle`, e não foram observadas long tasks. No iPad, a inicialização/settling registrou 190 draws, p95 de 3 ms e repouso da física em alpha `0,000976`.

A validação física em iPhone/iPad com Safari/WebKit real continua pendente. DPR 1,5/2, safe areas e o user-agent WebKit estão contemplados nos testes locais, mas não substituem um teste em aparelho real.

## Procedimento manual para Google Meet/WebRTC

1. Abra a rota de produção em uma janela normal do Chrome e confirme que o contador `?atlasPerf=1` não está presente.
2. Abra DevTools, aba **Performance**, marque screenshots e inicie uma gravação de 10–15 s.
3. Deixe o Atlas parado por 5 s; confirme que não há sequência contínua de RAF, draw ou tick depois da convergência.
4. Faça pan, zoom, hover e arraste um nó por alguns segundos; confirme resposta sem travamento e retorno ao idle.
5. Abra uma nota, volte ao grafo, aplique busca/filtro e repita duas vezes para observar lifecycle e memória.
6. Entre em uma chamada do Google Meet com câmera ligada, compartilhe a janela do Atlas e repita pan/zoom/pinch no aparelho ou janela compartilhada.
7. Pare a gravação e registre long tasks, frames perdidos, heap e qualquer erro de console. Repetir com a câmera desligada ajuda a separar custo do Meet do custo do Atlas.

## Release e gates externos

O commit `07605236cb65fa2f41a4ca27a2e673533d0d41c0` foi promovido por fast-forward para `origin/main` e publicado como produção no Vercel em 03/09/2026. O deployment ficou `READY` e recebeu o alias oficial `https://nutriwork-atlas.vercel.app` (`dpl_AYDWkcRjBN15Lzxk8xXNgVAGUKKh`).

- A única validação que não pode ser executada nesta máquina é o teste em iPhone/iPad físico com Safari/WebKit real; a matriz local cobre Chromium e as dimensões móveis, mas não substitui esse aparelho.
- O trace do arraste não reproduziu long task durante as janelas de interação. Uma tarefa isolada de 59–65 ms apareceu em settling posterior em duas execuções; sem hardware-alvo não é seguro atribuí-la a GC, settling da física ou compositor.
- O conteúdo científico e `content/atlas/*.md` não foram alterados.
