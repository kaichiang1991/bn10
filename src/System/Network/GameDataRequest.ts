import NetworkManager from "./NetworkManager";
import { appConfig } from "../Config/GameConfig";

// 命令對應的enum
export enum eCommand{

    CtoGPing = -1,
    GtoCPong = -2,
    
    GtoCGameError = 1001,

    CtoGJoinGame = 1002,
    GtoCJoinGame = 1005,

    GtoCPlayerBalance = 1011,

    GtoCSlotInit = 11001,

    CtoGSlotNGPlay = 11002,
    GtoCSlotNGPlay = 11003,

    CtoGSlotFGPlay = 11008,
    GtoCSlotFGPlay = 11009,

    CtoGSlotRoundEnd = 11010,
    GtoCSlotRoundEnd = 11011,
}

// 收到事件後對應的命令
export enum eCommandMap{
    GtoCJoinGame = 'CtoGJoinGame',
    GtoCSlotNGPlay = 'CtoGSlotNGPlay',
    GtoCSlotRoundEnd = 'CtoGSlotRoundEnd',
    GtoCSlotFGPlay = 'CtoGSlotFGPlay'
}

/** 處理與 server 之間的溝通 */
export default class GameDataRequest{

    /**
     * 傳送 request
     * @param data 要傳送的物件
     * @param callback 收到對應的回傳後要執行的callback
     */
    private static requestData(data: ICtoGBaseStruct, callback?: Function){
        NetworkManager.getInstance().sendMsg(data, callback)
    }

    /**
     * 傳送 JoinGame 請求
     * @param token 遊戲token
     * @param gameId GameID
     * @param callback 
     */
    public static requestJoinGame(token: string, gameId: number, callback: Function){
        let data: ICtoGJoinGame = {
            Code: eCommand.CtoGJoinGame,
            GameToken: token,
            GameID: gameId,
            DemoOn: appConfig.DemoMode
        }
        this.requestData(data, callback)
    }

    /**
     * 傳送 NG play 請求
     * @param bet 壓注倍率
     * @param callback 
     */
    public static requestNGPlay(bet: number, callback: Function){
        let data: ICtoGNGPlay = {
            Code: eCommand.CtoGSlotNGPlay,
            BetMultiple: bet
        }
        this.requestData(data, callback)
    }

    /**
     * 傳送 FG play 請求
     * @param callback 
     */
    public static requestFGPlay(callback: Function){
        let data: ICtoGFGPlay = {
            Code: eCommand.CtoGSlotFGPlay,
        }
        this.requestData(data, callback)
    }

    /**
     * 傳送 round end 請求 ( 將結果寫回 server )
     * @param callback 
     */
    public static requestRoundEnd(callback: Function){
        let data: ICtoGRoundEnd = {
            Code: eCommand.CtoGSlotRoundEnd,
        }
        this.requestData(data, callback)
    }
}