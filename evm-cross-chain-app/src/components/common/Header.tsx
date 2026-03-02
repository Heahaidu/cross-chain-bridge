"use client";

import { client } from "../../app/client";
import { ConnectButton } from "thirdweb/react";
import { Button } from "../ui/button";
import { Settings } from "lucide-react";
import { supportedWallets } from "../wallet/WalletSupported";

export default function Header() {
  return (
    <header className="border-b">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="text-lg font-semibold">Cross Chain</div>
        <div className="flex items-center gap-3">
          <ConnectButton
            client={client}
            theme="light"
            connectButton={
              {
                label: "Connect Wallet",
                style: { height: 40, fontSize: 14 }
              }
            }
            wallets={supportedWallets}
          />
          {/* <Button variant="outline" size="icon" aria-label="Settings" className="bg-transparent">
            <Settings />
          </Button> */}
        </div>
      </div>
    </header>
  );
}