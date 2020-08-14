import CustomButton from "./CustomButton";
import { App } from "../../main";
import { eLayer, appConfig } from "../../System/Config/GameConfig";
import { Container, LoaderResource, Sprite, NineSlicePlane, Graphics } from "pixi.js-legacy";
import AssetLoader from "../../System/Assets/AssetLoader";
import { TimelineLite } from "gsap";
import GameInfoManager from "./GameInfoManager";
import GameAudioManager from "../../System/Assets/Audio/GameAudioManager";
import { gameUrlParameter } from "../../System/Network/urlParser";
import LocalizationManager from "../../System/LocalizationManager";
import Debug from "../../Lib/Debug";
import CustomContainerManager, { eContainerType } from "../../System/Tool/CustomContainerManager";
import { killTween } from "../../Lib/Tool";
import EventHandler, { eEventName } from "../EventHandler";

enum eSettingPosIndex{
    menuOpen = 0,
    menuClose = menuOpen,
    instruction,
    soundOpen,
    soundClose = soundOpen,
    useMoney,
    useCredit = useMoney,
    history,
    leave
}

enum eSettingLayer{
    base,
    button
}

let eSettingPosDef: Array<Array<number>> = [
    [68, 660],
    [68, 546],
    [68, 432],
    [68, 318],
    [68, 204],
    [68, 90],
]

export default class SettingUIManager{
    
    private static instance: SettingUIManager;
    public static getInstance(): SettingUIManager{
        if(this.instance == null)   this.instance = new SettingUIManager();
        return this.instance;
    }

    private isMoving: boolean;
    private isActive: boolean;
    public get IsActive(): boolean {return this.isActive}

    private menuOpenButton: CustomButton;
    private menuCloseButton: CustomButton;
    private instructionButton: CustomButton;
    private soundOpenButton: CustomButton;
    private soundCloseButton: CustomButton;
    private useMoneyButton: CustomButton
    private useCreditButton: CustomButton
    private historyButton: CustomButton;
    private exitButton: CustomButton;

    private isUseMoney: boolean
    public get UseMoney(): boolean {return this.isUseMoney}

    private buttonCount: number;
    private buttonArr: Array<CustomButton>;

    private settingContainer: Container;
    private black: Container;

    private readonly baseHeight: Array<number> = [352, 466, 580, 694]

    private musicOn: boolean;
    public get MusicOn(): boolean {return this.musicOn}

    public async init(){

        this.menuOpenButton = new CustomButton('menuOpenButton');
        await this.menuOpenButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'MenuOpen_00.png', 'MenuOpen_01.png', 'MenuOpen_02.png', 'MenuOpen_03.png');
        this.menuOpenButton.zIndex = eLayer.UI;

        // 防止點到下層
        this.settingContainer = new Container()
        this.settingContainer.interactive = true
        this.settingContainer.sortableChildren = true
        this.settingContainer.on('pointerdown', (event)=>{
            event.stopPropagation()
        })

