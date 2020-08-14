import { Container, Graphics, spine, sound, Point } from "pixi.js-legacy";
import { wheelCountArr, eSymbolConfig, posXArr, posYArr, eSymbolName, eWheelConfig, eSymbolLayer } from "./SymbolDef";
import Symbol from "./Symbol";
import { TimelineMax, Linear, TimelineLite } from "gsap";
import Debug from "../../Lib/Debug";
import { appConfig, eBaseGmaeUILayer } from "../../System/Config/GameConfig";
import WheelController, { eWheelDataType } from "./WheelController";
import GameSpineManager from "../../System/Assets/Spine/GameSpineManager";
import { killTween } from "../../Lib/Tool";
import GameAudioManager from "../../System/Assets/Audio/GameAudioManager";
import SpineManager from "../../System/Assets/Spine/SpineManager";
import EventHandler, { eEventName } from "../EventHandler";
import { App } from "../../main";

/** 每一個滾輪 */
export default class Wheel extends Container{

    // private container: Container;
    private upContainer: Container;
    private downContainer: Container;

    private originPos: Array<number>;
    public get OriginPos(): Array<number> {return this.originPos.slice(0)}

    private upSymbols: Array<Symbol>;
    private downSymbols: Array<Symbol>;

    private wheelIndex: number;             // 第幾個滾輪
    private wheelSymbolCount: number;       // 這個滾輪有幾個symbol ( 顯示上 )
    private wheelHeight: number             // 滾輪的長度

    private spinTween: TimelineMax;         // 滾動的漸進
    private startStopCallback: Function

    // 滾輪帶
    private wheelDatas: Array<number>;
    private dataIndex: number;

    // 聽牌
    private isListening: boolean;
    public get Listening(): boolean { return this.isListening }
    private speedUpTween: TimelineLite;
    private reelExpect: spine.Spine
    private reelExpectAudio: sound.IMediaInstance

    // stick
    private allWheelStick: boolean;     // 是否整輪都是 stick，可以用來判斷要不要停輪
    public get AllWheelStick(): boolean { return this.allWheelStick }

    // 結果
    private resultArr: Array<number>;
    private repeatTimes: number;
    public get RepeatTimes(): number { return this.repeatTimes }

    private stopSpeed: boolean;     // 是否是autoSpeed 
    private stopTween: TimelineLite;

    /**
     * 初始化單條滾輪
     * @param index 第幾個滾輪 (0-based)
     */
    public async init(index: number) {

        this.wheelIndex = index;
        this.originPos = [posXArr[this.wheelIndex], 0]
        this.position.set(this.originPos[0], this.originPos[1])

        // 整個wheel的長度
        this.wheelSymbolCount = wheelCountArr[this.wheelIndex]
        this.wheelHeight = this.wheelSymbolCount * eSymbolConfig.height

        this.upContainer = new Container();
        this.downContainer = new Container();
        this.addChild(this.upContainer, this.downContainer)

        return this
    }

    public async reset(freeGame: boolean, index: number){
        
        if(freeGame){
            this.zIndex = eBaseGmaeUILayer.normalSymbol
            GameSpineManager.FreeGameUI.addChild(this)
            this.setWheelData(appConfig.stripJson[eWheelDataType.freeGame_0][this.wheelIndex])              // 設定滾輪帶
        }else{
            this.zIndex = eBaseGmaeUILayer.normalSymbol
            GameSpineManager.BaseGameUI.addChild(this)
            this.setWheelData(appConfig.stripJson[eWheelDataType.normalGame][this.wheelIndex])            // 設定滾輪帶
        }

        this.initMask()        // 初始化 mask

        // 重新定位上下節點
        this.upContainer.position.set(0, - this.wheelHeight)
        this.downContainer.position.set(0, 0)
       
        // 初始化轉輪符號
        await this.initSymbol()
    }

    public clearWheel(){
        this.upSymbols.forEach(symbol => symbol.end())
        this.downSymbols.forEach(symbol => symbol.end())
        this.parent.removeChild(this.mask as Container)
    }

    /**
     * 設定滾輪結果
     * @param result 
     */
    public setResult(result: Array<number>) {
        if (result.length != this.wheelSymbolCount) {
            Debug.Log('set result:', 'wrong result', result)
        }
        this.resultArr = result.slice(0, this.wheelSymbolCount)
    }

    /** 設定滾輪帶 */
    public async setWheelData(arr: Array<number>) {
        this.wheelDatas = arr.slice(1).reverse()
    }

