import GameSpineManager from "../../System/Assets/Spine/GameSpineManager";
import Sleep from "../../Lib/Sleep";
import EventHandler, {eEventName } from "../EventHandler";
import GameStateContext, { GameState, CreateState } from "../../System/State/State";
import LotteryController from "../Win/Lottery/LotteryController";
import GameSlotUIManager from "../UI/GameSlotUIManager";
import GameSlotData, { eWinType } from "../GameSlotData/GameSlotData";
import BetModel from "../BetModel/BetModel";
import SettingUIManager from "../UI/SettingUIManager";
import FreeGameController from "./FreeGameController";
import { eSymbolName, eWheelConfig, eSymbolConfig, eLotteryConfig, posXArr } from "../Symbol/SymbolDef";
import GameDataRequest from "../../System/Network/GameDataRequest";
import CustomInteractionManager, { eInteractionEvent, eKey } from "../../System/Tool/CustomInteractionManager";
import GameAudioManager from "../../System/Assets/Audio/GameAudioManager";
import WheelController, { eWheelDataType } from "../Symbol/WheelController";
import LineManager from "../Win/Line/LineManager";
import SystemErrorManager from "../../System/SystemErrorManager";
import LocalizationManager from "../../System/LocalizationManager";
import GameInfoManager from "../UI/GameInfoManager";
import BetListManager from "../UI/BetListManager";
import { setNoSleep } from "../../Lib/Tool";

export enum eGameState {
    GameInit = 'GameInit',
    GameStart = 'GameStart',
    StartSpin = 'StartSpin',
    SwapSymbol = 'SwapSymbol',
    EndSpin = 'EndSpin',
    TakeMoney = 'TakeMoney',
    FreeGame = 'FreeGame',
    FreeGameEndDrop = 'FreeGameEndDrop',
}

/** BaseGame 的遊戲邏輯 */
export default class GameController {

    private static instance: GameController;
    public static getInstance(): GameController {
        if (this.instance == null) this.instance = new GameController();
        return this.instance;
    }

    public async init() {
 
        /** 註冊狀態機 */
        let stateContext: GameStateContext = new GameStateContext();
        stateContext.regState(CreateState(GameInit, eGameState.GameInit, stateContext))
        stateContext.regState(CreateState(GameStart, eGameState.GameStart, stateContext))
        stateContext.regState(CreateState(StartSpin, eGameState.StartSpin, stateContext))
        stateContext.regState(CreateState(EndSpin, eGameState.EndSpin, stateContext))
        stateContext.regState(CreateState(TakeMoney, eGameState.TakeMoney, stateContext))
        stateContext.regState(CreateState(FreeGame, eGameState.FreeGame, stateContext))

        stateContext.changeState(eGameState.GameInit)
    }
}

/** 遊戲初始化 */
class GameInit extends GameState {

    async enter() {

        await GameSpineManager.playBaseGameUI();
        await WheelController.getInstance().reset()
        await GameSlotUIManager.getInstance().initBaseGameSlotUI();
        SettingUIManager.getInstance().activeSettingButton(true);

        EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})

        GameAudioManager.playAudioMusic('NG_BGM')

        this.change();
    }

    async change() {
        this.context.changeState(eGameState.GameStart)
    }
}

/** 遊戲開始，等待 spin / auto */
class GameStart extends GameState {

    enter() {
        setNoSleep(false)

        EventHandler.on(eEventName.startSpin, this.change.bind(this));
        CustomInteractionManager.onKeyDown(eKey.space, eInteractionEvent.startSpin, this.change.bind(this))

        if (GameSlotUIManager.getInstance().Auto) {
            this.change();
        }

    }

