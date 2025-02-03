ALTER TABLE investimentos
ADD COLUMN usuario_id INTEGER NOT NULL;

-- Adicionando a chave estrangeira
ALTER TABLE investimentos
ADD CONSTRAINT investimentos_fk_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
