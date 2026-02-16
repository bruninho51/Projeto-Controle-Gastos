#!/bin/sh
set -e

# Carrega variáveis de ambiente do Vault se existir
[ -f /vault/secrets/config ] && . /vault/secrets/config

# Link do Firebase
[ -f /vault/secrets/firebase-cert.json ] && ln -sf /vault/secrets/firebase-cert.json /app/firebase-cert.json

# Executa o comando do container
exec "$@"
