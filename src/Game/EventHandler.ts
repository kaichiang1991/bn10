export enum eEventName{
    
    gameStateChange     = 'gameStateChange',    // 遊戲狀態改變

    setMusicVolume      = 'setMusicVolume',     // 改變遊戲音樂音量
    setEffectVolume     = 'setEffectVolume',    // 改變遊戲音效音量
    
    startSpin           = 'startSpin',
    startSpinComp       = 'startSpinComp',      // 開始轉輪確定建立後
    stopSpinBtn         = 'stopSpinBtn',        // 點擊停止spin按鍵
    stopSpinPerWheel    = 'stopSpinPerWheel',
    stopSpinManual      = 'stopSpinManual',

    betModelChange      = 'betModelChange',
    betWinChangeAnim    = 'betWinChangeAnim',
    betWinChangeDone    = 'betWinChangeDone',   // 跑完得獎分數

    skipAllLineAnim     = 'skipAllLineAnim',    // 跳過全線獎
    lotteryEnd          = 'lotteryEnd',         // 得獎流程完成
    takeMoney           = 'takeMoney',

    freeGameEnd         = 'freeGameEnd',        // 免費遊戲結束

    startBigWin         = 'startBigWin',
    endBigWin           = 'endBigWin',
    bigWinNumberEnd     = 'bigWinNumberEnd',

    moneyCreditChange   = 'moneyCreditChange',  // 顯示分數和錢的轉換

}

export interface ICustomEvent{
    name: string,
    context?: Object
}

/** 處理自定義事件 */
export default class EventHandler{

    private static eventEmitter: PIXI.utils.EventEmitter;

    public static init(){
        this.eventEmitter = new PIXI.utils.EventEmitter();
    }

    public static dispatchEvent(event: ICustomEvent){
        this.eventEmitter.emit(event.name, event.context);
    }
    
    public static on(name: string, callback: Function){
        this.eventEmitter.on(name, (data)=>callback(data))
    }

    public static once(name: string, callback: Function){
        this.eventEmitter.once(name, (data) => callback(data))
    }

    public static removeListener(name: string){
        this.eventEmitter.removeListener(name)
    }

    public static removeAllListeners(){
        this.eventEmitter.removeAllListeners();
    }
}