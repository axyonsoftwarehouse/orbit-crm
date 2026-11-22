import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ItemPicker } from "@/components/app/item-picker"
import { DocumentItemsEditor } from "@/components/app/document-items-editor"
import type { ItemOption } from "@/server/queries/items"

const base = {
  long_description: null,
  rate: 10,
  unit: null,
  tax_name: null,
  tax_rate: null,
  group: null,
}

const pickerItems: ItemOption[] = [
  { ...base, id: "1", description: "Instalação elétrica", active: true },
  { ...base, id: "2", description: "Instalação antiga", active: false },
  { ...base, id: "3", description: "Manutenção", active: true },
]

describe("ItemPicker", () => {
  it("filtra sem acento/caixa e ignora inativo", async () => {
    render(<ItemPicker items={pickerItems} onSelect={vi.fn()} />)

    await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
    await userEvent.type(
      screen.getByPlaceholderText(/buscar item/i),
      "instalacao",
    )

    expect(screen.getByText("Instalação elétrica")).toBeInTheDocument()
    expect(screen.queryByText("Instalação antiga")).not.toBeInTheDocument()
    expect(screen.queryByText("Manutenção")).not.toBeInTheDocument()
  })

  it("Enter seleciona o primeiro resultado", async () => {
    const onSelect = vi.fn()
    render(
      <ItemPicker
        items={[{ ...base, id: "1", description: "Consultoria", active: true }]}
        onSelect={onSelect}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
    await userEvent.type(
      screen.getByPlaceholderText(/buscar item/i),
      "consul{Enter}",
    )

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
  })
})

describe("DocumentItemsEditor", () => {
  it("escolher do catálogo acrescenta linha preenchida com item_id", async () => {
    const onChange = vi.fn()
    render(
      <DocumentItemsEditor
        items={[{ description: "", qty: 1, rate: 0 }]}
        onChange={onChange}
        catalog={[
          {
            ...base,
            id: "i1",
            description: "Instalação",
            rate: 150,
            unit: "h",
            tax_name: "ISS",
            tax_rate: 5,
            active: true,
          },
        ]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
    await userEvent.click(screen.getByText("Instalação"))

    expect(onChange).toHaveBeenCalledWith([
      { description: "", qty: 1, rate: 0 },
      {
        description: "Instalação",
        qty: 1,
        rate: 150,
        unit: "h",
        tax_name: "ISS",
        tax_rate: 5,
        item_id: "i1",
      },
    ])
  })
})
