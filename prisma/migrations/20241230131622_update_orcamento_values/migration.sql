CREATE PROCEDURE update_orcamento_values(orc_id INT)
BEGIN
    -- Atualiza valor_atual e valor_livre com base nos gastos fixos e variáveis do orçamento específico
    UPDATE orcamentos o
    SET 
        valor_atual = valor_inicial 
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_fixos 
               WHERE orcamento_id = o.id 
                 AND data_pgto IS NOT NULL)
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_variados 
               WHERE orcamento_id = o.id 
                 AND data_pgto IS NOT NULL),
                 
        valor_livre = valor_inicial 
            - (SELECT IFNULL(SUM(
                CASE 
                    WHEN data_pgto IS NOT NULL THEN valor 
                    ELSE previsto 
                END), 0) 
               FROM gastos_fixos 
               WHERE orcamento_id = o.id)
            - (SELECT IFNULL(SUM(valor), 0) 
               FROM gastos_variados 
               WHERE orcamento_id = o.id 
                 AND data_pgto IS NOT NULL)
    WHERE id = orc_id;
END