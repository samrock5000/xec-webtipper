import styled from '@emotion/styled'
import { SignatureTemplate } from 'cashscript';
import { decodeCashAddress, decodeCashAddressFormatWithoutPrefix } from '@bitauth/libauth';

export const ColumnFlex = styled.div`
  display: flex;
  flex-direction: column;
  justify-content:center;
  align-item:center
`
export const RowFlex = styled.div`
  display: flex;
  flex-direction: row;
  justify-content:center;
  align-item:center
`

export interface Wallet {
  walletName: string
  privKey: Uint8Array
  privKeyHex: string
  pubKeyHex: string
  pubKeyHashHex: string
  address: string
  testnetAddress: string
}

export function readAsType(value: string, type: string) {
  if (type === 'int') {
    return Number(value);
  } else if (type === 'bool') {
    return value === 'true';
  } else if (type === 'sig') {
    try {
      return new SignatureTemplate(value);
    } catch (e) {
      return value;
    }
  } else if (type === 'bytes20') {
    let addressInfo;

    if (value.startsWith('ecash:') || value.startsWith('ectest:')) {
      addressInfo = decodeCashAddress(value);
    } else if(value.startsWith('q') || value.startsWith('p')) {
      addressInfo = decodeCashAddressFormatWithoutPrefix(value, ['ecash', 'ectest']);
    }

    if (addressInfo === undefined || typeof addressInfo === 'string') {
      return value;
    }

    return addressInfo.hash;
  } else {
    return value;
  }
}

export const ExplorerString = {
  // mainnet: 'https://explorer.bitcoin.com/bch',
  mainnet: 'https://blockchair.com/ecash/transaction/',
  testnet: 'http://testnet.imaginary.cash',
  staging: 'https://testnet4.imaginary.cash/',
  regtest: ''
}
