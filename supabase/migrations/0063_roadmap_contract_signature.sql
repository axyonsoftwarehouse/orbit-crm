-- Orbit CRM — roadmap: assinatura de contrato em andamento
--
-- O fluxo (link público, assinatura em PNG, prova de aceite, hash do conteúdo,
-- histórico) está implementado; o item fecha quando o primeiro tenant usar em
-- produção.

update public.roadmap_items
set status = 'in_progress'
where title = 'Assinatura eletrônica de contratos';
