-- DropForeignKey
ALTER TABLE `orcamentos` DROP FOREIGN KEY `orcamentos_fk_usuario`;

-- AlterTable
ALTER TABLE `gastos_fixos` ADD COLUMN `data_venc` DATE NULL;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `fk_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
