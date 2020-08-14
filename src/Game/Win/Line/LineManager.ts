import GameSpineManager from "../../../System/Assets/Spine/GameSpineManager";
import { App } from "../../../main";
import GameAudioManager from "../../../System/Assets/Audio/GameAudioManager";
import GameSlotUIManager from "../../UI/GameSlotUIManager";
import WheelController from "../../Symbol/WheelController";
import { eLotteryConfig, eSymbolName } from "../../Symbol/SymbolDef";
import { TimelineMax } from "gsap";
import { killTween } from "../../../Lib/Tool";
import LineNumeralManager from "../../Numeral/LineNumeralManager";

export default class LineManager{

    private static readonly LINE_BACKGROUND_PREFIX: string = 'BaseGameMask_';
    private static readonly LINE_FREEGAME_BACKGROUND_PREFIX: string = 'FreeGameMask_';

    private static eachLineTween: TimelineMax;
    private static isEachLineComplete: boolean

    /**
     * 撥放全線獎
     * @param winlineArr 
     */
    public static async playMultiLine(winlineArr: Array<ISSlotWinLineInfo>){
        // 撥放音效
        let isHigh: boolean = this.isHighScoreWin(this.getHighestWinline(winlineArr));
        let audioName: string = `AllLine_${isHigh? 'H': 'N'}_Symbols`
        GameAudioManager.playAudioEffect(audioName)
    
        await GameSpineManager.initLine()
        for(let winline of winlineArr){
            GameSpineManager.playLine(this.getLineAnimName(winline.LineNo))
        }
    }

    /**
     * 撥放逐線獎
     * @param winlineArr 線獎資訊 
     * @param isFreeGame 是不是freeGame
     */
    public static async playEachLine(winlineArr: Array<ISSlotWinLineInfo>, isFreeGame: boolean): Promise<void>{

        this.isEachLineComplete = false
        await GameSpineManager.initLine()       
        await GameSpineManager.initLineBackground()
        
        let index: number = 0, perLineLoopCount: number = 0, winline: ISSlotWinLineInfo, winPosIndex: number = 2, indexArr: Array<number>, yOffset: number = 18;
        this.eachLineTween = new TimelineMax({repeat: -1})
        this.eachLineTween.repeatDelay(eLotteryConfig.lineDarkTime)
        this.eachLineTween.call(()=>{
            if(this.isEachLineComplete)
                return

            winline = winlineArr[index]
            GameSpineManager.playSingleLine(this.getLineAnimName(winline.LineNo))            // 撥放得獎線
            this.playLineBackground(winline, isFreeGame)                            // 撥放得獎背景

            winline.WinPosition.forEach(pos =>{
                WheelController.getInstance().playWinBoxAnimation(winline.LineNo, pos[0], pos[1])            // 撥放得獎框
            })
            GameSlotUIManager.getInstance().activeWinInfo(true, winline)            // 撥放slotUI winInfo
            LineNumeralManager.playLineNumber(App.stage, winline)                   // 撥放分數
        })
        .add(()=>{
            GameSpineManager.endSingleLine()                             // 隱藏單線
            GameSpineManager.clearLineBackgroundTrack()                  // 隱藏得獎背景
            WheelController.getInstance().clearAllWinEffect()            // 隱藏得獎框
            GameSlotUIManager.getInstance().activeWinInfo(false)         // 隱藏slotUI winInfo
            LineNumeralManager.clearLineNumber()                         // 隱藏分數

            perLineLoopCount++;
            if(perLineLoopCount == eLotteryConfig.perLineRepeatTimes){
                index = ++index % winlineArr.length;
                perLineLoopCount = 0
            }
        }, `+=${eLotteryConfig.lineLightTime}`)
    }

    /** 停止撥放逐線獎 */
    public static stopEachLine(){
        if(this.eachLineTween && this.eachLineTween.isActive()){
            this.isEachLineComplete = true
            this.eachLineTween.repeat(0)
            killTween(this.eachLineTween)
            this.eachLineTween = null
            GameSpineManager.endLine()                                   // 隱藏得獎線
            GameSpineManager.clearLineBackground()                      // 隱藏得獎背景
            GameSlotUIManager.getInstance().activeWinInfo(false)         // 隱藏slotUI winInfo
            LineNumeralManager.clearLineNumber()                         // 隱藏分數
        }

        WheelController.getInstance().clearAllWinEffect()        // 隱藏得獎演出
    }
          
    /** 
     * 撥放線獎背景
     * @param winline 線獎資訊
     * @param isFreeGame 是否為 freeGame，預設為否
     */
    private static async playLineBackground(winLine: ISSlotWinLineInfo, isFreeGame: boolean = false){
        let animNameArr: Array<string> = this.getLineBackgroundName(winLine.WinPosition, isFreeGame)
        GameSpineManager.playLineBackground(animNameArr)
    }

    /** 
     * 清除線獎背景
     * @param isFreeGame 是否為 freeGame，預設為否
     */
    public static clearBackground(){
        GameSpineManager.clearLineBackground()
    }

    /**
     * 取得線獎動畫名稱 
     * @param lineNo 線號
     */
    private static getLineAnimName(lineNo: number): string{
        let name: string;
        if(lineNo < 10){
            name = `Line_0${lineNo}`
        }else{
            name = `Line_${lineNo}`
        }
        return name;
    }

    /**
     * 取得線獎背景的名稱 (陣列)
     * @param posArr 
     * @param isFreeGame 是否為 freeGame，預設為否
     */
    private static getLineBackgroundName(posArr: Array<Array<number>>, isFreeGame: boolean = false): Array<string>{
        let nameArr: Array<string> = new Array<string>(), name: string;
        for(let pos of posArr){
            name = `${isFreeGame? this.LINE_FREEGAME_BACKGROUND_PREFIX: this.LINE_BACKGROUND_PREFIX}${pos[0] + 1}_${pos[1] + 1}`
            nameArr.push(name)
        }
        return nameArr;
    }

    /**
     * 取得最高分的winline
     * @param winlineArr 全部的winline陣列
     */
    private static getHighestWinline(winlineArr: Array<ISSlotWinLineInfo>): ISSlotWinLineInfo{
        let winline: ISSlotWinLineInfo = winlineArr[0]
        for(let i = 1; i< winlineArr.length; i++){
            winline = (winlineArr[i].Win > winline.Win)? winlineArr[i]: winline
        }
        return winline;
    }

    /** 
     * 判斷是否為高分圖標
     * @param winline 線獎資訊
     */
    private static isHighScoreWin(winline: ISSlotWinLineInfo): boolean{
        let result: boolean = false;
        switch(winline.SymbolID){
            case eSymbolName.H1:
            case eSymbolName.H2:
            case eSymbolName.H3:
            case eSymbolName.H4:
                result = true;
        }
        return result;
    }
}