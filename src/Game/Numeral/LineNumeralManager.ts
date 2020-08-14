import { BitmapText, Container } from "pixi.js-legacy";
import GameFontManager from "../../System/Assets/Font/GameFontManager";
import { numberWithCommas, moneyToCredit, floatWithCommas } from "../../Lib/Math";
import { appConfig } from "../../System/Config/GameConfig";
import { posXArr, posYArr } from "../Symbol/SymbolDef";
import { divide } from "number-precision";
import SettingUIManager from "../UI/SettingUIManager";

/** 管理線獎的數字 */
export default class LineNumeralManager{
    
    private static lineNumberText: BitmapText;

    /** 初始化 贏線數字 */
    public static init(){
        this.lineNumberText = GameFontManager.drawLineNumber('0', 0, 0, 19)
        this.lineNumberText.parent && this.lineNumberText.parent.removeChild(this.lineNumberText)
    }

    /**
     * 撥放數字
     * @param parent 
     * @param winline 得獎縣資訊
     */
    public static playLineNumber(parent: Container, winline: ISSlotWinLineInfo){
        let winPosIndex: number = 2, indexArr = winline.WinPosition[winPosIndex], yOffset: number = 18, win: number = divide(winline.Win, appConfig.MoneyFractionMultiple)
        this.lineNumberText.text = SettingUIManager.getInstance().UseMoney? `${floatWithCommas(win)}`: `${numberWithCommas(moneyToCredit(win))}`
        this.lineNumberText.position.set(posXArr[indexArr[0]], posYArr[indexArr[1]] + yOffset);
        this.lineNumberText.setParent(parent)
    }

    /** 清除得獎線數字 */
    public static clearLineNumber(){
        this.lineNumberText.parent && this.lineNumberText.parent.removeChild(this.lineNumberText)
    }
}