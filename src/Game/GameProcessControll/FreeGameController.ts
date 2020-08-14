import GameSpineManager from "../../System/Assets/Spine/GameSpineManager";
import EventHandler, { eEventName } from "../EventHandler";
import GameStateContext, { GameState, CreateState } from "../../System/State/State";
import {spine, BitmapText } from "pixi.js-legacy";
import GameSlotData, { eWinType } from "../GameSlotData/GameSlotData";
import Sleep from "../../Lib/Sleep";
import FreeGameLotteryController from "../Win/Lottery/FreeGameLotteryController";
import { eWheelConfig, eSymbolName, eSymbolConfig, posXArr } from "../Symbol/SymbolDef";
import FreeGameNumeralManager from "../Numeral/FreeGameNumeralManager";
import CustomInteractionManager, { eInteractionEvent, eKey } from "../../System/Tool/CustomInteractionManager";
import WheelController, { eWheelDataType } from "../Symbol/WheelController";
import GameDataRequest from "../../System/Network/GameDataRequest";
import BetModel from "../BetModel/BetModel";
import BigWinManager from "../Win/BigWin/BigWinManager";
import GameAudioManager from "../../System/Assets/Audio/GameAudioManager";
import LineManager from "../Win/Line/LineManager";
import CustomContainerManager, { eContainerType } from "../../System/Tool/CustomContainerManager";
import { App } from "../../main";

export enum eFreeGameState {
    GameInit = 'FGGameInit',
    GameStart = 'FGGameStart',
    StartSpin = 'FGStartSpin',
    EndSpin = 'FGEndSpin',
    GameEnd = 'FGEnd',
}

export default class FreeGameController {

    private static instance: FreeGameController;
    public static getInstance(): FreeGameController {
        if (this.instance == null) this.instance = new FreeGameController();
        return this.instance;
    }
    
    public async init(): Promise<void> {

        return new Promise<void>((res, rej) =>{

            EventHandler.once(eEventName.freeGameEnd, res);

            /** 註冊狀態機 */
            let stateContext: GameStateContext = new GameStateContext();
            stateContext.regState(CreateState(FreeGameInit, eFreeGameState.GameInit, stateContext))
            stateContext.regState(CreateState(FreeGameStart, eFreeGameState.GameStart, stateContext))
            stateContext.regState(CreateState(FreeGameStartSpin, eFreeGameState.StartSpin, stateContext))
            stateContext.regState(CreateState(FreeGameEndSpin, eFreeGameState.EndSpin, stateContext))
            stateContext.regState(CreateState(FreeGameEnd, eFreeGameState.GameEnd, stateContext))
            
            stateContext.changeState(eFreeGameState.GameInit)
        })
    }
}

/** 初始化 FreeGame */
class FreeGameInit extends GameState {

    async enter() {

        let parent = CustomContainerManager.getContainer(eContainerType.fullScreenCover)
        App.stage.addChild(parent)
        GameSpineManager.playFreeGameHint(parent)
        await FreeGameNumeralManager.playTitleRoundTimes(parent, GameSlotData.NGPlayData.SpinInfo.FGTotalTimes)

        // 判斷點擊 或 停留時間後 繼續 ( 正式時一定要點擊 )
        let allPromsie: Array<Promise<any>> = new Array<Promise<any>>();
        window.burnTest && allPromsie.push(Promise.resolve())       // 測試時直接跳過

        allPromsie.push(
            new Promise<void>((res) => parent.once('pointerdown', res)),
            new Promise<void>((res) => CustomInteractionManager.onceKeyDown(eKey.space, eInteractionEvent.startFreeGame, res))
        )

        await Promise.race(allPromsie)
        parent.removeAllListeners()
        CustomInteractionManager.offKeyDown(eInteractionEvent.startFreeGame)
        this.change()
    }

    async change() {

        GameAudioManager.playAudioMusic('FG_BGM')

        GameSpineManager.clearFreeGameHint()                                        // 清除中獎提示
        FreeGameNumeralManager.clearTitleRoundTimes()                               // 清除數字
        CustomContainerManager.putContainer(eContainerType.fullScreenCover)         // 回收父容器

        await WheelController.getInstance().clearAllWheel()
        await GameSpineManager.playFreeGameUI()
        await WheelController.getInstance().reset(true)

        FreeGameNumeralManager.resetRoundTimes(GameSlotData.NGPlayData.SpinInfo.FGTotalTimes);        // 初始化回合數
        this.context.changeState(eFreeGameState.GameStart);
    }
}

/** 回合開始 */
class FreeGameStart extends GameState {

    async enter() {
        await new Promise<void>((res, rej) =>{
            GameDataRequest.requestFGPlay((data) =>{
                GameSlotData.FGPlayData = data;
                res()
            })
        })
        FreeGameNumeralManager.setCurrentTimes(GameSlotData.FGPlayData.SpinInfo.FGCurrentTimes)
        this.change();
    }

    change() {
        this.context.changeState(eFreeGameState.StartSpin);
    }
}