        // 依照按鍵的index來排按鍵的位置
        let buttonIndex: number = 0;
        this.menuCloseButton = new CustomButton('menuCloseButton');
        await this.menuCloseButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'MenuClose_00.png', 'MenuClose_01.png', 'MenuClose_02.png', 'MenuClose_03.png');
        this.menuCloseButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.menuCloseButton.zIndex = eSettingLayer.button
        buttonIndex++;

        this.instructionButton = new CustomButton('instructionButton');
        await this.instructionButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'InstructionPage_00.png', 'InstructionPage_01.png', 'InstructionPage_02.png', 'InstructionPage_03.png');
        this.instructionButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.instructionButton.zIndex = eSettingLayer.button
        buttonIndex++;

        this.soundOpenButton = new CustomButton('soundOpenButton');
        await this.soundOpenButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'SoundOpen_00.png', 'SoundOpen_01.png', 'SoundOpen_02.png', 'SoundOpen_03.png');
        this.soundOpenButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.soundOpenButton.zIndex = eSettingLayer.button

        this.soundCloseButton = new CustomButton('soundCloseButton');
        await this.soundCloseButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'SoundClose_00.png', 'SoundClose_01.png', 'SoundClose_02.png', 'SoundClose_03.png');
        this.soundCloseButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.soundCloseButton.zIndex = eSettingLayer.button
        this.activeAudio(true);
        buttonIndex++;
        
        this.useMoneyButton = new CustomButton('useMoneyButton');
        await this.useMoneyButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'Money_00.png', 'Money_01.png', 'Money_02.png');
        this.useMoneyButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.useMoneyButton.zIndex = eSettingLayer.button

        this.useCreditButton = new CustomButton('useCreditButton');
        await this.useCreditButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'Point_00.png', 'Point_01.png', 'Point_02.png');
        this.useCreditButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
        this.useCreditButton.zIndex = eSettingLayer.button
        this.activeUseMoney(true)
        buttonIndex++;

        if(appConfig.configJson.historyOn){
            this.historyButton = new CustomButton('historyButton');
            await this.historyButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'History_00.png', 'History_01.png', 'History_02.png', 'History_03.png');
            this.historyButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
            this.historyButton.zIndex = eSettingLayer.button
            buttonIndex++;
        }

        if(appConfig.configJson.exitOn){
            this.exitButton = new CustomButton('leaveButton');
            await this.exitButton.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'Leave_00.png', 'Leave_01.png', 'Leave_02.png', 'Leave_03.png');
            this.exitButton.addButtonTo(this.settingContainer, eSettingPosDef[buttonIndex][0], eSettingPosDef[buttonIndex][1])
            this.exitButton.zIndex = eSettingLayer.button
            buttonIndex++
        }

        this.buttonCount = buttonIndex
        let res: LoaderResource = await AssetLoader.getAsset(appConfig.assetPrefix + 'img/Button.json');
        let base: NineSlicePlane = new NineSlicePlane(res.textures['SideUIBase.png'], 0, 50, 0, 50);
        base.position.set(0, 144 + (5 - this.buttonCount) * 114)
        base.height = this.baseHeight[this.buttonCount - 3]
        base.zIndex = eSettingLayer.base
        this.settingContainer.addChild(base)

        // 存放所有在settingContainer裡面的按鍵  (方便統一設定)
        this.buttonArr = new Array<CustomButton>();
        this.buttonArr.push(this.menuCloseButton, this.instructionButton, this.soundOpenButton, this.soundCloseButton, this.useMoneyButton, this.useCreditButton, this.historyButton, this.exitButton)

        this.isActive = this.isMoving = false;
        this.onRegisterEvent();
    }

    public activeSettingButton(flag: boolean){

        if(!this.menuOpenButton){
            Debug.Warn('activeSettingButton', 'no button')
            return
        }

        if(flag){
            this.menuOpenButton.addButtonTo(App.stage, eSettingPosDef[eSettingPosIndex.menuOpen][0], eSettingPosDef[eSettingPosIndex.menuOpen][1], this.activeSettingUI.bind(this, true))
        }else{
            this.menuOpenButton.removeAllListeners()
            this.menuOpenButton.parent && this.menuOpenButton.parent.removeChild(this.menuOpenButton)
        }

    }

    public setButtonInteractive(flag: boolean){
        this.menuOpenButton.setInterActive(flag);
    }

    private onRegisterEvent(){

        this.menuCloseButton.on('pointertap', ()=>{
            this.activeSettingUI(false)
        })

        this.soundOpenButton.on('pointertap', ()=>{
            this.activeAudio(false)
        })

        this.soundCloseButton.on('pointertap', ()=>{
            this.activeAudio(true)
        })

        this.instructionButton.on('pointertap', async ()=>{
            await GameInfoManager.getInstance().showGameInfo();
        })

        this.useMoneyButton.on('pointertap', ()=>{
            this.activeUseMoney(false)
        })

        this.useCreditButton.on('pointertap', ()=>{
            this.activeUseMoney(true)
        })

        this.historyButton && this.historyButton.on('pointertap', ()=>{
            // 派送事件開啟細單
            let _gameCode: string = (appConfig.configJson.GameID < 10)? `BN0${appConfig.configJson.GameID}` : `BN${appConfig.configJson.GameID}`
            window.dispatchEvent(new CustomEvent('detailPageShow', {
                detail:{
                    gameToken: gameUrlParameter.token,
                    gameCode: _gameCode,
                    gameLanguage: LocalizationManager.getLanguage(),
                    url: gameUrlParameter.betQuery              
                }
            }))
        })

        this.exitButton && this.exitButton.on('pointertap', ()=>{
            window.dispatchEvent(new CustomEvent('exitGame', {
                detail:{
                    url: gameUrlParameter.exitUrl
                }
            }))
        })
    }

    private activeSettingUI(flag: boolean){
    
        if(this.isMoving)       // 避免移動中點擊
            return

        this.isActive = flag
        
        if(flag){
            this.isMoving = true

            // black
            this.black = CustomContainerManager.getContainer(eContainerType.blackFullScreen)
            this.black.on('pointerdown' , this.activeSettingUI.bind(this, false))
            this.black.addChild(this.settingContainer)
            App.stage.addChild(this.black)

            // 關閉所有按鍵
            for(let btn of this.buttonArr){
                // 只要關閉按鍵功能，不用換圖
                // 所以直接設定interactvie
                btn && (btn.interactive = false)
            }
            
            let t1: TimelineLite = new TimelineLite()
            .fromTo(this.settingContainer, .3, {y: 400}, {y: 0})
            t1.eventCallback('onComplete', ()=>{
                killTween(t1)
                this.isMoving = false
                // 開啟所有按鍵
                for(let btn of this.buttonArr){
                    btn && (btn.interactive = true)
                }
            })
        }else{            
            EventHandler.dispatchEvent({name: eEventName.setMusicVolume, context: {value: 1, musicOn: SettingUIManager.getInstance().MusicOn}})
            EventHandler.dispatchEvent({name: eEventName.setEffectVolume, context: {value: 1, musicOn: SettingUIManager.getInstance().MusicOn}})
            this.black.removeChildren()
            CustomContainerManager.putContainer(eContainerType.blackFullScreen)
        }
    }

    public activeAudio(flag: boolean){
        this.musicOn = flag;

        this.soundOpenButton && (this.soundOpenButton.visible = flag)
        this.soundCloseButton && (this.soundCloseButton.visible = !flag)
        // 聲音的開啟/關閉
        EventHandler.dispatchEvent({name: eEventName.setMusicVolume, context: {value: flag? 1: 0, musicOn: this.musicOn}})
        EventHandler.dispatchEvent({name: eEventName.setEffectVolume, context: {value: flag? 1: 0, musicOn: this.musicOn}})
    }
    
    private activeUseMoney(flag: boolean){
        this.isUseMoney = flag
        this.useMoneyButton.visible = flag
        this.useCreditButton.visible = !flag

        EventHandler.dispatchEvent({name: eEventName.moneyCreditChange})
    }
}