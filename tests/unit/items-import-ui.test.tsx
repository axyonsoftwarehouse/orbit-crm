import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/server/actions/items", () => ({
  importItemsAction: vi.fn(),
}))

import { ImportItemsDialog } from "@/app/app/itens/import-items-dialog"

describe("ImportItemsDialog", () => {
  it("bloqueia a importação quando há linha inválida", async () => {
    render(<ImportItemsDialog descriptions={["Instalação"]} groups={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /importar csv/i }))
    const file = new File(
      ["Descrição;Valor\nInstalação;10\nConsultoria;20\nManutenção;"],
      "itens.csv",
      { type: "text/csv" },
    )
    await userEvent.upload(screen.getByLabelText(/arquivo csv/i), file)

    expect(await screen.findByText(/1 válida/i)).toBeInTheDocument()
    expect(screen.getByText(/1 duplicada/i)).toBeInTheDocument()
    expect(screen.getByText(/1 inválida/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /^importar 1 item/i }),
    ).toBeDisabled()
    expect(screen.getByText(/corrija as linhas inválidas/i)).toBeInTheDocument()
  })
})