    async change() {

        if(GameInfoManager.getInstance().IsActive || SettingUIManager.getInstance().IsActive || BetListManager.IsActive){
            this.context.changeState(eGameState.GameStart)
            return;
        }
        // credit 不足
        if(!this.checkCredit()){
            // 取消keyboard事件
            CustomInteractionManager.offKeyDown(eInteractionEvent.startSpin)
            GameSlotUIManager.getInstance().Auto && GameSlotUIManager.getInstance().setAutoActive(false)
            await SystemErrorManager.showPromptOut(LocalizationManager.gameText('InsufficientBalanceTitle'))
            this.context.changeState(eGameState.GameStart)
            return;
        }

        BetModel.getInstance().startSpin();
        EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})
        this.context.changeState(eGameState.StartSpin);
    }

    exit() {
        EventHandler.removeListener(eEventName.startSpin)
        CustomInteractionManager.offKeyDown(eInteractionEvent.startSpin)
    }

    private checkCredit(): boolean{
        let creditEnough: boolean = (BetModel.getInstance().Credit >= BetModel.getInstance().TotalBet);
        return creditEnough
    }
}

/** 開始轉動 */
class StartSpin extends GameState {

    async enter() {

        setNoSleep(true)

        let startCompCount: number = 0
        let startComplete: Promise<void> = new Promise<void>((res) =>{
            EventHandler.on(eEventName.startSpinComp, () =>{
                startCompCount++
                if(startCompCount == posXArr.length){
                    res()
                }
            })
        })
        let isSpeedUp: boolean = GameSlotUIManager.getInstance().SpeedUp;
        let allSpin: Promise<void> = WheelController.getInstance().startSpin(isSpeedUp)

        // 等待傳送server請求回傳
        await new Promise<void>((res, rej) => {
            GameDataRequest.requestNGPlay(BetModel.getInstance().Bet, (data) =>{
                GameSlotData.NGPlayData = data
                res()
            })
        })

        await startComplete
        BetModel.getInstance().setRoundID(GameSlotData.NGPlayData.RoundCode)
        EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})

        await this.playPandaJump()     
        // 等待最少演出時間 或 手動停止演出
        let allPromise: Array<Promise<void>> = new Array<Promise<void>>()
        allPromise.push(Sleep(isSpeedUp? eWheelConfig.leastSpeedSpinTime: eWheelConfig.leastSpinTime))

        // 註冊接收急停事件  (快速自動時直接急停)
        if(isSpeedUp){
            WheelController.getInstance().setStopImmed()
        }else{
            allPromise.push(new Promise<void>((res, rej) =>{
                EventHandler.on(eEventName.stopSpinBtn, ()=>{
                    WheelController.getInstance().setStopImmed();
                    EventHandler.dispatchEvent({name: eEventName.stopSpinManual})
                    res()
                })
            }))
        }

        // 註冊點擊急停事件
        CustomInteractionManager.on('pointerdown', eInteractionEvent.startSpinStop, (event) =>{
            event.stopPropagation();
            EventHandler.dispatchEvent({name: eEventName.stopSpinBtn})
        })
        CustomInteractionManager.onKeyDown(eKey.space, eInteractionEvent.startSpinStop, ()=> EventHandler.dispatchEvent({name: eEventName.stopSpinBtn}))
                
        await Promise.race(allPromise)        
        
        WheelController.getInstance().setResult(GameSlotData.NGPlayData.SpinInfo.SymbolResult)
        WheelController.getInstance().checkListeningWithWinline(GameSlotData.NGPlayData.SpinInfo.WinLineInfos)
        WheelController.getInstance().stopWheel()

        await allSpin;
        WheelController.getInstance().setAllWheelStick(false)
        this.change()
    }

    change() {
        this.context.changeState(eGameState.EndSpin);
    }

    exit(){
        EventHandler.removeListener(eEventName.startSpinComp);
        EventHandler.removeListener(eEventName.stopSpinBtn);
        CustomInteractionManager.off('pointerdown', eInteractionEvent.startSpinStop)
        CustomInteractionManager.offKeyDown(eInteractionEvent.startSpinStop)
    }

    /** 撥放特殊機制的熊貓 */
    private async playPandaJump(){
        // 判斷有沒有
        let spinInfo: ISSlotSpinInfo = GameSlotData.NGPlayData.SpinInfo
        if(spinInfo.ScreenOutput.length == 0 || spinInfo.Win == 0){     // 有觸發卻沒贏分 也篩掉
            return;
        }
    
        let posArr: Array<Array<number>> = new Array<Array<number>>()
        spinInfo.ScreenOutput.forEach((wheel, wheelIndex) =>{
            wheel.forEach((symbol, symbolIndex) =>{
                (symbol == eSymbolName.WD) && posArr.push([wheelIndex, symbolIndex])
            })
        })
         
        // 要一次貼出複數的wild，所以先計算每次要貼出的量
        let count: number, multiPosArr: Array<Array<Array<number>>> = new Array<Array<Array<number>>>()
        while(posArr.length > 0){
            count = Math.ceil(Math.random() * 3)     // 隨機最多3個
            count = (count > posArr.length)? posArr.length: count;      // 不超過arr個數
            let tmpArr: Array<Array<number>> = new Array<Array<number>>();
            for(let i = 0; i < count; i++){     // 取三個出來放進陣列
                let del: Array<number> = posArr.splice(Math.floor(Math.random() * posArr.length), 1)[0]
                tmpArr.push(del)
            }
            multiPosArr.push(tmpArr)
        }
        
        // 隨機產生順序
        let order: Array<number> = Array(multiPosArr.length)
        for(let i = 0; i< order.length; i++){
            order[i] = i
        }

        let randomOrder: Array<number> = new Array<number>()
        while(order.length > 0){
            let start: number = Math.floor(Math.random() * order.length)
            randomOrder.push(order.splice(start, 1)[0])
        }

        // 最少延遲時間 (ms)          最大延遲的時間 (ms)
        let leastTime: number = 500, maxRandomTime: number = 500   
        let timeArr: Array<number> = new Array<number>();     // 亂數停輪的時間
        for(let i = 0; i< multiPosArr.length; i++){
            timeArr[i] = Math.random() * maxRandomTime + leastTime; 
        }
        
        GameSpineManager.playGameUIBlack()
        GameSpineManager.playPandaJump()
        // 音效
        GameAudioManager.playAudioMusic('NG_Feature_BGM', false, ()=> GameAudioManager.playAudioMusic('NG_BGM'))
        
        await Sleep(eSymbolConfig.jumpOutTime)

        for(let i = 0; i< multiPosArr.length; i++){
            let multiPos: Array<Array<number>> = multiPosArr[randomOrder[i]]
            // 音效
            GameAudioManager.playAudioEffect('NG_Feature_Hit')
            for(let j = 0; j < multiPos.length; j++){
                let pos = multiPos[j]
                WheelController.getInstance().setSpecifySingleStick(pos[0], pos[1], eSymbolName.WD)
            }
            await Sleep(timeArr[i])
        }
        GameSpineManager.clearGameUIBlack()
        GameSpineManager.endPandaJump()
    }
}

