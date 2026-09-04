# **Razão de Chances**

## **Definição**

Razão de chances, ou odds ratio, compara as chances de um evento entre dois grupos. Se p é a probabilidade, a chance é p/(1−p); OR = [p1/(1−p1)] / [p0/(1−p0)]. OR igual a 1 representa igualdade de chances.

## **Contexto clínico**

Odds ratio é natural em regressão logística e em estudos caso-controle. Quando o desfecho é raro, pode aproximar o [[Risco Relativo|risco relativo]]; quando é comum, pode afastar-se bastante e parecer um efeito maior. Comunicação clínica deve converter para riscos absolutos quando possível.

Em ensaios, OR pode ser calculada para resposta ou evento, porém a interpretação depende da codificação e do tempo. OR ajustada representa uma comparação condicional ao modelo, não necessariamente o efeito causal populacional.

## **Base fisiológica, bioquímica ou epidemiológica**

A chance compara ocorrência com não ocorrência, enquanto o risco usa ocorrência entre todas as pessoas sob risco. Modelos logísticos estimam log-odds como combinação de preditores. [[Confundimento|Confundimento]], interação e seleção alteram OR.

OR é não colapsável: mesmo sem [[Confundimento|confundimento]], a OR marginal pode diferir das OR estratificadas. Essa propriedade exige cuidado ao interpretar ajustes e ao comparar com [[Risco Relativo]].

## **Limitações e controvérsias**

OR não é “probabilidade de doença” nem “[[Risco Relativo|risco relativo]]” em desfechos frequentes. Uma OR de 2 pode corresponder a RR diferente conforme o [[Risco basal|risco basal]].

Em caso-controle, OR estima associação sob desenho apropriado; não informa incidência ou risco absoluto sem dados adicionais. [[Intervalo de Confiança|Intervalo de confiança]] amplo e seleção de controles limitam a inferência.

## **Conceitos relacionados**


- [[Risco Relativo]]
- [[Hazard ratio]]
- [[Amostra]]
## **Referências de base**

- Cochrane Collaboration. *Cochrane Handbook for Systematic Reviews of Interventions*, Chapter 6. https://training.cochrane.org/handbook/current/chapter-06
- Lash TL, VanderWeele TJ, Haneuse S, Rothman KJ. *Modern Epidemiology*, 4th ed. Wolters Kluwer. https://www.stata.com/bookstore/modern-epidemiology/
- Bonita R, Beaglehole R, Kjellström T. *Basic epidemiology*, 2nd ed. Geneva: World Health Organization; 2006. https://iris.who.int/handle/10665/43541
