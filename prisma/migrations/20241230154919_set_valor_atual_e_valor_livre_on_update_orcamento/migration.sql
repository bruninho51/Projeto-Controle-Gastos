CREATE TRIGGER set_valor_atual_e_valor_livre_on_update_orcamento
BEFORE UPDATE ON orcamentos
FOR EACH ROW
BEGIN
    -- Verifica se o campo 'valor_inicial' foi alterado
    IF NEW.valor_inicial <> OLD.valor_inicial THEN
        -- Atualiza 'valor_atual' apenas se 'valor_inicial' for alterado
        SET NEW.valor_atual = NEW.valor_inicial 
                - (SELECT IFNULL(SUM(valor), 0) 
                   FROM gastos_fixos 
                   WHERE orcamento_id = NEW.id 
                     AND data_pgto IS NOT NULL
                     AND soft_delete IS NULL)
                - (SELECT IFNULL(SUM(valor), 0) 
                   FROM gastos_variados 
                   WHERE orcamento_id = NEW.id 
                     AND data_pgto IS NOT NULL
                     AND soft_delete IS NULL);

        -- Atualiza 'valor_livre' apenas se 'valor_inicial' for alterado
        SET NEW.valor_livre = NEW.valor_inicial 
                - (SELECT IFNULL(SUM(
                    CASE 
                        WHEN data_pgto IS NOT NULL THEN valor 
                        ELSE previsto 
                    END), 0) 
                   FROM gastos_fixos 
                   WHERE orcamento_id = NEW.id
                   AND soft_delete IS NULL)
                - (SELECT IFNULL(SUM(valor), 0) 
                   FROM gastos_variados 
                   WHERE orcamento_id = NEW.id 
                     AND data_pgto IS NOT NULL
                     AND soft_delete IS NULL);
    END IF;
END;