/** 全部轉輪落定 判斷演出 */
class EndSpin extends GameState {

    private isFreeGame: boolean;
    private isWin: boolean;

    async enter() {

        await Sleep(500)

        this.isWin = ((GameSlotData.NGPlayData.SpinInfo.WinType & eWinType.normal) != 0)
        this.isFreeGame = ((GameSlotData.NGPlayData.SpinInfo.WinType & eWinType.freeGame) != 0)
        
        this.isWin && await LotteryController.getInstance().init();

        this.change();
    }

    async change() {

        if(this.isFreeGame){
            // 進入這裡已經要演完逐縣獎了，在這裡關掉
            LineManager.stopEachLine();
            
            // 演出 WD 符號
            await this.playWDEffect(this.getWDWinlines(GameSlotData.NGPlayData.SpinInfo.WinLineInfos))
            this.context.changeState(eGameState.FreeGame)
        }else{
            this.context.changeState(eGameState.TakeMoney)
        }
    }

    /** 
     * 取得 WD 得獎的線獎資訊
     * @param winlineInfos 要判斷的線獎資訊 (所有的線獎資訊)
     */
    private getWDWinlines(winlineInfos: Array<ISSlotWinLineInfo>): Array<ISSlotWinLineInfo>{
        return winlineInfos.filter(winline => winline.SymbolID == eSymbolName.WD)
    }

