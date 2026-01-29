#!/bin/sh

# Script para:
# 1. Atualizar deployment.yml e db-migrate.yml
# 2. Fazer build e push da imagem Docker ANTES do commit
# 3. Garantir que ArgoCD encontre a imagem quando ler os arquivos

new_version="$1"

if [ -z "$new_version" ]; then
    echo "❌ Erro: Versão é obrigatória"
    echo "Uso: $0 \"1.2.3\""
    exit 1
fi

echo "🚀 Iniciando build e atualização para versão: $new_version"

image_name="registry.gitlab.com/bruninho51/projeto-controle-gastos"
new_tag="v$new_version"
full_image="$image_name:$new_tag"
latest_image="$image_name:latest"

# Passo 1: Atualizar deployment.yml
deployment_file="k8s/app/deployment.yml"
echo "📝 Atualizando $deployment_file..."

if [ ! -f "$deployment_file" ]; then
    echo "❌ Erro: Arquivo $deployment_file não encontrado"
    exit 1
fi

sed -i "s|image: registry\.gitlab\.com/bruninho51/projeto-controle-gastos:.*|image: $full_image|" "$deployment_file"

if grep -q "$full_image" "$deployment_file"; then
    echo "✅ $deployment_file atualizado com sucesso!"
else
    echo "❌ Erro: Falha ao atualizar $deployment_file"
    exit 1
fi

# Passo 1.1: Atualizar db-migrate.yml
migrate_job_file="k8s/jobs/db-migrate.yml"
echo "📝 Atualizando $migrate_job_file..."

if [ ! -f "$migrate_job_file" ]; then
    echo "❌ Erro: Arquivo $migrate_job_file não encontrado"
    exit 1
fi

sed -i "s|image: registry\.gitlab\.com/bruninho51/projeto-controle-gastos:.*|image: $full_image|" "$migrate_job_file"

if grep -q "$full_image" "$migrate_job_file"; then
    echo "✅ $migrate_job_file atualizado com sucesso!"
else
    echo "❌ Erro: Falha ao atualizar $migrate_job_file"
    exit 1
fi

# Passo 2: Build da imagem Docker
echo "🐳 Fazendo build da imagem Docker..."
docker build -t "$full_image" .

if [ $? -eq 0 ]; then
    echo "✅ Build da imagem concluído: $full_image"
else
    echo "❌ Erro: Falha no build da imagem Docker"
    exit 1
fi

# Passo 3: Push da imagem para o registry
echo "📤 Enviando imagem para o registry..."

# Login no GitLab Container Registry
if [ -n "$CI_REGISTRY_USER" ] && [ -n "$CI_REGISTRY_PASSWORD" ]; then
    echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
elif [ -n "$GL_TOKEN" ] && [ -n "$CI_REGISTRY_USER" ]; then
    echo "$GL_TOKEN" | docker login -u "$CI_REGISTRY_USER" --password-stdin registry.gitlab.com
else
    echo "❌ Erro: Variáveis de autenticação não encontradas. Abortando push da imagem."
    echo "ℹ️ Certifique-se de que as variáveis CI_REGISTRY_USER e CI_REGISTRY_PASSWORD estão configuradas"
    exit 1
fi

docker push "$full_image"
docker push "$latest_image"

if [ $? -eq 0 ]; then
    echo "✅ Imagem enviada com sucesso: $full_image"
else
    echo "❌ Erro: Falha ao enviar imagem para o registry"
    exit 1
fi

# Conclusão
echo "🎉 Build e atualização concluídos!"
echo "📦 Nova versão: $new_version"
echo "🐳 Nova imagem: $full_image"
echo "📋 Arquivos atualizados:"
echo "   - $deployment_file"
echo "   - $migrate_job_file"
