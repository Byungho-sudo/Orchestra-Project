alter table public.invite_codes
  alter column label set not null;

alter table public.invite_codes
  add constraint invite_codes_label_not_blank
  check (length(trim(label)) > 0);
