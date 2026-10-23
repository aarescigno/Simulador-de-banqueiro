# Roadmap

Ordem de execução, do alicerce ao jogo completo. Cada marco termina jogável e testado; não se começa o próximo sem jogar o anterior. Detalhes de design em [`GDD.md`](GDD.md).

## Marco 0 — Fundação

Objetivo: esqueleto técnico pronto para receber conteúdo.

- [ ] Projeto TypeScript + Vite + Preact, lint e formatação.
- [ ] Vitest configurado; CI no GitHub Actions rodando testes a cada push.
- [ ] Deploy automático no GitHub Pages.
- [ ] Motor puro: tipo do estado, função `step`, RNG com semente, sistema de eventos.
- [ ] Save/load em `localStorage` + exportar/importar como texto.
- [ ] Casca da interface mobile-first: 5 abas, tema terminal, botão "Avançar".
- [ ] Formato de dados para cartas, eventos e textos.

**Pronto quando:** dá para abrir no celular, avançar turnos vazios, salvar e recarregar.

## Marco 1 — Fatia vertical: Agiota → ESC

Objetivo: provar que o jogo é divertido antes de construir o resto.

**1a. Agiota**
- [ ] Fichas de devedores (gerador de nomes, profissões, motivos, risco).
- [ ] Pedidos semanais, negociação de taxa, prazo e garantia.
- [ ] Pagamento e calote; cobrança em 3 níveis; medo e boca a boca.
- [ ] Atenção policial (faixa), denúncia, investigação.
- [ ] Bolso com 3 compartimentos e retiradas.
- [ ] 15–25 eventos (delegado, milícia, rival, devedor some, tragédia implícita).
- [ ] Crise do degrau 1 (advogado, sumir, acordo) e finais (preso, morto).

**1b. Transição e ESC**
- [ ] Dilema da lavagem para abrir a ESC (fachada, laranja, consultoria, devagar).
- [ ] Fichas de pequenas empresas; regras da ESC (município, capital próprio, porte).
- [ ] Selic e economia local afetando calote.
- [ ] 6–10 cartas de prática (legal, cinza, ilegal) com os quatro números.
- [ ] Receita Federal e ações judiciais; crise do degrau 2.

**1c. Fechamento da partida**
- [ ] Epílogo, "Quem pagou a conta", placar.
- [ ] Herança para a próxima partida.
- [ ] Tutorial embutido nas primeiras semanas; glossário contextual; notas "na vida real".

**1d. Balanceamento e polimento**
- [ ] Bots de estratégia e simulação em massa (Node).
- [ ] Metas de balanceamento passando em teste automatizado.
- [ ] Playtest com 3–5 pessoas de fora; ajustar.
- [ ] Publicar a versão 0.1.

**Pronto quando:** uma pessoa que nunca viu o jogo joga 30–45 minutos sem ajuda, chega a um final e quer jogar de novo.

## Marco 2 — Engrenagem política

- [ ] Cartas de contato (influência, preço, lealdade) começando no degrau 1 (delegado, vereador, fiscal).
- [ ] Propina e "mesada"; fios soltos rastreáveis.
- [ ] Coação (implícita) e seus multiplicadores de risco.
- [ ] Delação em cascata.
- [ ] Testa de ferro para contornar ficha suja.

## Marco 3 — SCD e Financeira (turno: mês)

- [ ] Mudança de escala: clientes em lotes e segmentos; "a câmera se afasta".
- [ ] Produtos: crédito pessoal digital, consignado, cartão, CDC de veículo.
- [ ] Captação: capital próprio, venda de carteira, letras de câmbio.
- [ ] Reputação, reclamações, Procon, ação coletiva, ranking de reclamações.
- [ ] Bacen entra no jogo; atenção regulatória.
- [ ] Pressão por metas e funcionários que agem sozinhos.
- [ ] Concorrentes com IA simples.
- [ ] Atalhos: comprar instituição licenciada, BaaS.

## Marco 4 — Banco (turno: trimestre)

- [ ] Depósitos, CDB, FGC; compulsório; índice de Basileia; liquidez.
- [ ] Tarifas e pacotes; seguros e capitalização vendidos no balcão.
- [ ] PDD e buraco oculto; auditoria interna paga.
- [ ] Corrida bancária; assistência de liquidez; regimes especiais (RAET, intervenção, liquidação).
- [ ] Modo Master: CDB acima do mercado, marcação otimista de ativos, venda do banco.
- [ ] Open Finance roubando clientes de quem cobra caro.
- [ ] Final "liquidado" com FGC.

## Marco 5 — Conglomerado

- [ ] Seguradora, gestora de fundos, tesouraria.
- [ ] Fusões e aquisições de concorrentes.
- [ ] Crise sistêmica; "grande demais para quebrar".
- [ ] Planejamento tributário: elisão x sonegação (seção 16 da referência).

## Marco 6 — Extras

- [ ] Skin "app de fintech".
- [ ] Interface que sobe de classe com o degrau.
- [ ] Origens do banqueiro com modificadores.
- [ ] Conquistas e galeria de rostos.
- [ ] Modo educativo para sala de aula (pausas explicativas, roteiro do professor).
- [ ] Som.
