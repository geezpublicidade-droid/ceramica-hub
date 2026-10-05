-- Conteudo inicial da vitrine das demais macrocategorias (Alimentacao ja foi semeada na 0072).
-- So preenche o que estiver vazio; tudo editavel em /admin/publicidade/categorias/conteudo.
-- As fotos sao provisorias (acervo do site) ate o cliente enviar imagens proprias de cada segmento.

update categories c set
  hero_title = v.title,
  hero_description = v.description,
  hero_image_url = v.image,
  hero_image_alt = v.alt,
  highlights_text = v.highlights,
  ad_eyebrow = 'Anuncie nesta categoria',
  ad_text = v.ad_text,
  ad_cta_label = 'Quero anunciar'
from (values
  ('saude-e-estetica', 'Saúde e Estética no Espaço Cerâmica',
   'Clínicas, consultórios, estética e bem-estar com atendimento perto de você, dentro do Cerâmica.',
   '/images/ceramica-hero-2.jpg', 'Corredor de um edifício do Espaço Cerâmica',
   'Profissionais e clínicas que cuidam de quem vive e trabalha no Espaço Cerâmica.',
   'Apresente sua clínica a quem busca saúde e bem-estar sem sair do Cerâmica.'),
  ('tecnologia-e-marketing', 'Tecnologia e Marketing no Espaço Cerâmica',
   'Agências, software, consultorias e soluções digitais para fazer o seu negócio crescer.',
   '/images/ceramica-hub-corporativo.webp', 'Escritório corporativo no Espaço Cerâmica',
   'Empresas de tecnologia e comunicação que movimentam o ecossistema do Cerâmica.',
   'Conecte sua empresa a quem decide e contrata dentro do Cerâmica.'),
  ('contabilidade-e-juridico', 'Contabilidade e Jurídico no Espaço Cerâmica',
   'Escritórios contábeis, advocacia e consultorias para dar segurança ao seu negócio.',
   '/images/ceramica-hub-corporativo.webp', 'Sala de reunião corporativa no Espaço Cerâmica',
   'Escritórios de confiança, a poucos passos de quem empreende no Cerâmica.',
   'Torne seu escritório a primeira lembrança de quem trabalha no Cerâmica.'),
  ('moda-e-beleza', 'Moda e Beleza no Espaço Cerâmica',
   'Salões, barbearias, moda e cuidados pessoais com o estilo de quem circula pelo Cerâmica.',
   '/images/ceramica-hero-3.jpg', 'Fachada do Espaço Cerâmica',
   'Marcas de moda e beleza que fazem parte do dia a dia no Espaço Cerâmica.',
   'Mostre sua marca a quem passa pelo Cerâmica todos os dias.'),
  ('educacao', 'Educação no Espaço Cerâmica',
   'Cursos, escolas, idiomas e formação para quem quer aprender e evoluir na carreira.',
   '/images/ceramica-hero-1.jpg', 'Edifícios do Espaço Cerâmica',
   'Instituições e profissionais que ensinam e formam dentro do Espaço Cerâmica.',
   'Apresente seus cursos a quem vive e trabalha no Cerâmica.'),
  ('design-e-arquitetura', 'Design e Arquitetura no Espaço Cerâmica',
   'Escritórios de arquitetura, interiores e design para transformar espaços e marcas.',
   '/images/ceramica-hero-4.jpg', 'Arquitetura do Espaço Cerâmica',
   'Estúdios e profissionais que projetam o que acontece no Espaço Cerâmica.',
   'Coloque seu estúdio diante de quem constrói e reforma no Cerâmica.'),
  ('investimentos', 'Investimentos no Espaço Cerâmica',
   'Consultorias, assessorias e gestoras para planejar e fazer o seu patrimônio crescer.',
   '/images/ceramica-hub-corporativo.webp', 'Ambiente corporativo no Espaço Cerâmica',
   'Especialistas em finanças e investimentos presentes no Espaço Cerâmica.',
   'Fale com um público qualificado que trabalha dentro do Cerâmica.')
) as v(slug, title, description, image, alt, highlights, ad_text)
where c.level = 1 and c.slug = v.slug and c.hero_title is null;
