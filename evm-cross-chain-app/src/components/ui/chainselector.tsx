import { X } from "lucide-react"
import { Button } from "./button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "./dialog"

import { ChainName, ChainIcon, ChainProvider } from "thirdweb/react"
import { client } from "@/app/client"
import { defineChain } from "thirdweb/chains"
import { SupportedChain, useSupportedChains } from "@/lib/chains"

interface ChainSelectionProps {
    isOpen: boolean,
    onClose: () => void,
    onSelect: (chain: SupportedChain) => void
    selectedChain: number
}

export function ChainSelection({ isOpen, onClose, onSelect, selectedChain }: ChainSelectionProps) {

    const handleChainSelect = (chain: SupportedChain) => {
        onSelect(chain)
        onClose()
    }

    const { chains, loading, error } = useSupportedChains()

    const filteredChains = chains.filter((chain) => chain)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:!max-w-3xl w-[720px] p-0">
                <DialogHeader className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <DialogTitle>Select a Chain</DialogTitle>
                        <div className="flex justify-beetween items-center">
                            <Button
                                size="icon"
                                className="h-7 w-7 text-gray-500 bg-transparent hover:text-gray-900 hover:bg-gray-200"
                                onClick={onClose}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                    </div>
                </DialogHeader>
                <div className="p-6 !pt-2 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                        {filteredChains.map((chain) => (
                            <div
                                key={chain.chainId}
                                className={`flex items-center relative p-3 space-x-3 rounded-lg hover:bg-gray-200 cursor-pointer
                                ${chain.chainId === selectedChain ? "bg-gray-300" : ""}`}
                                onClick={() => handleChainSelect(chain)}
                            >
                                <ChainProvider chain={defineChain(chain.chainId)}>
                                    <ChainIcon
                                        loadingComponent={
                                            chain.iconUrl ? (
                                                <img src={chain.iconUrl} alt={chain.name} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="bg-black rounded-full w-6 h-6" />
                                            )
                                        }
                                        fallbackComponent={
                                            chain.iconUrl ? (
                                                <img src={chain.iconUrl} alt={chain.name} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="bg-black rounded-full w-6 h-6" />
                                            )
                                        }
                                        client={client} className="w-6 h-6" />
                                    <ChainName className="text-sm" />
                                </ChainProvider>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}