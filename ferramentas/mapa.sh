#!/usr/bin/env bash
# Índice do código: seções, classes, funções e constantes, com arquivo e nº de linha.
# Use para achar o trecho e ler só aquelas linhas, em vez do arquivo inteiro.
# Uso: ferramentas/mapa.sh [filtro]          ex.: ferramentas/mapa.sh save
#      MAPA_DIRS="src lib" ferramentas/mapa.sh  (pastas; padrão: src, ou a raiz se não houver src)
# Reconhece JS/TS, Python, Go, Rust, Java/C#/Kotlin, Ruby, PHP, CSS e comentários de seção (/* ===, // ===, # ===).
cd "$(dirname "$0")/.."
DIRS=${MAPA_DIRS:-$([ -d src ] && echo src || echo .)}
PADRAO='^\s*(/\*|//|#) ?={3,}'                                           # comentário de seção
PADRAO+='|^\s*(export\s+)?(default\s+)?(async\s+)?(function\*?|class|interface|type|enum)\s+[A-Za-z_$]'   # JS/TS
PADRAO+='|^(export\s+)?const\s+[A-Z_$][A-Za-z0-9_$]*\s*='                # constantes e componentes no topo
PADRAO+='|^  (static\s+|async\s+|get\s+|set\s+)*[a-zA-Z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*\{'   # métodos de classe JS
PADRAO+='|^\s*(async\s+)?def\s+\w+|^class\s+\w+'                         # Python
PADRAO+='|^func\s|^type\s+\w+\s+(struct|interface)'                       # Go
PADRAO+='|^\s*(pub(\(crate\))?\s+)?(fn|struct|enum|trait|impl|mod)\s'    # Rust
PADRAO+='|^\s*(public|private|protected|internal)\s+[^=;]*\('             # Java/C#/Kotlin
PADRAO+='|^\s*(module|def)\s+\w|^\s*(public\s+)?function\s+\w'            # Ruby/PHP
PADRAO+='|^@media|^@layer'                                                 # CSS
grep -rnE "$PADRAO" $DIRS \
  --include='*.js' --include='*.mjs' --include='*.ts' --include='*.tsx' --include='*.jsx' --include='*.vue' --include='*.svelte' \
  --include='*.py' --include='*.go' --include='*.rs' --include='*.java' --include='*.kt' --include='*.cs' --include='*.rb' --include='*.php' \
  --include='*.css' --include='*.scss' --include='*.html' --include='*.sh' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=.venv --exclude-dir=venv --exclude-dir=target --exclude-dir=vendor \
  --exclude='*.min.js' \
  | sed 's#^\./##' | sed 's/ *{ *$//' | cut -c1-140 | grep -i -- "${1:-.}"
