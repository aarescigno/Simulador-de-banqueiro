# Agiota S.A. — documento de design

Versão 0.2 · 23/10/2026 · consolidado a partir de duas rodadas de entrevista e de [`referencia/como-um-banco-ganha-dinheiro.md`](referencia/como-um-banco-ganha-dinheiro.md)

Nome provisório do jogo: **Agiota S.A.** A tese em duas palavras: do agiota ao banco, é o mesmo negócio com CNPJ.

## 1. Proposta em uma frase

Um jogo de gestão em turnos, no navegador, em que você começa como agiota de bairro e sobe até conglomerado financeiro, aprendendo como um banco realmente ganha dinheiro, e descobrindo que o placar nunca foi a saúde do banco, mas o quanto você conseguiu tirar dele.

## 2. Pilares

1. **Instrutivo de verdade.** Cada mecânica corresponde a algo real: spread, PDD, Basileia, FGC, Lei de Usura, venda casada. O jogador sai sabendo o que é um CDB a 85% do CDI e por que isso é lucro.
2. **Sátira seca.** O jogo nunca moraliza. Mostra os números, as manchetes e, no fim, quem pagou a conta. A ironia vem do contraste entre o tom neutro e o que está acontecendo.
3. **Toda decisão é um trade-off.** Lucro agora contra reputação, risco e futuro. Não existe opção "certa", só opções com preço.
4. **Tentador e matematicamente condenado.** O caminho ilegal sempre paga mais no curto prazo e sempre acumula um risco que cresce mais rápido do que a capacidade de escondê-lo.
5. **Rejogável.** Partidas de 1–2 h, caminhos diferentes por degrau, finais múltiplos e herança entre partidas.

## 3. Decisões já tomadas (entrevista de 23/10/2026)

| Tema | Decisão |
| --- | --- |
| Formato | Painel de gestão (números, sliders, carteira) + eventos narrativos e cartas de decisão |
| Tom | Sátira seca: neutro, frio, sem sermão |
| Duração | 1–2 h por partida completa |
| Público | Geral, na web: precisa de tutorial embutido e explicação contextual |
| Turno | A escala de tempo cresce com o porte: semana → mês → trimestre |
| Placar | Patrimônio pessoal protegido, não o tamanho do banco |
| Clientes | "Rosto vira número": individuais no início, agregados no topo |
| Concorrência | 3–4 concorrentes com IA simples |
| Risco | Sinais indiretos; a verdade completa custa caro (auditoria interna) |
| Game over | Fim com epílogo + meta-progressão (herança escondida passa à próxima partida); antes do fim, fase de crise com saídas (FGC, socorro do BC, venda, aporte etc.) |
| Violência | Implícita: narrada em texto seco, nunca gráfica |
| Engrenagem política | Camada própria, logo depois do primeiro marco jogável |
| Tecnologia | TypeScript + Vite, motor de simulação separado e testável, build estático |
| Visual | Terminal financeiro + recortes de jornal. Guardadas para o futuro: skin "app de fintech" e "interface que sobe de classe" |
| Dispositivo | Mobile-first, instalável como app no Android (PWA) |
| Primeiro marco | Fatia vertical polida: Agiota → ESC, 30–45 min para um jogador novo |

### Segunda rodada (23/10/2026)

| Tema | Decisão |
| --- | --- |
| Nome | Agiota S.A. (provisório) |
| Valores | Reais em escala real, exibidos abreviados (R$ 20 mil, R$ 1,2 bi) |
| Origem do banqueiro | Fixa no marco 1 ("veio de baixo"); origens escolhíveis no marco 6 |
| Cenário | Cidade fictícia brasileira (provisório: São Jurandir do Norte); os bairros mudam com o degrau: periferia → centro → "Faria Lima" local |
| Microgestão no agiota | Pedidos novos decididos um a um; cobrança por política padrão, com exceções por devedor (escalar ou perdoar) |
| Save | Autosave único por partida, sem voltar atrás; a herança compensa o fracasso |
| Dificuldade | Uma só no marco 1 |
| Prioridade | Diversão primeiro, mas a direção de cada efeito tem que ser real (juro alto → mais calote, nunca o contrário). Simplificações ficam registradas nas notas "na vida real" |
| Conteúdo sensível | Tragédias com devedores (inclusive suicídio) podem ocorrer, sempre implícitas e secas; aviso de conteúdo no início do jogo e nota discreta do CVV (188) |
| Textos | Claude escreve no tom definido; ficam em arquivos de dados fáceis de editar |
| Arte | Ícones SVG (Lucide) + tipografia; rostos como iniciais ou silhuetas geradas |

