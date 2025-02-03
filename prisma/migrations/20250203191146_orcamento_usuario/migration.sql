ALTER TABLE orcamentos
ADD COLUMN usuario_id INTEGER NOT NULL;

-- Adicionando a chave estrangeira
ALTER TABLE orcamentos
ADD CONSTRAINT orcamentos_fk_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
