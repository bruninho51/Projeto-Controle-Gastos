#!/usr/bin/env bash
# ==================================================
# renovar-gitlab-registry.sh
#
# Para que serve:
#   O cluster K3s puxa a imagem da aplicação do GitLab Container Registry
#   (registry.gitlab.com) usando um imagePullSecret. Esse secret é gerado a
#   partir de um token do GitLab, que expira. Quando expira, os pods passam a
#   falhar com ErrImagePull / ImagePullBackOff. Este script renova o secret.
#
# O que faz:
#   1. Pede usuário e IP/hostname do servidor (SSH).
#   2. Copia um script auxiliar ao servidor e o executa lá, onde pede o
#      usuário e o token do GitLab Registry e faz `docker login` em um
#      diretório temporário (o login do seu usuário não é alterado).
#   3. Gera o Secret (tipo kubernetes.io/dockerconfigjson) com
#      `kubectl --dry-run=client`, sem aplicá-lo ao cluster.
#   4. Criptografa o Secret com `kubeseal`, usando o controller
#      sealed-secrets do cluster, produzindo um SealedSecret. Só o cluster
#      consegue descriptografá-lo, por isso é seguro versioná-lo no git.
#   5. Baixa o SealedSecret e grava em k8s/app/gitlab-registry.yml, somente se
#      o conteúdo for válido (não vazio e com `kind: SealedSecret`).
#   6. Remove os arquivos temporários local e remoto e fecha a conexão SSH.
#
# Como usar:
#   ./scripts/renovar-gitlab-registry.sh
#   Depois, revise o diff, faça commit e deixe o pipeline/ArgoCD aplicar o
#   k8s/app/gitlab-registry.yml.
#
# Pré-requisitos:
#   - Local: ssh e scp.
#   - Servidor: docker, kubectl e kubeseal, e sudo para o usuário SSH.
#   - Token do GitLab com permissão de leitura no registry (read_registry).
#
# Segurança:
#   O token é lido sem eco, passado ao docker por stdin e nunca gravado em
#   disco fora do diretório temporário (modo 700), apagado ao final.
# ==================================================
set -Eeuo pipefail

# ==================================================
# Configuração fixa
# ==================================================

REGISTRY_HOST="registry.gitlab.com"
NAMESPACE="orcamentos-app"
SECRET_NAME="gitlab-registry-secret"

# ==================================================
# Diretórios
# ==================================================

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

DEST="$PROJECT_ROOT/k8s/app/gitlab-registry.yml"

# ==================================================
# Dados do servidor
# ==================================================

read -r -p "Usuário SSH do servidor: " SSH_USER
read -r -p "IP ou hostname do servidor: " SSH_HOST

SSH_TARGET="${SSH_USER}@${SSH_HOST}"

RUN_ID="$(date +%s)-$$"
REMOTE_SCRIPT="/tmp/gitlab-registry-gen-${RUN_ID}.sh"
REMOTE_OUTPUT="/tmp/gitlab-registry-sealedsecret-${RUN_ID}.yaml"
LOCAL_SCRIPT="$(mktemp)"
LOCAL_TMP="$(mktemp)"

# Reaproveita uma única conexão SSH (a senha é pedida só uma vez)
SSH_CTL_DIR="$(mktemp -d)"
SSH_OPTS=(
    -o ControlMaster=auto
    -o ControlPath="$SSH_CTL_DIR/ctl"
    -o ControlPersist=120
)

cleanup() {
    rm -f "$LOCAL_SCRIPT" "$LOCAL_TMP"
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "rm -f '$REMOTE_SCRIPT' '$REMOTE_OUTPUT'" >/dev/null 2>&1 || true
    ssh "${SSH_OPTS[@]}" -O exit "$SSH_TARGET" >/dev/null 2>&1 || true
    rm -rf "$SSH_CTL_DIR"
}
trap cleanup EXIT

