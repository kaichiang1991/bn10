import CustomButton from "./CustomButton";
import GameSpineManager from "../../System/Assets/Spine/GameSpineManager";
import { appConfig } from "../../System/Config/GameConfig";
import GameFontManager from "../../System/Assets/Font/GameFontManager";
import { eSymbolName } from "../Symbol/SymbolDef";
import { BitmapText, Container, Rectangle } from "pixi.js-legacy";
import LocalizationManager, { eLanguage } from "../../System/LocalizationManager";
import { App } from "../../main";
import SpineManager from "../../System/Assets/Spine/SpineManager";
import CustomContainerManager, { eContainerType } from "../../System/Tool/CustomContainerManager";
import Debug from "../../Lib/Debug";

let posDef: Array<Array<number>> = [
    [25.5, 336],
    [1254.5, 336],
    [1231, 673]
]

enum ePosIndex{
    preBtn,
    nextBtn,
    exitBtn
}

let fontPosDef: Array<Array<number>> = [
    // page 0
    [677, 245],
    [677, 301],
    [677, 357],

    // page 1
    // H1
    [362, 270],
    [362, 300],
    [362, 330],
    // H2
    [560, 270],
    [560, 300],
    [560, 330],
    // H3
    [760, 270],
    [760, 300],
    [760, 330],
    // H4
    [951, 270],
    [951, 300],
    [951, 330],

    // N1
    [362, 526],
    [362, 556],
    [362, 586],
    // N2
    [560, 526],
    [560, 556],
    [560, 586],
    // N3
    [760, 526],
    [760, 556],
    [760, 586],
    // N4
    [951, 526],
    [951, 556],
    [951, 586],
    
    // zh-cn
    // FreeGamePerLine
    [1006, 515],
    // FreeGamePerWheel
    [879, 558],
    // FreeGameMax
    [910, 603],

    // en
    // FreeGamePerLine
    [798, 550],
    // FreeGamePerWheel
    [744, 587],
    // FreeGameMax
    [950, 627],

    // vi
    // FreeGamePerLine
    [1083, 517],
    // FreeGamePerWheel
    [752, 589],
    // FreeGameMax
    [1068, 624],

    // th
    // FreeGamePerLine
    [696, 557],
    // FreeGamePerWheel
    [988, 558],
    // FreeGameMax
    [868, 584],
]

enum eFontPosIndex{
    // page 0
    WD_5,
    WD_4,
    WD_3,

    // page 1
    H1_5,
    H1_4,
    H1_3,

    H2_5,
    H2_4,
    H2_3,

    H3_5,
    H3_4,
    H3_3,

    H4_5,
    H4_4,
    H4_3,

    N1_5,
    N1_4,
    N1_3,

    N2_5,
    N2_4,
    N2_3,

    N3_5,
    N3_4,
    N3_3,

    N4_5,
    N4_4,
    N4_3,
    
    zh_FreeGamePerLine,
    zh_FreeGamePerWheel,
    zh_FreeGameMax,

    en_FreeGamePerLine,
    en_FreeGamePerWheel,
    en_FreeGameMax,

    vi_FreeGamePerLine,
    vi_FreeGamePerWheel,
    vi_FreeGameMax,

    th_FreeGamePerLine,
    th_FreeGamePerWheel,
    th_FreeGameMax,
}

export default class GameInfoManager{
    private static instance: GameInfoManager;
    public static getInstance(): GameInfoManager{
        if(this.instance == null)   this.instance = new GameInfoManager();
        return this.instance;
    }

    private gameInfoCont: Container;

    // 判斷有沒有使用中
    private isActive: boolean = false;
    public get IsActive(): boolean {return this.isActive}

    private gameInfoSpine: PIXI.spine.Spine;
    private readonly ANIM_NAME: Array<string> = ['PayTable_1', 'PayTable_2', 'PayTable_3', 'PayTable_4']

    private infoIndex: number;
    private totalPage: number;

    private nextBtn: CustomButton;
    private preBtn: CustomButton;
    private exitBtn: CustomButton;

    private switchNext: Function;
    private switchPre: Function;

    private fontArr: Array<BitmapText>;

    /**
     * 初始化gameInfo   (只有一開始呼叫)
     */
    public async init(){

        this.gameInfoSpine = await GameSpineManager.playPayTable();

        this.preBtn = new CustomButton('preBtn');
        await this.preBtn.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'InstructionPage_Previous_00.png', 'InstructionPage_Previous_01.png', 'InstructionPage_Previous_02.png', 'InstructionPage_Previous_03.png');

