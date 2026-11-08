begin;

alter table public.products
  drop column if exists category,
  drop column if exists number_label,
  drop column if exists art_style,
  drop column if exists color,
  drop column if exists stripe_color;

commit;
