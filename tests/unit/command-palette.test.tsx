import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const push = vi.hoisted(() => vi.fn())
const searchAction = vi.hoisted(() => vi.fn(async () => [] as unknown[]))

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("@/server/actions/search", () => ({ searchAction }))

import { CommandPalette } from "@/components/app/command-palette"

// jsdom não implementa scrollIntoView.
Element.prototype.scrollIntoView = vi.fn()

describe("CommandPalette", () => {
  it("abre com Ctrl+K, filtra comandos e navega com Enter", async () => {
    const user = userEvent.setup()
    render(<CommandPalette />)

    expect(screen.queryByRole("combobox")).toBeNull()
    await user.keyboard("{Control>}k{/Control}")
    const input = await screen.findByRole("combobox")

    await user.type(input, "fatur")
    const options = screen.getAllByRole("option")
    expect(options.map((o) => o.textContent)).toEqual([
      "Nova fatura",
      "Faturas",
    ])

    await user.keyboard("{ArrowDown}{Enter}")
    expect(push).toHaveBeenCalledWith("/app/faturas")
    await waitFor(() => expect(screen.queryByRole("combobox")).toBeNull())
  })

  it("mostra resultados da busca antes dos comandos", async () => {
    searchAction.mockResolvedValueOnce([
      {
        id: "l1",
        title: "Maria Souza",
        subtitle: "Acme",
        href: "/app/leads/l1",
        type: "lead",
      },
    ])
    const user = userEvent.setup()
    render(<CommandPalette />)

    await user.click(screen.getByRole("button", { name: /buscar/i }))
    await user.type(await screen.findByRole("combobox"), "maria")

    await screen.findByText("Maria Souza")
    expect(searchAction).toHaveBeenCalledWith("maria")
    await user.keyboard("{Enter}")
    expect(push).toHaveBeenLastCalledWith("/app/leads/l1")
  })
})
