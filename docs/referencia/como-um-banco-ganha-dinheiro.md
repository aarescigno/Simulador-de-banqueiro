# Como um banco ganha dinheiro — referência para o simulador

Oct 23, 2026 · @Arthur de Almeida Rescigno

Um banco ganha dinheiro de quatro jeitos: emprestando mais caro do que capta, cobrando por serviços, vendendo produtos de terceiros (seguros, consórcio, previdência) e operando no mercado com o próprio capital. Tudo o mais — agências, apps, marketing, gestão de risco — existe para alimentar ou proteger essas quatro fontes.

Este documento é a base de conhecimento para um simulador de banqueiro. Cada seção descreve uma área real do negócio e termina com o que ela vira em mecânica de jogo. A seção de zona cinzenta lista práticas que lucram às custas do cliente, com o risco regulatório de cada uma, para alimentar o dilema central do jogo: lucro de curto prazo contra reputação, multa e fuga de clientes.

Números de mercado estão atualizados até outubro de 2026 e marcados com fonte; o restante é estrutura estável do setor.

## 1. Visão geral: de onde vem o lucro

No maior banco privado do país, cerca de três quartos da receita vêm de juros e um quarto de serviços e seguros. O Itaú fechou o 2º trimestre de 2026 com lucro recorrente de R$ 12,4 bilhões e ROE de 24,3% ([release Itaú](https://www.itau.com.br/media/dam/m/4a2ea1e7879ff197/original/itau-unibanco-registra-lucro-de-12-4-bilhoes-e-roe1-24-3-no-segundo-trimestre-de-2026-04-08-26.pdf), [InfoMoney](https://www.infomoney.com.br/mercados/itau-itub4-resultados-segundo-trimestre-2026/amp/)). O Santander Brasil, no mesmo período, teve ROE de 12,5% ([Money Times](https://www.moneytimes.com.br/itau-itub4-lucra-r-124-bilhoes-alta-de-78-no-2t26-e-fica-dentro-das-expetativas-rnda/)) — a diferença entre bancos está na eficiência, no mix de clientes e no controle de inadimplência.

### As quatro fontes de receita

| Fonte | O que é | Peso típico num grande banco |
| --- | --- | --- |
| Margem financeira com clientes | Juros recebidos no crédito menos juros pagos na captação | Maior linha (60–75% da receita) |
| Margem com mercado (tesouraria) | Ganho com títulos, câmbio, derivativos e descasamento de prazos | Variável, pode ser negativa |
| Prestação de serviços e tarifas | Cartões, contas, adquirência, gestão de fundos, assessoria | 20–25% |
| Seguros, previdência e capitalização | Prêmios e taxas de produtos de seguradora do grupo | 5–10% |

### A DRE simplificada (Itaú, 2T26)

| Linha | R$ bilhões | Observação |
| --- | --- | --- |
| Margem financeira gerencial | 33,5 | Juros do crédito − custo de captação + tesouraria |
| Receitas de serviços | 11,0 | Cartões, conta, assets, adquirência |
| (−) Custo do crédito | −10,1 | Provisões para calotes, já descontadas recuperações |
| (−) Despesas não decorrentes de juros | −16,7 | Pessoal, tecnologia, agências, marketing |
| (−) Impostos e outros | ≈ −5,3 | IR/CSLL, PIS/Cofins, ISS (valor por diferença) |
| **Lucro recorrente** | **12,4** | ROE 24,3% |

Dois indicadores resumem a saúde do banco: o **ROE** (lucro ÷ patrimônio) mede quanto o acionista ganha, e o **índice de eficiência** (despesas ÷ receitas) mede quanto custa gerar cada real. O Itaú opera com eficiência de 37,4% — gasta R$ 0,37 para gerar R$ 1 de receita ([InfoMoney](https://www.infomoney.com.br/mercados/itau-itub4-resultados-segundo-trimestre-2026/amp/)).

**No jogo:** a DRE trimestral é a tela de resultado. ROE é a pontuação principal; eficiência e inadimplência são os indicadores que o mercado (e o preço da ação do jogador) observa.

## 2. Criação de moeda e o balanço do banco

Bancos comerciais criam dinheiro quando emprestam: o crédito na conta do tomador é um depósito novo que não existia antes. O que limita essa criação não é o dinheiro em caixa, e sim três travas — capital próprio, depósito compulsório e liquidez.

### Como o dinheiro é criado

1. O banco aprova R$ 100 mil de financiamento e lança R$ 100 mil na conta do cliente. Nasce um ativo (o empréstimo) e um passivo (o depósito) ao mesmo tempo.
2. O cliente paga um fornecedor, que deposita em outro banco. O primeiro banco perde reserva e precisa cobri-la — captando depósitos, CDB ou tomando no interbancário.
3. O banco que recebeu o depósito pode emprestar parte dele de novo. Esse ciclo é o "multiplicador bancário".
4. Quando o empréstimo é pago, o dinheiro deixa de existir: depósito e ativo somem juntos. Só os juros ficam como lucro.

### O balanço

| Ativo (o que o banco tem) | Passivo + patrimônio (de onde veio o dinheiro) |
| --- | --- |
| Caixa e reservas no Banco Central | Depósitos à vista (conta corrente) |
| Depósito compulsório recolhido ao Bacen | Poupança |
| Títulos públicos e privados | CDB, LCI, LCA, Letra Financeira |
| Carteira de crédito (líquida de provisões) | Empréstimos de outros bancos e do exterior |
| Participações (seguradora, adquirente, asset) | Patrimônio líquido (capital dos acionistas + lucros retidos) |

### As três travas

- **Capital (Basileia):** cada real emprestado consome capital conforme o risco do tomador. O mínimo regulatório gira em torno de 10,5% dos ativos ponderados pelo risco, com adicionais para bancos sistêmicos. O Itaú opera com 12,3% de capital principal ([InfoMoney](https://www.infomoney.com.br/mercados/itau-itub4-resultados-segundo-trimestre-2026/amp/)). Na prática, R$ 1 de capital sustenta cerca de R$ 8–10 de crédito.
- **Compulsório:** o Banco Central retém uma fração dos depósitos (alíquotas diferentes para à vista, poupança e prazo; aproximadamente 20% hoje). Esse dinheiro rende pouco ou nada.
- **Liquidez:** o banco precisa ter ativos líquidos para aguentar 30 dias de saques em cenário de estresse (LCR). Banco sem liquidez quebra mesmo sendo lucrativo — é a corrida bancária.

**No jogo:** o jogador começa com capital inicial, que define o teto de crédito. Emprestar cria depósitos; perder depósitos para outros bancos exige captar mais caro. Lucro retido aumenta o capital e libera mais crédito — o motor de crescimento. Ficar abaixo do mínimo de Basileia trava novas operações; ficar sem liquidez dispara corrida bancária e intervenção.

## 3. Captação: de onde vem o dinheiro (passivo)

O dinheiro mais barato de um banco é o saldo parado em conta corrente, que não paga juros. Quanto mais o banco depende de CDB e Letra Financeira, mais caro fica o seu funding e menor a margem. Com a Selic em 13,75% ao ano desde 16/09/2026 ([Atlas Público / Bacen](https://atlaspublico.com.br/bcb/noticias/copom-reduz-selic-para-13-75pct-ao-ano-em-decisao-unanime-87748)), a diferença entre um real de conta corrente e um real de CDB a 100% do CDI é de quase 14 pontos ao ano.

| Instrumento | Custo para o banco | Prazo / liquidez | Garantia do FGC | Observação |
| --- | --- | --- | --- | --- |
| Depósito à vista (conta corrente) | ≈ 0% | Saque imediato | Sim | O funding mais valioso; o cliente paga tarifa para deixar o dinheiro lá |
| Poupança | TR + 0,5% a.m. (ou 70% da Selic se Selic ≤ 8,5%) | Imediata | Sim | Parte é direcionada por lei ao crédito imobiliário |
| CDB | 85–120% do CDI | Dias a anos | Sim | O grande cliente negocia taxa; o pequeno aceita a de balcão |
| LCI / LCA | 80–95% do CDI | Carência mínima | Sim | Isenta de IR para pessoa física, por isso o banco paga menos; lastro em crédito imobiliário/agro |
| Letra Financeira (LF) | CDI + spread | Mínimo 2 anos | Não | Funding de longo prazo para investidores qualificados |
| Interbancário (DI) | CDI | Um dia | — | Cobre buracos de caixa de curto prazo |
| Operações compromissadas | ≈ Selic | Curto | — | Banco vende título com recompra; usado também com clientes |
| Repasses (BNDES, FGTS, Funcafé) | Taxa fixada pelo governo | Longo | — | Dinheiro público que o banco reempresta com spread |

**Custo de funding** = média ponderada do custo de todas essas fontes. É a base de toda a precificação de crédito.

**No jogo:** cada tipo de captação é um botão com custo, prazo e risco de fuga. Conta corrente barata exige investir em agências, app e marketing para atrair clientes; CDB caro atrai dinheiro rápido. Pagar CDB acima do mercado é sinal de banco em dificuldade — e o FGC (garantia de até R$ 250 mil por CPF por instituição) é o que torna isso possível, como no caso real do Banco Master em 2025.

## 4. Crédito: onde o dinheiro trabalha (ativo)

A regra de ouro do crédito é: quanto menor a garantia e mais desesperado o cliente, maior a taxa. O rotativo do cartão — crédito sem garantia, usado por quem não conseguiu pagar a fatura — tinha juro médio de 442,4% ao ano em junho de 2026, enquanto o cheque especial estava em 139,8% ([Times Brasil / Bacen](https://timesbrasil.com.br/brasil/juros-cartao-rotativo-4424-junho/)).

### Pessoa física

| Produto | Garantia | Juro típico (a.a.) | Por que o banco gosta |
| --- | --- | --- | --- |
| Rotativo do cartão | Nenhuma | ≈ 440% (estatístico; teto legal de 100% do principal) | Margem altíssima; cliente endividado não sai |
| Parcelamento de fatura | Nenhuma | ≈ 190% | Converte rotativo em dívida longa |
| Cheque especial | Nenhuma | ≈ 140% (teto de 8% a.m.) | Uso automático, cliente nem percebe que contratou |
| Crédito pessoal não consignado | Nenhuma | 60–120% | Venda fácil no app |
| Consignado (INSS, servidor, CLT) | Desconto em folha | 20–30% | Calote quase zero; volume enorme |
| Financiamento de veículo (CDC) | Alienação do carro | 20–35% | Garantia recuperável + seguro embutido |
| Imobiliário (SFH/SFI) | Alienação do imóvel | TR + 10–13% | Prende o cliente por 30 anos; abre venda de seguros |
| Antecipação do saque-aniversário FGTS | Saldo do FGTS | ≈ 20% | Risco quase nulo |

### Pessoa jurídica

| Produto | Para que serve | Característica |
| --- | --- | --- |
| Capital de giro | Pagar contas do dia a dia | Pode exigir aval dos sócios |
| Antecipação de recebíveis (duplicatas, cartão) | Receber hoje vendas a prazo | Garantia é a própria venda; muito rentável |
| Conta garantida | Cheque especial da empresa | Limite rotativo caro |
| Desconto de cheques e duplicatas | Liquidez imediata | Banco assume risco do comprador |
| Financiamento de máquinas (Finame/BNDES) | Investimento | Dinheiro público com spread do banco |
| Crédito rural | Custeio e investimento agro | Parte com taxa controlada pelo governo |
| Comércio exterior (ACC, ACE) | Adiantar exportação | Ganho em juros e câmbio |
| Fiança bancária | Garantir contratos | Receita sem desembolso de caixa |

### O spread e seus componentes

Spread é a diferença entre a taxa cobrada e o custo de captação. Pela decomposição do Banco Central (Relatório de Economia Bancária 2019), ele se divide assim ([resumo](https://okai.com.br/artigo/o-que-e-spread-bancario-e-como-ele-e-formado)):

| Componente | Participação no spread |
| --- | --- |
| Inadimplência (perdas esperadas) | 31% |
| Despesas administrativas | 28% |
| Lucro do banco | 21,5% |
| Tributos e FGC | 19,7% |

**No jogo:** o jogador define a taxa de cada produto. Taxa alta = mais margem, mas atrai clientes piores (seleção adversa) e eleva inadimplência; taxa baixa = volume e clientes bons, margem fina. Cada produto tem um perfil de risco e uma "garantia" que reduz a perda em caso de calote.

## 5. Serviços e tarifas

Tarifa é a receita mais previsível do banco: não depende de juros nem de risco de calote. O Itaú faturou R$ 11 bilhões em serviços só no 2º trimestre de 2026 ([InfoMoney](https://www.infomoney.com.br/mercados/itau-itub4-resultados-segundo-trimestre-2026/amp/)).

| Serviço | Como gera receita | Comentário |
| --- | --- | --- |
| Pacotes de conta corrente | Mensalidade fixa | Lei obriga oferecer pacote de serviços essenciais gratuito; o padrão de venda é o pago |
| Cartão de crédito | Anuidade + tarifa de intercâmbio (≈ 1–2% de cada compra paga pelo lojista) + juros | Intercâmbio gera receita mesmo com cliente que paga a fatura em dia |
| Adquirência (maquininha) | MDR (taxa do lojista), aluguel de POS, antecipação | Rede, Getnet, Cielo pertencem ou pertenceram a bancos |
| Cobrança (boleto) | Tarifa por boleto emitido/liquidado | Perdeu espaço para o Pix |
| Pix | Gratuito para PF; tarifado para PJ em algumas operações | Matou a receita de TED/DOC |
| Folha de pagamento | Banco paga à empresa pelo direito de processar a folha | Ganha clientes cativos para vender crédito consignado |
| Câmbio | Spread entre compra e venda + IOF repassado | Cartão no exterior e remessas |
| Custódia e corretagem | Tarifa sobre investimentos | Maior no segmento alta renda |
| Saques, extratos extras, segunda via | Tarifa avulsa | Regulada por lista do Bacen |
| Cesta PJ e cash management | Mensalidade por volume | Maior margem que PF |

**No jogo:** tarifas são uma alavanca de receita sem risco de crédito, mas com custo de satisfação. Cada aumento eleva a chance de o cliente migrar para um banco digital gratuito.

## 6. Seguros, previdência, capitalização e consórcio

Esses produtos têm a maior margem para o banco e o pior custo-benefício para o cliente médio. O banco é dono (ou sócio) da seguradora e vende na agência, onde o gerente tem meta — o modelo chama-se bancassurance.

| Produto | Como o banco ganha | Por que costuma ser ruim para o cliente |
| --- | --- | --- |
| Seguro prestamista | Prêmio embutido no empréstimo | Encarece o crédito; muitas vezes vendido como obrigatório (não é) |
| Seguro de vida, residencial, auto | Prêmio − sinistros pagos (sinistralidade baixa = lucro) | Coberturas genéricas, preço acima do mercado de corretores |
| Seguro de cartão (perda e roubo) | Mensalidade pequena e recorrente | O próprio CDC e a regulação já protegem o cliente em fraudes |
| Previdência privada (PGBL/VGBL) | Taxa de administração sobre todo o saldo + carregamento | Taxas de 1,5–2% ao ano corroem décadas de rendimento |
| Título de capitalização | Banco fica com parte do dinheiro e devolve corrigido abaixo da inflação | É sorteio, não investimento; perde da poupança |
| Consórcio | Taxa de administração (15–20% do bem, diluída) | Sem juros, mas a taxa somada se aproxima de um financiamento; contemplação incerta |

**No jogo:** produtos de altíssima margem com custo reputacional crescente. Uma barra de "cliente lesado" sobe a cada venda desnecessária; ela alimenta reclamações no Bacen e no Procon (seções 13 e 19).

## 7. Investimentos e gestão de recursos

Na gestão de investimentos o banco ganha um percentual sobre o dinheiro do cliente, chova ou faça sol — não corre o risco do investimento, só cobra para administrá-lo.

| Atividade | Receita | Ponto de atenção |
| --- | --- | --- |
| Fundos de investimento (asset do banco) | Taxa de administração (0,2–2% a.a.) + taxa de performance | Fundo DI com taxa de 1,5% rende menos que um CDB simples |
| Distribuição de fundos de terceiros | Rebate (parte da taxa devolvida ao distribuidor) | Conflito: o gerente recomenda o que paga mais rebate |
| Corretora | Corretagem, aluguel de ações, margem | Cada vez mais gratuita; o lucro está no float e no crédito |
| Emissão própria (CDB, LCI, COE) | O banco capta barato vendendo seu próprio papel | O cliente acha que "investiu", o banco acha que "captou" |
| COE (Certificado de Operações Estruturadas) | Spread embutido na estrutura de opções | Produto complexo, custo invisível ao cliente |
| Private banking e alta renda | Taxa sobre patrimônio + venda de crédito, seguro, câmbio | Clientes mais rentáveis e mais disputados |
| Assessoria (agentes autônomos) | Comissão por produto vendido | Incentivo para girar carteira |

**No jogo:** o "AUM" (ativos sob gestão) gera receita fixa por trimestre. Cobrar taxa alta aumenta a receita mas, quando o cliente comparar com o mercado, ele resgata.

## 8. Atacado, banco de investimento e tesouraria

O lado "invisível" do banco atende grandes empresas e opera no mercado. Rende muito em anos bons e pode gerar prejuízo em anos de volatilidade — o Itaú cortou sua projeção de receitas de serviços para 2026 justamente pela volatilidade acima do esperado no mercado de capitais ([Bloomberg Línea](https://www.bloomberglinea.com.br/negocios/itau-lucra-r-124-bi-no-2-tri-e-revisa-guidance-de-receitas-de-servicos-e-seguros/)).

| Atividade | Como ganha | Risco |
| --- | --- | --- |
| Emissão de ações (IPO, follow-on) | Comissão de coordenação (1–4% da oferta) | Baixo; depende do humor do mercado |
| Emissão de dívida (debêntures, CRI, CRA) | Comissão + às vezes fica com parte dos papéis | Risco de ficar com papel encalhado |
| Fusões e aquisições (M&A) | Taxa de sucesso | Receita irregular |
| Crédito corporativo e sindicalizado | Juros + comissão de estruturação | Concentração em poucos devedores grandes (ex.: Americanas) |
| Derivativos para clientes (hedge de câmbio, juros) | Spread embutido no preço | Risco de contraparte |
| Tesouraria proprietária | Aposta em juros, câmbio, ações com capital do banco | Pode ganhar ou perder muito |
| Gestão de ALM (descasamento) | Captar curto e emprestar longo, ou vice-versa, apostando na direção da Selic | Se a Selic sobe e o banco emprestou prefixado, perde |
| Market making de títulos públicos (dealer) | Spread entre compra e venda | Volume alto, margem fina |

**No jogo:** um módulo opcional de "mesa de operações" — o jogador aposta na direção da Selic e do dólar. Gera lucros ou perdas grandes e rápidos; é o caminho de alto risco para quem quer crescer rápido.

## 9. Gestão de riscos

Banco quebra por risco, não por falta de lucro. O Itaú mantém inadimplência acima de 90 dias em 1,9% há seis trimestres, mas ainda assim gasta R$ 10,1 bilhões por trimestre em custo de crédito ([Bloomberg Línea](https://www.bloomberglinea.com.br/negocios/itau-lucra-r-124-bi-no-2-tri-e-revisa-guidance-de-receitas-de-servicos-e-seguros/), [BP Money](https://bpmoney.com.br/?p=414744)).

| Risco | O que é | Ferramentas |
| --- | --- | --- |
| Crédito | O cliente não paga | Score, renda comprovada, garantias, limite por cliente, provisão (PDD) |
| Mercado | Juros, câmbio ou ações se movem contra a posição | Hedge, limites de exposição, VaR |
| Liquidez | Saques maiores que o caixa disponível | Colchão de títulos públicos, linhas do Bacen (redesconto) |
| Operacional | Fraude, falha de sistema, erro humano, golpe do Pix | Biometria, monitoramento, seguros |
| Concentração | Muito crédito em um só cliente ou setor | Limites regulatórios por cliente |
| Legal e de conduta | Processos, multas, venda abusiva | Compliance, ouvidoria, provisão para contingências |
| PLD/FT | Lavagem de dinheiro e financiamento ao terrorismo | KYC, comunicação ao Coaf, bloqueio de contas |

### Como funciona a provisão

- Desde 2025 (Resolução CMN 4.966), o banco provisiona a **perda esperada** já na concessão, e não só quando o cliente atrasa.
- Provisão é despesa: reduz o lucro hoje, mesmo que o cliente pague depois.
- Atraso acima de 90 dias vira "inadimplência"; depois de alguns meses a dívida é baixada a prejuízo e pode ser vendida a empresas de cobrança por centavos por real.
- Renegociação (ex.: Desenrola) troca dívida ruim por dívida nova com prazo maior — às vezes é solução, às vezes empurra o problema.

**No jogo:** cada carteira de crédito tem uma taxa de calote que reage ao ciclo econômico (Selic, desemprego). Provisão é um custo imediato; economizar nela infla o lucro do trimestre e explode depois. Golpes e fraudes são eventos aleatórios cuja frequência cai com investimento em segurança.

## 10. Bancos públicos x privados

Caixa e Banco do Brasil fazem tudo o que um banco privado faz, mais um papel de braço do governo — o que traz linhas exclusivas e baratas, mas também pressão política sobre taxas e crédito.

|  | Caixa Econômica Federal | Banco do Brasil | Privados (Itaú, Bradesco, Santander) |
| --- | --- | --- | --- |
| Controle | 100% da União (empresa pública) | União majoritária, ações na bolsa | Acionistas privados |
| Especialidade | Crédito habitacional (maior do país), FGTS | Agronegócio, setor público, comércio exterior | Varejo de alta renda, empresas, cartões, seguros |
| Funções exclusivas ou quase | Gestão do FGTS, loterias, Bolsa Família, seguro-desemprego, PIS | Folha de servidores federais, crédito rural, conta do Tesouro | — |
| Objetivo | Lucro + política pública | Lucro + política pública | Lucro |
| Vantagem competitiva | Funding barato (poupança e FGTS) e capilaridade | Funding de depósitos judiciais e governamentais | Eficiência e tecnologia |

Bancos digitais (Nubank, Inter, C6, PicPay) entraram pelo cartão sem anuidade e conta gratuita, e hoje vivem principalmente de crédito pessoal e cartão. Cooperativas de crédito (Sicoob, Sicredi) devolvem parte do resultado aos cooperados.

**No jogo:** a escolha de modelo no início da partida — banco privado de varejo, banco digital ou cooperativa — muda o custo de funding, o tipo de cliente e o nível de pressão regulatória e política.

## 11. Regulação e limites legais

No Brasil, bancos podem cobrar juros livremente, mas operam cercados por regras de capital, de conduta e de transparência — e por vários reguladores ao mesmo tempo.

### Quem fiscaliza o quê

| Órgão | Papel | Poder sobre o banco |
| --- | --- | --- |
| CMN (Conselho Monetário Nacional) | Cria as regras gerais do sistema | Normas |
| Banco Central | Autoriza, fiscaliza, define compulsório e Selic | Multa, intervenção, liquidação, cassação da licença, afastamento de dirigentes |
| CVM | Fundos, ações, debêntures, ofertas | Multas e proibição de atuar no mercado |
| SUSEP | Seguros, previdência, capitalização | Multas e suspensão de produtos |
| Procon, Senacon, Ministério Público, Judiciário | Defesa do consumidor | Multas, ações coletivas, indenizações |
| Coaf | Prevenção à lavagem de dinheiro | Recebe comunicações obrigatórias |
| FGC | Garante depósitos até R$ 250 mil por CPF/CNPJ por instituição | Paga o cliente quando o banco quebra |

### Regras que limitam o lucro

| Regra | O que diz |
| --- | --- |
| Código de Defesa do Consumidor | Proíbe venda casada, publicidade enganosa, cobrança vexatória; cobrança indevida devolve-se em dobro (art. 42) |
| Resolução CMN 3.919/2010 | Lista as tarifas permitidas e exige pacote de serviços essenciais gratuito |
| Lei 14.690/2023 | Juros e encargos do rotativo e do parcelado do cartão não podem passar de 100% do valor original da dívida (desde jan/2024) |
| Resolução CMN 4.765/2019 | Juros do cheque especial limitados a 8% ao mês |
| Consignado INSS | Teto de juros fixado pelo Conselho Nacional de Previdência; margem consignável limitada |
| CET obrigatório | Todo crédito deve informar o Custo Efetivo Total, com tarifas e seguros embutidos |
| Portabilidade | Cliente pode levar dívida ou salário para outro banco; o banco de origem não pode impedir |
| Open Finance | Cliente pode compartilhar seus dados com concorrentes para receber ofertas melhores |
| Resolução CMN 4.966/2021 | Provisão pela perda esperada, desde 2025 |
| Basileia (capital e liquidez) | Capital mínimo proporcional ao risco; colchão de liquidez |
| Jurisprudência do STJ | Juros bancários acima de 12% a.a. não são abusivos por si; só há revisão quando a taxa fica muito acima da média de mercado do Bacen |

**No jogo:** cada regra é uma "cerca" com fiscal. Atravessá-la gera lucro imediato e um risco acumulado de autuação; o jogador decide quanto risco aceita.

## 12. Agiotagem e os limites legais dos juros

A mesma taxa pode ser legal para um banco e crime para um particular. O que separa o banqueiro do agiota não é o tamanho dos juros, e sim a licença do Banco Central: instituições autorizadas cobram juros livres, enquanto quem empresta por conta própria fica preso aos limites da Lei de Usura.

### Quem pode cobrar quanto

| Quem empresta | Limite de juros | Base legal |
| --- | --- | --- |
| Pessoa física para pessoa física (ou para empresa) | Até o dobro da taxa legal; sem juros compostos | Lei de Usura (Decreto 22.626/1933) + art. 591 do Código Civil |
| Taxa legal (referência) | Selic − IPCA; com Selic de 13,75% e IPCA perto de 5%, fica em torno de 8–9% a.a., e o teto da usura perto de 17–18% a.a. (aproximado) | Lei 14.905/2024 ([Agência Senado](https://www12.senado.leg.br/noticias/materias/2024/07/01/lula-sanciona-lei-que-uniformiza-juros-para-contratos-sem-taxa-convencionada)) |
| Contratos entre empresas, títulos de crédito, mercado de capitais | Livre (a Lei de Usura deixou de se aplicar) | Lei 14.905/2024 ([Demarest](https://www.demarest.com.br/?p=154602)) |
| Empresa Simples de Crédito (ESC) | Livre, mas só com capital próprio e só para MEI, micro e pequenas empresas do próprio município | Lei Complementar 167/2019 |
| Instituições autorizadas pelo Bacen (bancos, financeiras, fintechs) | Livre, salvo tetos específicos (rotativo, cheque especial, consignado) | Súmula 596 do STF + regulação do CMN |

Antes de 2024, o teto da usura era lido como 12% ao ano; a Lei 14.905 trocou essa referência pela taxa legal, que acompanha a Selic ([Migalhas](https://www.migalhas.com.br/depeso/413677/lei-14-905-24-e-novos-limites-em-termos-de-juros-e-correcao-monetaria)).

### Onde vira crime

| Conduta | Crime | Pena |
| --- | --- | --- |
| Cobrar juros acima do limite legal, ou lucrar mais de 1/5 do valor justo abusando da necessidade ou inexperiência do outro | Usura pecuniária — Lei 1.521/1951, art. 4º ([texto](https://www.admdireito.com.br/legislacao/art/lei_00015211951-4)) | Detenção de 6 meses a 2 anos e multa; agravada em crise econômica, dano grave ou contrato disfarçado |
| Emprestar dinheiro de forma habitual, como negócio, sem autorização do Bacen | Operar instituição financeira sem autorização — Lei 7.492/1986 (crimes contra o sistema financeiro) | Reclusão de 1 a 4 anos e multa |
| Esconder a origem dos lucros da agiotagem | Lavagem de dinheiro — Lei 9.613/1998 ([Migalhas](https://www.migalhas.com.br/depeso/405909/o-crime-de-agiotagem)) | Reclusão de 3 a 10 anos |
| Cobrar com ameaça, exposição ou constrangimento | Ameaça, extorsão, constrangimento ilegal (Código Penal); cobrança abusiva (CDC, art. 71) | Variam; extorsão chega a 10 anos |

O crime de usura é formal: basta exigir os juros abusivos, mesmo que o devedor nunca pague.

### E quando o banco abusa?

Banco não comete usura, mas pode ser condenado a devolver juros. O STJ revisa a taxa quando ela fica muito acima da média de mercado divulgada pelo Bacen para aquela modalidade — na prática, tribunais usam como sinal de alerta algo em torno de uma vez e meia a média. A consequência é civil (revisão do contrato, devolução, às vezes em dobro), não penal.

**No jogo:** a agiotagem é o modo "ilegal" do início da carreira — lucro altíssimo, risco de denúncia e prisão crescendo com o número de clientes e com o uso de cobrança violenta. Cada degrau de licença (seção 18) libera taxas maiores dentro da lei. O desenho reproduz a ironia real: a mesma taxa que leva o agiota à prisão é rotina para o banco licenciado.

## 13. Zona cinzenta: lucrar às custas do cliente

A maior parte do lucro "desvantajoso para o cliente" é legal: vem de inércia, desinformação e falta de comparação, não de fraude. A tabela vai do totalmente legal ao claramente ilegal — exatamente o espectro que o jogo pode explorar.

### Legal, mas desvantajoso para o cliente

| Prática | Como lucra | Risco para o banco |
| --- | --- | --- |
| Pacote de tarifas como padrão na abertura de conta | Mensalidade de quem nem sabe que tem direito ao pacote gratuito | Baixo; reclamação isolada |
| Fundo DI ou previdência com taxa de 1,5–2% | Taxa sobre o saldo por décadas | Baixo; fuga de clientes informados |
| Título de capitalização vendido como "guardar dinheiro" | Retém parte do valor e corrige abaixo da inflação | Médio se o gerente prometer rendimento |
| Destacar o "pagamento mínimo" na fatura | Empurra cliente para o rotativo | Baixo; limitado pelo teto de 100% |
| Juro na média alta do mercado | Margem maior em clientes que não comparam | Baixo até \~1,5× a média |
| Oferecer CDB a 85% do CDI para quem não negocia | Funding mais barato | Nenhum |
| Refinanciamento sucessivo do consignado ("refin") | Cada renovação cobra nova taxa e reinicia o prazo | Médio; alvo de Procon e Ministério Público |
| Dificultar a portabilidade com contraoferta só na hora da saída | Retém o cliente pagando mais até ele reclamar | Baixo |

### Zona cinzenta (legal na forma, abusivo na prática)

| Prática | Como lucra | Risco |
| --- | --- | --- |
| Seguro prestamista "recomendado" no crédito | Prêmio embutido; cliente acha que é obrigatório | Alto se provado que foi condição — vira venda casada |
| Metas agressivas para gerentes venderem seguros e capitalização | Volume de produto de alta margem | Médio; ações trabalhistas e coletivas |
| Ligações insistentes a aposentados recém-concedidos oferecendo consignado | Capta clientes antes da concorrência | Médio; o INSS e o Bacen já restringiram |
| Cartão de crédito consignado (RMC) apresentado como empréstimo comum | Dívida que quase nunca termina | Alto; muitas condenações judiciais |
| Renegociação que soma juros, multas e seguros num contrato novo | Transforma prejuízo em ativo "adimplente" | Médio |
| Cancelamento só por telefone ou na agência | Mantém cobranças por inércia | Médio; regulação exige canal equivalente ao de contratação |
| Venda de carteira inadimplente a cobradores agressivos | Recupera centavos por real sem sujar a marca | Médio; a responsabilidade pode voltar ao banco |

### Ilegal

| Prática | Consequência real |
| --- | --- |
| Venda casada explícita (crédito só com seguro) | CDC; devolução em dobro, multas do Procon e do Bacen |
| Enviar cartão ou aumentar limite sem pedido | Prática abusiva (Súmula 532 do STJ); indenização por dano moral |
| Abrir contas ou contratar produtos sem consentimento | Fraude; o caso Wells Fargo (EUA, 2016) custou bilhões de dólares em multas |
| Cobrar tarifa não prevista na regulação | Devolução em dobro + multa |
| Juros acima dos tetos (rotativo, cheque especial, consignado) | Autuação do Bacen e devolução |
| Ignorar sinais de lavagem de dinheiro | Multas pesadas, responsabilização de dirigentes |
| Esconder perdas no balanço | Crime contra o sistema financeiro; intervenção (ex.: Banco Panamericano, 2010) |

**No jogo:** cada prática é uma carta ou política com três números — lucro por trimestre, aumento da barra de "cliente lesado" e probabilidade de fiscalização. O jogador pode empilhar práticas legais desvantajosas com pouco risco; as da zona cinzenta multiplicam o lucro e o risco; as ilegais dão saltos de lucro com chance real de multa, intervenção ou prisão do banqueiro.

## 14. Lavagem de dinheiro: tipologias, casos reais e como são descobertos

Nos casos documentados, bancos raramente desenham esquemas de lavagem como produto; o padrão é a omissão lucrativa — clientes rentáveis recebem controles mais frouxos, alertas são arquivados e unidades distantes da matriz operam sem fiscalização. Os casos citados abaixo são os comprovados por acordos, condenações ou investigações públicas; nada aqui afirma conduta de bancos não citados.

### As três etapas

1. **Colocação:** o dinheiro ilícito entra no sistema financeiro (depósito, compra de bens, pagamento por empresa de fachada).
2. **Ocultação (estratificação):** sucessivas transferências, contas e empresas apagam o rastro da origem.
3. **Integração:** o dinheiro volta como renda aparentemente legítima (lucro de empresa, rendimento de fundo, venda de imóvel).

### Tipologias conhecidas

| Tipologia | Como funciona, em linhas gerais | Onde entra a instituição financeira | Como costuma ser detectada |
| --- | --- | --- | --- |
| Empresas de fachada com faturamento inflado | Negócio com muito dinheiro vivo mistura receita real e ilícita | Conta PJ aceita movimentação incompatível com o porte | Cruzamento de faturamento com movimentação; dados fiscais |
| Laranjas e contas de passagem | Contas em nome de terceiros recebem e repassam valores | Abertura de conta com verificação fraca | Padrão de entrada e saída imediata; vínculos entre contas |
| Doleiros e dólar-cabo | Compensação de valores entre Brasil e exterior sem passar pelo câmbio oficial | Contas usadas para liquidar a ponta doméstica | Delações, quebra de sigilo, cooperação internacional |
| Offshores e estruturas em camadas | Empresas e trusts em jurisdições sigilosas escondem o dono real | Private banking abre e administra as estruturas | Vazamentos (Panama Papers, Pandora Papers), troca automática de informações fiscais |
| Comércio exterior sub ou superfaturado | Preço falso em importação/exportação transfere valor entre países | Banco processa câmbio e cartas de crédito | Comparação de preços com o mercado, Receita e aduana |
| Fundos de investimento em cascata | Fundos com um único cotista, que é outro fundo, ocultam o beneficiário final | Administradoras e gestoras aceitam a estrutura | Exigência de beneficiário final; fiscalização da CVM e da Receita |
| Fintechs e "contas-bolsão" | Uma conta agregada movimenta valores de muitos clientes sem identificá-los individualmente | Instituição de pagamento com controles fracos | Regulação nova sobre identificação, cruzamento com a Receita |
| Correspondentes estrangeiros | Banco de um país dá acesso ao sistema de outro para clientes de alto risco | O banco correspondente não verifica o cliente do cliente | Auditorias e investigações do país de destino |
| Imóveis, arte, gado, criptoativos | Bens de preço subjetivo ou difícil rastreio armazenam e reintegram valor | Financiamento ou conta que recebe o pagamento | Comunicação obrigatória por cartórios, corretoras e exchanges |

### Como o tratamento VIP aparece nos casos

- **Exceções aprovadas para clientes grandes:** comitês liberam relacionamento com cliente de alto risco porque ele é lucrativo.
- **Pessoas politicamente expostas (PEP) tratadas como clientes comuns:** a regra exige diligência reforçada; a prática às vezes a dispensa.
- **Filial distante, metas altas:** unidades no exterior ou em nichos crescem rápido com clientes não residentes e pouca supervisão da matriz.
- **Alertas arquivados em massa:** o sistema dispara, mas a equipe de compliance é pequena ou pressionada a não perder clientes.
- **Gerente que "não pergunta":** remuneração ligada ao volume de recursos captados, não à qualidade do cliente.

### Casos reais

| Caso | O que aconteceu | Consequência |
| --- | --- | --- |
| Danske Bank, filial da Estônia (2007–2015) | Cerca de €200 bilhões de clientes não residentes, sobretudo russos, circularam com pouca supervisão; a filial atraía clientes prometendo transferências grandes com pouco controle ([Euronews](https://www.euronews.com/next/2022/12/14/danske-bk-moneylaundering)) | Confissão de culpa nos EUA e US$ 2 bilhões em penalidades em 2022; filial fechada ([Retail Banker](https://www.retailbankerinternational.com/news/danske-bank-guilty-plea-accepted/)) |
| HSBC (México/EUA, anos 2000) | Falhas de controle permitiram a passagem de recursos de cartéis de drogas | Acordo de cerca de US$ 1,9 bilhão com autoridades dos EUA em 2012 (aproximado) |
| Deutsche Bank, "mirror trades" (Rússia, 2011–2015) | Compras de ações em rublos espelhadas por vendas em dólares tiravam dinheiro da Rússia | Multas de cerca de US$ 630 milhões em 2017 (aproximado) |
| Banestado (Brasil, anos 1990) | Contas de não residentes (CC5) usadas para remessas ilegais bilionárias | CPI, condenações; origem de técnicas investigativas da Lava Jato |
| Lava Jato (Brasil, 2014–) | Doleiros, offshores e contas na Suíça lavavam propina de contratos públicos | Prisões, repatriação de recursos, acordos de leniência |
| Carbono Oculto (Brasil, 2025–2026) | PCC usou fintechs como "bancos paralelos" e ao menos 40 fundos com patrimônio estimado em R$ 30 bilhões ([InfoMoney](https://www.infomoney.com.br/brasil/operacao-carbono-oculto-entenda-o-esquema-bilionario-do-pcc-no-setor-de-combustiveis/)); fundos tinham cotista único, geralmente outro fundo, e a Receita apontou indícios de participação de administradoras ([IstoÉ Dinheiro](https://istoedinheiro.com.br/pcc-fintechs-fundos-de-investimento-lavar)) | Bloqueio de fundos; nova fase em 2026 mirou outras fintechs que movimentaram mais de R$ 26 bilhões ([CNN Brasil](https://www.cnnbrasil.com.br/nacional/sudeste/sp/faria-lima-pcc-e-combustiveis-veja-alvos-da-nova-fase-da-carbono-oculto/)); endurecimento de regras sobre beneficiário final |

### As regras e as punições

- **Lei 9.613/1998:** lavagem é crime, com reclusão de 3 a 10 anos; vale para o cliente e para o funcionário ou dirigente que participa.
- **Política de PLD do Bacen:** exige conhecer o cliente (KYC), classificar risco, monitorar transações e comunicar operações suspeitas ao Coaf. Falhar nisso gera multa mesmo sem prova de lavagem.
- **Responsabilidade do banco:** a instituição paga multas bilionárias e pode perder licença; dirigentes podem ser inabilitados e presos.

**No jogo:** clientes "de origem duvidosa" aparecem oferecendo depósitos enormes, sem negociar taxa — funding barato e farto. Aceitar sem diligência aumenta a barra de "risco PLD". A cada trimestre há chance de evento de descoberta: auditoria do Bacen, operação policial contra o cliente, vazamento de dados, delação de um gerente ou investigação estrangeira. Quanto maior o volume e mais tempo o esquema dura, maior a multa — e acima de certo nível, a consequência é intervenção e prisão do banqueiro. Investir em compliance reduz o risco e, de quebra, faz o jogador recusar dinheiro: o dilema fica explícito.

## 15. Estudo de caso: Banco Master e a engrenagem de influência

Segundo a Polícia Federal, o MPF e o Banco Central, o Master cresceu captando caro com a garantia do FGC, inflou ativos difíceis de avaliar e, quando o buraco ficou grande demais, tentou empurrá-lo para um banco público usando R$ 12,2 bilhões em carteiras de crédito que não existiam ([Diário de Pernambuco](https://www.diariodepernambuco.com.br/economia/2025/11/11700839-investigacao-revela-venda-de-rs-122-bi-em-carteiras-inexistentes-do-master-ao-brb.html)). Uma rede de relações políticas e, segundo a PF, servidores do próprio BC cooptados sustentaram o esquema por anos. O colapso custou ao FGC cerca de R$ 47 bilhões (Master e Will Bank), e R$ 56 bilhões somadas outras instituições do grupo ([Agência Pública](https://apublica.org/2026/03/banco-master-a-reconstrucao-completa-de-como-uma-fraude-capturou-a-republica/)).

**Estado do caso (out/2026):** investigação em curso no STF, sem julgamento. Daniel Vorcaro nega a fraude e sua defesa afirma que as carteiras vieram de terceiros ([Jovem Pan](https://jovempan.com.br/?p=9432)). Várias autoridades citadas em mensagens negam irregularidades. Abaixo, o que é acusação está marcado como tal.

### Linha do tempo

| Quando | O que aconteceu |
| --- | --- |
| out/2026 | Em proposta de delação não aceita pela PF, Vorcaro acusa o ex-governador do DF de pedir R$ 400 milhões para viabilizar a compra pelo BRB; a defesa do ex-governador nega e diz que não há provas ([O Tempo](https://www.otempo.com.br/politica/judiciario/2026/10/21/vorcaro-diz-que-ibaneis-pediu-r-400-milhoes-de-propina-por-negocio-do-brb-com-master), [TV Comunitária DF](https://tvcomunitariadf.com/2026/10/22/vorcaro-acusa-ibaneis-de-pedir-r-400-milhoes-em-propina-para-autorizar-compra-do-master/)) |
| mar/2026 | Segunda prisão; a PF aponta uma "milícia privada" usada para coagir adversários e jornalistas ([Agência Pública](https://apublica.org/2026/03/banco-master-a-reconstrucao-completa-de-como-uma-fraude-capturou-a-republica/)) |
| fev/2026 | Liquidação de outro banco ligado ao grupo eleva o custo total ao FGC para R$ 56 bilhões |
| 18/11/2025 | Operação Compliance Zero; Master liquidado; Vorcaro preso em Guarulhos tentando embarcar para o exterior |
| set/2025 | Banco Central veta a compra do Master pelo BRB |
| mar/2025 | BC cobra documentos das carteiras vendidas ao BRB; amostra de 130 contratos sem lastro |
| jul/2024 em diante | BRB passa a comprar carteiras do Master via empresa que a PF considera de fachada |
| ago/2024 | Proposta de emenda para elevar a garantia do FGC de R$ 250 mil para R$ 1 milhão por CPF — apelidada de "emenda Master" — é rejeitada no Senado |
| 2022–2025 | BC envia 31 ofícios de alerta ao conglomerado ([Correio Braziliense](https://edicao.correiobraziliense.com.br/correiobraziliense/2026/04/09/140112/pdf/A07-ECO-0904-DIG.pdf)) |
| 2019–2024 | Patrimônio sobe de R$ 200 milhões para R$ 4,7 bilhões; carteira de crédito, de R$ 1,4 bilhão para R$ 40 bilhões ([Wikipedia](https://en.wikipedia.org/wiki/Daniel_Vorcaro)) |
| 2017–2019 | Após dois anos de recusa, BC autoriza a compra do pequeno Banco Máxima, rebatizado de Master |

### A engrenagem em cinco peças

&#91;embedded content: engrenagem do caso Master · segundo PF, MPF e BC\]

1. **Licença comprada:** em vez de pedir licença do zero, comprar um banco pequeno já autorizado — o atalho de M&A da seção 18.
2. **Funding garantido por terceiros:** CDBs a até 140% do CDI, vendidos em plataformas com o argumento da garantia do FGC ([Capital Aberto](https://capitalaberto.com.br/gestao/investidores-do-master-terao-longo-processo-para-recebimento/)). O investidor olha a garantia, não o banco; o risco fica com o FGC, bancado pelos outros bancos. Fundos de previdência de servidores estaduais e municipais também compraram letras do banco, que não têm garantia do FGC.
3. **Ativos de valor subjetivo:** precatórios, crédito consignado e participações, cujo preço depende de avaliação. Marcados de forma otimista, inflam o patrimônio no papel. Como o CDB caro custava mais do que esses ativos de fato rendiam, o buraco crescia e cada resgate precisava de nova captação — dinâmica de pirâmide.
4. **Rede de influência:** parte legal (eventos patrocinados, contratos milionários com escritórios de advocacia e consultorias ligados a autoridades, lobby por uma emenda que aumentaria a garantia do FGC) e parte, segundo a PF, criminosa: "mesada" a dois ex-dirigentes da supervisão do BC, acesso ilegal a sistemas da própria PF, sites pagos para atacar jornalistas e coação de adversários ([Agência Pública](https://apublica.org/2026/03/banco-master-a-reconstrucao-completa-de-como-uma-fraude-capturou-a-republica/)).
5. **Saída pelo comprador público:** vender o banco — e o buraco — ao BRB, controlado pelo governo do DF. Segundo a PF, uma empresa recém-criada vendia ao BRB carteiras fabricadas, com documentos de data retroativa; o BRB pagava à vista e o Master não precisava pagar a empresa à vista.

### Por que ruiu

- **Pirâmide exige crescimento infinito:** em 2024, de cerca de R$ 15 bilhões esperados para recompor liquidez, o banco conseguiu R$ 2 bilhões.
- **Os grandes bancos se defenderam:** como são eles que financiam o FGC, fizeram pressão contra a "emenda Master".
- **A checagem por amostra pegou:** mesmo lenta, a supervisão do BC testou contratos e não achou lastro.
- **Cada contato virou prova:** o celular apreendido transformou a rede de influência em rede de investigados; vazamentos e tentativa de delação ampliaram o caso.
- **Quem pagou:** o FGC, os investidores acima de R$ 250 mil e os servidores cujos fundos de previdência compraram papéis sem garantia.

### No jogo: mecânicas inspiradas no caso

| Mecânica | Como funciona | Ganho | Risco acumulado |
| --- | --- | --- | --- |
| CDB acima do mercado | Paga mais que o CDI para captar rápido; o FGC tranquiliza o investidor | Funding farto imediato | Custo alto todo trimestre; FGC e BC passam a observar |
| Marcação de ativos | O jogador escolhe avaliar ativos pelo valor justo ou pelo otimista | Patrimônio e lucro maiores no papel | A diferença vira "buraco oculto", que cresce com os juros pagos |
| Rede de contatos | Cartas de pessoas: regulador, parlamentar, juiz, gestor de fundo público, presidente de banco público, jornalista, celebridade | Cada contato tem influência, preço e lealdade | Cada contato é também uma testemunha em potencial |
| Influência legal | Patrocínio de eventos, lobby via associação, contratar ex-autoridades como consultores | Pequenos bônus em aprovações e reputação | Baixo, mas gera manchetes se o banco cair |
| Propina e "mesada" | Pagamento recorrente a um contato | Atrasa fiscalização, acelera aprovações, faz fundos públicos comprarem seus papéis | Cada pagamento adiciona um "fio solto" rastreável |
| Coação | Intimidar jornalistas, denunciantes ou sócios | Silêncio temporário | Multiplica a pena e a chance de investigação; pode gerar mortes e fim de jogo imediato |
| Saída por venda | Vender o banco antes que o buraco apareça; exige comprador e aprovação do BC | Embolsa o preço e transfere o rombo | Due diligence e fiscalização por amostragem podem detectar ativos falsos |
| Cascata de delação | Quando um contato corrupto cai (troca de governo, de diretor do BC, operação policial), rola-se a chance de ele delatar | — | Cada delação expõe outros contatos; a rede inteira pode cair em sequência |

**Princípio de design:** o "modo Master" deve ser tentador e matematicamente condenado — o buraco oculto cresce mais rápido do que a influência consegue esconder, e cada contato comprado aumenta a superfície de descoberta. O jogo pode mostrar, no fim, quem pagou a conta: o FGC, os aposentados dos fundos públicos e os investidores sem garantia.

## 16. Impostos: quanto o banco paga e como reduz a conta

No papel, bancos pagam a maior alíquota sobre lucro do país: 45% (IRPJ de 25% mais CSLL de 20%) ([Bem Paraná / Febraban](https://www.bemparana.com.br/noticias/economia/para-bancos-alta-de-imposto-pode-encarecer-credito-973/amp/)). Na prática, a alíquota efetiva costuma ficar entre 20% e 30%, por causa de instrumentos legais e créditos acumulados ([Acionista](https://acionista.com.br/impostos-bancos-apresentam-carga-reduzida-enquanto-fintechs-enfrentam-desafios-fiscais/)). A maior alavanca não é o patrocínio cultural, e sim os juros sobre capital próprio; o patrocínio incentivado existe, mas é limitado a poucos por cento do imposto.

### Os impostos de um banco

| Tributo | Alíquota | Base |
| --- | --- | --- |
| IRPJ | 15% + 10% adicional | Lucro |
| CSLL | 20% para bancos; 15% para seguradoras e administradoras de cartão; fintechs (SCD, IP) subiram de 9% para 12% em abril de 2026 ([Finsiders](https://finsidersbrasil.com.br/noticias-sobre-fintechs/novo-imposto-para-fintechs-e-financeiras-passa-a-valer-a-partir-de-abril/)) | Lucro |
| PIS/Cofins | 4,65%, regime cumulativo | Receitas |
| ISS | 2–5%, conforme o município | Tarifas e serviços |
| IOF | Varia por operação | Cobrado do cliente, repassado ao governo |
| IBS/CBS (reforma tributária) | Regime específico para serviços financeiros, em transição | Substituirá PIS/Cofins e ISS |

### Estratégias legais (elisão)

| Estratégia | Como funciona | Quanto pesa |
| --- | --- | --- |
| Juros sobre capital próprio (JCP) | O banco paga aos acionistas "juros" calculados sobre o patrimônio e deduz como despesa a 45%; o acionista paga 17,5% na fonte desde 2026 (antes 15%), e lucros do próprio ano saíram da base ([Let's Money](https://www.letsmoney.com.br/noticias/governo-arrecadacao-csll-fintechs-jcp-apostas-2026/)) | A maior economia: cerca de 27 pontos percentuais sobre cada real distribuído assim |
| Créditos tributários diferidos | Provisões para calote reduzem o lucro contábil hoje, mas só são dedutíveis quando a perda se realiza; o banco acumula um "crédito" que abate imposto no futuro. Prejuízos fiscais também abatem até 30% do lucro por ano | Grandes bancos carregam dezenas de bilhões em créditos; em altas de alíquota, servem de colchão ([Site Contábil](https://sitecontabil.com.br/noticias_empresariais/ler/bancos-vao-repassar-aumento-de-csll-e-recorrer-a-credito-tributario)) |
| Patrocínio incentivado (cultura, esporte, saúde, infância) | Parte do patrocínio a projetos aprovados (Lei Rouanet, Audiovisual, Esporte, Fundo da Infância, Fundo do Idoso, Pronon/Pronas) é abatida diretamente do IRPJ devido, e a marca do banco aparece no projeto | Limite global de 4% do IRPJ para cultura e afins, mais 2% para esporte geral — até cerca de 6% ([Cosit 4/2026](https://contadores.cnt.br/projetos/25/noticias/tecnicas/2026/01/27/receita-federal-reforma-orientacao-e-impoe-novo-teto-a-deducoes-com-esporte-e-cultura.html)) |
| Doações a entidades sociais (OSCIP) | Dedutíveis como despesa até 2% do lucro operacional | Pequeno, mas gera relatório de sustentabilidade |
| Fundações e institutos próprios | O banco cria uma fundação que leva seu nome e recebe doações dedutíveis; algumas fundações são, elas mesmas, acionistas relevantes do grupo, e entidades imunes não pagam imposto sobre dividendos | Combina benefício fiscal, marca e controle acionário estável |
| Alocação de lucro dentro do grupo | Concentrar receita em empresas do grupo com CSLL menor (seguradora, administradora de cartões) | Moderado; limitado por regras de preço entre partes ligadas |
| Estruturas no exterior e hedge | Agências e subsidiárias fora do país; o "overhedge" explorava a diferença de tributação entre o investimento no exterior e o derivativo que o protegia, até ser fechado por lei em 2020–2021 | Já foi relevante; hoje restrito |
| Ágio em aquisições | Amortizar o ágio pago na compra de outro banco como despesa dedutível | Restrito desde 2014; fonte de autuações bilionárias |
| Contencioso e parcelamentos | Contestar cobranças por anos no CARF e na Justiça e aderir a programas de regularização com desconto | Adia e reduz pagamentos |
| Lobby tributário | Defender regime cumulativo de PIS/Cofins, alíquotas próprias na reforma, tributação maior de concorrentes (fintechs) | Molda a regra antes de ela existir |

### O patrocínio é mesmo "propaganda com dinheiro público"?

Em parte, sim. No caso do art. 18 da Lei Rouanet, a empresa abate 100% do valor patrocinado do imposto devido, dentro do limite — na prática, ela escolhe para onde vai um dinheiro que iria ao Tesouro e ainda coloca a marca no projeto ("Banco X apresenta"). Críticos chamam isso de marketing financiado pelo contribuinte, com concentração de recursos em grandes centros e projetos de visibilidade. Defensores respondem que é uma política pública deliberada, que leva recursos a cultura e esporte que o Estado não alcançaria, e que o teto de poucos por cento do imposto limita o efeito. Para o caixa do banco, o ganho fiscal é pequeno; o ganho de imagem é o que move a decisão.

### Onde termina o planejamento e começa o crime

- **Elisão (legal):** usar as opções que a lei oferece — JCP, incentivos, compensação de prejuízos.
- **Planejamento agressivo (zona cinzenta):** operações sem propósito econômico além de pagar menos imposto. A Receita pode desconsiderá-las e cobrar o imposto com multa de 75%, até cinco anos depois.
- **Evasão (crime):** omitir receita, simular operações, esconder dinheiro no exterior. Multa de até 150% e crime contra a ordem tributária, com reclusão de 2 a 5 anos.

**No jogo:** o imposto é uma linha da DRE com alavancas. O JCP é uma régua (limitada pelo patrimônio e pelo lucro) que reduz imposto no ato. Patrocínios incentivados convertem até \~6% do imposto em reputação, sem custo extra. A fundação própria custa caro, mas rende reputação e influência. O planejamento agressivo dá economia imediata e cria um "passivo fiscal oculto" que pode virar autuação com multa até cinco anos depois. O contencioso adia a conta em troca de provisão no balanço. Eventos de reforma tributária mudam as alíquotas no meio da partida.

## 17. Catálogo de falcatruas descobertas

Quase toda fraude bancária descoberta cai em quatro famílias: enganar o cliente vulnerável, manipular o mercado, maquiar o balanço e comprar autoridades. Os casos abaixo foram punidos, confessados ou estão em processo formal; cada linha pode virar uma "carta de atitude" no jogo, com o lucro que gerou, como foi descoberta e quanto custou.

### Contra o cliente

| Atitude | Caso real | Como foi descoberto | Consequência |
| --- | --- | --- | --- |
| Abrir contas e cartões sem o cliente saber, para bater metas | Wells Fargo (EUA, anos 2000–2016): milhões de contas falsas criadas por funcionários pressionados por metas | Reclamações, imprensa, ex-funcionários | US$ 3 bilhões em multa (2020) ([Axios](https://www.axios.com/2020/10/25/wall-street-bad-reputation)) |
| Depositar crédito não pedido na conta de aposentados ("telesaque") e usar a margem consignável sem autorização | Santander, como sucessor de Olé e Bonsucesso: crédito de cartão consignado depositado como se fosse empréstimo comum | Reclamações e investigação do Ministério Público | Multa de R$ 10,7 milhões do Procon-MPMG em abr/2026 ([MPMG](https://www.mpmg.mp.br/portal/menu/comunicacao/noticias/procon-mpmg-multa-o-banco-santander-por-praticas-abusivas-em-credito-consignado.shtml)); ação coletiva anulou contratos e proibiu a prática ([Patos Já](https://www.patosja.com.br/Justi%C3%A7a/justica-condena-bancos-por-emprestimos-sem-autorizacao-para-aposentados)) |
| Descontar consignado de benefício com autorização fraudada | Itaú Consignado: banco não conseguiu provar as autorizações | Reclamações no Procon-SP | Multa de R$ 5,8 milhões ([Procon-SP](https://www.procon.sp.gov.br/procon-sp-multa-banco-itau-consignado-por-descontos-indevidos-em-beneficio-previdenciario-de-consumidores/)) |
| Consignado agressivo a aposentados, com assinaturas falsas | Bancos de consignado do INSS, entre eles C6 Consig e Agibank; em processos do setor, perícias judiciais acharam assinaturas falsas | Enxurrada de queixas, perícia em processos | C6 multado em mais de R$ 7 milhões e com operação suspensa pela Senacon ([Metrópoles](https://www.metropoles.com/sao-paulo/consignados-inss-dobram-466-bi-fraudes)); Agibank multado pelo Procon-MPMG em out/2026 ([Estado de Minas](https://www.em.com.br/gerais/2026/10/7519432-banco-e-multado-por-liberar-emprestimo-consignado-sem-autorizacao.html)) |
| Exigir seguro para liberar empréstimo (venda casada) | Banco multado pelo Procon-SP por exigir seguro residencial para analisar empréstimo | Fiscalização do Procon | R$ 11,28 milhões, mantidos pelo TJ-SP ([Lex](https://www.lex.com.br/mantida-multa-de-r-1128-mi-contra-banco-por-praticas-abusivas/)); em 2026 a autorregulação Febraban/ABBC proibiu expressamente a prática no consignado ([meutudo](https://meutudo.com.br/blog/noticias/2026/02/04/bancos-proibem-venda-casada-com-consignado-e-impoem-novas-regras-contra-cobrancas-indevidas/)) |
| Executar hipotecas com documentos assinados em massa sem conferência ("robo-signing") | Cinco grandes bancos dos EUA após a crise de 2008 | Processos de mutuários e procuradores estaduais | Acordo de US$ 25 bilhões (2012) ([Ritholtz](https://ritholtz.com/2013/09/top-10-bank-fines-post-2008-09-crisis)) |

### Contra o mercado

| Atitude | Caso real | Como foi descoberto | Consequência |
| --- | --- | --- | --- |
| Manipular a taxa de referência dos juros | LIBOR: Barclays, UBS, Deutsche Bank e outros informavam taxas falsas para lucrar com derivativos e parecer mais sólidos | Chats entre operadores, investigações em vários países | Multas bilionárias; subsidiária do Deutsche condenada criminalmente nos EUA ([HBSS](https://www.hbsslaw.com/blog/whistleblower-news-deutsche-banks-london-subsidiary-sentenced-for-manipulation-of-libor-the-rolls-royce-treatment-global-bribery-demands-global-resolutions-wells-fargo-to-pay-110-million-to-settle-fake-account-suit)) |
| Combinar preços de câmbio com concorrentes | Cartel do câmbio envolvendo o real (2007–2013), com bancos estrangeiros | Acordo de leniência de um participante | Sete bancos confessaram e pagaram acordos no Cade; em 2025, a Superintendência recomendou condenar outros seis ([Cade](https://static.poder360.com.br/2025/04/superintendencia-geral-Cade-bancos-10abr2025.pdf)); ex-operadores denunciados criminalmente ([Congresso em Foco](https://congressoemfoco.com.br/noticia/34800/mpf-oferece-denuncia-contra-cartel-de-bancos-internacionais-que-manipulou-spread-cambial)) |
| Colocar ordens falsas para mover preços ("spoofing") | JPMorgan, mercados futuros de metais e títulos | Análise de dados de negociação | US$ 920 milhões (2020) ([Decrypt](https://decrypt.co/53739/banks-were-fined-15-billion-in-2020-study-finds)) |
| Inflar a própria ação com laranjas | Cruzeiro do Sul: financiava testas de ferro para negociar ações do próprio banco | Intervenção do BC e denúncia do MP | Ver abaixo ([Capital Aberto](https://capitalaberto.com.br/temas/captacao-de-recursos/roubo-a-ceu-aberto/)) |

### Maquiagem do balanço

| Atitude | Caso real | Como foi descoberto | Consequência |
| --- | --- | --- | --- |
| Registrar empréstimos que não existem | Cruzeiro do Sul (2012): cerca de 320 mil contratos fictícios de consignado somando R$ 1,25 bilhão em ativos | Fiscalização do BC e auditoria na intervenção | Intervenção, falência, processos contra os controladores ([Capital Aberto](https://capitalaberto.com.br/temas/captacao-de-recursos/roubo-a-ceu-aberto/)); o diretor de Fiscalização do BC compara o caso ao do Master ([Poder360](https://www.poder360.com.br/poder-justica/caso-master-e-muito-similar-ao-do-cruzeiro-do-sul-diz-diretor-do-bc/)) |
| Vender carteiras de crédito e continuar contando-as como ativo; sacar dinheiro por empresa do grupo fora da fiscalização do BC | Panamericano (2010): lançamentos manuais criaram resultado fictício de mais de R$ 3,8 bilhões; saques em espécie pela administradora de cartões do grupo | Cruzamento de dados pelo BC | Rombo coberto pelo controlador e pelo FGC; 17 denunciados pelo MPF ([Migalhas](https://www.migalhas.com.br/quentes/162529/mpf-denuncia-17-pessoas-em-caso-do-rombo-do-panamericano)) |
| Fabricar carteiras para vender a um banco público | Banco Master (2024–2025) | Ver seção 15 | Liquidação, prisão, maior custo da história do FGC |

### Corrupção, lavagem e sonegação de clientes

| Atitude | Caso real | Como foi descoberto | Consequência |
| --- | --- | --- | --- |
| Pagar propina a autoridades para ganhar contratos | Goldman Sachs no fundo 1MDB (Malásia): US$ 1,6 bilhão em propinas a autoridades para conseguir mandatos de emissão | Investigações em três continentes | Primeira confissão de culpa do banco; penalidades acima de US$ 5 bilhões ([InvestmentNews](https://www.investmentnews.com/regulation-legal-compliance/goldman-hit-with-29-billion-fine-in-1mdb-case/198451)) |
| Estruturar empréstimos ocultos a um governo, com propina aos banqueiros | Credit Suisse em Moçambique ("tuna bonds"): banqueiros receberam cerca de US$ 50 milhões em propinas | Calote do país e investigações nos EUA e Reino Unido | US$ 475 milhões em multas (2021) e banimento de banqueiros ([Caproasia](https://www.caproasia.com/?p=51602)) |
| Ajudar clientes ricos a esconder dinheiro do fisco | UBS (2009), Bank Hapoalim (2020) | Denunciante interno (UBS); investigações dos EUA | Multas de centenas de milhões e entrega de dados de clientes ([ITV](https://www.itv.com/news/update/2013-09-19/breakdown-of-the-biggest-banking-fines), [PFL Research](https://pflresearch.com/mintel/2021/1/20/aussie-banks-most-fined-in-the-world)) |
| Driblar sanções internacionais | Standard Chartered (Irã), ING, Credit Suisse | Investigações dos EUA | Multas de centenas de milhões ([ITV](https://www.itv.com/news/update/2013-09-19/breakdown-of-the-biggest-banking-fines)) |
| Falhar no controle de clientes de câmbio e nas comunicações ao Coaf | Banco Genial (2026) | Processo sancionador do BC | Multa de R$ 21,6 milhões e inabilitação do CEO por quatro anos; o banco contesta e vai recorrer ([JOTA](https://www.jota.info/executivo/banco-central-multa-banco-genial-em-r-216-milhoes-e-determina-inabilitacao-do-ceo)) |
| Lavagem em larga escala | HSBC, Danske, Westpac, Carbono Oculto | Ver seção 14 | — |

### Padrões que se repetem

- **Metas agressivas** aparecem por trás das fraudes contra o cliente: Wells Fargo, consignado, venda casada.
- **O alvo preferido é o vulnerável:** aposentados, endividados, quem não lê contrato.
- **Empresa do grupo fora do radar do regulador** é a porta de saída do dinheiro (Panamericano) ou da fraude (Master).
- **Chats entre operadores** são a principal prova em cartéis e manipulações.
- **Como cai:** denunciante interno, reclamação em massa, auditoria por amostragem, leniência de um cúmplice, vazamento de dados ou crise de liquidez que expõe o buraco.
- **A multa costuma ser pequena perto do lucro:** R$ 10 milhões para um banco que lucra bilhões por trimestre vira custo operacional. O que muda o cálculo é a punição pessoal — inabilitação do executivo, prisão, confissão de culpa.

**No jogo:** cada linha vira uma carta de atitude com quatro números — lucro por trimestre, canal de descoberta (reclamação, auditoria, leniência, denunciante, vazamento), probabilidade de cair por trimestre e punição (multa em % do lucro, devolução em dobro, inabilitação do banqueiro, prisão). Duas mecânicas saem direto dos padrões: a **pressão por metas**, que aumenta vendas e também a chance de um funcionário fazer algo ilegal por conta própria (e de outro denunciar); e a **multa como custo**, que ensina ao jogador que a punição só pesa quando atinge a pessoa, não o caixa.

## 18. Sistema de carreira: do agiota ao conglomerado

A progressão natural do jogo segue as licenças reais do sistema financeiro: cada degrau custa mais capital e mais conformidade, e em troca libera juros legais mais altos, captação mais barata e clientes maiores.

&#91;embedded content: escada de carreira · 6 degraus de licença\]

O degrau 1 dá lucro rápido mas tem teto: com poucos clientes ninguém percebe, e cada novo devedor aumenta a chance de denúncia. O salto para o degrau 2 é o primeiro passo legal — a ESC dispensa o Bacen, mas limita o público. Do degrau 3 em diante entra o regulador, e o capital mínimo passou a ser calculado pelas atividades exercidas desde a Resolução Conjunta 14/2025 ([Let's Money](https://www.letsmoney.com.br/regulacao/capital-minimo-fintechs-banco-central-novas-regras/)).

### Duas trilhas paralelas

| Trilha | Como sobe | Indicador |
| --- | --- | --- |
| Empresa (licenças) | Acumular capital e cumprir requisitos de cada licença | Patrimônio, índice de Basileia, histórico limpo |
| Banqueiro (pessoal) | Reputação no mercado e com o regulador; patrimônio pessoal | Fama, influência, ficha criminal |

A trilha pessoal permite caminhos alternativos: um banqueiro com ficha limpa consegue licença mais rápido; um com processos pode ser barrado pelo Bacen (os dirigentes passam por análise de reputação). Uma condenação por usura no início da carreira fecha a porta para os degraus regulados — exatamente o dilema de quem começa como agiota.

### Atalhos e quedas

- **Atalho:** comprar uma instituição já licenciada (M&A) em vez de pedir licença do zero — mais caro, mais rápido.
- **Atalho:** banco como serviço (BaaS) — operar sobre a licença de outro banco pagando uma fatia da receita.
- **Queda:** capital abaixo do mínimo do degrau atual rebaixa o jogador ou força venda.
- **Queda:** intervenção do Bacen por fraude encerra a carreira e inabilita o banqueiro.

## 19. Tradução para mecânicas de jogo

O núcleo do simulador é um balanço que gira a cada trimestre: o jogador escolhe taxas, produtos e práticas; a economia e os clientes reagem; a DRE mostra o resultado e os reguladores observam.

### Recursos e indicadores

| Variável | O que representa | Efeito |
| --- | --- | --- |
| Capital (patrimônio) | Dinheiro dos acionistas + lucro retido | Teto de crédito (Basileia) e porta para a próxima licença |
| Caixa / liquidez | Reservas disponíveis | Abaixo do mínimo → corrida bancária |
| Depósitos | Funding barato | Crescem com clientes, app e agências |
| Carteira de crédito | Empréstimos ativos por produto | Gera juros e calotes |
| Inadimplência | % da carteira em atraso | Vira provisão e custo |
| Reputação | Imagem pública | Atrai ou espanta clientes e depósitos |
| Cliente lesado | Acúmulo de práticas desvantajosas | Alimenta reclamações e fiscalização |
| Atenção regulatória | Quanto o Bacen/Procon está de olho | Probabilidade de auditoria por trimestre |
| ROE e preço da ação | Pontuação | Investidores aportam capital se ROE alto |

### Ciclo de um trimestre

1. Cenário macro: Selic, inflação, desemprego e humor do mercado mudam (aleatório + tendência).
2. Decisões: taxas de cada produto, tarifas, quanto captar e por qual instrumento, práticas ativas, investimento em tecnologia, segurança e marketing.
3. Mercado reage: clientes entram ou saem conforme taxa, reputação e concorrentes; calotes acontecem conforme perfil da carteira e ciclo.
4. Eventos: fraude, golpe do Pix, matéria de jornal, ação coletiva, auditoria, crise de liquidez de outro banco.
5. Resultado: DRE e balanço; checagem de capital e liquidez; reguladores aplicam multas ou exigências.

### Penalidades em escala

| Nível | Gatilho | Consequência |
| --- | --- | --- |
| 1 | Reclamações acima da média | Ranking negativo do Bacen, perda de reputação |
| 2 | Prática da zona cinzenta flagrada | Multa do Procon + devolução em dobro |
| 3 | Infração regulatória repetida | Multa do Bacen, proibição de vender o produto |
| 4 | Capital ou liquidez abaixo do mínimo | Plano de recuperação obrigatório, sem novos empréstimos |
| 5 | Fraude ou crime | Intervenção, liquidação, inabilitação e prisão do banqueiro — fim de jogo |

### Ganchos de design

- **Dilema central:** lucro rápido (taxas altas, práticas cinzentas) contra crescimento sustentável (reputação, clientes bons, capital acumulado).
- **Ciclo econômico:** apostas que funcionam com Selic alta quebram o banco quando ela cai, e vice-versa.
- **Concorrentes com IA:** um bancão eficiente, um digital barato e uma cooperativa disputam os mesmos clientes.
- **Open Finance:** se o jogador cobra caro, concorrentes "enxergam" seus clientes e os roubam com ofertas melhores.

## 20. Números de referência e glossário

### Números para calibrar o jogo (out/2026)

| Indicador | Valor | Fonte |
| --- | --- | --- |
| Selic | 13,75% a.a. (desde 16/09/2026; próxima reunião 3–4/11) | [Atlas Público / Bacen](https://atlaspublico.com.br/bcb/noticias/copom-reduz-selic-para-13-75pct-ao-ano-em-decisao-unanime-87748) |
| Juro médio do rotativo do cartão | 442,4% a.a. (jun/2026) | [Times Brasil](https://timesbrasil.com.br/brasil/juros-cartao-rotativo-4424-junho/) |
| Juro médio do parcelado do cartão | 191,4% a.a. (jun/2026) | [Viva](https://viva.com.br/dinheiro/cartao-de-credito-juro-medio-do-rotativo-sobe-a-4424-ao-ano-em-junho.html) |
| Juro médio do cheque especial | 139,8% a.a. (jun/2026) | [Times Brasil](https://timesbrasil.com.br/brasil/juros-cartao-rotativo-4424-junho/) |
| Comprometimento de renda das famílias com dívidas | 28,5% (mai/2026) | [Viva](https://viva.com.br/dinheiro/cartao-de-credito-juro-medio-do-rotativo-sobe-a-4424-ao-ano-em-junho.html) |
| ROE Itaú / Santander Brasil | 24,3% / 12,5% (2T26) | [Money Times](https://www.moneytimes.com.br/itau-itub4-lucra-r-124-bilhoes-alta-de-78-no-2t26-e-fica-dentro-das-expetativas-rnda/) |
| Inadimplência > 90 dias (Itaú) | 1,9% | [Bloomberg Línea](https://www.bloomberglinea.com.br/negocios/itau-lucra-r-124-bi-no-2-tri-e-revisa-guidance-de-receitas-de-servicos-e-seguros/) |
| Carteira de crédito Itaú | R$ 1,52 trilhão | [Let's Money](https://www.letsmoney.com.br/noticias/itau-lucro-recorde-2-trimestre-2026/) |
| Capital mínimo de uma SCD | R$ 9,6 milhões (antes R$ 1 milhão) | [Let's Money](https://www.letsmoney.com.br/regulacao/capital-minimo-fintechs-banco-central-novas-regras/) |

### Glossário

| Termo | Significado |
| --- | --- |
| CDI | Taxa dos empréstimos entre bancos por um dia; referência de rendimento, colada na Selic |
| CET | Custo Efetivo Total: juros + tarifas + seguros + impostos de um crédito |
| Spread | Diferença entre a taxa cobrada no crédito e o custo de captação |
| PDD | Provisão para devedores duvidosos: reserva contábil para calotes esperados |
| ROE | Lucro dividido pelo patrimônio líquido |
| Índice de eficiência | Despesas operacionais divididas pelas receitas; quanto menor, melhor |
| Basileia | Acordos internacionais que fixam capital mínimo e liquidez dos bancos |
| Compulsório | Parte dos depósitos que o banco deve deixar parada no Banco Central |
| Funding | Conjunto das fontes de captação do banco |
| ALM | Gestão de ativos e passivos: casar prazos e indexadores |
| FGC | Fundo Garantidor de Créditos, pago pelos próprios bancos |
| Intercâmbio | Taxa paga pelo lojista ao banco emissor do cartão a cada compra |
| MDR | Taxa total que o lojista paga à adquirente por venda no cartão |
| Bancassurance | Venda de seguros pela rede do banco |
| Usura | Cobrança de juros acima do limite legal, fora do sistema financeiro autorizado |
