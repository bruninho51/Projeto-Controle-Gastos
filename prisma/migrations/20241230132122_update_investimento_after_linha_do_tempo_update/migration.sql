CREATE TRIGGER update_investimento_after_linha_do_tempo_update
AFTER UPDATE ON linha_do_tempo_investimentos
FOR EACH ROW
BEGIN
    CALL update_investimento_values(NEW.investimento_id);
END