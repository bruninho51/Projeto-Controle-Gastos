CREATE TABLE linha_do_tempo_investimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investimento_id INT,                -- Relaciona com a tabela de investimentos
    valor DECIMAL(10, 2) NOT NULL,       -- Valor do investimento no dia
    data_registro DATE NOT NULL,         -- Data do registro do valor
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,               -- Data de inatividade do registro
    soft_delete TIMESTAMP,          -- Data de soft delete, quando o registro foi "excluído"
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),  -- Garante que a data de inatividade seja válida
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao),  -- Garante que a data de soft delete seja válida
    FOREIGN KEY (investimento_id) REFERENCES investimentos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;