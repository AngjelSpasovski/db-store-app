// src/app/user/buy-credits/credit-packages.config.ts
export interface CreditPackage {
  /** локален id за *ngFor / trackBy – можеме да го добиеме од backend id */
  id: string;

  /** прикажано име на пакетот (пример "500 package") */
  name: string;

  /** колку кредити дава пакетот */
  credits: number;

  /** цена во EUR (или валутата што ја користите) */
  price: number;

  /** попуст во % ако има, инаку 0 */
  discountPercentage: number;

  /** backend ID што ќе го праќаме до Stripe checkout endpoint-от */
  backendId: number;
}
