-- Login com Google (NextAuth) além de e-mail/senha. Contas criadas ou
-- vinculadas via Google não têm senha própria, então password_hash precisa
-- deixar de ser obrigatório nas 4 tabelas de conta.
alter table businesses alter column password_hash drop not null;
alter table business_staff alter column password_hash drop not null;
alter table members alter column password_hash drop not null;
alter table admins alter column password_hash drop not null;
