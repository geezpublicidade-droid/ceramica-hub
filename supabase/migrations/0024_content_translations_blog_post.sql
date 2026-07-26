alter table content_translations drop constraint content_translations_entity_type_check;
alter table content_translations add constraint content_translations_entity_type_check
  check (entity_type in ('business', 'benefit', 'opportunity', 'business_service', 'virtual_tour_scene', 'blog_post'));