# ==================================================
# Validações
# ==================================================

for cmd in ssh scp; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Erro: comando '$cmd' não encontrado."
        exit 1
    fi
done

echo
echo "Servidor: $SSH_TARGET"
echo "Registry: $REGISTRY_HOST"
echo "Namespace: $NAMESPACE"
echo "Secret: $SECRET_NAME"
echo "Destino: $DEST"
echo

# ==================================================
# Script remoto (copiado via scp, para o stdin ficar livre para o terminal)
# ==================================================

cat > "$LOCAL_SCRIPT" <<'REMOTE'
#!/usr/bin/env bash
set -Eeuo pipefail

REGISTRY_HOST="$1"
NAMESPACE="$2"
SECRET_NAME="$3"
REMOTE_OUTPUT="$4"

TMP_DIR="$(mktemp -d)"
chmod 700 "$TMP_DIR"

cleanup_remote() {
    rm -rf "$TMP_DIR"
}
trap cleanup_remote EXIT

export DOCKER_CONFIG="$TMP_DIR/docker"
mkdir -m 700 "$DOCKER_CONFIG"

read -r -p "Usuário do GitLab Registry: " REGISTRY_USER
read -r -s -p "Token do GitLab Registry: " GITLAB_TOKEN
printf '\n'

printf '%s' "$GITLAB_TOKEN" |
    docker login "$REGISTRY_HOST" \
        --username "$REGISTRY_USER" \
        --password-stdin
unset GITLAB_TOKEN

# Gera o Secret temporário sem aplicá-lo ao cluster
sudo kubectl create secret generic "$SECRET_NAME" \
    --namespace "$NAMESPACE" \
    --type=kubernetes.io/dockerconfigjson \
    --from-file=.dockerconfigjson="$DOCKER_CONFIG/config.json" \
    --dry-run=client \
    -o yaml > "$TMP_DIR/secret.yaml"

# Criptografa usando o controller do K3s (grava em arquivo temporário primeiro)
sudo kubeseal \
    --kubeconfig /etc/rancher/k3s/k3s.yaml \
    --controller-name sealed-secrets-controller \
    --controller-namespace kube-system \
    --format yaml \
    --namespace "$NAMESPACE" \
    < "$TMP_DIR/secret.yaml" \
    > "$TMP_DIR/sealed.yaml"

if [[ ! -s "$TMP_DIR/sealed.yaml" ]]; then
    echo "Erro: kubeseal gerou saída vazia." >&2
    exit 1
fi

install -m 600 "$TMP_DIR/sealed.yaml" "$REMOTE_OUTPUT"
echo "SealedSecret gerado com sucesso em $REMOTE_OUTPUT"
REMOTE

# ==================================================
# Execução remota
# ==================================================

echo "Enviando script ao servidor..."
scp "${SSH_OPTS[@]}" -q "$LOCAL_SCRIPT" "${SSH_TARGET}:${REMOTE_SCRIPT}"

ssh "${SSH_OPTS[@]}" -t "$SSH_TARGET" \
    "bash '$REMOTE_SCRIPT' '$REGISTRY_HOST' '$NAMESPACE' '$SECRET_NAME' '$REMOTE_OUTPUT'"

# ==================================================
# Download para a máquina local
# ==================================================

echo
echo "Baixando manifesto..."

scp "${SSH_OPTS[@]}" "${SSH_TARGET}:${REMOTE_OUTPUT}" "$LOCAL_TMP"

if [[ ! -s "$LOCAL_TMP" ]] || ! grep -q '^kind: SealedSecret' "$LOCAL_TMP"; then
    echo "Erro: manifesto baixado está vazio ou inválido. Arquivo atual mantido." >&2
    exit 1
fi

mkdir -p "$(dirname "$DEST")"
install -m 644 "$LOCAL_TMP" "$DEST"

echo
echo "Concluído com sucesso!"
echo "Arquivo gerado: $DEST"
