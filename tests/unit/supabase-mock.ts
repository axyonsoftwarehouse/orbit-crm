import { vi } from "vitest"

type Call = { method: string; args: unknown[] }
type Result = { data: unknown; error: unknown }

/**
 * Mock encadeável do client Supabase. `results[table]` é o que a query da
 * tabela resolve (em `await`, `.single()` ou `.maybeSingle()`); uma função
 * recebe as chamadas registradas e decide o resultado.
 */
export function createSupabaseMock(
  results: Record<string, Result | ((calls: Call[]) => Result)> = {},
) {
  const queries: { table: string; calls: Call[] }[] = []

  function builder(table: string) {
    const calls: Call[] = []
    queries.push({ table, calls })
    const resolve = (): Result => {
      const entry = results[table] ?? { data: null, error: null }
      return typeof entry === "function" ? entry(calls) : entry
    }
    const chain: Record<string, unknown> = {}
    for (const method of [
      "select",
      "insert",
      "update",
      "eq",
      "neq",
      "in",
      "is",
      "order",
      "limit",
    ]) {
      chain[method] = (...args: unknown[]) => {
        calls.push({ method, args })
        return chain
      }
    }
    chain.single = async () => resolve()
    chain.maybeSingle = async () => resolve()
    chain.then = (
      onFulfilled: (value: Result) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve()).then(onFulfilled, onRejected)
    return chain
  }

  const client = { from: vi.fn((table: string) => builder(table)) }

  function callsFor(table: string): Call[][] {
    return queries.filter((q) => q.table === table).map((q) => q.calls)
  }

  return { client, queries, callsFor }
}

export function hasCall(calls: Call[], method: string, ...args: unknown[]) {
  return calls.some(
    (call) =>
      call.method === method &&
      JSON.stringify(call.args) === JSON.stringify(args),
  )
}
