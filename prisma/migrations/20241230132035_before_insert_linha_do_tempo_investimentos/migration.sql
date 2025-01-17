CREATE TRIGGER before_insert_linha_do_tempo_investimentos
BEFORE INSERT ON linha_do_tempo_investimentos
FOR EACH ROW
BEGIN
    -- Quando valor for preenchido, data_registro deve ser obrigatória
    IF NEW.valor IS NOT NULL AND NEW.data_registro IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Se o valor for preenchido, a data_registro também deve ser preenchida.';
    END IF;

    -- Quando valor for NULL (embora valor seja NOT NULL, caso seja alterado no futuro)
    IF NEW.valor IS NULL THEN
        SET NEW.data_registro = NULL;
    END IF;
END