import { eSymbolLayer } from "../../Game/Symbol/SymbolDef";
import AssetLoader from "../Assets/AssetLoader";
import { gameUrlParameter } from "../Network/urlParser";

/** 遊戲的 Config */
export default class GameConfig{
    public size: any;
    public assetPrefix: string;
    public version: string = '0.3.5';

    public connect_url: string;
    public timeOut: number;
    public pingTimeInterval: number;
    public pongTimeOut: number;

    public Line: number;
    public DemoMode: boolean;

    public MoneyFractionMultiple: number;
    public Denom: number;   // 錢轉分數的倍率
    public GameTypeID: number;

    public GameID: number;
    public configJson: IConfigJson;
    public oddsJson: Object;
    private readonly ODDS_JSON_NAME: string = 'json/oddsBN10.json'
    public payTableJson: IPayTableJson;
    private readonly PAY_TABLE_JSON_NAME: string = 'json/info.json'
    public stripJson: Object;
    private readonly STRIP_JSON_NAME: string = 'json/stripBN10.json'

    constructor(){
        this.size = {width: 1280, height: 720};
        this.assetPrefix = envPathPrefix? envPathPrefix.trim(): 'assets/'

        this.timeOut = 5000;    // 用不到
        this.pingTimeInterval = 10000;
        this.pongTimeOut = this.pingTimeInterval * 3;       // 送三次ping都沒有Pong則斷線
    }

    /** 讀取外部 json 檔 */
    public async readJson(){
        // 讀取json
        await AssetLoader.loadAsset(['./config.json', this.assetPrefix + this.ODDS_JSON_NAME, this.assetPrefix + this.PAY_TABLE_JSON_NAME, this.assetPrefix + this.STRIP_JSON_NAME])
        
        // config
        let res = await AssetLoader.getAsset('./config.json');
        this.configJson = res.data;
        
        this.connect_url = gameUrlParameter.gameServer

        this.DemoMode = this.configJson.DemoOn;
        this.GameID = this.configJson.GameID;

        // odds
        res = await AssetLoader.getAsset(this.assetPrefix + this.ODDS_JSON_NAME);
        this.oddsJson = res.data;

        // payTable
        res = await AssetLoader.getAsset(this.assetPrefix + this.PAY_TABLE_JSON_NAME);
        this.payTableJson = res.data;

        // strip
        res = await AssetLoader.getAsset(this.assetPrefix + this.STRIP_JSON_NAME);
        this.stripJson = res.data;
    }
}

/** 自定義圖層順序 */
export enum eLayer{

    GameBackground,
    normalSymbol,
    UIBlack     = normalSymbol + eSymbolLayer.totalCount,
    GameUI,

    Line,
    LineBackground,
    winSymbol,
    wildSymbol = winSymbol,
    sitckSymbol = winSymbol,

    symbolBox,
    reelExpect = symbolBox,
    lineNumber,
    
    pandaJump,
    FreeGameTimesNumber,
    FreeGameHint,
    FreeGameHintNumber,

    Logo,
    
    UI_bottom,
    UI,

    bigWin, 
    bigWinNumber,
    
    betListUIBlack,
    betListUI,
    
    settingBlack,
    settingUI,
    
    freeGamePlus,
    LineWinNumber,

    payTable,
    payTableNumber,

    WinBG,
    fullScreenCover,
    
    version,
    promptOut,
}

export enum eBaseGmaeUILayer{
    normalSymbol,
}

export enum eBigWinLayer{
    glow,
    coin,
    word
}

export let appConfig = new GameConfig();