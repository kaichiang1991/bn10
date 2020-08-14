import LineManager from "../Line/LineManager";
import GameStateContext, { CreateState, GameState } from "../../../System/State/State";
import EventHandler, { eEventName } from "../../EventHandler";
import Sleep from "../../../Lib/Sleep";
import GameSlotData from "../../GameSlotData/GameSlotData";
import BetModel from "../../BetModel/BetModel";
import CustomInteractionManager, { eInteractionEvent, eKey } from "../../../System/Tool/CustomInteractionManager";
import WheelController from "../../Symbol/WheelController";
import GameSpineManager from "../../../System/Assets/Spine/GameSpineManager";
import { sound } from "pixi.js-legacy";
import GameAudioManager from "../../../System/Assets/Audio/GameAudioManager";
import { eLotteryConfig } from "../../Symbol/SymbolDef";
import BigWinManager from "../BigWin/BigWinManager";

enum eLotteryState {
    LotteryInit = 'LotteryInit',
    LotteryAnimation = 'LotteryAnimation',
    LotteryEnd = 'LotteryEnd'
}

export default class LotteryController {

    private static instance: LotteryController;
    public static getInstance(): LotteryController {
        if (this.instance == null) this.instance = new LotteryController();
        return this.instance;
    }

    // 不包含特殊lineNo (0) 的winLine
    public winLineDataArr: Array<ISSlotWinLineInfo>;
    // 每次進lottery時的贏分統計
    public win: number;

    public async init(): Promise<void> {

        return new Promise<void>((res, rej) => {

            EventHandler.once(eEventName.lotteryEnd, res);
            this.winLineDataArr = new Array<ISSlotWinLineInfo>();
            this.win = 0;
            
            /** 註冊狀態機 */
            let stateContext: GameStateContext = new GameStateContext();
            stateContext.regState(CreateState(LotteryInit, eLotteryState.LotteryInit, stateContext))
            stateContext.regState(CreateState(LotteryAnimation, eLotteryState.LotteryAnimation, stateContext))
            stateContext.regState(CreateState(LotteryEnd, eLotteryState.LotteryEnd, stateContext))

            stateContext.changeState(eLotteryState.LotteryInit)
        })
    }
}

class LotteryInit extends GameState {

    async enter() {

        // 統計總贏分
        GameSlotData.NGPlayData.SpinInfo.WinLineInfos.forEach(winLine =>{
            if(winLine.LineNo != 0) LotteryController.getInstance().win += winLine.Win;
        })
        this.change();
    }

    change() {

        if (LotteryController.getInstance().win > 0) {
            this.context.changeState(eLotteryState.LotteryAnimation)
        } else {
            this.context.changeState(eLotteryState.LotteryEnd);
        }
    }
}

class LotteryAnimation extends GameState {

    async enter() {

        await Sleep(100)

        LotteryController.getInstance().winLineDataArr = GameSlotData.NGPlayData.SpinInfo.WinLineInfos.filter(line => line.LineNo != 0);    // 過濾掉特殊情況lineNo = 0

        // 得獎框 及 得獎符號的演出
        // 處理所有從server收到的pos
        let dirtyPosArr: Array<Array<number>> = new Array<Array<number>>();
        for(let i = 0; i< LotteryController.getInstance().winLineDataArr.length; i++){
            let winline: ISSlotWinLineInfo = LotteryController.getInstance().winLineDataArr[i]
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
        EventHandler.once(eEventName.stopSpinBtn, dispatchFunc.bind(this))
        CustomInteractionManager.once('pointerdown', eInteractionEvent.skipAllLineAnim, dispatchFunc.bind(this))
        CustomInteractionManager.onceKeyDown(eKey.space, eInteractionEvent.skipAllLineAnim, dispatchFunc.bind(this))

        await LineManager.playMultiLine(LotteryController.getInstance().winLineDataArr)

        // 正常流程的promise
        let normalPromise = Promise.all(allWinPromise)
        await Promise.race([normalPromise, skipPromise])

        GameSpineManager.endLine()                               // 清除全線
        WheelController.getInstance().clearAllWinEffect()        // 清除得獎動畫

        // 清除事件
        EventHandler.removeListener(eEventName.skipAllLineAnim)
        EventHandler.removeListener(eEventName.stopSpinBtn)
        CustomInteractionManager.off('pointerdown', eInteractionEvent.skipAllLineAnim)
        CustomInteractionManager.offKeyDown(eInteractionEvent.skipAllLineAnim)

        this.change();
    }

    change() {
        if(this.context.getCurrentState() == eLotteryState.LotteryAnimation){
            this.context.changeState(eLotteryState.LotteryEnd);
        }
    }
}

class LotteryEnd extends GameState {

    async enter() {
        // 顯示分數
        let win = LotteryController.getInstance().win;
        if(win > 0){
            LineManager.playEachLine(LotteryController.getInstance().winLineDataArr, false)
            BetModel.getInstance().addWin(win)

            let allPromise: Array<Promise<void>> = new Array<Promise<void>>()
            let noBigWin: boolean = BigWinManager.checkSkipBigWin(BigWinManager.getBigWinType(BetModel.getInstance().Win), true)
            let scoring: sound.IMediaInstance;
            noBigWin && (scoring = await GameAudioManager.playAudioEffect('NG_Score', true))

            allPromise.push(new Promise<void>((res, rej) =>{
                EventHandler.once(eEventName.betWinChangeDone, ()=>{
                    if(noBigWin){
                        GameAudioManager.stopAudioEffect(scoring);
                        GameAudioManager.playAudioEffect('Score_End');
                    }
                    res()
                })
            }))

            allPromise.push(new Promise<void>((res, rej) =>{
                EventHandler.once(eEventName.endBigWin, ()=>{
                    GameAudioManager.playAudioMusic('NG_BGM')
                    res()
                })
            }))
            
            EventHandler.dispatchEvent({name: eEventName.startBigWin, context: {win: BetModel.getInstance().Win, duration: this.getDuration(), normalWin: true}})
            EventHandler.dispatchEvent({name: eEventName.betWinChangeAnim, context: {betModel: BetModel.getInstance().getDispatchObject(), duration: this.getDuration()}})

            await Promise.all(allPromise)
            this.change();

            
        }else{
            this.change();
        }
    }

    change() {
        EventHandler.dispatchEvent({ name: eEventName.lotteryEnd});
    }

    /**
     * 取得贏分演出時間，逐線獎演出時間
     */
    private getDuration(): number{
        let winlineArr: Array<ISSlotWinLineInfo> = LotteryController.getInstance().winLineDataArr;
        let win: number = LotteryController.getInstance().win;
        let duration: number = win * eLotteryConfig.timePerCredit;
        let lineDuration: number = ((eLotteryConfig.lineLightTime + eLotteryConfig.lineDarkTime) * eLotteryConfig.perLineRepeatTimes) * winlineArr.length;

        duration = (duration > eLotteryConfig.maxBetWinDuration)? eLotteryConfig.maxBetWinDuration: (duration > lineDuration)? duration: lineDuration;
        return duration
    }
}
