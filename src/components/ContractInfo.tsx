import React, { useState, useEffect } from 'react'
import { Artifact, Contract, Network } from 'cashscript'
import { ColumnFlex, Wallet } from './shared'
import ContractCreation from './ContractCreation'

interface Props {
  artifact?: Artifact
  network: Network
  setNetwork: (network: Network) => void
  style: any
  setShowWallets:(showWallets: boolean) => void
  wallets: Wallet[]
}

const ContractInfo: React.FC<Props> = ({ artifact, network, setNetwork, setShowWallets, style, wallets }) => {
  const [contract, setContract] = useState<Contract | undefined>(undefined)

  useEffect(() => setContract(undefined), [artifact])

  return (
    <ColumnFlex
      id="preview"
      style={{ ...style, flex: 1, margin: '16px' }}
    >       
      <ContractCreation artifact={artifact} contract={contract} setContract={setContract} network={network} setNetwork={setNetwork} setShowWallets={setShowWallets}/>
    </ColumnFlex>
  )
}

export default ContractInfo
