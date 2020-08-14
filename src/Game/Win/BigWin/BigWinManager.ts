import GameSpineManager from "../../../System/Assets/Spine/GameSpineManager";
import { Point, spine, sound, Container, Rectangle } from "pixi.js-legacy";
import Sleep from "../../../Lib/Sleep";
import EventHandler, { eEventName } from "../../EventHandler";
import BetModel from "../../BetModel/BetModel";
import GameAudioManager from "../../../System/Assets/Audio/GameAudioManager";
import BigWinNumeralManager from "../../Numeral/BigWinNumeralManager";
import { appConfig, eLayer, eBigWinLayer } from "../../../System/Config/GameConfig";
import { App } from "../../../main";
import CustomContainerManager, { eContainerType } from "../../../System/Tool/CustomContainerManager";
import GameParticleManager from "../../../System/Assets/Particles/GameParticleManager";
import { killTween, fadeOutContainer } from "../../../Lib/Tool";
import { TimelineMax, Linear, Back } from "gsap";

export enum eBigWinType{
    // win = -1,
    win = 0,
    bigwin1,
    bigwin2,
    bigwin3,

    totalCount
}

export default class BigWinManager{

    private static readonly BIG_WIN_INTERVAL_DEF: Array<number> = [ 20, 50, 200]
    private static readonly END_DELAY: number = 2000    // 延遲的時間 (ms)

    private static bigWinCont: Container;
    private static winNumber: number;
    private static audio: sound.IMediaInstance;
    private static isPlaying: boolean;

    private static bigWinTween: TimelineMax

    public static init(){

        this.isPlaying = false;

        EventHandler.on(eEventName.startBigWin, (context)=>{
            if(this.isPlaying){
                EventHandler.dispatchEvent({name: eEventName.endBigWin})
                return
            }
            this.playBigWinEffect(context.win, context.duration, context.normalWin)            
        })    
    }

    /**
     * 撥放bigWin的效果
     * @param win 贏分 (錢) (低於bigWin演出也可以，會自動跳過)
     */
    public static async playBigWinEffect(win: number, duration: number, normalWin: boolean = false){

        this.isPlaying = true;
        this.winNumber = win; // 單位 (錢)
        let bigwinType: eBigWinType = this.getBigWinType(this.winNumber)

        if(this.checkSkipBigWin(bigwinType, normalWin)){
            this.isPlaying = false
            EventHandler.dispatchEvent({name: eEventName.endBigWin})
            return;
        }
        
        EventHandler.once(eEventName.bigWinNumberEnd, async ()=>{
            // 撥放停止音效
            GameAudioManager.stopAudioEffect(this.audio);
            GameAudioManager.playAudioEffect('Score_End')
            normalWin && EventHandler.dispatchEvent({name: eEventName.stopSpinBtn})

            await Sleep(this.END_DELAY)
            this.endBigWin();
        })

        this.bigWinCont = CustomContainerManager.getContainer(eContainerType.blackFullScreen)
        App.stage.addChild(this.bigWinCont)
        GameAudioManager.pauseCurrentMusic();
        await GameSpineManager.initBigWinAnim(this.bigWinCont)
        this.playBigWinAnim(bigwinType, duration)
        BigWinNumeralManager.playBigWinNumber(this.winNumber, duration, this.bigWinCont, new Point(640, 450))           // 撥放數字
        this.audio = await GameAudioManager.playAudioEffect('BigWin_Score2', true)
    }

    private static async playBigWinAnim(type: eBigWinType, duration: number){
        let bigWin = await GameSpineManager.playBigWinByType(type)
        GameSpineManager.playBigWinGlow()

        // 撥放金幣粒子效果
        await GameParticleManager.playCoinParticle(this.bigWinCont, eBigWinLayer.coin, new Point(640, 360))
        
        // 放大效果
        this.bigWinTween = new TimelineMax()
        this.bigWinTween.from(this.bigWinCont, .5, {alpha: 0}, 0)
        this.bigWinTween.from(bigWin.scale, .5, {x: 0, y: 0, ease: Back.easeOut}, .4)        // 彈跳

        this.bigWinTween.eventCallback('onComplete', ()=>{
            killTween(this.bigWinTween)
            this.bigWinCont.alpha = 1

            this.bigWinTween = new TimelineMax({repeat: -1, yoyo: true})
            this.bigWinTween.fromTo(bigWin.scale, 1, {x: 1, y: 1, ease: Linear.easeInOut}, {x: .95, y: .95})      // 呼吸效果
            this.bigWinTween.eventCallback('onComplete', ()=> {
                killTween(this.bigWinTween)
                bigWin.scale.set(1)
            })
        })
    }
    
    /** 
     * 清除bigWin相關參照
     */
    private static async endBigWin(){
        await fadeOutContainer(this.bigWinCont, .5)

        if(this.bigWinTween && this.bigWinTween.isActive()){
            this.bigWinTween.repeat(0)
            this.bigWinTween.seek('-=0', false)
        }

        GameParticleManager.endCoinParticle()
        BigWinNumeralManager.destroy()
        GameSpineManager.endBigWin()
        CustomContainerManager.putContainer(eContainerType.blackFullScreen)
        EventHandler.dispatchEvent({name: eEventName.endBigWin})
        this.isPlaying = false
    }

    public static getBigWinType(winNumber: number): eBigWinType{
        let result: eBigWinType;

        let betModel: BetModel = BetModel.getInstance().getDispatchObject()
        let interval: Array<number> = this.BIG_WIN_INTERVAL_DEF.map(number => number * betModel.TotalBet)

        if(winNumber < interval[0]){
            result = eBigWinType.win
        }else if(winNumber < interval[1]){
            result = eBigWinType.bigwin1
        }else if(winNumber < interval[2]){
            result = eBigWinType.bigwin2
        }else{
            result = eBigWinType.bigwin3
        }

        return result;
    }

    public static checkSkipBigWin(bigwinType: eBigWinType, normalWin: boolean): boolean{
        let result: boolean = false

        if(bigwinType == -1){        // 沒有定義 win 
            result = true;
        }else if(normalWin && bigwinType == eBigWinType.win){   // 一般遊戲沒有 win 的部分
            result = true
        }

        return result
    }
}