    /** 初始化滾輪上的symbol */
    private async initSymbol() {
        this.upSymbols = new Array<Symbol>();
        this.downSymbols = new Array<Symbol>();
        this.dataIndex = -1;

        // 先記錄stage原本的旋轉和位置，避免 Symbol.init()時，toGlobal 計算錯誤
        let oriPos: Point = new Point(), oriRot: number = App.stage.rotation
        App.stage.position.copyTo(oriPos)
        App.stage.rotation = 0
        App.stage.position.set(0)
        for (let i = this.wheelSymbolCount - 1; i >= 0; i--) {
            this.downSymbols[i] = await new Symbol().init(this.downContainer, this.wheelIndex, i, this.wheelDatas[this.addIndex()])
            this.upSymbols[i] = await new Symbol().init(this.upContainer, this.wheelIndex, i, 1, false)
        }
        App.stage.rotation = oriRot
        App.stage.position.set(oriPos.x, oriPos.y)
    }

    /**
     * 初始化滾輪遮罩
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param 遮罩的graphics
     */
    private initMask() {
        let borderOffset: number = 9
        let mask = new Graphics()
            .beginFill(0xFF0000, 0.5)       // 方便看位置而已
            .drawRect(this.originPos[0] - eSymbolConfig.width / 2, posYArr[0] - eSymbolConfig.height / 2,  eSymbolConfig.width, this.wheelHeight - borderOffset)
            .endFill()

        this.parent.addChild(mask)
        this.mask = mask
    }

    /**
     * 開始滾動
     * @param speedUp 是否是自動加速滾動
     */
    public async startSpin(speedUp: boolean = false): Promise<void> {
        return new Promise<void>((res, rej) => {

            this.repeatTimes = -1;
            this.isListening = false;
            this.stopSpeed = speedUp;

            this.spinTween = new TimelineMax({ repeat: this.repeatTimes })
            this.spinTween.eventCallback('onStart', () => {
                for (let i = this.wheelSymbolCount - 1; i >= 0; i--) {
                    this.downSymbols[i].setBlurSymbol(this.downSymbols[i].symbol)
                    this.upSymbols[i].setBlurSymbol(this.wheelDatas[this.addIndex()])
                }
                EventHandler.dispatchEvent({name: eEventName.startSpinComp})
            })

            this.spinTween.eventCallback('onRepeat', () => {
                // 交換上下滾輪的圖片，並重新ran出上面滾輪的圖片
                for (let i = this.wheelSymbolCount - 1; i >= 0; i--) {
                    this.downSymbols[i].setBlurSymbol(this.upSymbols[i].symbol)
                    this.upSymbols[i].setBlurSymbol(this.wheelDatas[this.addIndex()])
                }
            })

            this.spinTween.eventCallback('onComplete', async () => {
                killTween(this.spinTween)
                await this.spinBounce();
                res()
            })

            this.spinTween.to(this.position, this.stopSpeed ? eWheelConfig.wheelSpeedUpDuration : eWheelConfig.wheelDuration, { y: this.wheelHeight, ease: Linear.easeInOut })
        })
    }

    /** 正常停輪 ( 逐輪 ) */
    public async stopSpinNormal() {

        if(this.stopTween && this.stopTween.isActive()){
            Debug.Warn('stop spin.', 'exist tween')
        }

        // 根據有沒有聽牌，決定要不要延遲
        let delay: number = this.isListening? eWheelConfig.listeningDelay: 0
        this.stopTween = new TimelineLite()
        .add(()=>{
            this.repeatTimes = Math.floor(this.spinTween.totalTime() / (this.spinTween.duration() + this.spinTween.repeatDelay()));
            this.spinTween.repeat(this.repeatTimes);
            this.spinTween.eventCallback('onRepeat', null)          // 避免結束的同時觸發 onRepeat ，造成圖片閃爍
        }, delay)

        this.stopTween.eventCallback('onComplete', ()=>{
            killTween(this.stopTween)
        })
    }

    /** 即停 */
    public async stopSpinQuick(){
        killTween(this.stopTween)

        this.repeatTimes = Math.floor(this.spinTween.totalTime() / (this.spinTween.duration() + this.spinTween.repeatDelay()));
        this.spinTween.repeat(this.repeatTimes);
        this.spinTween.eventCallback('onRepeat', null)          // 避免結束的同時觸發 onRepeat ，造成圖片閃爍
    }
    
    /** 設定滾輪帶聽牌 */
    public setListening() {
        this.isListening = true;
    }

    /** 讓滾輪帶逐漸加速滾動 */
    public speedUp() {
        killTween(this.speedUpTween)

        this.speedUpTween = new TimelineLite()
        this.speedUpTween.to(this.spinTween, eWheelConfig.listeningSpeedUpTime, {timeScale: eWheelConfig.listeningMaxScale})
        this.speedUpTween.eventCallback('onComplete', ()=>{
            killTween(this.speedUpTween)
        })
    }

    /**
     * 設定 stick symbol
     * @param symbolIndex 該輪的第幾個 symbol
     * @param flag 是否設定為stcik            true 則 stick，false 則取消 stick 
     * @param specify 是否為特殊情況
     * @param symbol symbol id，配合 specify 使用
     */
    public setStick(symbolIndex: number, flag: boolean, specify: boolean = false, symbol?: number) {
        if (flag) {
            specify ? this.downSymbols[symbolIndex].playSpecifyStickSymbol(symbol) : this.downSymbols[symbolIndex].playStickSymbol()
        } else {
            this.downSymbols[symbolIndex].clearStickSymbol()
        }
    }

