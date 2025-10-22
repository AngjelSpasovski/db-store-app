//src/environments/environment.prod.ts
export const environment = {
  production: true,
  baseApiUrl: 'https://web-society.kps-dev.com/api/v1', // ✅ постоечка вредност
  stripePublishableKey: 'pk_test_51SA5lrRpEhEmFMYRhJZVN3TVzNOwDwZbuPrjXANSIEtuWlDlU39rm5IJBfqeAFOa5nbINzhtWz37UrkVKYSZNWJE00Bm3LBAPD', // или test за сега
  paymentsMode: 'api' as 'paymentLinks' | 'api', // или 'paymentLinks' додека нема бекенд
  dataMode: 'api' as 'local'|'api',
};
