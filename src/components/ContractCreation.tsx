import React, { useState, useEffect, useCallback } from 'react'
import { Artifact, Contract, Argument, AbiFunction, SignatureTemplate, Network, FullStackNetworkProvider } from 'cashscript'
import { Button, Spinner } from 'react-bootstrap'
import { QRFunc } from 'react-qrbtf'
import { RowFlex } from './shared' //ExplorerString

import {
  stringify,
  binToHex,
  hexToBin,
  instantiateSecp256k1,
  generatePrivateKey,
  instantiateRipemd160,
  instantiateSha256,
  Base58AddressFormatVersion,
  encodeCashAddress,
  CashAddressType,
  encodePrivateKeyWif
} from '@bitauth/libauth'

const XECJS = require('@sambo5000/xec-js')
const xecjs = new XECJS()

interface Props {
  abi?: AbiFunction
  artifact?: Artifact
  contract?: Contract
  setContract: (contract?: Contract) => void
  network: Network
  setNetwork: (network: Network) => void
  setShowWallets: (showWallets: boolean) => void
}

const ContractCreation: React.FC<Props> = ({ artifact, contract, setContract, network, setNetwork, setShowWallets, abi }) => {
  const [args, setArgs] = useState<Argument[]>([])
  const [balance, setBalance] = useState<number | undefined>(undefined)
  const [receiverPkh, setReceiverPkh] = useState("")
  const [receiverAddr, setReceiverAddr] = useState("")
  const [sig, setSig] = useState('')
  const [signerPk, setSignerPk] = useState('')
  const [signerPkh, setSignerPkh] = useState("")
  const [polling, setPolling] = useState(setInterval(() => createContract(), 1000000))
  const [wif,setWif] = useState("")
  const [showWif, setShowWif] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [showCreateBtn, setshowCreateBtn] = useState(true)
  // const [funded, setFunded] = useState(0)
  // const [outputs, setOutputs] = useState<Recipient[]>([{ to: '', amount: 0 }])


  useEffect(() => {
    getSignerInfo()
    // This code is suuper ugly but I haven't found any other way to clear the value
    // of the input fields.
    artifact?.constructorInputs.forEach((input, i) => {
      const el = document.getElementById(`constructor-arg-${i}`)
      if (el) (el as any).value = ''
    })
    // Set empty strings as default values
    const newArgs = artifact?.constructorInputs.map(() => '') || []
    // console.log("newArgs@artifact ",newArgs)
    setArgs(newArgs)

  }, [artifact])

  useEffect(() => {
    async function updateBalance() {
      if (!contract) return
      setBalance(await contract.getBalance())
    }
    updateBalance()
  }, [contract])

    useEffect(() => {
      makeReceiverWallet()   
  }, [abi])


  const getSignerInfo = useCallback( async () => {
    const signerMnemonic = xecjs.Mnemonic.generate(
      128,
      xecjs.Mnemonic.wordLists()["english"]
    )
    

    const signerRootSeed = await xecjs.Mnemonic.toSeed(signerMnemonic)
    const signerHDNode = xecjs.HDNode.fromSeed(signerRootSeed)
    const signer = xecjs.HDNode.toKeyPair(
      xecjs.HDNode.derivePath(signerHDNode, "m/44'/1899'/0'/0/0")
    );
    const signerPk = xecjs.ECPair.toPublicKey(signer);
    const signerAddr = xecjs.ECPair.toCashAddress(signer)  
    const signerPkh = xecjs.Address.toHash160(signerAddr)
    const signerPkhStr = signerPkh.toString('hex')

    setSig(signer)

    setSignerPk(signerPk)

    setSignerPkh(signerPkhStr)
    // console.log("mnemonic :", signerMnemonic)
  },[abi]
  )



  const makeReceiverWallet = useCallback( async () => {
    const secp256k1 = await instantiateSecp256k1();
    const ripemd160 = await instantiateRipemd160();
    const sha256 = await instantiateSha256();

    const privKey = generatePrivateKey(() =>
      window.crypto.getRandomValues(new Uint8Array(32))
    )

    const pubKey = secp256k1.derivePublicKeyCompressed(privKey)
  
    let wif = encodePrivateKeyWif(sha256, privKey, "mainnet");
    const pubKeyHash = ripemd160.hash(sha256.hash(pubKey))
    const pubKeyHashHex = binToHex(pubKeyHash)
    const result = hash160ToCash(pubKeyHashHex)

    setWif(wif)
    // console.log("Wif ",wif)

    setReceiverPkh(pubKeyHashHex)

    setReceiverAddr(result)
    console.log("Receiver addr: ", receiverAddr)

    function hash160ToCash(hex: string, network: number = 0x00) {
      let type: string = Base58AddressFormatVersion[network] || "p2pkh";
      let prefix = "ecash";
      if (type.endsWith("Testnet")) prefix = "ectest"
      let cashType: CashAddressType = 0;

      return encodeCashAddress(prefix, cashType, hexToBin(hex));
    }
  },[abi]
  )
  const serviceProviderPkH = '901761961cdcb1642ada8e3dff0451957ef081dc'
  async function createContract() {

    if (!artifact) return
    try {
      const provider = new FullStackNetworkProvider("mainnet", xecjs)

      args.unshift(receiverPkh)
      args.unshift(signerPkh)
      args.unshift(serviceProviderPkH)
      args.pop()
      args.pop()
      args.pop()
      setArgs(args)

      console.log(args)
      const newContract = new Contract(artifact, args, provider)
      setContract(newContract)

      setInterval(() => console.log("contract address: ", xecjs.Address.toEcashAddress(newContract.address)), 2000);
      setTimeout(() => componentDidMount(), 5000);

      const componentDidMount = () => {
        let timer = setInterval(() => getContractBalance(), 2000);
        setPolling(timer);
      }

      const getContractBalance = async () => {
        const newBalance = await newContract.getBalance()
       
        //  const response = await
        //   fetch((`https://xec-js.loca.lt/v5/electrumx/utxos/${addr}`))
        //     .then((response) =>  response.json());
       
        if (!newBalance) {       
          console.log("not funded, constract balance:", newBalance)         
        } else {          
          console.log("funds detected, constract balance: ", newBalance)

          const sendTransaction = async () => {
            // balance = newContract.getBalance()
            // console.log("sending to: ",receiverAddr, "amount: ", response.utxos[0].value - 5000)   
            console.log("sending to: ", receiverAddr, "amount: ", newBalance - 5000)

            const feeAddr = "ecash:qzgpwcvkrnwtzep2m28rmlcy2x2hauypmshy5amknn"

            const txDetails = await newContract.functions
              .spend(signerPk, new SignatureTemplate(sig))
              .to(receiverAddr, newBalance - 5000)
              .to(feeAddr, 4000)
              .withHardcodedFee(1000)
              .send()
            console.log('transaction details:', stringify(txDetails));
            setShowWif(true)
            setShowQr(true)
            setshowCreateBtn(false)
          }
          sendTransaction()
        }
      }

    } catch (e) {
      alert(e.message)
      console.error(e.message)
    }
  }


  return (
    <div style={{
      
      height: '100%',
      border: '1px solid black',
      borderBottom: '6px solid black',
      fontSize: '100%',
      lineHeight: 'inherit',
      overflow: 'auto',
      background: '#fffffe',
      padding: '8px 16px',
      color: '#000'
    }}>

    <RowFlex>  
     {showCreateBtn?
     <div >
    <Button style={{cursor:'pointer'}} variant="secondary" size="sm" onClick={() =>    
        createContract()
       }>Create Address</Button>
     </div>      
      : 
      "congratulations"}
    </RowFlex>
    <RowFlex>  
      {contract !== undefined && balance !== undefined && showQr == false &&
              
          <div style={{ width: '30%', textAlign: 'center'}}>
            <h4 style={{margin: '5px'}} >Send Tip Amount</h4>
            <p  style={{marginBottom: '1rem', fontSize:'12px'}} >{xecjs.Address.toEcashAddress(contract.address)}</p>
            <div className="d-grid gap-2">
            <Button  variant="outline-dark" disabled>
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              ...Waiting...
              <Spinner
                as="span"
                animation="grow"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            </Button>
            </div>
            
            <QRFunc  value={contract.address} />
            {/* <Spinner animation="grow" size="sm" />        */}
          
          </div>   
      }
      
      <div style={{margin: '5px', textAlign: 'center'}}>
      {!showWif? <p></p>:<div>
      <h4>Collect your Tip </h4> 
      <h3>Claim your funds with</h3>
      <a href='https://www.bitcoinabc.org/electrum/'>ElectrumABC</a>
      <p>Import this WIF into your new Wallet</p>
      <h5>{wif}</h5>
      </div>
     
      }
      </div>
           
    </RowFlex>
     
    </div>
  )
}

export default ContractCreation
