import { appConfig } from "../../System/Config/GameConfig";
import Debug from "../../Lib/Debug";

/** 管理金額 */
export default class BetModel{

    private static instance: BetModel;
    public static getInstance(): BetModel{
        if(this.instance == null)   this.instance = new BetModel();
        return this.instance;
    }

    private bet: number;
    public get Bet(): number{ return this.bet }
    private betInterval: Array<number>;
    public get BetInterval(): Array<number> {return this.betInterval.slice(0)}
    private betIndex: number;
    private betUnit: number;        // 基本押注
    public get BetUnit(): number {return this.betUnit}

    private credit: number;
    public get Credit(): number {return this.credit}
    private win: number;
    public get Win(): number {return this.win}
    private preWin: number;     // 上一次win的分數紀錄 (用來演分)
    public get PreWin(): number {return this.preWin}
    private roundID: string;
    public get RoundID(): string {return this.roundID}
    private totalBet: number
    public get TotalBet(): number {return this.totalBet}

    /**
     * 取得可派送的物件
     * 回傳的物件不能修改
     */
    public getDispatchObject(): BetModel{
        let model: BetModel = new BetModel();
        model.bet = BetModel.getInstance().bet;
        model.credit = BetModel.getInstance().credit;
        model.win = BetModel.getInstance().win;
        model.preWin = BetModel.getInstance().preWin;
        model.betUnit = BetModel.getInstance().betUnit;
        model.roundID = BetModel.getInstance().RoundID;
        model.totalBet = BetModel.getInstance().totalBet;

        return model;
    }

    /** 增加押注額 (循環) */
    public addBet(){
        if(this.betIndex < this.betInterval.length - 1){
            this.betIndex++;
        }else{
            this.betIndex = 0;
        }
        this.bet = this.betInterval[this.betIndex]
        this.setTotalBet()
    }
    
    /** 減少押注額 (循環) */
    public subBet(){
        if(this.betIndex > 0){
            this.betIndex--;
        }else{
            this.betIndex = this.betInterval.length - 1;
        }
        this.bet = this.betInterval[this.betIndex]
        this.setTotalBet()
    }

    public setBet(index: number){
        if(index > this.betInterval.length - 1){
            Debug.Warn('setBet', 'more than interval', index)
            return
        }
        this.betIndex = index;
        this.bet = this.betInterval[this.betIndex]
        this.setTotalBet()
    }  
    /**
     * 設定 bet 基本單位
     * @param value 
     */
    public setBetUnit(value: number){
        this.betUnit = value;
    }

    /**
     * 設定玩家 credit
     * @param value 
     */
    public setCredit(value: number){
        this.credit = value;
    }

    /** 增加贏分 */
    public addWin(value: number){
        this.preWin = this.win;
        this.win += value;
        return this.win
    }
    
    /** 設定贏分 */
    public setWin(value: number){
        this.win = value;
        if(value == 0){
            this.preWin = 0;
        }
    }

    /**
     * 設定押注區間
     * @param arr 押注區間的陣列
     * @param index 
     */
    public setBetInterval(arr: Array<number>, index: number = 0){
        this.betInterval = arr.slice(0);
        this.betIndex = index;
        this.bet = this.betInterval[this.betIndex]
        this.setTotalBet()

    }

    /**
     * 設定 round id
     * @param id 
     */
    public setRoundID(id: string){
        this.roundID = id;
    }

    public startSpin(){
        this.credit -= this.totalBet
    }
    
    private setTotalBet(){
        this.totalBet = this.bet * this.betUnit * appConfig.Line
    }
}