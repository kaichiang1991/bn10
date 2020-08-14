import { appConfig } from "../../System/Config/GameConfig";

export enum eWinType{
    none = 0,
    normal = 0x01,
    freeGame = 0x02,
    bonusGame = 0x04,
    feature = 0x08
}

/** 儲存 / 處理 從 server 送的資料 */
export default class GameSlotData{

    public static SlotInitData: IGtoCSlotInit;
    public static JoinGameData: IGtoCJoinGame;

    public static NGPlayData: IGtoCNGPlay;
    public static FGPlayData: IGtoCFGPlay;

    public static setInitData(data: IGtoCSlotInit){
        this.SlotInitData = data;

        appConfig.MoneyFractionMultiple = data.MoneyFractionMultiple;
        appConfig.Denom = data.Denom;
        appConfig.Line = data.Line;        
    }

    public static printAll(){
        console.log('slot init', this.SlotInitData)
        console.log('join game', this.JoinGameData)
        console.log('NgGame', this.NGPlayData)
        console.log('freeGame', this.FGPlayData)
    }
}