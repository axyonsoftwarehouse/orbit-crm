-- Orbit CRM — F17: Portal do cliente (contratos + despesas faturáveis)

-- Contratos: o cliente enxerga os contratos da própria empresa (somente leitura).
create policy "contracts_client_select" on public.contracts
  for select to authenticated using (public.is_client_of_company(company_id));

-- Despesas: o cliente enxerga apenas as despesas faturáveis da própria empresa.
create policy "expenses_client_select" on public.expenses
  for select to authenticated
  using (billable and public.is_client_of_company(company_id));
