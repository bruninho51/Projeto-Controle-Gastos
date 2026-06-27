-- CreateTable
CREATE TABLE `padroes_notificacoes_bancarias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituicao_financeira` VARCHAR(255) NOT NULL,
    `titulo_notificacao` VARCHAR(255) NOT NULL,
    `regex` TEXT NOT NULL,
    `data_criacao` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `data_atualizacao` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `data_expiracao` TIMESTAMP(0) NOT NULL,
    `soft_delete` TIMESTAMP,

    UNIQUE INDEX `unique_instituicao_titulo`(`instituicao_financeira`, `titulo_notificacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
