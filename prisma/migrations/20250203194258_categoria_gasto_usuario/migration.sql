ALTER TABLE categorias_gastos
ADD COLUMN usuario_id INTEGER NOT NULL;

-- Adicionando a chave estrangeira
ALTER TABLE categorias_gastos
ADD CONSTRAINT categorias_gastos_fk_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
