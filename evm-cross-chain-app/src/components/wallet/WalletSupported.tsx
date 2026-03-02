import { createWallet } from "thirdweb/wallets";

export const supportedWallets = [
    createWallet("io.metamask"),
    createWallet("com.okex.wallet"),
    createWallet("io.rabby"),
    createWallet("app.phantom")
  ]