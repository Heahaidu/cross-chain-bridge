import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Token } from "@/lib/chains";
import { Input } from "./input";
import { useEffect, useState } from "react";
import { isAddress } from "ethers";

interface TokenSelectionProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (token: Token) => void
    selectedToken: string
    commonTokens: Token[]
}

export default function TokenSelection({ isOpen, onClose, onSelect, selectedToken, commonTokens }: TokenSelectionProps) {

    const [searchTerm, setSearchTerm] = useState("")
    const [unknownTokens, setUnknownTokens] = useState<Token[]>([])
    const [isDup, setDup] = useState(false)
    const handleTokenSelect = (token: Token) => {
        onSelect(token)
        onClose()
    }
    const filterTokens = commonTokens.filter((token) => (token.address.toLowerCase() === searchTerm.toLowerCase()))

    useEffect(() => {
        if (searchTerm.length > 0 && isAddress(searchTerm)) {
            if (filterTokens.length > 0) {
                setDup(true)
            } else {
                setDup(false)
            }
        } else {
            setDup(false)
        }
    }, [searchTerm])

    const TokenCard = ({token}:{token: Token}) => (
        <div
            key={token.address}
            className={`flex items-center relative p-3 space-x-3 rounded-lg hover:bg-gray-200 cursor-pointer ${selectedToken === token.symbol ? 'bg-gray-300' : ''
                }`
            }
            onClick={() => handleTokenSelect(token)}
        >
            <div className="flex items-center space-x-3">
                {
                    token.iconUrl ? <img src={token.iconUrl} className="w-6 h-6" /> :
                        <div className="relative">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">{token.symbol[0]}</span>
                            </div>
                        </div>
                }
                <div>{token.symbol}</div>
            </div>
        </div >
    )

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:!max-w-sm w-[720px] p-0">
                <DialogHeader className="p-0 pb-3 border-b border-gray-200">
                    <div className="p-3 pb-1 flex justify-between items-center">
                        <DialogTitle className="text-md">Select a Token</DialogTitle>
                        <Button
                            size="icon"
                            className="w-7 h-7 text-gray-500 bg-transparent hover:text-gray-900 hover:bg-gray-200"
                            onClick={onClose}
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="relative pl-3 pr-3">
                        <Search className="absolute text-gray-400 w-4 h-4 left-6 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Search by token address"
                            maxLength={42}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!text-xs text-gray-900 pl-10 placeholder:text-gray-500 focus-visible:!ring-[0px]"
                        />

                    </div>
                </DialogHeader>
                <div className="p-3 pt-0 overflow-y-auto space-y-1">
                    {/* unknown tokens */}
                    {unknownTokens && unknownTokens?.length > 0 ?
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-gray-700 pb-2">Unknown tokens</div>
                            {unknownTokens.length > 0 ? unknownTokens.map((token) => (
                                <TokenCard token={token}/>
                            )) : ""}
                        </div>
                        : ""}

                    {/* support tokens */}
                    <div className="text-xs font-medium text-gray-700 pb-2">Supported tokens</div>
                    {commonTokens.length > 0 ? (isDup? filterTokens :commonTokens).map((token) => (
                        <TokenCard token={token}/>
                    )) :
                        <div className="text-gray-400 text-sm font-normal py-5 flex items-center justify-center">No supported token</div>}
                </div>
            </DialogContent>
        </Dialog>
    )
}

