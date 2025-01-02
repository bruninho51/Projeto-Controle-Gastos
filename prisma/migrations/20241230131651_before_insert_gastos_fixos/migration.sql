CREATE TRIGGER before_insert_gastos_fixos
BEFORE INSERT ON gastos_fixos
FOR EACH ROW
BEGIN
    -- Quando valor for preenchido, data_pgto deve ser obrigatória
    IF NEW.valor IS NOT NULL AND NEW.data_pgto IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Se o valor for preenchido, a data_pgto também deve ser preenchida.';
    END IF;

    -- Quando valor for NULL, data_pgto deve ser NULL
    IF NEW.valor IS NULL THEN
        SET NEW.data_pgto = NULL;
    END IF;
END