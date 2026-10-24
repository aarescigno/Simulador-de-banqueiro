# Agiota S.A.

Jogo de gestão em turnos, no navegador e instalável no celular: comece como agiota de bairro e suba até conglomerado financeiro. Instrutivo sobre como os bancos ganham dinheiro e ácido sobre o preço disso.

- [Documento de design](docs/GDD.md)
- [Roadmap](docs/ROADMAP.md)
- [Briefing da próxima sessão](docs/PROXIMA-SESSAO.md)
- [Diário de sessões](docs/LOG.md)
- [Referência: como um banco ganha dinheiro](docs/referencia/como-um-banco-ganha-dinheiro.md)

Status: Marco 1a em andamento. Garantias e negociação prontas; a próxima etapa está em [`docs/PROXIMA-SESSAO.md`](docs/PROXIMA-SESSAO.md).

## Desenvolvimento

```sh
npm install
npm run dev        # servidor local
npm run typecheck
npm test
npm run build
npm run sim        # balanço: patrimônio e calote por taxa e prazo
```

Painel dev: no menu, toque 10 vezes no número da versão.
