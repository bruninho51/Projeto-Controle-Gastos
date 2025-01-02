-- Tabela de Gastos Fixos
CREATE TABLE gastos_fixos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    previsto DECIMAL(10, 2) NOT NULL,
    valor DECIMAL(10, 2),
    categoria_id INT,
    orcamento_id INT,
    diferenca DECIMAL(10, 2) GENERATED ALWAYS AS (previsto - valor) STORED,
    data_pgto DATE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    data_inatividade TIMESTAMP,  -- Coluna de inatividade
    soft_delete TIMESTAMP,  -- Coluna para soft delete
    FOREIGN KEY (categoria_id) REFERENCES categorias_gastos(id) ON DELETE SET NULL,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id) ON DELETE CASCADE,
    CHECK (data_inatividade IS NULL OR data_inatividade >= data_criacao),
    CHECK (soft_delete IS NULL OR soft_delete >= data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;