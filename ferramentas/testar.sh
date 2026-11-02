#!/usr/bin/env bash
# Roda os comandos de ferramentas/testes.txt, em ordem, a partir da raiz do projeto, e mostra só o resumo:
# a última linha de cada um, mais até 5 linhas com FAIL/Error/falhou. Sai com 1 se algum falhar.
# Uso: ferramentas/testar.sh          (os rápidos)
#      ferramentas/testar.sh --tudo   (também as linhas que começam com "tudo:")
cd "$(dirname "$0")/.."
st=0
while IFS= read -r linha || [ -n "$linha" ]; do
  case "$linha" in ''|\#*) continue ;; esac
  if [[ "$linha" == tudo:* ]]; then
    [ "$1" = "--tudo" ] || continue
    linha="${linha#tudo:}"; linha="${linha# }"
  fi
  out=$(bash -c "$linha" 2>&1); rc=$?
  ultima=$(printf '%s\n' "$out" | grep -v '^\s*$' | tail -1)
  if [ $rc -eq 0 ]; then echo "ok    $linha  →  ${ultima:0:120}"
  else echo "FALHA $linha  (saída $rc)  →  ${ultima:0:120}"; st=1; fi
  printf '%s\n' "$out" | grep -m5 -E '^(FAIL|.*Error|.*falhou)' | grep -vF "$ultima" | sed 's/^/      /'
done < ferramentas/testes.txt
exit $st
