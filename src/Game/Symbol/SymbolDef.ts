// 遊戲內用到的 symbol 名稱與 server 回傳值的對應
enum eSymbolName{
    H1 = 1,
    H2 = 2,
    H3 = 3,
    H4 = 4,

    N1 = 11,
    N2 = 12,
    N3 = 13,
    N4 = 14,

    WD = 21,
}

// 每一個symbol的圖層定義 以及 總共symbol數的計算
enum eSymbolLayer{
    H1 = 0,
    H2,
    H3,
    H4,
    N1,
    N2,
    N3,
    N4,
    WD,

    totalCount
}

// symbol 動畫的狀態
enum eSymbolState{
    normal,
    blur,
    win,
    jumpOut,
    jumpOutLoop
}

// symbol 相關的參數
enum eSymbolConfig{
    height = 167,
    width = 172,
    jumpOutTime = 2000,             // 熊貓跳出來後，symbol出現的時機點 (ms)
}

// 滾輪相關的參數
enum eWheelConfig{
    // leastSpinTime = 800,            // 最少要演出的時間 (ms)
    leastSpinTime = 300,            // 最少要演出的時間 (ms)
    leastSpeedSpinTime = 300,       // 快速auto時的最少演出時間 (ms)

    wheelStopDuration = 0.2,        // 滾輪停輪時下墜的時間
    wheelStopDistance = 80,         // 滾輪停輪時下墜的距離

    wheelDuration = 0.22,            // 一輪滾完的時間 (可以看成速度)
    // wheelDuration = .7,            // 一輪滾完的時間 (可以看成速度)
    eachWheelStartInterval = 0,      // 每一滾輪開始間隔時間
    // eachWheelEndInterval = 220,      // 每一滾輪停輪間隔時間
    eachWheelEndInterval = .22,      // 每一滾輪停輪間隔時間
    eachWheelFastEndInterval = 0,    // 每一滾輪快速停輪間隔時間
    
    // 聽牌
    listeningMaxScale = 2.5,        // 加速效果最大倍率
    // listeningDelay = 10,          // 聽牌延遲停輪的時間   (s)
    listeningDelay = 2.5,          // 聽牌延遲停輪的時間   (s)
    listeningSpeedUpTime = 1,       // 聽牌加速到目標速度的時間 (s)

    // autoSpinSpeed
    wheelSpeedUpDuration = 0.15,
}

// 贏分演出相關參數
enum eLotteryConfig{
    leastAllLineTime = 1000,        // 全線獎最少演出時間
    maxAllLineTime = 1700,          // 全線獎最多演出時間

    timePerCredit = 0.02,           // 每分會演出的時間
    perLineRepeatTimes = 1,         // 每條線重複演出的時間
    lineLightTime = 0.6,            // 每條線亮線時間 (s)
    lineDarkTime = 0.3,             // 每條線暗線時間 (s)

    maxBetWinDuration = 10,         // 最大跑線時間
}

// 每輪的slot個數
let wheelCountArr: Array<number> = [3, 3, 3, 3, 3]

// symbol位置的定義
let posXArr: Array<number> = [294, 466, 642, 815, 989];
let posYArr: Array<number> = [182, 347, 511];

let wheelStopOrder: Array<number> = [0, 1, 2, 3, 4]

export {eSymbolName, eSymbolLayer, eSymbolState, eSymbolConfig, posXArr, posYArr, eWheelConfig, wheelCountArr, eLotteryConfig, wheelStopOrder}
