CREATE TRIGGER set_valor_atual_e_valor_livre_on_update_orcamento
BEFORE UPDATE ON orcamentos
FOR EACH ROW
BEGIN
    SET NEW.valor_atual = NEW.valor_inicial 
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_fixos 
               WHERE orcamento_id = NEW.id 
                 AND data_pgto IS NOT NULL)
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_variados 
               WHERE orcamento_id = NEW.id 
                 AND data_pgto IS NOT NULL);
                 
    SET NEW.valor_livre = NEW.valor_inicial 
            - (SELECT IFNULL(SUM(
                CASE 
                    WHEN data_pgto IS NOT NULL THEN valor 
                    ELSE previsto 
                END), 0) 
               FROM gastos_fixos 
               WHERE orcamento_id = NEW.id)
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_variados 
               WHERE orcamento_id = NEW.id 
                 AND data_pgto IS NOT NULL);
END