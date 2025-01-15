CREATE TABLE investimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,           -- Tipo de investimento (ex: "Ações", "Fundos Imobiliários", etc.)
    valor_inicial DECIMAL(10, 2) NOT NULL,        -- Valor inicial do investimento
    valor_atual DECIMAL(10, 2),        -- Valor atual do investimento
    categoria_id INT,        -- Relaciona com a tabela categorias_investimentos
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,                -- Data de inatividade do investimento, caso não esteja mais ativo
    soft_delete TIMESTAMP,           -- Data de soft delete, quando o investimento for marcado como excluído
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),  -- Garante que a data de inatividade seja válida
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao),  -- Garante que a data de soft delete seja válida
    FOREIGN KEY (categoria_id) REFERENCES categorias_investimentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;