import { client } from "@/app/client";
import { SupportedChain, Token } from "@/lib/chains";
import { getEtherPrice } from "@/lib/utils";
import { formatEther, GasCostPlugin, parseEther, parseUnits } from "ethers";
import { useEffect, useState } from "react";
import { defineChain, estimateGas, estimateGasCost, getContract, isAddress, prepareContractCall, readContract, sendAndConfirmTransaction, toWei } from "thirdweb";
import { getApprovalForTransaction } from "thirdweb/extensions/erc20";
import { Account } from "thirdweb/wallets";

export async function getSupportedChains(fromChain: SupportedChain, destinationChain: SupportedChain, token: Token) {
    const contract = getContract({
        client,
        address: token.poolAddress,
        chain: defineChain(fromChain.chainId)
    })

    try {
        const supportedChains = await readContract({
            contract,
            method: "function getSupportedChains() view returns (uint64[])",
            params: []
        });

        return supportedChains.some(chain => chain.toString() === destinationChain.chainSelector);
    } catch (error) {
        return false;
    }
}

export async function getSupportedTokens(fromChain: SupportedChain, destinationChain: SupportedChain) {
    const tokens: Token[] = [];

    for (const token of fromChain.tokens) {
        if (await getSupportedChains(fromChain, destinationChain, token)) {
            tokens.push(token);
        }
    }
    return tokens;
}

export async function getBridgeFee(fromChain: SupportedChain, destinationChain: SupportedChain, token: Token, amount: string) {
    if (!amount || parseFloat(amount) === 0) return ""
    const contract = getContract({
        client,
        chain: defineChain(fromChain.chainId),
        address: fromChain.router
    })
    const feeInWei = await readContract({
        contract,
        method: "function getFee(uint64 destinationChainSelector, address tokenAddress, uint256 amount) view returns(uint256)",
        params: [BigInt(destinationChain.chainSelector), token.address, parseEther(amount)]
    })

    return formatEther(feeInWei)
}

export function useBridgeFee() {
    const [data, setData] = useState<any>({ether: '0', usd: '0'})
    const [isLoading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [etherPrice, setEtherPrice] = useState(0)
    const [isCountdown, setCountdown] = useState(false)

    useEffect(() => {
        if (isCountdown) {
            const timer = setTimeout(() => {
                setCountdown(false)
            }, 10000)
            return () => clearTimeout(timer)
        }
    }, [isCountdown])

    const executeBridgeFee = async(
        fromChain: SupportedChain, destinationChain: SupportedChain, token: Token, amount: string
    ) => {
        try {
            setLoading(true)
            let currentEtherPrice = etherPrice;

            if (!isCountdown) {
                currentEtherPrice = await getEtherPrice()
                setEtherPrice(currentEtherPrice)
                setCountdown(true)
            }
            const fee = await getBridgeFee(fromChain, destinationChain, token, amount)
            const usd = parseFloat(fee) * currentEtherPrice
            setData({ether: fee, usd: usd.toString()})
            setLoading(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bridge fee');
        } finally {
            setLoading(false)
        }

    }

    return {data, isLoading, error, executeBridgeFee}
}

export function useBridgeERC20() {
    const [data, setData] = useState<any | null>(null)
    const [isLoading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const executeBridge = async (
        account: Account | null,
        fromChain: SupportedChain | null,
        destinationChain: SupportedChain | null,
        token: Token | null,
        amount: string,
        recipient: string
    ) => {
        try {
            setLoading(true)
            setError(null)

            if (!account || !fromChain || !destinationChain || !token || !isAddress(recipient) || parseFloat(amount) <= 0) {
                throw new Error("Invalid parameters")
            }

            const router = getContract({
                chain: defineChain(fromChain.chainId),
                address: fromChain.router,
                client
            })

            const fee = await getBridgeFee(fromChain, destinationChain, token, amount)
            
            const bridgeTransaction = prepareContractCall({
                contract: router,
                value: toWei(fee),
                method: "function bridgeERC20(uint64 destinationChainSelector, address tokenAddress, uint256 amount, address destinationAddress) returns(bytes32)",
                params: [BigInt(destinationChain.chainSelector), token.address, parseUnits(amount, token.decimals), recipient],
                erc20Value: {
                    amountWei: parseUnits(amount, token.decimals),
                    tokenAddress: token.address
                }
            })

            try {
                const estimatedGas = await estimateGas({transaction: bridgeTransaction, account: account})
                console.log('gas', estimatedGas)

            } catch (err) {
                console.log(err)
            }

            const approveTx = await getApprovalForTransaction({
                transaction: bridgeTransaction,
                account: account,
            })

            if (approveTx) {
                let approvalResult = await sendAndConfirmTransaction({
                    transaction: approveTx,
                    account: account,
                })
            }

            const txn = await sendAndConfirmTransaction({
                transaction: bridgeTransaction,
                account,
              });

            setData({
                transactionHash: txn.transactionHash,
                bridgeInfo: {
                    fromChain: fromChain,
                    destinationChain: destinationChain,
                    token: token,
                    amount: amount,
                    recipient: recipient
                }
            })

        } catch (error: any) {
            setError(error.message || "Bridge transaction failed")
            setData(null)
        } finally {
            setLoading(false) 
        }
    }

    return { data, isLoading, error, executeBridge }
}