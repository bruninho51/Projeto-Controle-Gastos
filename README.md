# Projeto de Controle de Gastos e Investimentos
Este projeto é uma API Rest para controle de gastos e investimentos, utilizando o Prisma como ORM para interação com o banco de dados e o MySQL como sistema de gerenciamento de banco de dados.

## Funcionalidades principais:
- Cadastro de categorias de gastos e investimentos;
- Registro de gastos fixos e gastos variados;
- Acompanhamento do valor de investimentos ao longo do tempo;
- Controle de orçamentos com possibilidade de atualização e controle de valores.

## Tecnologias Utilizadas
- Node.js: Ambiente de execução JavaScript;
- Nest.js: Framework para desenvolvimento de API's;
- Prisma: ORM para fácil interação com o banco de dados;
- MySQL 8: Banco de dados relacional;
- TypeScript: Superset do JavaScript com tipagem estática.


## Instalação
1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/projeto-controle-gastos.git
cd projeto-controle-gastos
```

2. Instale as dependências

```bash
npm install
```

3. Configure o banco de dados

- Crie um banco de dados no MySQL:

```bash
docker run --name mysql-orcamento \   
  -e MYSQL_ROOT_PASSWORD=root \
  -p 3306:3306 \
  -v mysql-orcamento:/var/lib/mysql \
  -d mysql:8.0
```

- No arquivo .env, configure a variável DATABASE_URL com a URL de conexão do seu banco de dados:

```env
DATABASE_URL="mysql://root:root@localhost:3306/orcamentos"
```

4. Gere o cliente Prisma

- Depois de configurar o banco de dados e o arquivo .env, gere o cliente Prisma:

```bash
npx prisma generate
```

5. Rodar as migrações

- Caso você ainda não tenha executado as migrações, rode o seguinte comando para aplicar as alterações no banco de dados:

```bash
npx prisma migrate dev
```

- Este comando vai aplicar as migrações e criar as tabelas necessárias no banco de dados de acordo com o seu schema.prisma.

## Estrutura do Banco de Dados


### Modelos no Prisma
O schema.prisma define os seguintes modelos:

- **CategoriaGasto**: Representa as categorias de gastos;
- **CategoriaInvestimento**: Representa as categorias de investimentos;
- **GastoFixo**: Representa os gastos fixos de cada categoria;
- **GastoVariado**: Representa os gastos variados de cada categoria;
- **Investimento**: Representa os investimentos registrados;
- **LinhaDoTempoInvestimento**: Representa o histórico de alterações de valores nos investimentos;
- **Orcamento**: Representa os orçamentos financeiros;

O mapeamento para as tabelas do banco é realizado com o comando @@map para garantir que as tabelas sigam o padrão de nomes em minúsculo com underscores (ex.: categorias_gastos, gastos_fixos).

## Scripts
1. Prisma Generate

Gera o cliente Prisma baseado no schema.prisma.

```bash
npx prisma generate
```
2. Prisma Migrate

Aplica as migrações no banco de dados.

```bash
npx prisma migrate dev
```
3. Executar a aplicação

Você pode rodar o seguinte comando para iniciar o servidor:

```bash
npm run start:dev
```
