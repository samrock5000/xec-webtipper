import React, { useState, useEffect } from 'react';
import { Artifact, Network } from 'cashscript';
import { compileString } from 'cashc';
import { RowFlex, Wallet } from './shared';
import ContractInfo from './ContractInfo';

interface Props {}

const Main: React.FC<Props> = () => {
  const [code, setCode] = useState<string>(
`pragma cashscript ^0.6.5;

contract Escrow(bytes20 arbiter, bytes20 buyer, bytes20 seller) {
    function spend(pubkey pk, sig s) {
        require(hash160(pk) == buyer);
        require(checkSig(s, pk));

        // Check that the correct amount is sent
        int minerFee = 1000; // hardcoded fee
        int arbiterFee = 4000;

        bytes8 amount = bytes8(int(bytes(tx.value)) - (minerFee + arbiterFee));
        bytes8 amount2 = bytes8(arbiterFee);

        bytes34 arbiterOutput = new OutputP2PKH(amount2, arbiter);
        bytes34 buyerOutput = new OutputP2PKH(amount, buyer);
        bytes34 sellerOutput = new OutputP2PKH(amount, seller);
        require(tx.hashOutputs == hash256(buyerOutput + arbiterOutput) || tx.hashOutputs == hash256(sellerOutput + arbiterOutput));

      
    }
}
`);

  const [artifact, setArtifact] = useState<Artifact | undefined>(undefined);
  const [network, setNetwork] = useState<Network>('mainnet')
  const [showWallets, setShowWallets] = useState<boolean | undefined>(false);
  const [wallets, setWallets] = useState<Wallet[]>([])


  useEffect(() => {
    compile();
  }, [])

  function compile() {
    try {
      const artifact = compileString(code);
      setArtifact(artifact);
    } catch (e) {
      alert(e.message);
      console.error(e.message);
    }
  }

  return (
    <RowFlex style={{
      padding: '32px',
      paddingTop: '0px',
      height: 'calc(100vh - 120px'
    }}>
     
      <ContractInfo style={showWallets?{display:'none'}:{}} artifact={artifact} network={network} setNetwork={setNetwork} setShowWallets={setShowWallets} wallets={wallets}/>
    </RowFlex>
  )
}

export default Main;
