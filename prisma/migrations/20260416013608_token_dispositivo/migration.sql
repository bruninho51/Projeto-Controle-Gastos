-- CreateTable
CREATE TABLE `tokens_dispositivos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `usuario_id` INTEGER NOT NULL,
    `plataforma` VARCHAR(191) NOT NULL,
    `data_criacao` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `data_atualizacao` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `tokens_dispositivos_token_key`(`token`),
    INDEX `tokens_dispositivos_usuario_id_idx`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tokens_dispositivos` ADD CONSTRAINT `tokens_dispositivos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `orcamentos` RENAME INDEX `fk_usuario` TO `orcamentos_fk_usuario`;
