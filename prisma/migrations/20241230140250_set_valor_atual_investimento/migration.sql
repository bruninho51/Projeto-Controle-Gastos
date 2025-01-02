CREATE TRIGGER set_valor_atual_investimento
BEFORE INSERT ON investimentos
FOR EACH ROW
BEGIN
    SET NEW.valor_atual = NEW.valor_inicial;
END