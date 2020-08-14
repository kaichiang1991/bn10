import Wheel from "./Wheel";
import { wheelCountArr, eSymbolName, wheelStopOrder } from "./SymbolDef";
import EventHandler, { eEventName } from "../EventHandler";
import { appConfig } from "../../System/Config/GameConfig";
import Debug from "../../Lib/Debug";

export enum eWheelDataType{
    normalGame = 0,
    freeGame_0 = 50,
}

export default class WheelController{

    private static instance: WheelController;
    public static getInstance(): WheelController{
        if(this.instance == null)   this.instance = new WheelController();
        return this.instance
    }

    private wheelArr: Array<Wheel>;
    private stopManualPromise: Promise<void>;
    private WD_symbolCount: number;
    public get WD_SymbolCount(): number { return this.WD_symbolCount}
    private stopManual: boolean;
    public get StopManual(): boolean { return this.stopManual}

    private stopSpeed: boolean;
    public get StopSpeed(): boolean { return this.stopSpeed}

    private stopImmed: boolean;

    /** 初始化滾輪 */
    public async init(){
        this.wheelArr = new Array<Wheel>();
        for(let i = 0; i< wheelCountArr.length; i++){
            this.wheelArr.push(await new Wheel().init(i))
        }
    }

    public async reset(freeGame: boolean = false){
        if(!this.wheelArr){
            Debug.Error('WheelController reset', 'no wheelArr')
            return
        }
        for(let i = 0; i< wheelCountArr.length; i++){
            await this.wheelArr[i].reset(freeGame, i)
        }
    }

    public async clearAllWheel(){
        this.wheelArr.forEach(wheel => wheel.clearWheel())
    }

    /**
     * 初始化滾輪帶
     * @param isFreeGame 是否為 FreeGame
     */
    public setWheelData(type: eWheelDataType = eWheelDataType.normalGame){
        this.wheelArr.forEach((wheel, index) => wheel.setWheelData(appConfig.stripJson[type][index]))
    }
    
    /**
     * 設定滾輪結果
     * @param result 
     */
    public setResult(result: Array<Array<number>>){
        this.wheelArr.forEach((wheel, index) =>{
            wheel.setResult(result[index])
        })
    }

    /** 
     * 檢查是否有聽牌
     */
    public checkListening(result: Array<Array<number>>){
       let bonusCount: number = 0;
       result.forEach((column, index) =>{
           if(index < 2 && column.includes(eSymbolName.WD)){
                bonusCount++;
           }
       })
       if(bonusCount == 2){     // 前兩輪都有bonus
            this.setListening([2])
       }
    }

    /**
     * 利用線獎資訊判斷聽牌
     * 有聽牌symbol，並且在線上
     * @param winlineArr 
     */
    public checkListeningWithWinline(winlineArr: Array<ISSlotWinLineInfo>){
        let specifyWinline: Array<ISSlotWinLineInfo> = winlineArr.filter(winline => winline.SymbolID == eSymbolName.WD)
        if(specifyWinline.length == 0){
            return;
        }

        // 計算winline裡面得獎最多的個數
        this.WD_symbolCount = 0;
        for(let i = 0; i < specifyWinline.length; i++){
            if(specifyWinline[i].SymbolCount > this.WD_symbolCount)   this.WD_symbolCount = specifyWinline[i].SymbolCount
        }

        // 從第三輪開始
        let wheelIndexArr: Array<number> = new Array<number>()
        for(let i = 2; i< this.WD_symbolCount; i++){
            (i < this.wheelArr.length-1) && wheelIndexArr.push(i+1)
        }
        this.setListening(wheelIndexArr)
    }

    /** 
     * 開始spin 全部停止後回傳
     * @param speedUp 是否要加速演出 (autoSpeedSpin)
     */
    public async startSpin(speedUp: boolean){
        this.stopImmed = false
        this.WD_symbolCount = 0;

        // 收到事件通知下一輪停輪
        EventHandler.on(eEventName.stopSpinPerWheel, (context)=>{
            if(context != wheelStopOrder[wheelStopOrder.length - 1]){
                let index: number = wheelStopOrder.indexOf(context)
                this.wheelArr[wheelStopOrder[index+1]].stopSpinNormal()
            } 
        })

        let allSpin: Array<Promise<any>> = new Array<Promise<any>>()
        for(let i = 0; i< wheelCountArr.length; i++){
            allSpin.push(this.wheelArr[i].startSpin(speedUp))
        }

        for(let i = 0; i < wheelCountArr.length; i++){
            let orderedIndex: number = wheelStopOrder[i]

            if(this.wheelArr[orderedIndex].Listening && !speedUp && !this.stopImmed){
                this.wheelArr[orderedIndex].playReelExpectEffect()    
                this.wheelArr[orderedIndex].speedUp()
            }

            await allSpin[orderedIndex]
        }
                
        EventHandler.removeListener(eEventName.stopSpinPerWheel)
        EventHandler.removeListener(eEventName.stopSpinManual)
    }
    
