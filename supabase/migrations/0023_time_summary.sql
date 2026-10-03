-- Orbit CRM — Agregação de apontamentos (totais independentes da paginação)

create or replace function public.time_entries_summary(
  p_tenant uuid,
  p_project uuid default null,
  p_task uuid default null
)
returns table (seconds bigint, billable_amount numeric)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(
      sum(
        coalesce(
          te.duration_seconds,
          extract(epoch from (now() - te.started_at))::bigint
        )
      ),
      0
    )::bigint as seconds,
    coalesce(
      sum(
        case
          when te.is_billable and te.rate is not null then
            (
              coalesce(
                te.duration_seconds,
                extract(epoch from (now() - te.started_at))
              )::numeric / 3600
            ) * te.rate
          else 0
        end
      ),
      0
    ) as billable_amount
  from public.time_entries te
  where te.tenant_id = p_tenant
    and (p_project is null or te.project_id = p_project)
    and (p_task is null or te.task_id = p_task);
$$;

grant execute on function public.time_entries_summary(uuid, uuid, uuid) to authenticated;
grant execute on function public.time_entries_summary(uuid, uuid, uuid) to service_role;
