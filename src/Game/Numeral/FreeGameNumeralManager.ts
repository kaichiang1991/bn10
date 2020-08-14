import { BitmapText, Point, Container } from "pixi.js-legacy";
import GameFontManager from "../../System/Assets/Font/GameFontManager";
import LocalizationManager from "../../System/LocalizationManager";
import { TimelineLite } from "gsap";
import { numberWithCommas, moneyToCredit, floatWithCommas } from "../../Lib/Math";
import Debug from "../../Lib/Debug";
import GameSlotData from "../GameSlotData/GameSlotData";
import { App } from "../../main";
import { killTween } from "../../Lib/Tool";
import { divide } from "number-precision";
import { appConfig } from "../../System/Config/GameConfig";
import SettingUIManager from "../UI/SettingUIManager";

enum eRoundTextName{
    now = 'now',
    total = 'total'
}

/** 管理 FreeGame 裡面使用的數字 */
export default class FreeGameNumeralManager{

    private static readonly ROUND_TEXT_POS_DEF = {
        'zh-cn': {x: 640, y: 250},
        'en': {x: 640, y: 250},
        'vi': {x: 640, y: 250},
        'th': {x: 640, y: 250},
    }

    private static readonly WIN_TEXT_POS_DEF = {
        'zh-cn': {x: 640, y: 315},
        'en': {x: 640, y: 315},
        'vi': {x: 640, y: 315},
        'th': {x: 640, y: 315},
    }

    private static readonly CURRENT_ROUND_TEXT_POS_DEF = {
        'zh-cn': {x: 460, y: 44},
        'en': {x: 460, y: 44},
        'vi': {x: 460, y: 44},
        'th': {x: 698, y: 44},
    }

    private static readonly TOTAL_ROUND_TEXT_POS_DEF = {
        'zh-cn': {x: 600, y: 44},
        'en': {x: 600, y: 44},
        'vi': {x: 600, y: 44},
        'th': {x: 827, y: 44},
    }

    // 開頭總回和數
    private static titleRoundText: BitmapText;
    // 結算總分
    private static totalWin: BitmapText;

    // 回和數
    private static textArr: Array<BitmapText>;
    private static currentTotalTimes: number;
    public static get CurrentTotalTimes(): number {return this.currentTotalTimes}

    // 加分數字
    private static plusText: BitmapText;

    /** 初始化 FreeGame 用到的數字 */
    public static init(){
        // 獲得免費遊戲的次數顯示
        let pos = this.ROUND_TEXT_POS_DEF[LocalizationManager.getLanguage()];
        this.titleRoundText = GameFontManager.drawFreeGameTitleNumber('0', pos.x, pos.y)
        this.clearTitleRoundTimes()
        
        // 免費遊戲總得分
        pos = this.WIN_TEXT_POS_DEF[LocalizationManager.getLanguage()]
        this.totalWin = GameFontManager.drawFreeGameTitleNumber('0', pos.x, pos.y);
        this.clearTotalWin()

        // 回和數顯示的數字
        this.textArr = new Array<BitmapText>();
        pos = this.CURRENT_ROUND_TEXT_POS_DEF[LocalizationManager.getLanguage()]
        this.textArr[eRoundTextName.now] = GameFontManager.drawFreeGameTimesNumber('0', pos.x, pos.y)
        pos = this.TOTAL_ROUND_TEXT_POS_DEF[LocalizationManager.getLanguage()]
        this.textArr[eRoundTextName.total] = GameFontManager.drawFreeGameTimesNumber('0', pos.x, pos.y);
        this.clearRoundTimes()

        // 加分
        this.plusText = GameFontManager.drawPlusTimesNumber('0', pos.x, 50)
        this.clearPlusTime()
    }

    /**
     * 撥放開頭回和數
     * @param total 回合總數
     */
    public static async playTitleRoundTimes(parent: Container, total: number){
        this.titleRoundText.text = `${total}`
        this.titleRoundText.setParent(parent)

        let tween: TimelineLite = new TimelineLite()
        tween.from(this.titleRoundText.scale, .3, {x: 0, y: 0}, 1)        
        await new Promise<void>((res) =>{
            tween.eventCallback('onComplete', ()=>{
                killTween(tween)
                res()
            })
        })
    }

    public static clearTitleRoundTimes(){
        this.titleRoundText && this.titleRoundText.parent && this.titleRoundText.parent.removeChild(this.titleRoundText)
    }

    /**
     * 初始化並顯示freeGame回和數
     * @param totalTimes 總共的回合
     */
    public static resetRoundTimes(totalTimes: number){

        if(!this.textArr){
            Debug.Warn('resetRoundTimes fail.', 'no text Arr')
            return
        }

        this.textArr[eRoundTextName.now].setParent(App.stage)
        this.textArr[eRoundTextName.total].setParent(App.stage)
        this.setTotalTimes(totalTimes)
    }

    /**
     * 設定總回和數
     * @param value 
     */
    public static setTotalTimes(value: number){
        if(!this.textArr){
            Debug.Error('free game numeral:', 'setTotalTime no text')
            return;
        }
        this.textArr[eRoundTextName.total].text = `${value}`;
        this.currentTotalTimes = value
    }

    /**
     * 設定目前回和數
     * @param value 
     */
    public static setCurrentTimes(value: number){
        if(!this.textArr){
            Debug.Error('free game numeral:', 'setCurrentTimes no text')
            return;
        }
        this.textArr[eRoundTextName.now].text = `${value}`;
    }

    /** 清除freeGame的回合數 */
    public static clearRoundTimes(){
        if(this.textArr){
            for(let text in this.textArr){
                this.textArr[text].parent && this.textArr[text].parent.removeChild(this.textArr[text])
            }
        }
        this.currentTotalTimes = 0;       
    }

    /** 撥放獲得總分 */
    public static async playTotalWin(parent: Container, _win: number){

        if(!this.totalWin){
            Debug.Warn('playTotalWin', 'no totalWin text')
            return
        }

        let win: number = divide(_win, appConfig.MoneyFractionMultiple)
        this.totalWin.text = SettingUIManager.getInstance().UseMoney? `${floatWithCommas(win)}`: `${numberWithCommas(moneyToCredit(win))}`
        this.totalWin.setParent(parent)

        let tween: TimelineLite = new TimelineLite()
        tween.from(this.totalWin.scale, .3, {x: 0, y: 0}, 1)        
        await new Promise<void>((res) =>{
            tween.eventCallback('onComplete', ()=>{
                res()
            })
        })
    }

    public static clearTotalWin(){
        this.totalWin && this.totalWin.parent && this.totalWin.parent.removeChild(this.totalWin)
    }

    /** 撥放增加總回數的數字特效 */
    public static async playPlusTimeNumber(times: number){
        
        return new Promise<BitmapText>((res, rej) =>{

            let duration: number = 1;
            this.plusText.text = `+${times}`
            this.plusText.setParent(App.stage)
            let t1: TimelineLite = new TimelineLite()
            .fromTo(this.plusText, duration, {y: 50, alpha: 0}, {y: 25, alpha: 1})
            .call(()=>{
                killTween(t1)
                this.clearPlusTime()
                res();
            })
        })
    }

    private static clearPlusTime(){
        if(!this.plusText){
            Debug.Warn('clearPlusTime', 'no plus text')
            return
        }
        this.plusText.parent && this.plusText.parent.removeChild(this.plusText)
    }
}