## 4. Loop central

Cada turno tem cinco passos (adaptado da seção 19 da referência):

1. **Cenário.** Selic, inflação, desemprego e humor do mercado se movem (tendência + ruído). Chegam pedidos, propostas e notícias.
2. **Decisões.** O jogador ajusta taxas, prazos, tarifas, política de cobrança, captação, práticas ativas (cartas) e retiradas para o bolso. Decisões persistem entre turnos: só se mexe no que se quer mudar.
3. **Resolução.** Clientes entram e saem (taxa, reputação, concorrência), pagam ou dão calote (perfil, ciclo, cobrança), juros e custos são apurados.
4. **Eventos.** Denúncia, reportagem, ação coletiva, auditoria, golpe, crise de outro banco, devedor que reaparece.
5. **Fechamento.** DRE e balanço do período, checagem de capital e liquidez, reguladores agem, manchete da semana/mês/trimestre.

### Escala de tempo por degrau

| Degraus | Turno | Turnos aproximados no degrau |
| --- | --- | --- |
| 1 Agiota, 2 ESC | Semana | 20–40 cada |
| 3 SCD, 4 Financeira | Mês | 18–30 cada |
| 5 Banco, 6 Conglomerado | Trimestre | 10–20 cada |

A mudança de escala é anunciada como "a câmera se afasta": o jogador perde a visão dos detalhes ao mesmo tempo em que ganha poder.

## 5. Escada de carreira

| # | Degrau | Clientes visíveis como | Libera | Ameaça principal | Para subir |
| --- | --- | --- | --- | --- | --- |
| 1 | **Agiota** | 5–20 devedores com nome, rosto e história | Juros sem limite (ilegal), cobrança "criativa" | Polícia, denúncia, milícia local, devedor que some | Capital "limpo" para abrir uma ESC e ficha que aguente um CNPJ |
| 2 | **ESC** (Empresa Simples de Crédito) | Dezenas de MEIs e pequenas empresas do município, com nome | Juros livres dentro da lei, garantias formais | Receita Federal, limite de público e de capital, tentação de burlar as regras da ESC | Capital mínimo de SCD, ficha que passe na análise de reputação do Bacen (ou um testa de ferro) |
| 3 | **SCD** (fintech de crédito) | Centenas de clientes em lotes e perfis | App, crédito digital, venda de carteiras | Bacen entra no jogo, Procon, fraude digital | Capital e histórico para financeira |
| 4 | **Financeira** (SCFI) | Segmentos (aposentado, classe C, autônomo) | Consignado, cartão, CDC de veículos, letras de câmbio | Reclamações em massa, ação coletiva, INSS | Capital e governança para banco |
| 5 | **Banco** | Percentuais e milhões | Depósitos, CDB com FGC, tarifas, seguros | Basileia, liquidez, corrida bancária, fiscalização do BC | Escala, fusões e aquisições |
| 6 | **Conglomerado** | "Clientes lesados: 1,2 milhão" | Seguradora, gestora, tesouraria, M&A, influência | Delação, mega-operação, crise sistêmica | Final: "grande demais para quebrar" |

**Atalhos** (seção 18 da referência): comprar uma instituição já licenciada (caro e rápido) ou operar sobre a licença de outro banco (BaaS) pagando parte da receita.

**Quedas:** capital abaixo do mínimo rebaixa de degrau ou força venda; fraude descoberta leva à fase de crise (seção 9).

## 6. As duas contas: o banco e o bolso

O coração da sátira. O jogador administra dois balanços:

