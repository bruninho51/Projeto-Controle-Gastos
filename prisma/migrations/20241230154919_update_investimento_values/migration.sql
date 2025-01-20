CREATE PROCEDURE update_investimento_values(inv_id INT)
BEGIN
    -- Atualiza valor_atual com base na linha do tempo de um investimento
    UPDATE investimentos
    SET valor_atual = COALESCE((
        SELECT valor
        FROM linha_do_tempo_investimentos
        WHERE investimento_id = inv_id
        AND soft_delete IS NULL
        ORDER BY data_registro DESC, data_criacao DESC, id DESC
        LIMIT 1
    ), valor_inicial)
    WHERE id = inv_id;
END