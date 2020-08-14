interface ICtoGBaseStruct{
    Code: number
}

interface IGtoCBaseStruct{
    Code: number,
    Result: number,
    [propName: string]: any
}

interface IGtoCSlotInit extends IGtoCBaseStruct{
    MoneyFractionMultiple: number,
    Denom: number,
    Line: number,
    BetMultiples: Array<number>,
    BetUnit: number
}

interface ICtoGJoinGame extends ICtoGBaseStruct{
    GameToken: string,
    GameID: number,
    DemoOn: boolean
}

interface IGtoCJoinGame extends IGtoCBaseStruct{
    GameToken: string,
    Result: number,
    GameID: number,
    AccountID: number,
    DemoOn: boolean,
    Balance: number,
    CurrencyID: number
}

interface ICtoGNGPlay extends ICtoGBaseStruct{
    BetMultiple: number
}

interface IGtoCNGPlay extends IGtoCBaseStruct{
    Result: number,
    RoundCode: string,
    SpinInfo: ISSlotSpinInfo
    LDOption: Array<ISSlotOptionValue>,
    WaitNGRespin: boolean
}

interface ICtoGFGPlay extends ICtoGBaseStruct{
}

interface IGtoCFGPlay extends IGtoCBaseStruct{
    SpinInfo: ISSlotSpinInfo,
    LDOption: Array<ISSlotOptionValue>,
    IsOver: boolean,
    WaitNGRespin: boolean
}

interface ISSlotSpinInfo{
    GameState: number,
    WinType: number,
    Multiplier: number,
    SymbolResult: Array<Array<number>>,
    ScreenOutput: Array<Array<number>>,
    WinLineInfos: Array<ISSlotWinLineInfo>,
    FGTotalTimes: number,
    FGCurrentTimes: number,
    FGRemainTimes: number,
    FGMaxFlag: boolean,
    Win: number
}

interface ISSlotWinLineInfo{
    LineNo: number,
    SymbolID: number,
    SymbolType: number,
    SymbolCount: number,
    WayCount: number,
    WinPosition: Array<Array<number>>,
    Multiplier: number,
    WinOrg: number,
    Win: number,
    WinType: number,
    Odds: number
}

interface ISSlotOptionValue{

}

interface ICtoGRoundEnd extends ICtoGBaseStruct{

}

interface IGtoCRoundEnd extends IGtoCBaseStruct{
    Balance: number
}

// 擴充網頁的window.全域變數
interface Window {
    burnTest: boolean,
    speed: boolean,
    md: any
}

// 自定義 config 檔參數
interface IConfigJson{
    gameTitle: Object,
    DemoOn: boolean,
    GameID: number,
    historyOn: boolean,
    exitOn: boolean
}

// 自訂義 payTable 參數
interface IPayTableJson{
    FreeGameTriggeredRoundPerLine: number,
    FreeGameOneSpinTriggeredRoundMax: number,
    FreeGameTotalRoundMax: number
}

declare let envGameServer: string
declare let envPathPrefix: string