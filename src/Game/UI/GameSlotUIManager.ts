import { Sprite, LoaderResource, Text, TextStyle, interaction } from "pixi.js-legacy";
import CustomButton from "./CustomButton";
import { App } from "../../main";
import { eLayer, appConfig } from "../../System/Config/GameConfig";
import EventHandler, { eEventName } from "../EventHandler";
import AssetLoader from "../../System/Assets/AssetLoader";
import BetModel from "../BetModel/BetModel";
import { eGameState } from "../GameProcessControll/GameController";
import { eFreeGameState } from "../GameProcessControll/FreeGameController";
import LocalizationManager, { eLanguage, eLanguageMap } from "../../System/LocalizationManager";
import { TimelineLite, Linear, killTweensOf } from "gsap";
import { numberWithCommas, floatWithCommas, moneyToCredit } from "../../Lib/Math";
import SettingUIManager from "./SettingUIManager";
import CustomInteractionManager, { eKey, eInteractionEvent } from "../../System/Tool/CustomInteractionManager";
import { eWinType } from "../GameSlotData/GameSlotData";
import BetListManager from "./BetListManager";
import { killTween } from "../../Lib/Tool";
import Debug from "../../Lib/Debug";
import { divide } from "number-precision";
import CurrencyManager from "../../System/CurrencyManager";

// 自定義演分格式
export interface IBetWinChange{
    betModel: BetModel,
    duration: number
}

// 控制spinBtn位置上面唯一能打開的符號
enum eSpinBtnSwitch{
    spinBtn,
    spinStopBtn,
    takeMoneyBtn
}

enum ePosIndex{
    spinBtn = 0,
    spinStopBtn = spinBtn,
    takeMoneyBtn = spinBtn,
    addBtn,
    autoSpinBtn = addBtn,
    subBtn,
    autoSpeedBtn = subBtn,
    autoOnBtn,
    autoOffBtn = autoOnBtn,
    betList,
    spinRound,
    
    creditText,
    winText,
    totalBetText,

    roundCode,
    winInfo,
    betLevel,
}

let posDef: Array<Array<number>> = [
    [1210, 296],
    [1210, 191],
    [1210, 400],
    [1210, 475],
    [1210, 551],
    [1210, 297],

    [280, 672],
    [640, 672],
    [1045, 672],

    [150, 707],
    [640, 707],
    [1270, 707]
]

export default class GameSlotUIManager{
    private static instance: GameSlotUIManager;
    public static getInstance(): GameSlotUIManager{
        if(this.instance == null)   this.instance = new GameSlotUIManager();
        return this.instance;
    }

    private spinButton: CustomButton;
    private spinStopButton: CustomButton;
    private takeMoneyButton: CustomButton;

    private autoOnButton: CustomButton;
    private autoOffButton: CustomButton;
    private autoSpinButton: CustomButton;
    private autoSpeedSpinButton: CustomButton;
    private betListButton: CustomButton

    private addBetButton: CustomButton;
    private subBetButton: CustomButton;

    private UI_Base: Sprite;

    private buttons: Array<CustomButton>;
    private texts: Array<Text>;

    private isAuto: boolean;
    public get Auto(): boolean{
        return this.isAuto;
    }
    private speedUp: boolean;
    public get SpeedUp(): boolean{
        return this.speedUp;
    }

    private spinRound: Text;
    private spinRoundNum: number;

    private credit: Text;
    private win: Text;
    private totalBet: Text;
    private round: Text;
    private betLevel: Text;
    private betWinInfo: Text;

    private readonly WIN_CHANGE_UNIT: number = 0.01;
    private readonly MAX_WIN_CHANGE_TIME: number = 20;

    public async initBaseGameSlotUI(){
        this.buttons = new Array<CustomButton>();

        this.spinButton = new CustomButton('spinButton');
        await this.spinButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'SpinStart_00.png', 'SpinStart_01.png', 'SpinStart_02.png', 'SpinStart_03.png', 'SpinStart_04.png');
        this.spinButton.addButtonTo(App.stage, posDef[ePosIndex.spinBtn][0], posDef[ePosIndex.spinBtn][1])
        this.buttons.push(this.spinButton);

