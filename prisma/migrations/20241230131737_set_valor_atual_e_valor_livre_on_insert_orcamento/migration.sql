CREATE TRIGGER set_valor_atual_e_valor_livre_on_insert_orcamento
BEFORE INSERT ON orcamentos
FOR EACH ROW
BEGIN
    SET NEW.valor_atual = NEW.valor_inicial;
    SET NEW.valor_livre = NEW.valor_inicial;
END