CREATE TRIGGER update_orcamento_after_gastos_variados_insert
AFTER INSERT ON gastos_variados
FOR EACH ROW
BEGIN
    CALL update_orcamento_values(NEW.orcamento_id);
END