    /**
     * 停止轉輪
     * 如果有設定聽牌，則會同時演出聽牌效果
     * @param speedUp 是否是自動快速停輪
     */
    public async stopWheel(){
        EventHandler.on(eEventName.stopSpinManual, ()=>{
            this.stopAllWheel()
        })

        if(this.stopImmed){
            this.stopAllWheel()
        }else{
            this.stopFirstWheel()
        }
    }

    /** 通知第一輪停輪 */
    private async stopFirstWheel(){
        this.wheelArr[0].stopSpinNormal()
    }
    
    /** 全部停輪 */
    private async stopAllWheel(){
        EventHandler.removeListener(eEventName.stopSpinPerWheel)
        this.wheelArr.forEach(wheel => wheel.stopSpinQuick())
    }

    /** 
     * 設定立刻停止 (快速自動 / 手動停止)
     */
    public setStopImmed(){
        this.stopImmed = true
    }

    /**
     * 設定要聽牌的轉輪
     * @param indexArr 要停止的轉輪陣列
     */
    public setListening(indexArr: Array<number>){
        for(let index of indexArr){
            this.wheelArr[index].setListening()
        }
    }

    /**
     * 設定整輪 stick
     * @param flag 是否stick
     * @param wheelIndex 滾輪 index
     */
    public setWheelStick(flag: boolean, wheelIndex: number){
        for(let i = 0; i < wheelCountArr[wheelIndex]; i++){
            this.wheelArr[wheelIndex].setStick(i, flag)
        }
    }

    /**
     * 設定單條滾輪 stick
     * @param flag 是否 stick
     * @param wheelIndex 滾輪 index
     * @param symbolIndex 第幾個 symbol
     */
    public setSingleStick(flag: boolean, wheelIndex: number, symbolIndex: number){
        this.wheelArr[wheelIndex].setStick(symbolIndex, flag)
    }

    /**
     * 設定特殊符號的 stick
     * @param wheelIndex 
     * @param symbolIndex 
     * @param symbol 
     */
    public setSpecifySingleStick(wheelIndex: number, symbolIndex: number, symbol: number){
        this.wheelArr[wheelIndex].setStick(symbolIndex, true, true, symbol)
    }

    /**
     * 設定全部滾輪的 stick
     * @param flag 
     */
    public setAllWheelStick(flag: boolean){
        this.wheelArr.forEach((wheel, wheelIndex) =>{
            for(let i = 0; i < wheelCountArr[wheelIndex]; i++){
                wheel.setStick(i, flag)
            }
        })
    }

    public async playWinAnimation(wheelIndex: number, symbolIndex: number, times: number = 1){
        await this.wheelArr[wheelIndex].playWinAnimation(symbolIndex, times)
    }

    public async playWinBoxAnimation(lineNo: number, wheelIndex: number, symbolIndex: number){
        await this.wheelArr[wheelIndex].playWinBoxAnimation(symbolIndex, lineNo)
    }

    public clearAllWinBox(clear: boolean = false){
        this.wheelArr.forEach((wheel, index) =>{
            for(let i = 0; i< wheelCountArr[index]; i++){
                wheel.clearWinBox(i, clear)
            }
        })
    }

    public clearAllWinEffect(){
        this.wheelArr && this.wheelArr.forEach((wheel, index) =>{
            for(let i = 0; i< wheelCountArr[index]; i++){
                wheel.clearWinEffect(i)
            }
        })
    }
    public clearWinEffect(wheelIndex: number, symbolIndex: number){
        this.wheelArr[wheelIndex].clearWinEffect(symbolIndex)
    }

    public getWheelRepeatTimes(index: number): number{
        return this.wheelArr[index].RepeatTimes;
    }
}