        this.spinStopButton = new CustomButton('spinStopButton');
        await this.spinStopButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'SpinStop_00.png', 'SpinStop_01.png', 'SpinStop_02.png', 'SpinStop_03.png', 'SpinStop_04.png');
        this.spinStopButton.addButtonTo(App.stage, posDef[ePosIndex.spinStopBtn][0], posDef[ePosIndex.spinStopBtn][1])
        this.spinStopButton.visible = false;
        this.buttons.push(this.spinStopButton);

        this.takeMoneyButton = new CustomButton('takeMoneyButton');
        await this.takeMoneyButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'TakeWin_00.png', 'TakeWin_01.png', 'TakeWin_02.png', 'TakeWin_03.png', 'TakeWin_04.png');
        this.takeMoneyButton.addButtonTo(App.stage, posDef[ePosIndex.takeMoneyBtn][0], posDef[ePosIndex.takeMoneyBtn][1])
        this.takeMoneyButton.visible = false;
        this.buttons.push(this.takeMoneyButton);

        this.addBetButton = new CustomButton('addBet');
        await this.addBetButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'BetAdd_00.png', 'BetAdd_01.png', 'BetAdd_02.png', 'BetAdd_03.png', 'BetAdd_04.png');
        this.addBetButton.addButtonTo(App.stage, posDef[ePosIndex.addBtn][0], posDef[ePosIndex.addBtn][1])
        this.buttons.push(this.addBetButton);
        
        this.subBetButton = new CustomButton('subBet');
        await this.subBetButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'BetSubside_00.png', 'BetSubside_01.png', 'BetSubside_02.png', 'BetSubside_03.png', 'BetSubside_04.png');
        this.subBetButton.addButtonTo(App.stage, posDef[ePosIndex.subBtn][0], posDef[ePosIndex.subBtn][1])
        this.buttons.push(this.subBetButton);
        
        this.autoOnButton = new CustomButton('autoOn');
        await this.autoOnButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'AutoSpinOpen_00.png', 'AutoSpinOpen_01.png', 'AutoSpinOpen_02.png', 'AutoSpinOpen_03.png', 'AutoSpinOpen_04.png');
        this.autoOnButton.addButtonTo(App.stage, posDef[ePosIndex.autoOnBtn][0], posDef[ePosIndex.autoOnBtn][1])
        this.buttons.push(this.autoOnButton);

        this.autoOffButton = new CustomButton('autoOff');
        await this.autoOffButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'AutoSpinClose_00.png', 'AutoSpinClose_01.png', 'AutoSpinClose_02.png', 'AutoSpinClose_03.png', 'AutoSpinClose_04.png');
        this.autoOffButton.addButtonTo(App.stage, posDef[ePosIndex.autoOffBtn][0], posDef[ePosIndex.autoOffBtn][1])
        this.buttons.push(this.autoOffButton);

        this.autoSpinButton = new CustomButton('autoSpin');
        await this.autoSpinButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'AutoSpin_00.png', 'AutoSpin_01.png', 'AutoSpin_02.png', 'AutoSpin_03.png', 'AutoSpin_04.png');
        this.autoSpinButton.addButtonTo(App.stage, posDef[ePosIndex.autoSpinBtn][0], posDef[ePosIndex.autoSpinBtn][1])
        this.buttons.push(this.autoSpinButton);

        this.autoSpeedSpinButton = new CustomButton('autoSpeedSpin');
        await this.autoSpeedSpinButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'AutoSpeedSpin_00.png', 'AutoSpeedSpin_01.png', 'AutoSpeedSpin_02.png', 'AutoSpeedSpin_03.png', 'AutoSpeedSpin_04.png');
        this.autoSpeedSpinButton.addButtonTo(App.stage, posDef[ePosIndex.autoSpeedBtn][0], posDef[ePosIndex.autoSpeedBtn][1])
        this.buttons.push(this.autoSpeedSpinButton);
        this.speedUp = false;

        this.betListButton = new CustomButton('betListButton');
        await this.betListButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'BetList_00.png', 'BetList_01.png', 'BetList_02.png', 'BetList_03.png', 'BetList_04.png');
        this.betListButton.addButtonTo(App.stage, posDef[ePosIndex.betList][0], posDef[ePosIndex.betList][1])
        this.buttons.push(this.betListButton);

        let res: LoaderResource = await AssetLoader.getAsset(appConfig.assetPrefix + 'img/Button.json');
        let path: string = `UIBase_${eLanguageMap[LocalizationManager.getLanguage()]}.png`
        this.UI_Base = new Sprite(res.textures[path]);
        this.UI_Base.position.set(0, 600)
        this.UI_Base.zIndex = eLayer.UI_bottom;
        this.UI_Base.interactive = true
        
        App.stage.addChild(this.UI_Base);
        
        this.setAutoVisible(false);

        this.buttons.forEach(btn => btn.zIndex = eLayer.UI_bottom)
        this.isAuto = false;

        // text
        this.texts = new Array<Text>();
        let style: TextStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fontWeight: 'bold',
            fill: 'white',
        })

        let style2: TextStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 42,
            fontWeight: 'bold',
            fill: 'white',
        })

        let style3: TextStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 'white',
        })

        let style4: TextStyle = new TextStyle({
            fontFamily: (LocalizationManager.getLanguage() == eLanguage.ENG)? 'Arial' : '微軟正黑體',
            fontWeight: 'bold',
            fontSize: (LocalizationManager.getLanguage() == eLanguage.ENG)? 24 : 22,
            fill: 'white',
        })

        this.spinRound = new Text('', style2)
        this.spinRound.position.set(posDef[ePosIndex.spinRound][0], posDef[ePosIndex.spinRound][1])
        
        this.spinRound.visible = false;
        this.texts.push(this.spinRound)

        this.credit = new Text('0', style)
        this.credit.position.set(posDef[ePosIndex.creditText][0], posDef[ePosIndex.creditText][1])
        this.texts.push(this.credit);
        
        this.win = new Text('0', style)
        this.win.position.set(posDef[ePosIndex.winText][0], posDef[ePosIndex.winText][1])
        this.texts.push(this.win);
        
        this.totalBet = new Text('0', style)
        this.totalBet.position.set(posDef[ePosIndex.totalBetText][0], posDef[ePosIndex.totalBetText][1])
        this.texts.push(this.totalBet);

        this.round = new Text('', style3)
        this.round.position.set(posDef[ePosIndex.roundCode][0], posDef[ePosIndex.roundCode][1])
        this.texts.push(this.round);

        this.betLevel = new Text('Bet Level X5', style4)
        this.betLevel.position.set(posDef[ePosIndex.betLevel][0], posDef[ePosIndex.betLevel][1])
        this.texts.push(this.betLevel);

        this.betWinInfo = new Text('Line 0 Score 0', style4)
        this.betWinInfo.position.set(posDef[ePosIndex.winInfo][0], posDef[ePosIndex.winInfo][1])
        this.texts.push(this.betWinInfo);
        this.activeWinInfo(false)

        this.texts.forEach(text =>{
            App.stage.addChild(text);
            text.zIndex = eLayer.UI;
            text.anchor.set(0.5);
        })

        this.round.anchor.set(0, 0.5)
        this.betLevel.anchor.set(1, 0.5)

        this.onRegisterEvent();
    }

    public activeWinInfo(flag: boolean, winLine: ISSlotWinLineInfo = null){
        if(flag && winLine){
            // 判斷贏分類型
            let type: eWinType = eWinType.none;
            if((winLine.WinType & eWinType.normal) != 0){
                type = eWinType.normal
            }else if((winLine.WinType & eWinType.freeGame) != 0){
                type = eWinType.freeGame
            }else if((winLine.WinType & eWinType.bonusGame) != 0){
                type = eWinType.bonusGame
            }

            this.betWinInfo.visible = true;

            let _text: string = '';  // 最後要顯示的文字
            let winMoneyOrg: number, winMoney: number, winOrgStr: string, winStr: string;
            let showMoney: boolean = SettingUIManager.getInstance().UseMoney

            // ToDo 視遊戲決定顯示內容
            // 根據贏分類型顯示 winInfo 
            switch(type){
                case eWinType.normal:
                    winMoney = divide(winLine.Win, appConfig.MoneyFractionMultiple)
                    // 判斷顯示 分數 / 錢
                    if(showMoney){
                        winStr = `${CurrencyManager.getCurrencySymbol()}${floatWithCommas(winMoney)}`
                    }else{
                        winStr = numberWithCommas(moneyToCredit(winMoney)).split('.')[0];
                    }
                     // Line Game
                    _text = `${LocalizationManager.gameText('Line')} ${winLine.LineNo} ${LocalizationManager.gameText('GetWin')} ${winStr}`

                    break;

                case eWinType.freeGame:
                break;

                case eWinType.bonusGame:
                    // _text = '恭喜獲得bonus Game'
                break;
            }

            this.betWinInfo.visible = true;
            this.betWinInfo.text = _text;
        }else{
            this.betWinInfo.visible = false;
        }
    }

    /**
     * 設定是否要auto
     * @param flag 
     * @param speed 是否要加速
     */
    public setAutoActive(flag: boolean, speed?: boolean){
        this.isAuto = flag;
        this.speedUp = speed;
        this.spinRound.visible = flag;
        if(flag){
            this.spinRoundNum = 1;
            this.showSpinRoundText()
            this.takeMoneyButton.visible = false;
            EventHandler.dispatchEvent({name: eEventName.startSpin})
        }
    }

    private onRegisterEvent(){
 
        // 遊戲狀態的事件註冊
        EventHandler.on(eEventName.gameStateChange, (context) =>{
            // console.log('game state change:', context)
            Debug.WriteLog('process', context)
            switch(context){
                case eGameState.GameStart:
                    // 判斷要不要取消stopSpin按鈕
                    if(this.isAuto){
                        this.addSpinRoundNum()
                        this.setSpinVisible(false)
                    }else{
                        this.setSpinVisible(true)
                        SettingUIManager.getInstance().setButtonInteractive(true)
                    }
                    break;

                case eGameState.StartSpin:
                    this.setSpinVisible(false)
                    SettingUIManager.getInstance().setButtonInteractive(false);
                    break;

                case eGameState.TakeMoney:
                    SettingUIManager.getInstance().activeSettingButton(true)
                    SettingUIManager.getInstance().setButtonInteractive(false)
                    if(!this.isAuto){
                        this.spinRound.visible = false;
                        (BetModel.getInstance().Win > 0) && this.switchSpinBtn(eSpinBtnSwitch.takeMoneyBtn)
                        // 註冊按鍵事件
                        CustomInteractionManager.onceKeyDown(eKey.space, eInteractionEvent.takeMoney, ()=>{
                            EventHandler.dispatchEvent({name: eEventName.takeMoney})
                            this.takeMoneyButton.visible = false;
                        })
                    }
                    break;

                case eFreeGameState.GameInit:
                    this.setAllButtonDisplay(false)
                    this.spinRound.visible = false;
                    SettingUIManager.getInstance().activeSettingButton(false)
                    break;

                }
        })

        // 按鍵事件註冊
        this.spinButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            EventHandler.dispatchEvent({name: eEventName.startSpin})
        })

        this.spinStopButton.on('pointertap', (event) => {
            EventHandler.dispatchEvent({name: eEventName.stopSpinBtn})
            if(this.isAuto){
                this.setAutoActive(false)
            }
        })
        
        this.takeMoneyButton.on('pointertap', (event: PIXI.interaction.InteractionEvent) =>{
            EventHandler.dispatchEvent({name: eEventName.takeMoney})
            this.takeMoneyButton.visible = false;
        })

        let betChange: Function = (flag: boolean) =>{
            let betModel: BetModel = BetModel.getInstance();
            flag? betModel.addBet(): betModel.subBet();

            let dispatchBetModel: BetModel = betModel.getDispatchObject();
            EventHandler.dispatchEvent({name: eEventName.betModelChange, context: dispatchBetModel})

        }

        this.addBetButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            betChange(true)
        })

        this.subBetButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            betChange(false)
        })

        EventHandler.on(eEventName.moneyCreditChange, ()=> this.betModelDisplay(BetModel.getInstance().getDispatchObject()))
        EventHandler.on(eEventName.betModelChange, (context: BetModel) => this.betModelDisplay(context))

        EventHandler.on(eEventName.betWinChangeAnim, async (context: IBetWinChange)=>{
            await this.playBetWinChange(context.betModel, context.duration)
            EventHandler.dispatchEvent({name: eEventName.betWinChangeDone})
        })

        this.autoOnButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            this.setAutoVisible(true);
        })

        this.autoOffButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            this.setAutoVisible(false);
        })

        this.autoSpinButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            this.setSpinVisible(false)
            this.setAutoActive(true, false)
        })

        this.autoSpeedSpinButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            this.setSpinVisible(false)
            this.setAutoActive(true, true)
        })

        this.betListButton.on('pointertap', (event: PIXI.interaction.InteractionEvent)=>{
            event.stopPropagation();
            BetListManager.activeBetList(true)
        })
    }

    private setAllButtonDisplay(flag: boolean){
        this.spinButton.visible = this.spinStopButton.visible = this.takeMoneyButton.visible = 
        this.addBetButton.visible = this.subBetButton.visible = this.autoOnButton.visible = this.autoOffButton.visible =
        this.autoSpinButton.visible = this.autoSpeedSpinButton.visible = this.betListButton.visible = flag
    }

    private betModelDisplay(betModel: BetModel){

        let _credit: number, _win: number, _totalBet: number;

        _credit = divide(betModel.Credit, appConfig.MoneyFractionMultiple)
        _win = divide(betModel.Win, appConfig.MoneyFractionMultiple)
        _totalBet = divide(betModel.TotalBet, appConfig.MoneyFractionMultiple)

        if(SettingUIManager.getInstance().UseMoney){
            this.credit.text = `${CurrencyManager.getCurrencySymbol()}${floatWithCommas(_credit)}`
            this.win.text = `${CurrencyManager.getCurrencySymbol()}${floatWithCommas(_win)}`
            this.totalBet.text = `${CurrencyManager.getCurrencySymbol()}${floatWithCommas(_totalBet)}`
        }else{
            this.credit.text = numberWithCommas(moneyToCredit(_credit));
            this.win.text = numberWithCommas(moneyToCredit(_win)).split('.')[0];        // 只取整數部分演出
            this.totalBet.text = numberWithCommas(moneyToCredit(_totalBet));
        }

        betModel.RoundID && (this.round.text = `${betModel.RoundID}`)
        this.betLevel.text = `${LocalizationManager.gameText('BetLevelTitle')} X${betModel.Bet}`
    }

    private async playBetWinChange(betModel: BetModel, duration: number): Promise<void>{
        
        return new Promise<void>((res, rej) =>{

            let t1: TimelineLite = new TimelineLite()
            .fromTo(betModel, duration, {win: betModel.PreWin}, {win: betModel.Win, ease: Linear.easeInOut})

            let jumpToEnd: Function = ()=>{
                t1.progress(1, false)
            }

            CustomInteractionManager.once('pointerdown', eInteractionEvent.skipBetWinChange, jumpToEnd)
            CustomInteractionManager.onceKeyDown(eKey.space, eInteractionEvent.skipBetWinChange, jumpToEnd)
            EventHandler.once(eEventName.stopSpinBtn, jumpToEnd)

            t1.eventCallback('onUpdate', ()=>{
                this.betModelDisplay(betModel)
            })

            t1.eventCallback('onComplete', ()=>{
                EventHandler.removeListener(eEventName.stopSpinBtn)
                CustomInteractionManager.off('pointerdown', eInteractionEvent.skipBetWinChange)
                CustomInteractionManager.offKeyDown(eInteractionEvent.skipBetWinChange)
                res();
            })
        })
    }

    /** 
     * 設定spin按鍵可不可見 
     * @param flag 是否打開spin按鍵
     * true 打開spin 回到預設的畫面 (不是auto選單)
     * false 打開stopSpin 關閉其他按鍵
     */
    private setSpinVisible(flag: boolean){
        this.switchSpinBtn(flag? eSpinBtnSwitch.spinBtn: eSpinBtnSwitch.spinStopBtn)
        if(flag){
            this.addBetButton.visible = this.subBetButton.visible = this.autoOnButton.visible = this.betListButton.visible = flag;
        }else{
            this.addBetButton.visible = this.subBetButton.visible = this.autoOnButton.visible = this.autoOffButton.visible = this.autoSpinButton.visible = this.autoSpeedSpinButton.visible = this.betListButton.visible = flag;
        }
    }

    private setAutoVisible(flag: boolean){
        this.autoOnButton.visible = !flag;
        this.autoOffButton.visible = flag;

        this.addBetButton.visible = this.subBetButton.visible = !flag;
        this.autoSpinButton.visible = this.autoSpeedSpinButton.visible = flag;
    }

    private addSpinRoundNum(){
        this.spinRoundNum++;
        this.showSpinRoundText()
        this.spinRound.visible = true
    }

    /** 根據數字調整顯示 */
    private showSpinRoundText(){
        if(this.spinRoundNum > 9999){
            this.spinRound.text = '9999+';
            this.spinRound.style.fontSize = 14
        }else if(this.spinRoundNum > 999){
            this.spinRound.text = `${this.spinRoundNum}`
            this.spinRound.style.fontSize = 20
        }else if(this.spinRoundNum > 99){
            this.spinRound.text = `${this.spinRoundNum}`
            this.spinRound.style.fontSize = 27
        }else{
            this.spinRound.text = `${this.spinRoundNum}`
            this.spinRound.style.fontSize = 36
        }
    }

    /** 
     * 切換spin btn位置上的按鍵
     * @param type 要顯示的按鍵類型
     */
    private switchSpinBtn(type: eSpinBtnSwitch){
        // 先關掉所有在spinBtn位置上的按鍵
        this.spinButton.visible = this.spinStopButton.visible = this.takeMoneyButton.visible = false;
        // 打開指定的btn
        let btn: CustomButton;
        switch(type){
            case eSpinBtnSwitch.spinBtn:
                btn = this.spinButton;
                break;
            case eSpinBtnSwitch.spinStopBtn:
                btn = this.spinStopButton;
                break;
            case eSpinBtnSwitch.takeMoneyBtn:
                btn = this.takeMoneyButton;
                break;
        }
        btn && (btn.visible = true);
    }
}