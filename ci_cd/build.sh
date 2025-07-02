#!/bin/sh

# Script para: 
# 1. Atualizar deployment.yml
# 2. Fazer build e push da imagem Docker ANTES do commit
# 3. Garantir que ArgoCD encontre a imagem quando ler o deployment.yml

new_version="$1"

if [ -z "$new_version" ]; then
    echo "❌ Erro: Versão é obrigatória"
    echo "Usage: $0 \"1.2.3\""
    exit 1
fi

echo "🚀 Iniciando build e atualização para versão: $new_version"

# Passo 1: Atualizar deployment.yml
echo "📝 Atualizando deployment.yml..."
deployment_file="k8s/app/deployment.yml"

if [ ! -f "$deployment_file" ]; then
    echo "❌ Erro: Arquivo $deployment_file não encontrado"
    exit 1
fi

# Substituição da imagem com sed compatível com POSIX
# Se estiver usando Alpine no CI, o sed já é compatível com -i sem sufixo
sed -i "s|image: registry\.gitlab\.com/bruninho51/projeto-controle-gastos:.*|image: registry.gitlab.com/bruninho51/projeto-controle-gastos:v$new_version|" "$deployment_file"

if grep -q "registry\.gitlab\.com/bruninho51/projeto-controle-gastos:v$new_version" "$deployment_file"; then
    echo "✅ Deployment.yml atualizado com sucesso!"
else
    echo "❌ Erro: Falha ao atualizar o deployment.yml"
    exit 1
fi

# Passo 2: Build da imagem Docker
echo "🐳 Fazendo build da imagem Docker..."
image_name="registry.gitlab.com/bruninho51/projeto-controle-gastos"
new_tag="v$new_version"

docker build -t "$image_name:$new_tag" .

if [ $? -eq 0 ]; then
    echo "✅ Build da imagem concluído: $image_name:$new_tag"
else
    echo "❌ Erro: Falha no build da imagem Docker"
    exit 1
fi

# Passo 3: Push da imagem para o registry
echo "📤 Enviando imagem para o registry..."

# Login no GitLab Container Registry
if [ -n "$CI_REGISTRY_USER" ] && [ -n "$CI_REGISTRY_PASSWORD" ]; then
    echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
elif [ -n "$GL_TOKEN" ]; then
    echo "$GL_TOKEN" | docker login -u "$CI_REGISTRY_USER" --password-stdin registry.gitlab.com
else
    echo "⚠️ Aviso: Variáveis de autenticação não encontradas. Pulando push da imagem."
    echo "ℹ️ Certifique-se de que as variáveis CI_REGISTRY_USER e CI_REGISTRY_PASSWORD estão configuradas"
fi

docker push "$image_name:$new_tag"

if [ $? -eq 0 ]; then
    echo "✅ Imagem enviada com sucesso: $image_name:$new_tag"
else
    echo "❌ Erro: Falha ao enviar imagem para o registry"
    exit 1
fi

echo "🎉 Build e atualização concluídos!"
echo "📦 Nova versão: $new_version"
echo "🐳 Nova imagem: $image_name:$new_tag"
echo "📋 Deployment.yml atualizado"
echo ""
echo "ℹ️ A imagem está disponível no registry ANTES do commit"
echo "ℹ️ ArgoCD poderá fazer deploy assim que ler o deployment.yml atualizado"