- **O negócio** (caixa, carteira, capital, reputação) é o veículo.
- **O bolso** (patrimônio pessoal) é o placar.

**Do negócio para o bolso:** pró-labore, dividendos (limitados pela regulação a partir do degrau 3), bônus por resultado, contratos com empresas suas (partes relacionadas), "consultorias", desvio puro.

**Do bolso para o negócio:** aporte de capital, necessário para subir de degrau ou atravessar crises.

O bolso tem três compartimentos, cada um com seu risco:

| Compartimento | Vantagem | Risco |
| --- | --- | --- |
| Em seu nome | Sem custo, disponível | Bloqueado em caso de processo ou prisão |
| Laranja | Fora do seu nome | Traição, morte ou delação do laranja; rende pouco |
| Offshore | Mais protegido | Custo de remessa, rastreável por vazamento ou cooperação internacional |

**Placar final:** o que estiver protegido no fim da partida. O epílogo também mostra o tamanho do rombo deixado e quem o cobriu.

## 7. Clientes: o rosto vira número

- **Agiota:** cada devedor é uma ficha (nome, profissão, motivo, família, sinais de risco). Você decide caso a caso.
- **ESC:** fichas de pequenas empresas (padaria, oficina, salão), ainda com nome, já em volume maior.
- **SCD e Financeira:** lotes e perfis, com um ou outro caso individual destacado em evento.
- **Banco e Conglomerado:** só agregados.
- **O rosto volta:** um devedor dos degraus 1 e 2 pode reaparecer muito depois como jornalista, promotor, juiz, denunciante ou concorrente. O jogo guarda essas fichas e as traz de volta em eventos ("Lembra de Dona Cida?").

## 8. Sistemas principais

### Indicadores

| Indicador | Visível? | Efeito |
| --- | --- | --- |
| Caixa / liquidez | Sim | Abaixo do mínimo: crise de liquidez ou corrida |
| Carteira e inadimplência | Sim | Juros, calotes, provisão |
| Capital | Sim | Teto de crédito; porta para o próximo degrau |
| Reputação | Sim | Atrai ou espanta clientes e captação |
| Medo (agiota) | Sim | Aumenta pagamento e denúncia |
| Cliente lesado | Aproximado | Alimenta reclamações, ações coletivas, fiscalização |
| Atenção regulatória/policial | Faixa (baixa/média/alta) | Chance de investigação por turno |
| Fios soltos | Contador | Cada ato ilegal deixa um rastro; base para delação e descoberta |
| Buraco oculto | Não, só via auditoria interna paga | Perda escondida no balanço, cresce com o tempo |

### Cartas de prática

Cada prática da referência (seções 13 e 17) vira uma carta ativável, com quatro números:

1. Lucro por turno.
2. Aumento de "cliente lesado" e de "fios soltos".
3. Canal de descoberta (reclamação, auditoria, denunciante, leniência, vazamento).
4. Punição (multa em % do lucro, devolução em dobro, proibição do produto, inabilitação, prisão).

Elas vêm em três faixas: **legal mas desvantajosa**, **zona cinzenta** e **ilegal**. Empilhar práticas legais é seguro e lento; as cinzentas multiplicam lucro e risco; as ilegais dão saltos com chance real de ruína.

**Pressão por metas:** uma política de metas agressivas aumenta as vendas e a chance de um funcionário cometer uma ilegalidade por conta própria (e de outro denunciar), como no padrão Wells Fargo e consignado.

**A multa como custo:** o relatório mostra a multa ao lado do lucro que a prática gerou. O jogador aprende sozinho que a multa raramente pesa; o que pesa é a punição pessoal.

### Macroeconomia

A Selic segue um ciclo com tendência e choques. Estratégias que funcionam com juros altos quebram quando eles caem, e vice-versa. Desemprego puxa a inadimplência.

### Concorrentes

De 3 a 4, com personalidades: o bancão eficiente, o digital barato, a cooperativa, o agiota rival (degraus 1 e 2). Eles ajustam taxas, disputam clientes, podem quebrar ou ser comprados. A partir do banco entra o Open Finance: quem cobra caro vê os clientes roubados por ofertas melhores.