        this.nextBtn = new CustomButton('nextBtn');
        await this.nextBtn.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'InstructionPage_Next_00.png', 'InstructionPage_Next_01.png', 'InstructionPage_Next_02.png', 'InstructionPage_Next_03.png');

        this.exitBtn = new CustomButton('exitBtn');
        await this.exitBtn.initWithSheet(appConfig.assetPrefix + 'img/Button.json', 'MenuClose_00.png', 'MenuClose_01.png', 'MenuClose_02.png', 'MenuClose_03.png');
        this.exitBtn.scale.set(0.8)

        this.totalPage = this.ANIM_NAME.length;

        this.switchNext = () => this.switchPage(true)
        this.switchPre = () => this.switchPage(false)

        this.fontArr = new Array<BitmapText>();
    }

    /** 顯示 gameInfo (每次開啟時呼叫) */
    public showGameInfo(){
        if(this.isActive)
            return

        this.isActive = true
        this.gameInfoCont = CustomContainerManager.getContainer(eContainerType.fullScreenCover)
        this.gameInfoCont.addChild(this.gameInfoSpine)
        App.stage.addChild(this.gameInfoCont)
        this.switchPage(0)

        this.preBtn.addButtonTo(this.gameInfoCont, posDef[ePosIndex.preBtn][0], posDef[ePosIndex.preBtn][1], this.switchPre.bind(this))
        this.nextBtn.addButtonTo(this.gameInfoCont, posDef[ePosIndex.nextBtn][0], posDef[ePosIndex.nextBtn][1], this.switchNext.bind(this))
        this.exitBtn.addButtonTo(this.gameInfoCont, posDef[ePosIndex.exitBtn][0], posDef[ePosIndex.exitBtn][1], this.end.bind(this))
    }   

    /** 離開 gameInfo */
    private end(){
        this.gameInfoCont.children.forEach(child => child.removeAllListeners())
        this.gameInfoCont.removeChildren()
        CustomContainerManager.putContainer(eContainerType.fullScreenCover)
        this.clearAllFonts()
        this.isActive = false
    }

    /**
     * 切換頁面
     * @param flag {boolean | number} true 下一頁, false 上一頁  // 0 ~ 直接指定頁數
     */
    private switchPage(flag: boolean | number){
        if(typeof flag == 'number'){
            if(flag >= this.ANIM_NAME.length){
                Debug.Warn('switch page', 'out of range')
                return
            }
            this.infoIndex = flag

        }else{
            if(flag){
                this.infoIndex = (this.infoIndex +1 ) % this.totalPage;
            }else{
                this.infoIndex--;
                if(this.infoIndex < 0)  this.infoIndex = this.totalPage - 1;
            }   
        }

        SpineManager.setAnimation(this.gameInfoSpine, this.ANIM_NAME[this.infoIndex], false);
        this.showOdds();
    }

    /** 顯示自定義字 */
    private showOdds(){
        this.clearAllFonts();
        let allOdds = appConfig.oddsJson[1] // 全部的倍率表
        let odds: Array<number>;    // 單一symbol的倍率表
        let payTableJson: IPayTableJson = appConfig.payTableJson, index: number, language: string;

        switch (this.infoIndex) {
            case 0:     // Wild
                odds = allOdds[eSymbolName.WD]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.WD_3][0], fontPosDef[eFontPosIndex.WD_3][1]))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.WD_4][0], fontPosDef[eFontPosIndex.WD_4][1]))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.WD_5][0], fontPosDef[eFontPosIndex.WD_5][1]))
                break;
                
            case 1:
                // H1
                odds = allOdds[eSymbolName.H1]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.H1_3][0], fontPosDef[eFontPosIndex.H1_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.H1_4][0], fontPosDef[eFontPosIndex.H1_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.H1_5][0], fontPosDef[eFontPosIndex.H1_5][1], 18))
                
                // H2
                odds = allOdds[eSymbolName.H2]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.H2_3][0], fontPosDef[eFontPosIndex.H2_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.H2_4][0], fontPosDef[eFontPosIndex.H2_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.H2_5][0], fontPosDef[eFontPosIndex.H2_5][1], 18))

                // H3
                odds = allOdds[eSymbolName.H3]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.H3_3][0], fontPosDef[eFontPosIndex.H3_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.H3_4][0], fontPosDef[eFontPosIndex.H3_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.H3_5][0], fontPosDef[eFontPosIndex.H3_5][1], 18))

                // H4
                odds = allOdds[eSymbolName.H4]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.H4_3][0], fontPosDef[eFontPosIndex.H4_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.H4_4][0], fontPosDef[eFontPosIndex.H4_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.H4_5][0], fontPosDef[eFontPosIndex.H4_5][1], 18))

                // N1
                odds = allOdds[eSymbolName.N1]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.N1_3][0], fontPosDef[eFontPosIndex.N1_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.N1_4][0], fontPosDef[eFontPosIndex.N1_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.N1_5][0], fontPosDef[eFontPosIndex.N1_5][1], 18))

                // N2
                odds = allOdds[eSymbolName.N2]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.N2_3][0], fontPosDef[eFontPosIndex.N2_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.N2_4][0], fontPosDef[eFontPosIndex.N2_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.N2_5][0], fontPosDef[eFontPosIndex.N2_5][1], 18))

                // N3
                odds = allOdds[eSymbolName.N3]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.N3_3][0], fontPosDef[eFontPosIndex.N3_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.N3_4][0], fontPosDef[eFontPosIndex.N3_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.N3_5][0], fontPosDef[eFontPosIndex.N3_5][1], 18))

                // N4
                odds = allOdds[eSymbolName.N4]
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[2]}`, fontPosDef[eFontPosIndex.N4_3][0], fontPosDef[eFontPosIndex.N4_3][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[3]}`, fontPosDef[eFontPosIndex.N4_4][0], fontPosDef[eFontPosIndex.N4_4][1], 18))
                this.fontArr.push(GameFontManager.drawPayTableNumber(`${odds[4]}`, fontPosDef[eFontPosIndex.N4_5][0], fontPosDef[eFontPosIndex.N4_5][1], 18))

                break;

            case 2:     // FreeGame P3
                payTableJson = appConfig.payTableJson;
                language = LocalizationManager.getLanguage()
                index = (language == eLanguage.ENG)? eFontPosIndex.en_FreeGamePerLine: (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGamePerLine: (language == eLanguage.VI)? eFontPosIndex.vi_FreeGamePerLine: eFontPosIndex.th_FreeGamePerLine
                // index = (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGamePerLine: (language == eLanguage.ENG)? eFontPosIndex.en_FreeGamePerLine: eFontPosIndex.vi_FreeGamePerLine
                this.fontArr.push(GameFontManager.drawPayTableP3Number(`${payTableJson.FreeGameTriggeredRoundPerLine}`, fontPosDef[index][0], fontPosDef[index][1]))
                // this.fontArr.forEach(font => !font.name && (font.name = 'perline'))

                // index = (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGamePerWheel: (language == eLanguage.ENG)? eFontPosIndex.en_FreeGamePerWheel: eFontPosIndex.vi_FreeGamePerWheel
                index = (language == eLanguage.ENG)? eFontPosIndex.en_FreeGamePerWheel: (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGamePerWheel: (language == eLanguage.VI)? eFontPosIndex.vi_FreeGamePerWheel: eFontPosIndex.th_FreeGamePerWheel
                this.fontArr.push(GameFontManager.drawPayTableP3Number(`${payTableJson.FreeGameOneSpinTriggeredRoundMax}`, fontPosDef[index][0], fontPosDef[index][1]))
                // this.fontArr.forEach(font => !font.name && (font.name = 'perwheel'))

                // index = (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGameMax: (language == eLanguage.ENG)? eFontPosIndex.en_FreeGameMax: eFontPosIndex.vi_FreeGameMax
                index = (language == eLanguage.ENG)? eFontPosIndex.en_FreeGameMax: (language == eLanguage.CHS)? eFontPosIndex.zh_FreeGameMax: (language == eLanguage.VI)? eFontPosIndex.vi_FreeGameMax: eFontPosIndex.th_FreeGameMax
                this.fontArr.push(GameFontManager.drawPayTableP3Number(`${payTableJson.FreeGameTotalRoundMax}`, fontPosDef[index][0], fontPosDef[index][1]))
                // this.fontArr.forEach(font => !font.name && (font.name = 'max'))

                break;
        }

        this.fontArr.forEach(font =>{
            font.setParent(this.gameInfoCont)
        })
    }

    /** 清除所有字體 */
    private clearAllFonts(){
        this.fontArr.forEach(font =>{
            font.destroy()
        })
        this.fontArr = new Array<BitmapText>()
    }
}