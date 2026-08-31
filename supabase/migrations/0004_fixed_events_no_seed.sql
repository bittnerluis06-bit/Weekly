-- Fixtermine werden nicht mehr geseedet: die Tabelle startet leer, gepflegt
-- wird sie in der App unter Einstellungen. `fixed_events` bleibt unverändert
-- Teil des Datenmodells.
--
-- 1) Die früher geseedeten Termine entfernen — nur exakte Treffer der alten
--    Seed-Zeilen, von Hand angelegte Termine bleiben unberührt.
-- 2) seed_my_data() legt nur noch Rollen und die leere Mission an.

delete from public.fixed_events fe
where (fe.title, fe.weekday, fe.start_time, fe.end_time) in (
  ('Uni (inkl. Fahrt)',               1, time '07:15', time '18:00'),
  ('Lauftraining (inkl. Fahrt)',      2, time '17:15', time '19:00'),
  ('Uni (inkl. Fahrt)',               3, time '07:15', time '12:00'),
  ('Berufsschule (nicht jede Woche)', 4, time '06:30', time '15:30'),
  ('Schwimmtraining (inkl. Fahrt)',   6, time '07:00', time '10:20')
);

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

  for r in
    select * from (values
      ('Freund',                    0),
      ('Sportler',                  1),
      ('Sohn',                      2),
      ('Kollege',                   3),
      ('Side Hustle - Persönlich',  4)
    ) as v(name, sort_order)
  loop
    if not exists (select 1 from public.roles where user_id = uid and name = r.name) then
      insert into public.roles (user_id, name, sort_order)
      values (uid, r.name, r.sort_order);
    end if;
  end loop;

  if not exists (select 1 from public.mission where user_id = uid) then
    insert into public.mission (user_id, content) values (uid, '');
  end if;
end;
$$;

grant execute on function public.seed_my_data() to authenticated;