### Risco visível por sinais indiretos

O jogador vê faixas e contadores, nunca a probabilidade exata. A informação completa (buraco oculto, chance real de auditoria) só vem com uma **auditoria interna honesta**, que custa caro e pode encontrar coisas que obrigam a agir. Saber a verdade tem preço, e muitos jogadores vão preferir não saber.

## 9. Crise e saídas

Antes do game over, o jogo entra em **modo crise**, com opções que dependem do degrau:

| Degrau | Saídas da crise |
| --- | --- |
| Agiota | Contratar advogado, sumir da cidade por um tempo, "acordo" com o delegado, entregar um cúmplice |
| ESC | Aporte do bolso, vender a carteira com deságio, fechar e reabrir em nome de outro |
| SCD / Financeira | Aporte, venda de carteira, fusão às pressas, vender a operação para concorrente |
| Banco | Assistência de liquidez do BC (redesconto), venda para concorrente, aporte do controlador, regime especial (RAET/intervenção) com chance de recuperação, liquidação com acionamento do FGC |
| Conglomerado | Tudo acima + socorro do governo ("grande demais para quebrar"), delação premiada |

Detalhe real que vira mecânica: banco não pode pedir recuperação judicial. A "recuperação" dele são os regimes especiais do Banco Central. O FGC é o gatilho mais satírico: o banco quebra, o rombo vai para o sistema, e o seu bolso pode sair intacto.

## 10. Finais e meta-progressão

### Finais (com epílogo)

- **Aposentado rico:** vendeu antes de o buraco aparecer.
- **Preso:** com ou sem delação, com ou sem patrimônio bloqueado.
- **Exilado:** fugiu com o que estava offshore.
- **Inabilitado:** ficha suja, proibido de atuar no sistema financeiro.
- **Liquidado:** o banco quebrou; o FGC pagou; você assiste.
- **Grande demais para quebrar:** socorrido com dinheiro público.
- **Morto:** fim súbito no degrau 1 por mexer com a pessoa errada (implícito).
- **Honesto:** banco sólido, bolso modesto. O jogo registra, sem comentário, que é o menor placar possível.

Todo epílogo termina com **"Quem pagou a conta"**: aposentados, FGC, fundos de pensão, devedores e contribuintes, em números.

### Herança (meta-progressão)

O que estava protegido (laranja e offshore) no fim de uma partida passa para a próxima como herança: você recomeça como filho, sócio-laranja ou com nome novo, com um capital inicial maior. Cada herança também carrega um pouco de suspeita (atenção inicial maior). O dinheiro sobrevive ao crime; a ficha às vezes também.

Outros ganhos entre partidas: arquivo de finais alcançados, galeria de "rostos" e um glossário que se completa conforme você aprende.

## 11. Engrenagem política (marco 2)

Baseada na seção 15 da referência ("modo Master"):

- **Rede de contatos:** cartas de pessoas (delegado, vereador, fiscal, regulador, parlamentar, juiz, gestor de fundo público, jornalista), cada uma com influência, preço e lealdade.
- **Influência legal:** patrocínio, lobby via associação, contratar ex-autoridades.
- **Propina e "mesada":** atrasa fiscalização, acelera aprovação; cada pagamento é um fio solto.
- **Coação:** silêncio temporário, risco multiplicado (implícita).
- **Delação em cascata:** quando um contato cai (troca de governo, operação policial), rola-se a chance de ele delatar e derrubar outros.
- **No degrau de banco:** CDB acima do mercado com FGC, marcação otimista de ativos, venda do banco antes de o buraco aparecer.

Ela entra genérica desde o degrau 1 (o delegado do bairro, o vereador) e cresce com o porte.

## 12. Tom e escrita