    /** 撥放 WD 符號的演出*/
    private async playWDEffect(WD_winlineArr: Array<ISSlotWinLineInfo>){
        // 蓋上黑幕
        GameSpineManager.playGameUIBlack();

        // 處理所有從server收到的pos
        let dirtyPosArr: Array<Array<number>> = new Array<Array<number>>();
        for(let i = 0; i< WD_winlineArr.length; i++){
            let winline: ISSlotWinLineInfo = WD_winlineArr[i]
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
        
        let allPromise: Array<Promise<void>> = new Array<Promise<void>>()
        purePosArr.forEach(pos =>{
            allPromise.push(WheelController.getInstance().playWinAnimation(pos[0], pos[1]))
        })

        // 等待得獎演出完
        await Promise.all(allPromise)
        GameSpineManager.clearGameUIBlack()
        WheelController.getInstance().clearAllWinEffect()
    }
}

/** 取錢 */
class TakeMoney extends GameState {

    private isAuto: boolean;

    async enter() {
        
        this.isAuto = GameSlotUIManager.getInstance().Auto;
        if(this.isAuto){
            LineManager.stopEachLine()
            await Sleep(500)
            this.change();
            return;
        }

        if(BetModel.getInstance().Win > 0){
            EventHandler.once(eEventName.takeMoney, ()=>{
                this.change();
            })
        }else{
            this.change();
        }

    }

    change() {
        if(!this.isAuto){
            LineManager.stopEachLine()
        }

        GameDataRequest.requestRoundEnd((data)=>{

            // ToDo  測試分數有沒有一致
            if(BetModel.getInstance().Credit + BetModel.getInstance().Win != data.Balance){
                console.log('betModel', BetModel.getInstance(), ' data balance', data.balance)
            }
            BetModel.getInstance().setWin(0);
            BetModel.getInstance().setCredit(data.Balance)
            EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})
            this.context.changeState(eGameState.GameStart)
        })
    }

    exit(){
        EventHandler.removeListener(eEventName.takeMoney)
        // 在slotUI監測狀態時註冊
        CustomInteractionManager.offKeyDown(eInteractionEvent.takeMoney)
    }

}

/** FreeGame 狀態 */
class FreeGame extends GameState {

    async enter() {
        GameAudioManager.playAudioMusic('NGtoFG', false, ()=>{
            // 避免玩家久不按，造成沒有背景音樂
            GameAudioManager.playAudioMusic('FG_BGM')
        })
        
        await FreeGameController.getInstance().init();
        
        // 撥放 bigWin
        EventHandler.once(eEventName.endBigWin, ()=>{
            GameAudioManager.playAudioMusic('NG_BGM')
            this.change();
        })
        EventHandler.dispatchEvent({name: eEventName.startBigWin, context: {win: BetModel.getInstance().Win, duration: this.getDuration(BetModel.getInstance().Win, 0)}})
    }

    change() {
        WheelController.getInstance().setWheelData(eWheelDataType.normalGame)
        this.context.changeState(eGameState.TakeMoney)
    }

    /**
     * 取得要跑分的時間
     * @param target 目標分數
     * @param nowValue 目前分數
     */
    private getDuration(target: number, nowValue: number): number{

        // 跑線的時間
        let LEAST_DURATION: number = 10
        let MAX_DURATION: number = 20
        let TIME_PER_CREDIT: number = 0.01

        let value: number = target - nowValue;
        value *= TIME_PER_CREDIT;
        value = (value > MAX_DURATION)? MAX_DURATION: (value < LEAST_DURATION)? LEAST_DURATION: value;
        return value
    }

}



