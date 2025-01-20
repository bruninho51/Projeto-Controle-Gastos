CREATE TRIGGER set_valor_atual_investimento_after_update_investimento
BEFORE UPDATE ON investimentos
FOR EACH ROW
BEGIN
    DECLARE v_exists INT;
    
    IF NEW.valor_inicial <> OLD.valor_inicial THEN
        SELECT COUNT(*) INTO v_exists
        FROM linha_do_tempo_investimentos
        WHERE investimento_id = NEW.id
          AND soft_delete IS NULL;
        
        IF v_exists = 0 THEN
            SET NEW.valor_atual = NEW.valor_inicial;
        END IF;
    END IF;
END;
