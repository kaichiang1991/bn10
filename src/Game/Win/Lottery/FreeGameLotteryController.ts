import LineManager from "../Line/LineManager";
import GameStateContext, { CreateState, GameState } from "../../../System/State/State";
import EventHandler, { eEventName } from "../../EventHandler";
import Sleep from "../../../Lib/Sleep";
import {sound } from "pixi.js-legacy";
import GameSlotData from "../../GameSlotData/GameSlotData";
import FreeGameController from "../../GameProcessControll/FreeGameController";
import BetModel from "../../BetModel/BetModel";
import CustomInteractionManager, { eInteractionEvent, eKey } from "../../../System/Tool/CustomInteractionManager";
import GameAudioManager from "../../../System/Assets/Audio/GameAudioManager";
import WheelController from "../../Symbol/WheelController";
import { eLotteryConfig } from "../../Symbol/SymbolDef";
import GameSpineManager from "../../../System/Assets/Spine/GameSpineManager";

enum eFreeGameLotteryState {
    LotteryInit = 'FG_LotteryInit',
    LotteryAnimation = 'FG_LotteryAnimation',
    LotteryEnd = 'FG_LotteryEnd'
}

export default class FreeGameLotteryController {

    private static instance: FreeGameLotteryController;
    public static getInstance(): FreeGameLotteryController {
        if (this.instance == null) this.instance = new FreeGameLotteryController();
        return this.instance;
    }

    // 不包含特殊lineNo (0) 的winLine
    public winLineDataArr: Array<ISSlotWinLineInfo>;
    // 每次進lottery時的贏分統計
    public win: number;

    public async init(): Promise<void> {

        return new Promise<void>((res, rej) =>{

            EventHandler.once(eEventName.lotteryEnd, res);
            this.winLineDataArr = new Array<ISSlotWinLineInfo>();
            this.win = 0;

            /** 註冊狀態機 */
            let stateContext: GameStateContext = new GameStateContext();
            stateContext.regState(CreateState(LotteryInit, eFreeGameLotteryState.LotteryInit, stateContext))
            stateContext.regState(CreateState(LotteryAnimation, eFreeGameLotteryState.LotteryAnimation, stateContext))
            stateContext.regState(CreateState(LotteryEnd, eFreeGameLotteryState.LotteryEnd, stateContext))
                        
            stateContext.changeState(eFreeGameLotteryState.LotteryInit)    
        })
    }
}

class LotteryInit extends GameState {

    async enter() {

        // 統計總贏分
        GameSlotData.FGPlayData.SpinInfo.WinLineInfos.forEach(winLine =>{
            if(winLine.LineNo != 0) FreeGameLotteryController.getInstance().win += (winLine.Win * GameSlotData.FGPlayData.SpinInfo.Multiplier);
        })

        this.change();
    }

    change() {
        if(FreeGameLotteryController.getInstance().win > 0){
            this.context.changeState(eFreeGameLotteryState.LotteryAnimation)
        }else{
            this.context.changeState(eFreeGameLotteryState.LotteryEnd);
        }
    }
}

class LotteryAnimation extends GameState {

