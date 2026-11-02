#!/usr/bin/env bash
# Índice dos docs grandes: cabeçalhos com nº de linha, para ler só a seção da vez (Read com offset e limit).
# Uso: ferramentas/indice.sh [GDD|ROADMAP|LOG|PROXIMA-SESSAO|referencia/...] [filtro]   ex.: ferramentas/indice.sh GDD cobrança
cd "$(dirname "$0")/.."
for f in docs/${1:-GDD}.md; do
  total=$(wc -l < "$f")
  grep -nE '^#{2,3} ' "$f" | awk -F: -v t="$total" -v f="$f" '
    { if (NR>1) printf "%s  %d–%d  %s\n", f, ini, $1-1, tit; ini=$1; tit=substr($0, length($1)+2) }
    END { if (NR) printf "%s  %d–%d  %s\n", f, ini, t, tit }'
done | grep -i -- "${2:-.}"
