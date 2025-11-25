// src/app/user/buy-credits/credit-packages.config.ts
export interface CreditPackage {
  id: string;               //
  credits: number;          //
  displayPrice: string;     //
  paymentLinkUrl?: string;  //
  priceId?: string;         // ⭐ за API/Checkout
  backendId?: number;       // ⭐ реално packageId од backend
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id:'p300',   backendId: 1,  credits:100,   displayPrice:'199€',  paymentLinkUrl:'', priceId:'' },
  { id:'p500',   backendId: 2,  credits:500,   displayPrice:'275€',  paymentLinkUrl:'', priceId:'' },
  { id:'p1000',  backendId: 3,  credits:1000,  displayPrice:'500€',  paymentLinkUrl:'', priceId:'' },
  { id:'p2000',  backendId: 4,  credits:2000,  displayPrice:'800€',  paymentLinkUrl:'', priceId:'' },
  { id:'p5000',  backendId: 5,  credits:5000,  displayPrice:'1500€', paymentLinkUrl:'', priceId:'' },
  { id:'p10000', backendId: 6,  credits:10000, displayPrice:'2500€', paymentLinkUrl:'', priceId:'' },
  { id:'p15000', backendId: 7,  credits:15000, displayPrice:'3000€', paymentLinkUrl:'', priceId:'' },
];
