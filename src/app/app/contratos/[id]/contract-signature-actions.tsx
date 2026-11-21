"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCheck, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  clearContractSignatureAction,
  markContractSignedAction,
} from "@/server/actions/contracts"

export function ContractSignatureActions({
  contractId,
  signed,
  markedAsSigned,
}: {
  contractId: string
  signed: boolean
  markedAsSigned: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(
    action: (id: string) => Promise<{ ok?: true; error?: string }>,
    okMessage: string,
  ) {
    startTransition(async () => {
      const result = await action(contractId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(okMessage)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!markedAsSigned ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(markContractSignedAction, "Contrato marcado como assinado.")
          }
        >
          <CheckCheck className="size-4" />
          Assinado no papel
        </Button>
      ) : null}
      {signed ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(clearContractSignatureAction, "Assinatura removida.")
          }
        >
          <Undo2 className="size-4" />
          Desfazer assinatura
        </Button>
      ) : null}
    </div>
  )
}
