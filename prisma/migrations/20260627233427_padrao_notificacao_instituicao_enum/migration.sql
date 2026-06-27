/*
  Warnings:

  - You are about to alter the column `instituicao_financeira` on the `padroes_notificacoes_bancarias` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `padroes_notificacoes_bancarias` MODIFY `instituicao_financeira` ENUM('INTER', 'ITAU', 'NUBANK', 'ALELO', 'IFOOD_BENEFICIOS') NOT NULL;