    /**
     * 撥放得獎動畫
     * @param symbolIndex 第幾個symbol
     */
    public async playWinAnimation(symbolIndex: number, times: number) {
        await this.downSymbols[symbolIndex].playWinAnimation(times)
    }

    /**
     * 撥放得獎框動畫
     * @param symboIndex 第幾個symbol
     * @param lineNo 線號
     */
    public async playWinBoxAnimation(symbolIndex: number, lineNo: number) {
        await this.downSymbols[symbolIndex].playWinBox(lineNo)
    }

    /**
     * 清除得獎框動畫
     * @param symbolIndex 第幾個symbol
     */
    public async clearWinBox(symbolIndex: number, clear: boolean) {
        this.downSymbols[symbolIndex].clearWinBox(clear)
    }

    /**
     * 清除所有得獎效果
     * @param symbolIndex 第幾個symbol
     * @param reset 是否重設
     */
    public async clearWinEffect(symbolIndex: number) {
        this.downSymbols[symbolIndex].clearWinEffect()
    }

    /** 轉最後一輪並將結果顯示在畫面上 */
    private spinBounce() {
        return new Promise<void>((res, rej) => {
            if (this.resultArr == null || this.resultArr.length != this.wheelSymbolCount) {
                Debug.Error('spin bounce:', 'result not right.', this.resultArr)
                rej()
            }

            // 如果聽牌加速還沒結束，取消加速效果
            killTween(this.speedUpTween)

            /**  再滾一輪   */
            // 交換上下滾輪的圖片，並設定最終結果
            for (let i = 0; i < this.wheelSymbolCount; i++) {
                this.downSymbols[i].setBlurSymbol(this.upSymbols[i].symbol)
                this.upSymbols[i].setBlurSymbol(this.resultArr[i])
            }
            this.y = 0

            // 結束時的向下位移動畫
            let timeScale: number = this.spinTween.timeScale()
            let endTween: TimelineMax = new TimelineMax()
            endTween.timeScale(timeScale)
            endTween.to(this.position, this.stopSpeed ? eWheelConfig.wheelSpeedUpDuration : eWheelConfig.wheelDuration, { y: this.wheelHeight, ease: Linear.easeInOut })
            .call(() => {
                // 到達最底部時，把整個容器往上拉，確保最後回彈時，上方的 symbol 可以被看到
                for (let i = 0; i < this.wheelSymbolCount; i++) {
                    this.downSymbols[i].setNormalSymbol(this.upSymbols[i].symbol)
                    this.upSymbols[i].setNormalSymbol(this.wheelDatas[this.addIndex()])
                }
                this.position.y = 0
                // 派送事件，通知下一輪停輪
                EventHandler.dispatchEvent({name: eEventName.stopSpinPerWheel, context: this.wheelIndex})
            })
            .to(this.position, eWheelConfig.wheelStopDuration, { y: eWheelConfig.wheelStopDistance })
            .call(()=>{
                this.stopReelExpect()
                // 判斷有沒有聽牌來決定音效
                if(this.wheelIndex >= 2 && this.wheelIndex < WheelController.getInstance().WD_SymbolCount ){     // 有聽牌並且有連線的轉輪
                    GameAudioManager.playAudioEffect(`HitReel_${this.wheelIndex+1}`)
                }else{
                    GameAudioManager.playAudioEffect('SpinStop')
                }
            })
            .to(this.position, eWheelConfig.wheelStopDuration, { y: 0 })

            endTween.eventCallback('onComplete', async () => {
                killTween(endTween)
                let allPromise: Array<Promise<void>> = new Array<Promise<void>>()
                this.downSymbols.forEach((downSymbol, index) => {
                    allPromise.push(downSymbol.setResultSymbol(this.resultArr[index]))
                })
                await Promise.all(allPromise)
                res()
            })
        })
    }

    public async playReelExpectEffect(){
        if(this.reelExpect){
            Debug.Warn('playReelExpectEffect', 'reelExpect already exist')
            return
        }

        this.reelExpect = await GameSpineManager.playReelExpect(this.wheelIndex)
        this.reelExpectAudio = await GameAudioManager.playAudioEffect('ReelExpecting')
    }

    private stopReelExpect(){
        if(!this.reelExpect)
            return
        // 回收 spine
        SpineManager.endSpine(GameSpineManager.getFullUrl('ReelExpect'), this.reelExpect)
        this.reelExpect = null

        GameAudioManager.stopAudioEffect(this.reelExpectAudio)        // 停止音效
    }

    /** 取得滾輪帶的index並+1 */
    private addIndex(): number {
        this.dataIndex = ++this.dataIndex % this.wheelDatas.length
        return this.dataIndex;
    }
}