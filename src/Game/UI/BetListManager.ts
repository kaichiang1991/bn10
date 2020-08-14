import { Container, LoaderResource, Sprite, Text, TextStyle, Graphics } from "pixi.js-legacy";
import AssetLoader from "../../System/Assets/AssetLoader";
import { appConfig, eLayer } from "../../System/Config/GameConfig";
import LocalizationManager, { eLanguageMap, eLanguage } from "../../System/LocalizationManager";
import CustomButton from "./CustomButton";
import { App } from "../../main";
import { TimelineLite } from "gsap";
import { killTween } from "../../Lib/Tool";
import { numberWithCommas, moneyToCredit, floatWithCommas } from "../../Lib/Math";
import EventHandler, { eEventName } from "../EventHandler";
import GameSlotUIManager from "./GameSlotUIManager";
import BetModel from "../BetModel/BetModel";
import CustomContainerManager, { eContainerType } from "../../System/Tool/CustomContainerManager";
import SettingUIManager from "./SettingUIManager";
import CurrencyManager from "../../System/CurrencyManager";

let posXDef: Array<number> = [-200, -100, 0, 100, 200]
let posYDef: Array<number> = [-56, 5, 66, 127]

// let pos3RowDef: Array<Array<number>> = [
//     [-200, -56],
//     [-100, -56],
//     [0   , -56],
//     [100 , -56],
//     [200 , -56],

//     [-200, 5],
//     [-100, 5],
//     [   0, 5],
//     [100 , 5],
//     [200 , 5],

//     [-200, 66],
//     [-100, 66],
//     [   0, 66],
//     [100 , 66],
//     [200 , 66],

//     [-200, 127],
//     [-100, 127],
//     [   0, 127],
//     [100 , 127],
//     [200 , 127],
// ]

// let pos2RowDef: Array<Array<number>> = [
//     [-200, -15],
//     [-100, -15],
//     [0  ,  -15],
//     [100,  -15],
//     [200,  -15],

//     [-200, 55],
//     [-100, 55],
//     [   0, 55],
//     [100 , 55],
//     [200 , 55],
// ]

// let isTwoRow: boolean;

let textStyle: TextStyle = new TextStyle({
    fontFamily:'Arial',
    fontWeight: 'bold',
    fontSize: 26,
    fill: 'white', 
})

export default class BetListManager{

    private static listUI: Sprite;
    private static black: Container;
    private static cancelBtn: CustomButton
    private static betUnitArr: Array<BetListUnit>;
    private static isMoving: boolean
    private static isActive: boolean;
    public static get IsActive(): boolean {return this.isActive}

    /** 初始化 BetList ( 一開始呼叫 ) */
    public static async init(){

        // 初始化底圖
        let res: LoaderResource = await AssetLoader.getAsset(appConfig.assetPrefix + 'img/Button.json');
        this.listUI = new Sprite(res.textures['BetListUI.png']);
        this.listUI.position.set(617, 318)
        this.listUI.anchor.set(.5)
        // 防止點到下層的 black
        this.listUI.interactive = true      
        this.listUI.on('pointerdown', (event)=>{
            event.stopPropagation()
        })

        // 投注等級 文字
        let text: Text = new Text(LocalizationManager.gameText('BetLevelTitle'), textStyle)
        text.anchor.set(.5)
        text.position.set(0, -150)
        this.listUI.addChild(text)

        // 取消
        this.cancelBtn = new CustomButton('cancelBtn')
        await this.cancelBtn.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'InstructionPage_Close_00.png', 'InstructionPage_Close_01.png', 'InstructionPage_Close_02.png');
        this.cancelBtn.scale.set(.6)

        this.betUnitArr = new Array<BetListUnit>()
        for(let i = 0; i< BetModel.getInstance().BetInterval.length; i++){
            this.betUnitArr.push(await new BetListUnit('unit').initBetListUnit(this.listUI, i))
        }

        this.isActive = this.isMoving = false
    }

    /**
     * 開關betList
     * @param flag 
     */
    public static activeBetList(flag: boolean){

        if(this.isMoving)       // 避免移動中點擊
            return

        this.isActive = flag
        
        if(flag){
            this.isMoving = true
            this.black = CustomContainerManager.getContainer(eContainerType.blackFullScreen)
            
            // 取消按鈕
            this.cancelBtn.addButtonTo(this.listUI, 305, -150, this.activeBetList.bind(this, false))
            // betUnit
            this.betUnitArr.forEach(betUnit => betUnit.showText())
            // black
            this.black.on('pointerdown' , this.activeBetList.bind(this, false))

            this.black.addChild(this.listUI)
            App.stage.addChild(this.black)

            let t1: TimelineLite = new TimelineLite()
            .fromTo(this.listUI, .3, {y: 0}, {y: this.listUI.y})
            t1.eventCallback('onComplete', ()=>{
                killTween(t1)
                this.isMoving = false
            })
        }else{
            this.cancelBtn.removeAllListeners()
            this.black.removeChildren()
            CustomContainerManager.putContainer(eContainerType.blackFullScreen)
        }
    }
}

class BetListUnit extends CustomButton{

    private index: number;
    private betText: Text;

    /**
     * 初始化 betUnit
     * @param parent 父節點
     * @param index 第幾個betUnit
     */
    public async initBetListUnit(parent: Container, index: number): Promise<BetListUnit>{
        
        let pos: Array<number> = [posXDef[index % posXDef.length], posYDef[Math.floor(index / posXDef.length)]]
        await this.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'BetListButton_00.png', 'BetListButton_01.png', 'BetListButton_02.png');
        this.addButtonTo(parent, pos[0], pos[1])

        this.betText = new Text(`0`, textStyle)
        this.betText.position.set(0, -3)            // 底圖有位移，將文字對準
        this.betText.anchor.set(.5)
        this.betText.style.fontSize = 20
        this.addChild(this.betText)

        this.index = index
        this.onRegisterEvent()
        return this
    }

    /** 顯示上面的文字 */
    public showText(){
        let betValue: number = BetModel.getInstance().BetInterval[this.index] * BetModel.getInstance().BetUnit * appConfig.Line / appConfig.MoneyFractionMultiple
        this.betText.text = SettingUIManager.getInstance().UseMoney? `${floatWithCommas(betValue)}`: `${numberWithCommas(moneyToCredit(betValue))}`
    }

    /** 註冊點擊事件 */
    private onRegisterEvent(){
        this.on('pointertap', ()=>{
            BetModel.getInstance().setBet(this.index)
            EventHandler.dispatchEvent({name: eEventName.betModelChange, context: BetModel.getInstance().getDispatchObject()})
            BetListManager.activeBetList(false)
        })
    }
}