class TransactionService {
  private static isFetching = false
  private static queuedFetch: (() => void) | null = null
  private static delay = 1000

  static async fetchTransactions(
    sender: string,
    first = 20,
    offset = 0
  ): Promise<any[]> {
    return new Promise((resolve) => {
      const doFetch = async () => {
        if (this.isFetching) {
          this.queuedFetch = () => {
            this.fetchTransactions(sender, first, offset).then(resolve)
          }
          return
        }

        this.isFetching = true
        try {
          const res = await fetch(
            `/api/ccip/transactions?first=${first}&offset=${offset}&sender=${sender}`
          )
          if (!res.ok) throw new Error(`API error: ${res.status}`)
          const data = await res.json()
          resolve(data)
        } catch (err) {
          resolve([])
        } finally {
          this.isFetching = false
          if (this.queuedFetch) {
            const queued = this.queuedFetch
            this.queuedFetch = null
            setTimeout(() => queued(), this.delay)
          }
        }
      }

      doFetch()
    })
  }
}

export default TransactionService