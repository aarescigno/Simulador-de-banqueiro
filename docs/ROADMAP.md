# Roadmap

Ordem de execução, do alicerce ao jogo completo. Cada marco termina jogável e testado; não se começa o próximo sem jogar o anterior. Detalhes de design em [`GDD.md`](GDD.md).

## Pré-requisitos (no GitHub, antes da próxima sessão)

- [x] Criar a branch `main` a partir desta (hoje o repositório só tem a branch de planejamento, que virou a padrão) e marcá-la como branch padrão.
- [x] Tornar o repositório público.
- [x] Em Settings → Pages, escolher "Source: GitHub Actions".

## Marco 0 — Fundação + primeiro loop (próxima sessão)

Objetivo: o jogo instalado no celular, com um loop mínimo do agiota para "sentir" o ritmo. Briefing detalhado em [`PROXIMA-SESSAO.md`](PROXIMA-SESSAO.md).

**Fundação**
- [ ] Projeto TypeScript + Vite + Preact, ESLint e Prettier.
- [ ] Vitest; CI no GitHub Actions (typecheck, testes, build) em todo PR.
- [ ] Deploy automático no GitHub Pages a cada merge na `main`.
- [ ] PWA: manifesto, ícone, offline, aviso "Nova versão — atualizar", número da versão no menu.
- [ ] Motor puro: tipo do estado, `step`, RNG com semente, fila de eventos, versão do formato do save.
- [ ] Autosave único em `localStorage`; exportar/importar como texto.
- [ ] Casca mobile-first: menu principal, 5 abas, tema terminal, formatação de valores (R$ 20 mil, R$ 1,2 bi).
- [ ] Aviso de conteúdo na primeira abertura.
- [ ] Painel dev (10 toques na versão): semente, dar dinheiro, avançar N semanas, ver variáveis ocultas, copiar estado.
- [ ] Modelos de issue: bug, ajuste de balanço, ideia.

**Primeiro loop do agiota**
- [ ] Pedidos semanais com ficha (nome, profissão, valor, motivo, risco oculto).
- [ ] Aceitar com taxa e prazo, ou recusar.
- [ ] Parcelas semanais; pagamento ou atraso conforme risco e taxa (juro mais alto → mais atraso).
- [ ] Calote depois de N semanas sem pagar; resumo semanal no Jornal.

**Pronto quando:** você instala pelo link no Android, joga 10 semanas emprestando e cobrando, fecha o app, reabre e a partida continua.

## Marco 1 — Fatia vertical: Agiota → ESC

Objetivo: provar que o jogo é divertido antes de construir o resto.

**1a. Agiota**
- [ ] Garantias (celular, moto, cartão do INSS retido) e negociação nos pedidos.
- [ ] Política de cobrança em 3 níveis com exceções por devedor; medo e boca a boca.
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
