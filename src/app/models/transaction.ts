export enum TxnType {
  Buy = 'Buy',
  Sell = 'Sell'
}


export interface TransactionDto {
  id: number;
  date: string;          
  product: string;
  txnType: TxnType;
  quantity: number;
  pricePerUnit: number;
}

