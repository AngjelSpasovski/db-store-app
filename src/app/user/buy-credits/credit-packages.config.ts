// src/app/user/buy-credits/credit-packages.config.ts
export interface CreditPackage {
  id:                 string;           /** локален id за *ngFor / trackBy – можеме да го добиеме од backend id */
  name:               string;           /** прикажано име на пакетот (пример "500 package") */
  credits:            number;           /** колку кредити дава пакетот */
  price:              number;           /** цена во EUR (или валутата што ја користите) */
  discountPercentage: number | string;  /** попуст во % ако има, инаку 0 */
  backendId:          number;           /** backend ID што ќе го праќаме до Stripe checkout endpoint-от */
}
