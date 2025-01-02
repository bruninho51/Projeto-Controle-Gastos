CREATE TRIGGER update_orcamento_after_gastos_fixos_update
AFTER UPDATE ON gastos_fixos
FOR EACH ROW
BEGIN
    CALL update_orcamento_values(NEW.orcamento_id);
END