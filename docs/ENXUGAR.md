# Rodada de enxugamento (quando os docs incharem)

Objetivo: baixar o custo de cada sessão sem perder informação. Só mexe em docs e configuração, nunca no código. Vale quando o `CLAUDE.md` passar de 8 KB, o `LOG.md` de 15 KB ou o `GDD.md` de 40 KB, ou quando abrir uma etapa começar a ler mais de 3 mil tokens.

## 1. Medir (sessão curta, Sonnet)

```bash
wc -c CLAUDE.md docs/*.md | sort -n | tail
ferramentas/indice.sh GDD | head -40
du -sh * .[!.]* 2>/dev/null | sort -h | tail
```

Só o `CLAUDE.md` custa em todo turno; o resto custa quando alguém lê. Ele vem primeiro.

## 2. Passos (um commit cada; o Haiku executa se o plano estiver decidido)

1. **`CLAUDE.md`:** exemplos e histórico saem; regras ficam inteiras. Confira com `git diff` que nenhuma regra se perdeu.
2. **Arquivar sem ler:** entradas antigas do `LOG.md` para `docs/LOG-ANTIGO.md`; marcos concluídos do `ROADMAP.md` podem ir para `docs/ROADMAP-FEITO.md`. Tudo com `ferramentas/arquiva.py`. Antes, `grep -rn` para ver se algum link aponta para a seção.
3. **Bloquear leituras caras:** pasta gerada ou binário novo vai para o `permissions.deny` do `.claude/settings.json`.

## 3. Conferir

Tamanhos de novo (`wc -c`) e `ferramentas/testar.sh` verde. Anote abaixo.

## Lições (de outro projeto, que chegou a 129 KB de plano)

- O índice é gerado na hora (`indice.sh`); tabela escrita à mão no doc fica velha.
- Arquivar a cada etapa sai mais barato que uma rodada grande depois.
- Conectores e plugins da conta do claude.ai não se desligam pelo `settings.json` nas sessões na nuvem.
- Um `CLAUDE.md` com as regras inteiras vale mais do que um menor que perdeu regra.

## Resultados

| Data | Medida | Antes | Depois |
| ---- | ------ | ----- | ------ |
