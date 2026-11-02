#!/usr/bin/env python3
"""Põe uma entrada nova no topo de um log (logo depois do 1º '---'), sem ler o arquivo no chat.
Uso: python3 ferramentas/anota.py docs/LOG.md < entrada.md
     (ou com heredoc: python3 ferramentas/anota.py docs/LOG.md <<'EOF' ... EOF)
A entrada começa com '## AAAA-MM-DD · Marco · assunto · PR #N'; o separador '---' é posto sozinho."""
import sys
arq = sys.argv[1]
novo = sys.stdin.read().strip('\n')
assert novo.startswith('## '), "a entrada deve começar com '## '"
s = open(arq, encoding='utf-8').read()
marca = '\n---\n'
assert marca in s, "o arquivo precisa ter um '---' depois do cabeçalho"
i = s.index(marca) + len(marca)
s = s[:i] + '\n' + novo + '\n\n---\n' + s[i:]
open(arq, 'w', encoding='utf-8').write(s)
print('ok:', arq, '+', len(novo.encode()), 'bytes')
