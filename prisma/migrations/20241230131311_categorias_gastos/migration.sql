-- Tabela de Categorias
CREATE TABLE categorias_gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,  -- Coluna de inatividade
    soft_delete TIMESTAMP,  -- Coluna para soft delete
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),  -- Garante que a data de inatividade seja válida
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao),  -- Garante que a data de soft delete seja válida
    UNIQUE KEY unique_categoria_gasto (nome,(coalesce(soft_delete, '1900-01-01')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserindo categorias
INSERT INTO categorias_gastos (nome) VALUES
    ('Transporte Público'),
    ('Transporte Uber'),
    ('Alimentação e Bebidas Fora de Casa e Delivery'),
    ('Compras de Supermercado e Mercado'),
    ('Saúde e Bem-Estar'),
    ('Moradia e Utilidades'),
    ('Entretenimento e Lazer'),
    ('Investimentos e Poupança'),
    ('Presentes e Caridade'),
    ('Eventos e Festividades'),
    ('Assinaturas e Serviços de Assinatura'),
    ('Educação e Desenvolvimento Pessoal'),
    ('Despesas com Animais de Estimação'),
    ('Váquinas e Objetivos'),
    ('Evolução de Obra Apartamento'),
    ('Outros');