/** 開始轉輪 */
class FreeGameStartSpin extends GameState {

    private spinInfo: ISSlotSpinInfo;

    async enter() {
        let startCompCount: number = 0
        let startComplete: Promise<void> = new Promise<void>((res) =>{
            EventHandler.on(eEventName.startSpinComp, () =>{
                startCompCount++
                if(startCompCount == posXArr.length){
                    res()
                }
            })
        })

        let allSpin: Promise<void> = WheelController.getInstance().startSpin(window.speed)
        await startComplete

        this.spinInfo = GameSlotData.FGPlayData.SpinInfo
        await this.playPandaJump();
        
        // 等待最少演出時間 或 手動停止演出
        let allPromise: Array<Promise<void>> = new Array<Promise<void>>()
        allPromise.push(Sleep(eWheelConfig.leastSpinTime))
        
        // 註冊接收急停事件  (快速自動時直接急停)
        if(window.speed){
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
        CustomInteractionManager.on('pointerdown', eInteractionEvent.freeGameStartSpinStop, (event) =>{
            event.stopPropagation();
            EventHandler.dispatchEvent({name: eEventName.stopSpinBtn})
        })
        CustomInteractionManager.onKeyDown(eKey.space, eInteractionEvent.freeGameStartSpinStop, ()=>EventHandler.dispatchEvent({name: eEventName.stopSpinBtn}))
        
        await Promise.race(allPromise)
        
        WheelController.getInstance().setResult(this.spinInfo.SymbolResult)
        // WheelController.getInstance().checkListeningWithWinline(this.spinInfo.WinLineInfos)
        WheelController.getInstance().stopWheel()

        await allSpin;
        WheelController.getInstance().setAllWheelStick(false)
        this.change();
    }

    change() {
        this.context.changeState(eFreeGameState.EndSpin);
    }

    exit(){
        CustomInteractionManager.offKeyDown(eInteractionEvent.freeGameStartSpinStop)
        CustomInteractionManager.off('pointerdown', eInteractionEvent.freeGameStartSpinStop);
        EventHandler.removeListener(eEventName.stopSpinBtn)
        EventHandler.removeListener(eEventName.startSpinComp)
    }

    private async playPandaJump(){
        // 判斷有沒有
        if(this.spinInfo.ScreenOutput.length == 0){
            return;
        }

        let posArr: Array<Array<number>> = new Array<Array<number>>()
        this.spinInfo.ScreenOutput.forEach((wheel, wheelIndex) =>{
            wheel.forEach((symbol, symbolIndex) =>{
                (symbol == eSymbolName.WD) && posArr.push([wheelIndex, symbolIndex])
            })
        })

        // 要一次貼出複數的wild，所以先計算每次要貼出的量
        let count: number, multiPosArr: Array<Array<Array<number>>> =  new Array<Array<Array<number>>>()
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

/** 全部轉輪停止 */
class FreeGameEndSpin extends GameState {

    async enter() {
        await Sleep(500);

        // 判斷有沒有贏分
        ((GameSlotData.FGPlayData.SpinInfo.WinType & eWinType.normal) != 0) && await FreeGameLotteryController.getInstance().init();
        // 判斷有沒有加次數
        if((GameSlotData.FGPlayData.SpinInfo.WinType & eWinType.freeGame) != 0){
            // 計算加的次數
            let plus: number = GameSlotData.FGPlayData.SpinInfo.FGTotalTimes - FreeGameNumeralManager.CurrentTotalTimes;
            await FreeGameNumeralManager.playPlusTimeNumber(plus);
            FreeGameNumeralManager.setTotalTimes(GameSlotData.FGPlayData.SpinInfo.FGTotalTimes)
        } 

        this.change();
    }

    async change() {

        LineManager.stopEachLine()

        if(GameSlotData.FGPlayData.SpinInfo.FGRemainTimes == 0){
            this.context.changeState(eFreeGameState.GameEnd)
        }else{
            await Sleep(500)
            this.context.changeState(eFreeGameState.GameStart)
        }   
    }
}

/** 整個 freeGame 結束 */
class FreeGameEnd extends GameState{

    async enter(){
        await Sleep(1000)
        // 撥放贏分提示
        let changeAudio: Promise<void> = new Promise<void>(res => GameAudioManager.playAudioMusic('FGtoNG', false, res))

        let parent = CustomContainerManager.getContainer(eContainerType.fullScreenCover)
        App.stage.addChild(parent)
        await GameSpineManager.playFreeGameWin(parent)
        await FreeGameNumeralManager.playTotalWin(parent, BetModel.getInstance().Win)
        await changeAudio

        this.change();
    }

    async change(){
        GameSpineManager.clearFreeGameWin()
        FreeGameNumeralManager.clearTotalWin();
        CustomContainerManager.putContainer(eContainerType.fullScreenCover)
        FreeGameNumeralManager.clearRoundTimes();
        await GameSpineManager.playBaseGameUI();
        EventHandler.dispatchEvent({name: eEventName.freeGameEnd})
    }
}