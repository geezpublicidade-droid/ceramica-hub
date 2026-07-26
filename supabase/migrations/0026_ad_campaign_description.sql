-- Banner do topo (hero_abaixo) agora mostra texto ao lado da imagem, alem
-- do titulo -- precisa de um resumo curto proprio, opcional.
alter table ad_campaigns add column if not exists description text;