    async enter(){

        await Sleep(100)

        FreeGameLotteryController.getInstance().winLineDataArr = GameSlotData.FGPlayData.SpinInfo.WinLineInfos.filter(line => line.LineNo != 0);    // 過濾掉特殊情況lineNo = 0

        // 得獎框 及 得獎符號的演出
        // 處理所有從server收到的pos
        let dirtyPosArr: Array<Array<number>> = new Array<Array<number>>();
        for(let i = 0; i< FreeGameLotteryController.getInstance().winLineDataArr.length; i++){
            let winline: ISSlotWinLineInfo = FreeGameLotteryController.getInstance().winLineDataArr[i]
            for(let j = 0; j< winline.SymbolCount; j++){
                let pos: Array<number> = winline.WinPosition[j];
                dirtyPosArr.push(pos)
            }
        }

        // 存放乾淨的posArr (不重複)
        let purePosArr: Array<Array<number>> = new Array<Array<number>>();
        let isInArr: Function = (pos: Array<number>, posArr: Array<Array<number>>): boolean =>{
            let check: boolean = false;
            posArr.forEach(_pos =>{
                if(pos[0] == _pos[0] && pos[1] == _pos[1])
                    check = true
            })
            return check;
        }

        dirtyPosArr.forEach(pos =>{
            !isInArr(pos, purePosArr) && purePosArr.push(pos)
        })

        let allWinPromise: Array<Promise<void>> = new Array<Promise<void>>();
        purePosArr.forEach(pos =>{
            allWinPromise.push(WheelController.getInstance().playWinAnimation(pos[0], pos[1]))
        })
        // 最少要演出的時間
        allWinPromise.push(Sleep(eLotteryConfig.leastAllLineTime))
        
        // 跳過全線演出
        let skipPromise: Promise<void> = new Promise((res, rej) => EventHandler.once(eEventName.skipAllLineAnim, res))
        let dispatchFunc: Function = ()=> EventHandler.dispatchEvent({name: eEventName.skipAllLineAnim});
        // EventHandler.once(eEventName.stopSpinBtn, dispatchFunc.bind(this))
        CustomInteractionManager.once('pointerdown', eInteractionEvent.skipAllLineAnim, dispatchFunc.bind(this))
        CustomInteractionManager.onceKeyDown(eKey.space, eInteractionEvent.skipAllLineAnim, dispatchFunc.bind(this))

        await LineManager.playMultiLine(FreeGameLotteryController.getInstance().winLineDataArr)

        // 正常流程的promise
        let normalPromise = Promise.all(allWinPromise)
        await Promise.race([normalPromise, skipPromise])
    
        GameSpineManager.endLine()                               // 清除全線
        WheelController.getInstance().clearAllWinEffect()        // 清除得獎動畫

        // 清除事件
        EventHandler.removeListener(eEventName.skipAllLineAnim)
        // EventHandler.removeListener(eEventName.stopSpinBtn)
        CustomInteractionManager.off('pointerdown', eInteractionEvent.skipAllLineAnim)
        CustomInteractionManager.offKeyDown(eInteractionEvent.skipAllLineAnim)
        
        this.change();
    }
 
    change() {
        if(this.context.getCurrentState() == eFreeGameLotteryState.LotteryAnimation){
            this.context.changeState(eFreeGameLotteryState.LotteryEnd);
        }
    }

}

class LotteryEnd extends GameState {

    async enter() {
        // 顯示分數
        let win = FreeGameLotteryController.getInstance().win
        if(win > 0){
            LineManager.playEachLine(FreeGameLotteryController.getInstance().winLineDataArr, true)
            let scoring: sound.IMediaInstance = await GameAudioManager.playAudioEffect('FG_Score', true)
            BetModel.getInstance().addWin(win)
            EventHandler.dispatchEvent({name: eEventName.betWinChangeAnim, context: {betModel: BetModel.getInstance().getDispatchObject(), duration: this.getDuration()}})

            EventHandler.once(eEventName.betWinChangeDone, ()=>{
                GameAudioManager.stopAudioEffect(scoring);
                GameAudioManager.playAudioEffect('Score_End');
                this.change();
            })

        }else{   
            this.change();
        }
    }

    change() {
        EventHandler.dispatchEvent({name: eEventName.lotteryEnd});
    }

    /**
     * 取得贏分演出時間，逐線獎演出時間
     */
    private getDuration(): number{
        let winlineArr: Array<ISSlotWinLineInfo> = FreeGameLotteryController.getInstance().winLineDataArr;
        let win: number = FreeGameLotteryController.getInstance().win;
        let duration: number = win * eLotteryConfig.timePerCredit;
        let lineDuration: number = ((eLotteryConfig.lineLightTime + eLotteryConfig.lineDarkTime) * eLotteryConfig.perLineRepeatTimes) * winlineArr.length;

        duration = (duration > eLotteryConfig.maxBetWinDuration)? eLotteryConfig.maxBetWinDuration: (duration > lineDuration)? duration: lineDuration;
        return duration
    }
}
