import { appConfig } from "../System/Config/GameConfig";
import { times, divide } from "number-precision";
/**
 * 將帶入的數值轉換成帶有逗點的字串並回傳
 * @param value 數值
 */
export function numberWithCommas(value: number) {
    return Number(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 將帶入的數值轉換成帶有逗點及小數點後二位的字串並回傳
 * @param value 數值
 */
export function floatWithCommas(value: number) {
    let parts: string[] = value.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (parts.length > 1) {
        parts[1] = parts[1].substring(0, 2);
        if (parts[1].length == 1) {
            parts[1] += "0";
        }
    } else {
        parts[1] = "00"
    }
    return parts.join(".");
}

export function moneyToCredit(money: number): number{
    return times(money, divide(100, appConfig.Denom))
}