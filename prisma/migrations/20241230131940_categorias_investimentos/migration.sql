CREATE TABLE categorias_investimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,        
    soft_delete TIMESTAMP,
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),  -- Garante que a data de inatividade seja válida
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao)  -- Garante que a data de soft delete seja válida
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categorias_investimentos (nome) 
VALUES 
    ('Ações'),
    ('Fundos Imobiliários'),
    ('Renda Fixa'),
    ('Tesouro Direto'),
    ('Criptomoedas'),
    ('Câmbio'),
    ('Previdência Privada'),
    ('Private Equity'),
    ('Venture Capital'),
    ('Commodities');