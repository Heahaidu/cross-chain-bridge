import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronRight, CircleCheck, ExternalLink } from "lucide-react"
import TransactionService from "@/hooks/Transaction"
import { ChainIcon, ChainProvider, useActiveAccount } from "thirdweb/react"
import { useSupportedChains } from "@/lib/chains"
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers"
import { defineChain } from "thirdweb"
import { client } from "@/app/client"
import { shortenAddr } from "@/lib/utils"
import { Spinner } from "../spinner"

type TxHistoryDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export default function TxHistoryDialog({ isOpen, onClose }: TxHistoryDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const { chains, loading: isChainLoading, error } = useSupportedChains()
  const activeAccount = useActiveAccount()

  useEffect(() => {
    if (!isOpen || !activeAccount?.address) return

    const load = async () => {
      setLoading(true)
      const txs = await TransactionService.fetchTransactions(activeAccount.address, 20, 0)
      setTransactions(txs)
      setLoading(false)
    }

    load()
  }, [isOpen, activeAccount?.address])

  const TransactionItem = ({ transaction }: { transaction: any }) => {
    if (isChainLoading) return

    const srcChain = chains.find((c) => c.chainSelectorName === transaction.sourceNetworkName)
    const token = srcChain?.tokens.find((t) => t.address.toLowerCase() === transaction.tokenAmounts[0].token.toLowerCase())

    const destChain = chains.find((c) => c.chainSelectorName === transaction.destNetworkName)
    if (!srcChain || !token || !destChain) return
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-900 flex">
            <div className="z-10">
              <ChainProvider chain={defineChain(srcChain?.chainId ? srcChain.chainId : 0)}>
                <ChainIcon
                  loadingComponent={
                    srcChain && srcChain.iconUrl ? (
                      <img src={srcChain.iconUrl} alt={srcChain.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="bg-black rounded-full w-6 h-6" />
                    )
                  }
                  fallbackComponent={
                    srcChain && srcChain.iconUrl ? (
                      <img src={srcChain.iconUrl} alt={srcChain.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="bg-black rounded-full w-6 h-6" />
                    )
                  }
                  client={client} className="w-6 h-6" />
              </ChainProvider>
            </div>
            <div className="-ml-2 z-0">
              <ChainProvider chain={defineChain(destChain?.chainId ? destChain.chainId : 0)}>
                <ChainIcon
                  loadingComponent={
                    destChain && destChain.iconUrl ? (
                      <img src={destChain.iconUrl} alt={destChain.name} className="w-6 h-6 rounded-full absolute" />
                    ) : (
                      <div className="bg-black rounded-full w-6 h-6" />
                    )
                  }
                  fallbackComponent={
                    destChain && destChain.iconUrl ? (
                      <img src={destChain.iconUrl} alt={destChain.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="bg-black rounded-full w-6 h-6" />
                    )
                  }
                  client={client} className="w-6 h-6" />
              </ChainProvider>
            </div>
            <div className="flex space-x-2 items-center pl-2">
              <div>
                {srcChain?.name}
              </div>
              <ChevronRight className="inline w-4 h-4" />
              <div>
                {destChain?.name}
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-600">
            {transaction.state === 2 ?
              <div className="flex space-x-1 items-center">
                <CircleCheck className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-500">Completed</span>
              </div>
              :
              <div className="flex space-x-2 items-center">
                <div className="w-3 h-3 text-green animate-pulse bg-yellow-400 rounded-full" />
                <span className="font-semibold">Pending</span>
              </div>
            }
          </span>
        </div>

        {/* Chains */}
        <div className="space-x-2 flex items-center">
          <img className="h-8 w-8 rounded-full " src={token?.iconUrl} />
          <div className="font-semibold text-lg">
            {formatUnits(transaction.tokenAmounts[0]?.amount, token.decimals)} {token?.symbol}
          </div>
        </div>


        {/* Details */}
        <div className="text-xs pt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div>Source TxHash</div>
            <a
              href={`${srcChain?.explorer}tx/${transaction.transactionHash}`}
              target="_blank"
              className="cursor-pointer underline underline-offset-2 hover:text-blue-600"
            >{shortenAddr(transaction.transactionHash)}</a>
          </div>
          <div className="flex items-center justify-between">
            <div>Destination TxHash</div>
            {
              transaction.destTransactionHash ?
                <a
                  href={`${destChain?.explorer}tx/${transaction.destTransactionHash}`}
                  target="_blank"
                  className="cursor-pointer underline underline-offset-2 hover:text-blue-600"
                >{shortenAddr(transaction.destTransactionHash)}</a>
                :
                <div className="h-3 w-24 rounded-full bg-gray-200 animate-pulse" />
            }
          </div>
          <div className="flex items-center justify-between">
            <div>Receiver</div>
            <a
              href={`${destChain?.explorer}address/${transaction.receiver}`}
              target="_blank"
              className="cursor-pointer underline underline-offset-2 hover:text-blue-600"
            >{shortenAddr(transaction.receiver)}</a>
          </div>
          <div className="flex items-center justify-between">
            <div>Timestamp (UTC)</div>
            <div>{transaction.blockTimestamp}</div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 text-gray-900 max-w-lg max-h-[80vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader className="p-4 border border-gray-200">
          <div className=" flex justify-between items-center">
            <div className="flex">
              <DialogTitle className="text-lg font-semibold">Transactions</DialogTitle>
              <a target="_blank" href={`https://ccip.chain.link/address/${activeAccount?.address}`}>
                <ExternalLink href="" className="pl-2 w-5 h-5 cursor-pointer hover:text-blue-600" />
              </a>
            </div>
            <Button
              size="icon"
              className="w-7 h-7 text-gray-500 bg-transparent hover:text-gray-900 hover:bg-gray-200"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 min-h-0 p-4 pt-0">

          {loading ? (
            <div className="justify-items-center py-8 space-y-3">
              <div className="items-center"><Spinner className="text-gray-500" style={{ width: 24, height: 24 }} variant="circle" /></div>
              <div className="text-gray-500 translate-x-2">Loading…</div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((t) => (
                <TransactionItem key={t.messageId} transaction={t} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No transactions yet</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}