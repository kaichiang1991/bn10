import { BitmapText, Point, Container } from "pixi.js-legacy";
import { moneyToCredit, numberWithCommas, floatWithCommas } from "../../Lib/Math";
import GameFontManager from "../../System/Assets/Font/GameFontManager";
import { eLayer, appConfig } from "../../System/Config/GameConfig";
import EventHandler, { eEventName } from "../EventHandler";
import CustomInteractionManager, { eKey, eInteractionEvent } from "../../System/Tool/CustomInteractionManager";
import { killTween } from "../../Lib/Tool";
import { TimelineLite, Back } from "gsap";
import { divide } from "number-precision";
import SettingUIManager from "../UI/SettingUIManager";

/** BigWin 的數字 */
export default class BigWinNumeralManager {

    private static target: number;
    private static value: number;
    private static numText: BitmapText;

    private static bSkip: boolean;

    /**
     * 撥放 bigWin的數字
     * 跑完分數後會派送 bigWinEnd 事件
     * @param target 目標分數
     * @param pos 分數要顯示的位置
     */
    public static async playBigWinNumber(target: number, duration: number, parent: Container, pos: Point) {

        this.target = target
        this.value = 0;
        this.bSkip = false;

        this.numText = GameFontManager.drawBigWinNumber(`${this.value}`, pos.x, pos.y)
        this.numText.zIndex = eLayer.bigWinNumber;
        this.numText.setParent(parent)
    
        let delayTime: number = .4, win: number
        let tween: TimelineLite = new TimelineLite()

        // 數字出來後才註冊跳過事件
        tween.add(()=>{
            parent.once('pointerdown', jumpToEnd)
            CustomInteractionManager.onKeyDown(eKey.space, eInteractionEvent.skipBigWin, jumpToEnd)
        }, delayTime)
        // 彈跳
        tween.from(this.numText.scale, .5, {x: 0, y: 0, ease: Back.easeOut}, delayTime)
        // 跑分
        tween.to(this, duration, {value: target}, delayTime)
        tween.eventCallback('onUpdate', ()=>{
            win = divide(this.value, appConfig.MoneyFractionMultiple)
            this.numText.text = SettingUIManager.getInstance().UseMoney? `${floatWithCommas(win)}`: `${numberWithCommas(moneyToCredit(win)).split('.')[0]}`
        })

        tween.eventCallback('onComplete', ()=> {
            killTween(tween)
            parent.off('pointerdown', jumpToEnd)
            CustomInteractionManager.offKeyDown(eInteractionEvent.skipBigWin)
            EventHandler.dispatchEvent({ name: eEventName.bigWinNumberEnd })
        })

        let jumpToEnd: Function = () => {
            if (this.bSkip || !tween) {
                return;
            }
            this.bSkip = true
            // 強制派送事件
            tween.progress(1, false)
        }
    }

    /** 清除 bigWin 數字 */
    public static destroy() {
        this.numText.destroy();
    }
}
