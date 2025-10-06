#!/bin/sh
set -e

echo "🚀 Configurando ambiente..."

# Cria link simbólico se o arquivo existir
create_link() {
  SOURCE=$1
  TARGET=$2
  
  if [ -f "$SOURCE" ]; then
    ln -sf "$SOURCE" "$TARGET"
    echo "✅ Link criado: $TARGET -> $SOURCE"
  fi
}

# Cria os links
create_link "/vault/secrets/.env" "/app/.env"
create_link "/vault/secrets/firebase-cert.json" "/app/firebase-cert.json"

echo "🎯 Iniciando aplicação..."
echo ""

# Executa o comando original
exec "$@"