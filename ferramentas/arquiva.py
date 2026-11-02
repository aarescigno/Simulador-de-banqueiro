#!/usr/bin/env python3
"""Move seções inteiras (cabeçalhos ## ou ###) de um doc para outro, sem ler o conteúdo.

Uso:
  python3 ferramentas/arquiva.py ORIGEM DESTINO [--topo] "início do cabeçalho" ["outro" ...]

- Cada argumento é o começo exato de uma linha de cabeçalho da ORIGEM. A seção vai dessa
  linha até antes do próximo cabeçalho de nível igual ou maior (## para ##, ### para ###).
- Cabeçalhos dentro de blocos de código (```) são ignorados.
- Se algum argumento não casar com exatamente uma linha, nada é gravado.
- Sem --topo, as seções vão para o fim do DESTINO, na ordem dos argumentos.
  Com --topo, entram antes do primeiro "## " do DESTINO (para arquivos com os mais novos no topo).
- Imprime o tamanho em KB de ORIGEM e DESTINO, antes e depois.
"""
import os
import re
import sys

USO = __doc__


def kb(caminho):
    return os.path.getsize(caminho) / 1024 if os.path.exists(caminho) else 0.0


def cabecalhos(linhas):
    """Lista (índice, nível) das linhas de cabeçalho, fora de blocos de código."""
    saida = []
    dentro = False
    for i, ln in enumerate(linhas):
        if ln.lstrip().startswith("```"):
            dentro = not dentro
            continue
        if dentro:
            continue
        m = re.match(r"(#{1,6}) ", ln)
        if m:
            saida.append((i, len(m.group(1))))
    return saida


def secao(linhas, inicio, hs):
    """Intervalo [ini, fim) da seção que começa na linha que casa com `inicio`."""
    achados = [(i, n) for i, n in hs if linhas[i].startswith(inicio)]
    if len(achados) != 1:
        sys.exit(f"ERRO: {inicio!r} casa com {len(achados)} linhas de cabeçalho (precisa ser exatamente 1). Nada foi gravado.")
    ini, nivel = achados[0]
    fim = len(linhas)
    for j, n in hs:
        if j > ini and n <= nivel:
            fim = j
            break
    return ini, fim


def main():
    args = sys.argv[1:]
    topo = "--topo" in args
    args = [a for a in args if a != "--topo"]
    if len(args) < 3:
        sys.exit(USO)
    origem, destino, inicios = args[0], args[1], args[2:]
    if os.path.abspath(origem) == os.path.abspath(destino):
        sys.exit("ERRO: ORIGEM e DESTINO são o mesmo arquivo.")

    print(f"Antes: {origem} = {kb(origem):.1f} KB | {destino} = {kb(destino):.1f} KB")

    with open(origem, encoding="utf-8") as f:
        orig = f.read().splitlines()
    dest = []
    if os.path.exists(destino):
        with open(destino, encoding="utf-8") as f:
            dest = f.read().splitlines()

    hs = cabecalhos(orig)
    cortes = sorted(secao(orig, inicio, hs) for inicio in inicios)
    for (a_ini, a_fim), (b_ini, _) in zip(cortes, cortes[1:]):
        if b_ini < a_fim:
            sys.exit("ERRO: duas seções pedidas se sobrepõem (uma está dentro da outra). Nada foi gravado.")

    # Blocos a mover: sem linhas em branco no fim de cada um.
    blocos = []
    for ini, fim in [secao(orig, inicio, hs) for inicio in inicios]:
        bloco = orig[ini:fim]
        while bloco and bloco[-1].strip() == "":
            bloco.pop()
        blocos.append((ini, bloco))
    # Mantém a ordem dos argumentos na hora de gravar.
    ordem_args = [secao(orig, inicio, hs)[0] for inicio in inicios]
    blocos_ordenados = [dict(blocos)[ini] for ini in ordem_args]
    for ini, bloco in blocos:
        print(f"movida: {orig[ini]!r} ({len(bloco)} linhas)")

    # Origem: tira as seções; colapsa linhas em branco duplicadas que o corte deixar.
    removidas = set()
    for ini, fim in cortes:
        removidas.update(range(ini, fim))
    novo_orig = []
    for i, ln in enumerate(orig):
        if i in removidas:
            continue
        if ln.strip() == "" and novo_orig and novo_orig[-1].strip() == "":
            continue
        novo_orig.append(ln)
    while novo_orig and novo_orig[-1].strip() == "":
        novo_orig.pop()

    # Destino: entre as seções, uma linha em branco.
    trecho = []
    for k, bloco in enumerate(blocos_ordenados):
        if k:
            trecho.append("")
        trecho.extend(bloco)

    if topo:
        p = next((i for i, n in cabecalhos(dest) if dest[i].startswith("## ")), None)
        if p is None:
            novo_dest = dest[:]
            while novo_dest and novo_dest[-1].strip() == "":
                novo_dest.pop()
            novo_dest = novo_dest + [""] + trecho
        else:
            novo_dest = dest[:p] + trecho + [""] + dest[p:]
    else:
        novo_dest = dest[:]
        while novo_dest and novo_dest[-1].strip() == "":
            novo_dest.pop()
        novo_dest = novo_dest + ([""] if novo_dest else []) + trecho

    with open(origem, "w", encoding="utf-8") as f:
        f.write("\n".join(novo_orig) + "\n")
    with open(destino, "w", encoding="utf-8") as f:
        f.write("\n".join(novo_dest) + "\n")

    print(f"Depois: {origem} = {kb(origem):.1f} KB | {destino} = {kb(destino):.1f} KB")


if __name__ == "__main__":
    main()
