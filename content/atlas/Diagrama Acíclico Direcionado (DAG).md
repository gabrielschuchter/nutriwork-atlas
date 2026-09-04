## Definição

Um Diagrama Acíclico Direcionado (Directed Acyclic Graph, DAG) é uma representação gráfica explícita das hipóteses causais entre variáveis.

Os nós representam variáveis e as setas representam relações causais presumidas. O termo "acíclico" indica que uma variável não pode ser causa de si própria ao longo do caminho representado.

DAGs não são ferramentas estatísticas. São ferramentas conceituais para formalização de hipóteses causais.

## Contexto clínico

Na epidemiologia nutricional, DAGs são utilizados para identificar confundidores, evitar ajustes inadequados e orientar estratégias analíticas.

Sua aplicação tornou-se particularmente relevante em estudos observacionais, nos quais a identificação correta das variáveis de ajuste influencia diretamente a validade das estimativas produzidas.

Também são amplamente utilizados na construção de protocolos de pesquisa, revisões sistemáticas e análises de [[Causalidade|causalidade]].

## Base fisiológica, bioquímica ou epidemiológica

A lógica dos DAGs deriva da teoria moderna da [[Inferência Causal]].

Ao representar explicitamente as relações causais presumidas, torna-se possível identificar caminhos de [[Confundimento|confundimento]] que precisam ser bloqueados e caminhos causais que não devem ser interrompidos.

O conceito permitiu avanços importantes na compreensão de problemas como [[Confundimento|Confundimento]], [[Viés de seleção|Viés de Seleção]], [[Colisor (Collider Bias)|Colisor]] e [[Superajuste]].

O valor do DAG depende inteiramente da plausibilidade das relações causais especificadas. O diagrama não produz conhecimento causal novo; ele organiza hipóteses já existentes.

## Limitações e controvérsias

Uma interpretação equivocada frequente consiste em tratar DAGs como ferramentas capazes de determinar [[Causalidade|causalidade]] de forma automática.

Na realidade, a validade de um DAG depende da qualidade do conhecimento prévio utilizado em sua construção. Um DAG incorreto pode produzir recomendações analíticas incorretas.

Outra limitação é que muitas relações causais relevantes permanecem parcialmente desconhecidas. Em áreas complexas da [[Nutrição|nutrição]], diferentes pesquisadores podem construir DAGs distintos para a mesma pergunta.

Existe ainda o risco de falsa sensação de objetividade. Embora os DAGs tornem hipóteses explícitas, eles não eliminam incertezas sobre mecanismos causais reais.

Apesar dessas limitações, representam atualmente uma das ferramentas conceituais mais importantes para reduzir ambiguidades na interpretação de estudos observacionais.

## Conceitos relacionados
- [[Inferência Causal]]
- [[Confundimento]]
- [[Viés de seleção]]
## Referências de base

Hernán MA, Robins JM. Causal Inference: What If.

Pearl J. Causality.

Greenland S, Pearl J, Robins JM. Causal Diagrams for Epidemiologic Research.

Textor J et al. Robust Causal Inference Using Directed Acyclic Graphs.

Modern Epidemiology.
