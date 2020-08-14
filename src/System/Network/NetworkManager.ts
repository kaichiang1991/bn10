import { appConfig } from "../Config/GameConfig";
import { eCommand, eCommandMap } from "./GameDataRequest";
import GameSlotData from "../../Game/GameSlotData/GameSlotData";
import BetModel from "../../Game/BetModel/BetModel";
import EventHandler, { eEventName } from "../../Game/EventHandler";
import SystemErrorManager from "../SystemErrorManager";
import LocalizationManager from "../LocalizationManager";

enum eJoinGameError{
    Success = 0,
    Failed = 1,
    NotReady = 2,
    MismatchGameCode = 3,
    GameDisabled = 4,
    AlreadyInThisGame = 5
}

enum eGameError{
    None = 0,
    IdleForceClose = 1
}

/** 網路層的管理 */
export default class NetworkManager{

    private static instance: NetworkManager;
    public static getInstance(): NetworkManager{
        if(this.instance == null)   this.instance = new NetworkManager();
        return this.instance;
    }

    private websocket: WebSocket;
    private reflash: NodeJS.Timeout;                // client端手動斷線 timeout   ( 目前用不到 )
    private pongTimeOut: NodeJS.Timeout | number;   // 收到pingpong回傳的 timeout

    private callbackArr: Array<Function>;           // 存放每個指令收到後的 callback

    constructor(){
        this.callbackArr = new Array<Function>();
    }

    /** 初始化 */
    public async init(): Promise<void>{

        return new Promise<void>(async (res, rej) =>{

            let connect_url: string = appConfig.connect_url;
            this.websocket = new WebSocket(connect_url);
            
            this.websocket.onopen = ()=> this.onOpen(res)
            this.websocket.onerror = (e)=> this.onError((e) => console.log('websocket error', e))
            this.websocket.onclose = ()=> this.onClose(() => console.log('on clode cb'))
            this.websocket.onmessage = (event) => this.onMsg(event)
        })
    }

    /**
     * 傳送 request
     * @param data 要傳送的資料 (物件)
     * @param callback 
     */
    public sendMsg(data: ICtoGBaseStruct, callback?: Function){

        if(this.websocket == null || this.websocket.readyState == this.websocket.CLOSED || this.websocket.readyState == this.websocket.CLOSING)  return;

        // 將callback儲存起來
        callback && (this.callbackArr[eCommand[data.Code]] = callback)    

        let jsonStr: string = JSON.stringify(data)
        this.websocket.send(jsonStr)
    }

    /** ws 連接成功時 */
    private onOpen(callback?: Function){
        callback && callback();
        this.setPingPong(true);
    }

    /** ws 關閉時 */
    private onClose(callback?: Function){
        let msg: string = LocalizationManager.systemText('ConnectClose')
        SystemErrorManager.showError(msg)
        let dt = new Date()
        console.log('close time', `${dt.getHours()} : ${dt.getMinutes()}`)
        callback && callback();
    }

    /** ws 出現錯誤時 */
    private onError(callback?: Function){
        callback && callback();
    }

    /** 收到 server 回傳資料 */
    private onMsg(event){

        let data: IGtoCBaseStruct = JSON.parse(event.data);

        switch(data.Code){
            case eCommand.GtoCJoinGame:
                switch(data.Result){
                    case eJoinGameError.Success:
                        break;
                    case eJoinGameError.Failed:
                    case eJoinGameError.MismatchGameCode:
                        SystemErrorManager.showError(LocalizationManager.systemText('TokenInvalid'))
                        break;
                    case eJoinGameError.NotReady:
                    case eJoinGameError.GameDisabled:
                    case eJoinGameError.AlreadyInThisGame:
                        this.websocket.close()
                        break;
                    default:
                        console.log('join game default fail', 'result', data.Result)
                        this.websocket.close()
                        break;
                }
                break;
            case eCommand.GtoCSlotInit:
                GameSlotData.setInitData(data as IGtoCSlotInit)
                break;
            case eCommand.GtoCPong:
                this.setPingPong(false)
                break;
            case eCommand.GtoCGameError:    // Server廣播斷線
                switch(data.ErrorReason){
                    case eGameError.None:
                        this.websocket.close();
                        break;
                    case eGameError.IdleForceClose:
                        SystemErrorManager.showError(LocalizationManager.systemText('IdleForceClose'))
                        break;
                }
                break;
            case eCommand.GtoCPlayerBalance:    // Server廣播更新餘額
                BetModel.getInstance().setCredit(data.Balance);
                EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})
                break;
        }

        if(data.Result > 0){    // 有錯誤
            // ToDo 看之後要不要顯示錯誤訊息
            this.websocket.close()
            return;
        }

        let map: string = eCommandMap[eCommand[data.Code]];     // 將收到的response轉成對應的request function
        this.callbackArr[map] && this.callbackArr[map](data)

    }

    /**
     * 每次sendMsg後重新計時，時間到了沒送sendMsg就主動斷線
     * (目前遊戲規則內沒有)
     * @param interval 
     */
    public setCloseConnection(interval: number = appConfig.timeOut){
        if(this.websocket == null)
            return;
        clearTimeout(this.reflash);
        this.reflash = setTimeout(() => {
            console.log('client disconnect.')
            this.websocket.close();
        }, interval);
    }

    /**
     * 設定ping pong的計時
     * @param ping true 是送ping，false 是收到pong
     */
    public setPingPong(ping: boolean){
        if(this.websocket == null)
            return;

        // 設定當pong太久沒回傳時執行的function
        let pongTimeOutFunc: Function = ()=>{
            console.log(`no pong for ${appConfig.pongTimeOut} ms. close ws.`);
            this.websocket.close()
        }

        if(ping){
            this.sendMsg({Code: eCommand.CtoGPing})
            // 計時下一次送ping的時間
            setTimeout(() => {
                this.setPingPong(true)
            }, appConfig.pingTimeInterval);

            if(!this.pongTimeOut){
                this.pongTimeOut = setTimeout(pongTimeOutFunc, appConfig.pongTimeOut);
            }

        }else{
            // 清除timeout並重新設定
            this.pongTimeOut && clearTimeout(this.pongTimeOut as number)
            this.pongTimeOut = setTimeout(pongTimeOutFunc, appConfig.pongTimeOut);
        }
    }
}