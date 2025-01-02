CREATE TRIGGER update_investimento_after_linha_do_tempo_update
AFTER UPDATE ON linha_do_tempo_investimentos
FOR EACH ROW
BEGIN
    UPDATE investimentos
    SET valor_atual = (
        SELECT valor
        FROM linha_do_tempo_investimentos
        WHERE investimento_id = NEW.investimento_id
        ORDER BY data_registro DESC
        LIMIT 1
    )
    WHERE id = NEW.investimento_id;
END