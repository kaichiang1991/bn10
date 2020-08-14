export enum eCurrencyID{
    CNY = 1,    // 人民幣
    VND = 2,    // 越南盾
    MYR = 3,    // 馬來西亞令吉
    THB = 4,    // 泰銖
    TWD = 5,    // 新台幣
    VNDK = 6,   // 越南盾(K)
}

const currencySymbol = [
    null,
    '¥',    // 人民幣
    '₫',    // 越南盾
    'RM ',    // 馬來西亞令吉
    '฿',    // 泰銖
    '$',    // 新台幣
    '₫(K)',    // 越南盾(K)
]

export default class CurrencyManager{

    private static useCurrency: eCurrencyID

    public static setCurrency(id: eCurrencyID){
        this.useCurrency = id
    }

    public static getCurrency(): eCurrencyID{
        return this.useCurrency
    }

    public static getCurrencySymbol(): string{
        return currencySymbol[this.useCurrency]
    }
}
