-- Tabela de Orçamentos
CREATE TABLE orcamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    valor_inicial DECIMAL(10, 2) NOT NULL,
    valor_atual DECIMAL(10, 2),
    valor_livre DECIMAL(10, 2),
    data_encerramento DATE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,  -- Coluna de inatividade
    soft_delete TIMESTAMP,  -- Coluna para soft delete
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),  -- Garante que a data de inatividade seja válida
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao)  -- Garante que a data de soft delete seja válida
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;