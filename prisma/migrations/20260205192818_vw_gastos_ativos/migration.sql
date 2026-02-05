/* View: vw_gastos_ativos
   Descrição: Combina gastos fixos e variados ativos (não deletados) com informações do orçamento e usuário.
*/
CREATE OR REPLACE VIEW vw_gastos_ativos AS
(
    SELECT 
        -- Orçamento
        gf.orcamento_id,
        o.nome AS orcamento_nome,
        o.valor_inicial AS orcamento_valor_inicial,
        o.valor_atual AS orcamento_valor_atual,
        o.valor_livre AS orcamento_valor_livre,
        o.data_encerramento AS orcamento_data_encerramento,
        o.data_criacao AS orcamento_data_criacao,
        o.data_atualizacao AS orcamento_data_atualizacao,
        -- Usuário
        u.id AS usuario_id,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        -- Gasto Fixo
        gf.id AS gasto_id,
        'fixo' AS gasto_tipo,
        gf.descricao AS gasto_descricao,
        gf.previsto AS gasto_previsto,
        gf.valor AS gasto_valor,
        gf.categoria_id AS gasto_categoria_id,
        gf.diferenca AS gasto_diferenca,
        gf.data_pgto AS gasto_data_pgto,
        gf.observacoes AS gasto_observacoes,
        gf.data_criacao AS gasto_data_criacao,
        gf.data_atualizacao AS gasto_data_atualizacao,
        gf.data_venc AS gasto_data_venc
    FROM gastos_fixos gf
    INNER JOIN orcamentos o ON o.id = gf.orcamento_id
    INNER JOIN usuarios u ON u.id = o.usuario_id
    INNER JOIN categorias_gastos cg ON cg.id = gf.categoria_id
    WHERE gf.soft_delete IS NULL

    UNION ALL

    SELECT
        -- Orçamento
        gv.orcamento_id,
        o.nome AS orcamento_nome,
        o.valor_inicial AS orcamento_valor_inicial,
        o.valor_atual AS orcamento_valor_atual,
        o.valor_livre AS orcamento_valor_livre,
        o.data_encerramento AS orcamento_data_encerramento,
        o.data_criacao AS orcamento_data_criacao,
        o.data_atualizacao AS orcamento_data_atualizacao,
        -- Usuário
        u.id AS usuario_id,
        u.nome AS usuario_nome,
        u.email AS usuario_email,
        -- Gasto Variado
        gv.id AS gasto_id,
        'variado' AS gasto_tipo,
        gv.descricao AS gasto_descricao,
        NULL AS gasto_previsto,
        gv.valor AS gasto_valor,
        gv.categoria_id AS gasto_categoria_id,
        NULL AS gasto_diferenca,
        gv.data_pgto AS gasto_data_pgto,
        gv.observacoes AS gasto_observacoes,
        gv.data_criacao AS gasto_data_criacao,
        gv.data_atualizacao AS gasto_data_atualizacao,
        NULL AS gasto_data_venc
    FROM gastos_variados gv
    INNER JOIN orcamentos o ON o.id = gv.orcamento_id
    INNER JOIN usuarios u ON u.id = o.usuario_id
    INNER JOIN categorias_gastos cg ON cg.id = gv.categoria_id
    WHERE gv.soft_delete IS NULL
);
