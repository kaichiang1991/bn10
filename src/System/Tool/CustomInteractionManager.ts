import { Container, Rectangle, Circle, Graphics } from "pixi.js-legacy";
import { App } from "../../main";

/** 自定義的互動事件名稱 */
export enum eInteractionEvent{
    startSpin,                      
    startSpinStop,
    skipAllLineAnim,

    startFreeGame,
    freeGameStartSpinStop,

    skipBigWin,
    skipWinLine,
    takeMoney,

    skipBetWinChange,
}

export enum eKey{
    space = ' '
}

/** 自定義的互動事件 ( 盤面上的點擊 / 鍵盤點擊 ) */
export default class CustomInteractionManager{

    private static container: Container;
    private static eventMap: Object;
    private static keyboardEventMap: Object;

    /**
     * 初始化客製按鍵
     * @param parent 
     */
    public static init(parent: Container){

        this.container = new Container()
        // 設定可以點擊的範圍
        this.container.hitArea = new Rectangle(210, 102, 867, 487)
        this.container.interactive = true
        parent.addChild(this.container)
        
        // 儲存事件，以便之後消除
        this.eventMap = new Object();
        this.keyboardEventMap = new Object();
    }

    /**
     * 註冊事件
     * @param event 事件名稱
     * @param callbackEvent 指定的函式名稱 (之後用來刪除事件)
     * @param callback 
     */
    public static on(event: string, callbackEvent: eInteractionEvent, callback: Function){
        if(!this.eventMap || !this.container)
            return
         // 將function存起來
        this.eventMap[callbackEvent] = callback;
        this.container.on(event, callback);
    }

    public static once(event: string, callbackEvent: eInteractionEvent, callback: Function){
        if(!this.eventMap || !this.container)
            return  
        this.eventMap[callbackEvent] = callback;
        this.container.once(event, callback);
    }

    /**
     * 移除事件
     * @param event 事件名稱
     * @param callbackEvent 指定的函式名稱
     */
    public static off(event: string, callbackEvent: eInteractionEvent){
        if(!this.eventMap || !this.container)
            return
        this.container.off(event, this.eventMap[callbackEvent])
    }

    /** 
     * 測試用，可以停止並等待點擊畫面繼續
     * @example
     *      await touchAndContinue()
     */
    public static async touchAndContinue(): Promise<void>{
        return new Promise<void>((res, rej) =>{
            App.stage.once('pointerdown', res)
        })
    }

    /**
     * 註冊鍵盤事件
     * @param key 按鍵名稱
     * @param callbackEvent 事件名稱
     * @param callback 按下去後的callback
     */
    public static onKeyDown(key: eKey, callbackEvent: eInteractionEvent, callback: Function){
        if(!this.keyboardEventMap)
            return
        this.keyboardEventMap[callbackEvent] = (e: KeyboardEvent) =>{
            if(e.key != key)    return;
            callback()
        }
        window.addEventListener('keydown', this.keyboardEventMap[callbackEvent])
    }

    public static onceKeyDown(key: eKey, callbackEvent: eInteractionEvent, callback: Function){ 
        if(!this.keyboardEventMap)
            return
        this.keyboardEventMap[callbackEvent] = (e: KeyboardEvent) =>{
            if(e.key != key)    return;
            callback()
            this.offKeyDown(callbackEvent)
        }
        window.addEventListener('keydown', this.keyboardEventMap[callbackEvent])
    }

    /**
     * 取消鍵盤按鍵事件
     * @param callbackEvent 事件名稱
     */
    public static offKeyDown(callbackEvent: eInteractionEvent){
        if(!this.keyboardEventMap)
            return
        window.removeEventListener('keydown', this.keyboardEventMap[callbackEvent])
    }

    /** 清除所有按鍵事件 */
    public static removeAllKeyDownEvent(){
        if(!this.keyboardEventMap)
            return
        Object.values(this.keyboardEventMap).forEach(event => {
            window.removeEventListener('keydown', event)
        })
    }}