- Frases curtas, voz de relatório, de manchete ou de ata. Nunca adjetivos morais.
- O jogo descreve, não julga: "Dona Cida não pagou. A família dela se mudou. Recuperado: R$ 0."
- Manchetes de jornal fictício a cada fechamento.
- **Nomes fictícios** para bancos, pessoas e cidades dentro do jogo. Casos reais aparecem só nas notas educativas, com fonte. Isso protege o jogo, já que é público na web.
- Violência sempre implícita: o "primo", a "visita", o BO, o sumiço.
- Tragédias com devedores, inclusive suicídio, podem acontecer, mas só de forma indireta e seca ("A família pediu que não houvesse cobrança no velório"). Nunca descrição do ato. O jogo abre com um aviso de conteúdo, e a nota do CVV (188, cvv.org.br) aparece de forma discreta junto desses eventos.

## 13. Camada educativa (público geral)

- **Tutorial embutido** no primeiro degrau, via eventos ("seu primeiro devedor"), não como manual.
- **Glossário contextual:** cada termo técnico na interface tem toque/hover com explicação de uma linha.
- **"Na vida real":** após eventos-chave, uma nota curta com o caso real equivalente e a fonte (Wells Fargo, Panamericano, Cruzeiro do Sul, Master).
- **Relatório final** com o que a sua partida ensinou: de onde veio o seu lucro, por fonte (juros, tarifas, práticas, desvio).

## 14. Interface (mobile-first)

Barra de navegação inferior com cinco abas:

| Aba | Conteúdo |
| --- | --- |
| Resumo | Indicadores, manchete, botão "Avançar semana/mês/trimestre" |
| Carteira | Fichas de clientes (ou segmentos), pedidos pendentes |
| Políticas | Taxas, prazos, cobrança, tarifas, cartas de prática ativas |
| Bolso | Os três compartimentos, retiradas e aportes |
| Jornal | Eventos, manchetes, notas "na vida real", histórico |

**Estética:** terminal financeiro (fonte mono para números, verde/âmbar/vermelho, gráficos secos) + recortes de jornal para eventos. No desktop, as abas viram colunas.

**Skins futuras** (guardadas): visual de app de fintech (amigável enquanto você faz coisas horríveis) e interface que sobe de classe (caderninho → planilha → terminal → app polido).

## 15. Arquitetura técnica

- **Stack:** TypeScript + Vite. Interface em Preact (leve, componentes, bom para mobile). Testes com Vitest. Deploy estático no GitHub Pages via GitHub Actions a cada merge na `main`. Repositório público.
- **PWA:** manifesto + service worker (vite-plugin-pwa); instalável no Android e jogável offline. Quando sai uma versão nova, aparece o aviso "Nova versão — atualizar" (nunca recarrega sozinho no meio da partida). O número da versão fica visível no menu principal.
- **Caminho base relativo** no build, para funcionar em `https://aarescigno.github.io/<repo>/` sem depender do nome do repositório.
- **Motor puro:** `step(estado, decisões, rng) → { estado, eventos }`, sem DOM, determinístico com semente. Mesma semente + mesmas decisões = mesma partida, o que permite reproduzir bugs e compartilhar partidas.
- **Conteúdo como dados:** cartas, eventos, nomes, textos e parâmetros de degrau em arquivos de dados, separados da lógica. Adicionar uma prática nova não exige mexer no motor.
- **Save:** estado serializável com número de versão do formato (para migrar saves antigos), autosave único em `localStorage` a cada turno, exportar/importar como texto.
- **Painel dev:** aparece ao tocar 10 vezes no número da versão no menu principal. Permite escolher semente, pular de degrau, dar dinheiro, forçar evento, ver as variáveis ocultas (probabilidades, buraco oculto) e **copiar estado** (semente + turno + save) para colar numa issue.
- **Nomes no código:** estrutura em inglês (`step`, `state`, `loan`, `debtor`), termos do domínio brasileiro em português quando não têm tradução boa (`agiota`, `esc`, `consignado`, `fgc`, `pdd`, `laranja`). Textos do jogo em português, sempre em arquivos de dados, nunca escritos dentro da interface.
- **Balanceamento por simulação:** scripts em Node rodam milhares de partidas com bots de estratégia (honesto, ganancioso legal, cinzento, "modo Master") e verificam metas, por exemplo: "o modo ilegal tem retorno maior em 20 turnos e taxa de ruína acima de 80% em 60 turnos".

