-- Seed als aufrufbare Funktion: legt Rollen und Fixtermine für den
-- eingeloggten Nutzer an. Idempotent — mehrfacher Aufruf dupliziert nichts.
-- Wochentage: 0 = Montag ... 6 = Sonntag.

create or replace function public.seed_my_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  r   record;
begin
  if uid is null then
    raise exception 'seed_my_data: kein eingeloggter Nutzer';
  end if;

  -- Rollen
  for r in
    select * from (values
      ('Freund',                  0),
      ('Sportler & Teammanager',  1),
      ('Sohn',                    2),
      ('Student & Kollege',       3),
      ('Unternehmer',             4)
    ) as v(name, sort_order)
  loop
    if not exists (select 1 from public.roles where user_id = uid and name = r.name) then
      insert into public.roles (user_id, name, sort_order)
      values (uid, r.name, r.sort_order);
    end if;
  end loop;

  -- Fixtermine
  for r in
    select * from (values
      ('Uni (inkl. Fahrt)',                  1, time '07:15', time '18:00'),
      ('Lauftraining (inkl. Fahrt)',         2, time '17:15', time '19:00'),
      ('Uni (inkl. Fahrt)',                  3, time '07:15', time '12:00'),
      ('Berufsschule (nicht jede Woche)',    4, time '06:30', time '15:30'),
      ('Schwimmtraining (inkl. Fahrt)',      6, time '07:00', time '10:20')
    ) as v(title, weekday, start_time, end_time)
  loop
    if not exists (
      select 1 from public.fixed_events
      where user_id = uid and title = r.title and weekday = r.weekday
    ) then
      insert into public.fixed_events (user_id, title, weekday, start_time, end_time)
      values (uid, r.title, r.weekday, r.start_time, r.end_time);
    end if;
  end loop;

  -- Leere Mission anlegen, damit die App immer einen Datensatz vorfindet.
  if not exists (select 1 from public.mission where user_id = uid) then
    insert into public.mission (user_id, content) values (uid, '');
  end if;
end;
$$;

grant execute on function public.seed_my_data() to authenticated;
