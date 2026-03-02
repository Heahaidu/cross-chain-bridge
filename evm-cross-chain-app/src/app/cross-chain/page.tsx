"use client"

import { useState, useEffect } from "react";
import { ConnectButton, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { client } from "../../app/client";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, BadgeCheck, Check, ChevronDown, PencilLine, X } from "lucide-react"
import "../../app/globals.css";
import { sepolia, baseSepolia } from "thirdweb/chains";
import { ChainProvider, ChainIcon, ChainName, useWalletBalance, useActiveAccount } from "thirdweb/react"
import { defineChain } from "thirdweb/chains";
import { ChainSelection } from "@/components/ui/chainselector";
import TokenSelection from "@/components/ui/tokenselector";
import { Input } from "@/components/ui/input";
import { useSupportedChains, Token, SupportedChain } from "@/lib/chains";

import { supportedWallets } from "../../components/wallet/WalletSupported";
import { normalizeNumericString, shortenString } from "@/lib/utils";
import { getSupportedTokens, useBridgeERC20, useBridgeFee } from "@/contracts/abis/ERC20";
import { isAddress, shortenAddress } from "thirdweb/utils";
import { Spinner } from "@/components/spinner";
import TxHistoryDialog from "@/components/ui/txhistorydialog";

export default function Body() {

    // From chain
    const [fromChain, setFromChain] = useState<SupportedChain | null>(null)
    const [isFromChainDialogOpen, setIsFromChainDialogOpen] = useState(false)
    // Destination chain
    const [destinationChain, setDestinationChain] = useState<SupportedChain | null>(null)
    const [isDestinationChainDialogOpen, setIsDestinationChainDialogOpen] = useState(false)
    // Token
    const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false)
    const [selectedToken, setSelectedToken] = useState<Token | null>(null)
    const [commonTokens, setCommonTokens] = useState<Token[]>([])
    const [isReady, setReady] = useState(true)

    const { chains, loading: isLoadingChains } = useSupportedChains()

    // Balance
    const [displayBalance, setDisplayBalance] = useState<string>("0")
    // Edit address
    const [editAddr, setEditAddr] = useState(false)
    const [valueEditAddr, setValueEditAddr] = useState("")
    const [recipientAddr, setRecipientAddr] = useState("")

    // Fee display
    const [displayFee, setDisplayFee] = useState("")

    const activeAccount = useActiveAccount()

    useEffect(() => {
        if (activeAccount) {
            setRecipientAddr(activeAccount.address)
        } else {
            setRecipientAddr("")
        }
    }, [activeAccount])

    const autoSelectToken = async () => {
        if (fromChain && destinationChain) {
            const newCommonTokens = await getSupportedTokens(fromChain, destinationChain)
            setCommonTokens(newCommonTokens)
        }
    }

    const { data: balanceData, isLoading: isBalanceLoading, error: balanceError } = useWalletBalance({
        chain: fromChain ? defineChain(fromChain.chainId) : undefined,
        address: activeAccount?.address,
        client: client,
        tokenAddress: selectedToken?.address
    })

    //
    const { data: nativeToken, isLoading, isError } = useWalletBalance({
        chain: fromChain ? defineChain(fromChain.chainId) : undefined,
        address: activeAccount?.address,
        client: client,
    });

    useEffect(() => {
        if (!isBalanceLoading && balanceData?.displayValue !== undefined) {
            setDisplayBalance(balanceData.displayValue)
        } else {
            setDisplayBalance("0")
        }
    }, [balanceData])

    // Set default chain (change paramater then)
    useEffect(() => {
        if (chains.length > 1) {
            if (!fromChain) {
                const defaultFromChain = chains.find(chain => chain.chainId === sepolia.id)
                if (defaultFromChain) setFromChain(defaultFromChain)
            }
            if (!destinationChain) {
                const defaultDestChain = chains.find(chain => chain.chainId === baseSepolia.id)
                if (defaultDestChain) setDestinationChain(defaultDestChain)
            }
        }
    }, [chains])

    // Get common token when chain change
    useEffect(() => {
        autoSelectToken()
    }, [fromChain, destinationChain])

    // Select common token
    useEffect(() => {
        if (commonTokens.length > 0) {
            const currentTokenExists = commonTokens.find(t => t.symbol === selectedToken?.symbol)
            if (!currentTokenExists) {
                setSelectedToken(commonTokens[0])
            } else {
                setSelectedToken(currentTokenExists)
            }
        } else {
            setSelectedToken(null)
            setFromAmount("")
        }
    }, [commonTokens, selectedToken])

    // Coincidence
    const handleFromCoincidence = (chain: SupportedChain) => {
        if (destinationChain && chain.chainId === destinationChain.chainId) {
            setDestinationChain(fromChain)
        }
        setFromChain(chain)
    }

    const handleDestinationCoincidence = (chain: SupportedChain) => {
        if (fromChain && chain.chainId === fromChain.chainId) {
            setFromChain(destinationChain)
        }
        setDestinationChain(chain)
    }

    // Amount
    const [fromAmount, setFromAmount] = useState("")

    useEffect(() => {
        if (!isReady) {
            setTimeout(() => {
                setReady(true)
            }, 1000)
        }
    }, [isReady])

    const { data: bridgeFee, isLoading: isBridgeFeeLoading, error, executeBridgeFee } = useBridgeFee()

    useEffect(() => {
        if (parseFloat(fromAmount) <= 0 || !fromChain || !destinationChain || !selectedToken || fromAmount > displayBalance) return;
        if (isReady) {
            executeBridgeFee(fromChain, destinationChain, selectedToken, fromAmount)
            setReady(false)
        }
    }, [fromAmount])

    useEffect(() => {
        const ether = normalizeNumericString((parseFloat(bridgeFee?.ether).toFixed(6)).toString())
        const etherInUSD = normalizeNumericString((parseFloat(bridgeFee?.usd).toFixed(3)).toString())
        setDisplayFee(`${ether} ETH ~ ${etherInUSD} $`)
    }, [bridgeFee])

    const handleSwapNetworks = () => {
        const temp = fromChain
        setFromChain(destinationChain)
        setDestinationChain(temp)
    }

    const selectToken = () => {
        if (isLoadingChains) {
            return (
                <div className="h-8 w-20 animate-pulse bg-gray-200 rounded-full" />
            )
        }
        return (
            <div className="rounded-full border p-2 flex items-center space-x-3 hover:bg-gray-200 cursor-pointer"
                onClick={() => setIsTokenDialogOpen(true)}>
                {
                    selectedToken?.iconUrl ? <img title="select token bridge" src={selectedToken.iconUrl} className="w-5 h-5" /> :
                        selectedToken ?
                            <div className="relative">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm">{selectedToken.symbol[0]}</span>
                                </div>
                            </div>
                            :
                            ""
                }
                {selectedToken ? <div className="text-sm font-medium">{selectedToken.symbol}</div> : <div className="text-xs font-medium text-gray-400">Select a Token</div>}
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
        )
    }

    const showBalance = () => {
        if (!activeAccount || isLoadingChains || isBalanceLoading || !selectedToken) return (
            <div className="h-3 w-20 bg-gray-200 rounded-md animate-pulse" />
        )
        return (
            <div className="flex">
                <div className="font-medium text-xs text-gray-600 px-1">Balance: {shortenString(displayBalance, 10)}</div>
                <button
                    className="text-xs text-red-600"
                    onClick={() => {
                        setFromAmount(displayBalance)
                    }}>Max</button>
            </div>
        )
    }

    const selectFromChain = () => {
        if (isLoadingChains) {
            return (
                <div className="bg-gray-200 animate-pulse w-32 h-10 rounded-lg" />
            )
        }
        if (fromChain)
            return (
                <div
                    className="cursor-pointer flex items-center space-x-3 hover:bg-gray-200 p-2 rounded-lg"
                    onClick={() => setIsFromChainDialogOpen(true)}
                >
                    <div className="flex items-center justify-between space-x-2">
                        <ChainProvider chain={defineChain(fromChain.chainId)}>
                            <ChainIcon
                                loadingComponent={
                                    fromChain && fromChain.iconUrl ? (
                                        <img src={fromChain.iconUrl} alt={fromChain.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="bg-black rounded-full w-6 h-6" />
                                    )
                                }
                                fallbackComponent={
                                    fromChain && fromChain.iconUrl ? (
                                        <img src={fromChain.iconUrl} alt={fromChain.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="bg-black rounded-full w-6 h-6" />
                                    )
                                }
                                client={client} className="w-6 h-6" />
                            <ChainName className="font-semibold" />
                        </ChainProvider>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            )
    }

    const amountBridge = () => {
        if (isLoadingChains) {
            return (
                <div className="bg-gray-200 animate-pulse w-32 h-10 rounded-lg" />
            )
        }
        return (
            <div className="text-right">
                <Input
                    placeholder="0"
                    maxLength={selectedToken ? selectedToken.decimals : 0}
                    value={fromAmount}
                    onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/[^0-9.]/g, "");
                        setFromAmount(onlyDigits);
                    }}
                    className={`text-right border-none focus-visible:ring-[0px] bg-transparent p-0 font-semibold w-32 
                      ${fromAmount.length > 11
                            ? "!text-ms"
                            : fromAmount.length > 10
                                ? "!text-base"
                                : fromAmount.length > 9
                                    ? "!text-lg"
                                    : "!text-xl"
                        }`}
                />
            </div>
        )
    }

    const selectDestinationChain = () => {
        if (isLoadingChains) {
            return (
                <div className="bg-gray-200 animate-pulse w-32 h-10 rounded-lg" />
            )
        }
        if (destinationChain)
            return (
                <div
                    className="cursor-pointer p-2 rounded-lg flex items-center space-x-3 hover:bg-gray-200"
                    onClick={() => setIsDestinationChainDialogOpen(true)}
                >
                    <div className="flex items-center justify-between space-x-2">
                        <ChainProvider chain={defineChain(destinationChain.chainId)}>
                            <ChainIcon
                                loadingComponent={
                                    destinationChain && destinationChain.iconUrl ? (
                                        <img title="destination chain icon loading" src={destinationChain.iconUrl} alt={destinationChain.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="bg-black rounded-full w-6 h-6" />
                                    )
                                }
                                fallbackComponent={
                                    destinationChain && destinationChain.iconUrl ? (
                                        <img title="destination chain icon display" src={destinationChain.iconUrl} alt={destinationChain.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="bg-black rounded-full w-6 h-6" />
                                    )
                                }
                                client={client} className="w-6 h-6" />
                            <ChainName className="font-semibold" />
                        </ChainProvider>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            )
    }

    const bridgeDetails = () => {
        if (!activeAccount) return

        return (
            <div className="p-3 border rounded-lg space-y-3 justify-center items-center">
                <div className="flex justify-between items-center">
                    <div className="text-xs font-medium text-gray-600">Recipient:</div>
                    <div className="flex items-center space-x-1">
                        <div className="tooltip text-xs hover:bg-gray-200 cursor-pointer px-1 rounded-lg font-medium">{recipientAddr ? shortenAddress(recipientAddr, 6) : ""}
                            <span className="tooltiptext !-ml-40">{recipientAddr}</span>
                        </div>

                        <Button
                            title="use another button"
                            size="icon"
                            variant="ghost"
                            className="w-5 h-5 p-1 bg-gray-100 hover:bg-gray-200"
                            onClick={() => {
                                if (!editAddr) {
                                    setEditAddr(true)
                                    setValueEditAddr(recipientAddr)
                                } else {
                                    setEditAddr(false)
                                }
                            }}
                        >
                            {editAddr ? <X className="w-8 h-8" />
                                :
                                <PencilLine className="w-8 h-8" />
                            }
                        </Button>
                    </div>
                </div>
                {editAddr ?
                    <div className="space-y-2">
                        <div className="flex relative">
                            <Input
                                maxLength={42}
                                className="!text-xs focus-visible:ring-[0px] h-8"
                                placeholder="Enter recipient address"
                                value={valueEditAddr}
                                onChange={(e) => setValueEditAddr(e.target.value)}
                            />
                            <BadgeCheck
                                className={`absolute !text-green-600 right-3 top-1/2 w-4 h-4 -translate-y-1/2 ${!isAddress(valueEditAddr) ? "hidden" : ""}`}
                            />
                        </div>
                        <div className="flex justify-end space-x-1">
                            {activeAccount && activeAccount.address !== valueEditAddr ?
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="border rounded-md hover:bg-gray-200 h-6 text-xs"
                                    onClick={() => {
                                        setRecipientAddr(activeAccount.address)
                                        setEditAddr(false)
                                    }}
                                >
                                    Use my wallet
                                </Button>
                                : ""
                            }

                            <Button
                                size="sm"
                                className="h-6 text-xs"
                                disabled={isAddress(valueEditAddr) ? false : true}
                                onClick={() => {
                                    setRecipientAddr(valueEditAddr)
                                    setEditAddr(false)
                                }}
                            >
                                <Check className="w-3 h-3 mr-1" />
                                Verify
                            </Button>
                        </div>
                    </div>
                    : <div></div>}
                {/* Fee */}
                <div className="flex justify-between">
                    <div className="text-xs font-medium text-gray-600">Fee (Include platform):</div>
                    <div className="flex items-center space-x-1">
                        {(fromAmount && parseFloat(fromAmount) > 0 && fromAmount <= displayBalance && !isBridgeFeeLoading) ?
                            <div className="text-xs font-medium">{displayFee}</div>
                            :
                            <div className="h-3 w-32 bg-gray-200 rounded-md animate-pulse" />
                        }
                        {/* <Button
                    size="icon"
                    variant="ghost"
                    className="w-5 h-5 p-1 bg-gray-100 hover:bg-gray-200"
                >
                    <RefreshCcw className="w-8 h-8" />
                    <div className="absolute text-[8px] font-medium">9</div>

                </Button> */}
                    </div>
                </div>
                {/* Time spend */}
                {/* <div className="flex justify-between">
                    <div className="text-xs font-medium text-gray-600">Estimated time spend:</div>
                    {fromAmount && parseFloat(fromAmount) > 0 && fromAmount <= displayBalance ?
                        <div className="text-xs font-medium">30m</div>
                        :
                        <div className="h-3 w-8 bg-gray-200 rounded-md animate-pulse" />
                    }
                </div> */}
            </div>
        )
    }

    const { data: bridgeData, isLoading: isBridgePending, error: bridgeError, executeBridge } = useBridgeERC20()

    useEffect(() => {
        console.log(bridgeData)
        if (bridgeData)
            setFromAmount("")
    }, bridgeData)

    const [isTxHistoryDialogOpen, setTxHistoryDialogOpen] = useState(false)
    const txHistory = () => {
        if (activeAccount)
            return (
                <div
                    className="absolute -top-9 -right-0 bg-gray-100 border border-gray-300 
                    rounded-full px-2 py-1 text-xs font-semibold shadow-sm flex items-center 
                    space-x-1 hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                    onClick={() => { setTxHistoryDialogOpen(true) }}>
                    <span className="text-gray-700">History</span>
                </div>
            )
    }

    const activeChain = useActiveWalletChain();
    const switchChain = useSwitchActiveWalletChain()

    const buttonEvent = () => {
        if (isLoadingChains) {
            return (
                <div className="animate-pulse w-full py-6 bg-gray-200 text-gray-400 font-semibold text-lg rounded-xl" />
            )
        }
        if (!activeAccount) {
            return (
                <ConnectButton
                    client={client}
                    theme="light"
                    connectButton={
                        {
                            label: "Connect Wallet",
                            className: "!w-full !py-6 !bg-black !font-semibold !text-white !text-lg !rounded-xl"
                        }
                    }
                    wallets={supportedWallets}
                />
            )
        }

        if (fromChain && !fromChain.router) {
            return (
                <Button
                    className="w-full py-6 hover:bg-gray-200 hover:text-gray-400 bg-gray-200 text-gray-400 font-semibold text-lg rounded-xl"
                >No Router Found</Button>
            )
        }

        if (!fromAmount || parseFloat(fromAmount) === 0) {
            return (
                <Button
                    className="w-full py-6 hover:bg-gray-200 hover:text-gray-400 bg-gray-200 text-gray-400 font-semibold text-lg rounded-xl"
                >Enter Amount</Button>
            )
        }

        if (!nativeToken ||  Number(bridgeFee.ether)*1.5 > Number(nativeToken?.displayValue)) {
            return (
                <Button
                    className="w-full py-6 hover:bg-gray-200 hover:text-gray-400 bg-gray-200 text-gray-400 font-semibold text-lg rounded-xl"
                >Insufficient Native Gas</Button>
            )
        }

            if (normalizeNumericString(fromAmount) > normalizeNumericString(displayBalance)) {
                return (
                    <Button
                        className="w-full py-6 hover:bg-gray-200 hover:text-gray-400 bg-gray-200 text-gray-400 font-semibold text-lg rounded-xl"
                    >Insufficient Balance</Button>
                )
            }
        if (Number(activeChain?.id) !== fromChain?.chainId) {
            return (
                <Button
                    onClick={() => {
                        if (fromChain)
                            switchChain(defineChain(fromChain?.chainId))
                    }}
                    className="w-full py-6 bg-black font-semibold text-white text-lg rounded-xl"
                >Switch Network</Button>
            )
        }

        // When connected and has amount sufficient balance -> show bridge button
        if (!isBridgePending && nativeToken) {
            return (
                <Button
                    onClick={() => {
                        executeBridge(activeAccount, fromChain, destinationChain, selectedToken, fromAmount, recipientAddr)
                    }}
                    className="w-full py-6 bg-black font-semibold text-white text-lg rounded-xl"
                >Bridge</Button>
            )
        }

        return (
            <Button
                className="w-full py-6 bg-black font-semibold text-white text-lg rounded-xl hover:bg-black"
            >
                <Spinner variant="circle" style={{ width: 26, height: 26 }} /> Pending
            </Button>
        )
    }

    return (
        <div className="pt-20 bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md mx-auto border rounded-lg relative">
                {txHistory()}
                <div className="flex items-center">
                    <div className="p-4 pl-5 text-md font-bold">Bridge</div>
                    {selectToken()}
                </div>
                <div className="px-4 space-y-2 py-0 pb-4">
                    {/* From Section */}
                    <div className="p-3 border rounded-lg pb-1">
                        <div className="flex justify-between">
                            <div className="font-medium text-xs text-gray-600 items-center">From</div>
                            {showBalance()}
                        </div>
                        <div className="flex items-center justify-between py-2 bg-gray-50 rounded-lg">
                            {selectFromChain()}
                            {amountBridge()}
                        </div>

                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <Button
                            title="swap chains"
                            variant="outline"
                            size="icon"
                            className="rounded-full border-2 bg-transparent"
                            onClick={handleSwapNetworks}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* To Section */}
                    <div className="p-3 border rounded-lg pb-1">
                        <div className="flex justify-between">
                            <div className="text-xs font-medium text-gray-600">To</div>
                        </div>
                        <div className="py-2 flex items-center justify-between bg-gray-50 rounded-lg">
                            {selectDestinationChain()}
                            <div className="text-right">
                                {fromAmount && parseFloat(fromAmount) > 0 && fromAmount <= displayBalance ?
                                    <div className="text-right">
                                        <Input
                                            readOnly
                                            value={normalizeNumericString(fromAmount)}
                                            className={`
                                                    text-right 
                                                    border-none 
                                                    focus-visible:ring-[0px] 
                                                    bg-transparent 
                                                    p-0 
                                                    font-semibold 
                                                    w-32 
                                                    ${fromAmount.length > 11
                                                    ? "!text-ms"
                                                    : fromAmount.length > 10
                                                        ? "!text-base"
                                                        : fromAmount.length > 9
                                                            ? "!text-lg"
                                                            : "!text-xl"
                                                }`}
                                        ></Input>
                                    </div> :
                                    ""
                                }
                            </div>
                        </div>

                    </div>
                    {/* Detail */}
                    {bridgeDetails()}
                    {/* Bridge Button */}
                    {buttonEvent()}
                </div>
            </div>

            <ChainSelection
                isOpen={isFromChainDialogOpen}
                onClose={() => setIsFromChainDialogOpen(false)}
                onSelect={handleFromCoincidence}
                selectedChain={fromChain?.chainId || 0}
            />
            <ChainSelection
                isOpen={isDestinationChainDialogOpen}
                onClose={() => setIsDestinationChainDialogOpen(false)}
                onSelect={handleDestinationCoincidence}
                selectedChain={destinationChain?.chainId || 0}
            />
            <TokenSelection
                isOpen={isTokenDialogOpen}
                onClose={() => setIsTokenDialogOpen(false)}
                commonTokens={commonTokens}
                onSelect={setSelectedToken}
                selectedToken={selectedToken?.symbol || ""}
            />
            <TxHistoryDialog
                isOpen={isTxHistoryDialogOpen}
                onClose={() => setTxHistoryDialogOpen(false)}
            />
        </div>
    )
}