Estrutura prevista:

```
src/
  engine/     motor puro: estado, passo, rng, sistemas, degraus
  content/    dados: cartas, eventos, nomes, textos
  ui/         componentes Preact
sim/          bots e scripts de balanceamento (Node)
tests/        testes do motor
docs/         este documento, roadmap e referência
```

## 16. Especificação inicial do primeiro marco

### Degrau 1 — Agiota (turno: semana)

- **Início:** R$ 20 mil de economias, um bairro de periferia de São Jurandir do Norte, um caderninho.
- **A cada semana:** chegam de 1 a 4 pedidos (ficha: nome, profissão, valor, motivo, sinais de risco). Você decide cada um: aceita, recusa ou negocia taxa (% ao mês), prazo e garantia (celular, moto, cartão do benefício do INSS retido).
- **Cobrança por política:** uma regra padrão vale para todos (ex.: "conversa na 1ª semana de atraso, pressão na 2ª, o primo na 4ª"); em cada devedor dá para abrir exceção (escalar já ou perdoar). Os três níveis são conversa, pressão (ligar no trabalho, na família) e "mandar o primo". Cada nível aumenta o pagamento, o medo e a chance de denúncia.
- **Indicadores:** caixa, carteira, calote, boca a boca (atrai clientes e atenção), medo, atenção policial (faixa), bolso.
- **Eventos:** devedor some; tragédia com devedor (implícita); denúncia; o delegado quer "colaborar"; a milícia do bairro quer a parte dela; agiota rival baixa a taxa.
- **Fim:** prisão (usura, crime contra o sistema financeiro, lavagem), morte (implícita) ou subida para ESC.

### Transição 1 → 2: o primeiro dilema de lavagem

Para abrir a ESC você precisa de capital declarado, mas o seu dinheiro é de agiotagem. A transição obriga a escolher: declarar como "consultoria", passar por um comércio de fachada, usar um laranja como sócio ou subir devagar só com dinheiro limpo. A lavagem é estrutural, não opcional, e é exatamente o que a seção 14 da referência descreve.

Uma condenação no degrau 1 fecha a porta dos degraus regulados (3+) para o seu nome. A saída é um testa de ferro, que vira um fio solto permanente.

### Degrau 2 — ESC (turno: semana)

- Só empresta capital próprio, só para MEI, micro e pequena empresa do próprio município, juros livres.
- Fichas de pequenas empresas; garantias formais (alienação fiduciária); calote ligado ao ciclo da economia local.
- **Zona cinzenta e ilegal típicas:** cobrar tarifa disfarçada (a lei da ESC só permite receita de juros, a confirmar no texto da LC 167/2019), emprestar a pessoa física "abrindo um MEI" para ela, emprestar fora do município com endereço de fachada, misturar dinheiro do degrau 1.
- **Ameaças:** Receita Federal, ações judiciais de clientes, limite de crescimento.
- **Fim do marco:** a escada continua (tela de "em breve" para SCD) ou game over/epílogo/herança.

## 17. Fluxo de trabalho

- Cada entrega é um PR pequeno para a `main` (uma fatia jogável por vez, ex.: "pedidos de empréstimo").
- O merge na `main` publica no GitHub Pages; o teste é feito no celular Android, com o jogo instalado pelo navegador. Não há preview por PR: a `main` é o ambiente de teste.
- Feedback chega por issues do GitHub com modelos (bug, ajuste de balanço, ideia), fáceis de preencher no celular, de preferência com o estado copiado do painel dev. As sessões seguintes trabalham a partir das issues abertas.
- Antes de cada PR: testes do motor, typecheck e build passando.

## 18. Perguntas em aberto

Não bloqueiam o marco 1:

1. Nome definitivo do jogo e da cidade.
2. Tradução: preparar a estrutura de textos para outros idiomas desde já ou só depois?
3. Som e música: sim, não, depois?
4. Licença: código aberto com qual licença (ex.: MIT para o código, CC BY-NC para os textos)? Domínio próprio?
