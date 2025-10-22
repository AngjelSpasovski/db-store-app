// src/app/user/buy-credits/credit-packages.config.ts
export interface CreditPackage {
  id: string;
  credits: number;
  displayPrice: string;
  paymentLinkUrl?: string;
  priceId?: string; // ⭐ за API/Checkout
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id:'p300',   credits:300,   displayPrice:'199€',  paymentLinkUrl:'', priceId:'' },
  { id:'p500',   credits:500,   displayPrice:'275€',  paymentLinkUrl:'', priceId:'' },
  { id:'p1000',  credits:1000,  displayPrice:'500€',  paymentLinkUrl:'', priceId:'' },
  { id:'p2000',  credits:2000,  displayPrice:'800€',  paymentLinkUrl:'', priceId:'' },
  { id:'p5000',  credits:5000,  displayPrice:'1500€', paymentLinkUrl:'', priceId:'' },
  { id:'p10000', credits:10000, displayPrice:'2500€', paymentLinkUrl:'', priceId:'' },
  { id:'p15000', credits:15000, displayPrice:'3000€', paymentLinkUrl:'', priceId:'' },
];
