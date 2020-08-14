import { Container, Graphics, spine } from "pixi.js-legacy";
import { App } from "../main";
import { TimelineLite } from "gsap";
import AssetLoader from "../System/Assets/AssetLoader";
import { eLanguage, eLanguageMap } from "../System/LocalizationManager";
import Debug from "../Lib/Debug";
import GameSpineManager from "../System/Assets/Spine/GameSpineManager";
import { appConfig } from "../System/Config/GameConfig";
import { killTween } from "../Lib/Tool";

export default class Loading{

    private static loadingUrl: string;
    private static loadingComplete: Function;

    private static loadingSpine: spine.Spine;
    private static loadingBar: Graphics;
    private static loadingTween: TimelineLite

    /**
     * 設定語言
     * @param _language 
     */
    public static setLangugae(_language: string){
        this.loadingUrl = `img/panda/${eLanguageMap[_language]}/Loading.json`;
    }

    /** 初始化 loading 頁面 */
    public static async initLoading(){
        await AssetLoader.loadAsset([appConfig.assetPrefix + this.loadingUrl])
        this.loadingSpine = await GameSpineManager.playLoading();        
        App.stage.addChild(this.loadingSpine)

        // Loading Bar
        let barContainer = new Container();
        barContainer.position.set(0, 715)

        let loadingBG = new Graphics()
        .beginFill(0xc47300)
        .drawRect(0, 0, 1280, 3)
        .endFill()
    
        this.loadingBar = new Graphics()
        .beginFill(0xffff00) 
        .drawRect(0, 0, 1280, 3)
        .endFill()

        this.loadingBar.scale.set(0, 1)
        barContainer.addChild(loadingBG, this.loadingBar)
        this.loadingSpine.addChild(barContainer)

        window.dispatchEvent(new CustomEvent("complete"));
    }
    
    /**
     * 開始loading的動畫
     * 會在結束前4秒停下
     * @param callback 整個loading條跑完的動作
     */
    public static startLoading(callback: Function){
        this.loadingComplete = callback;

        this.loadingTween = new TimelineLite()
        .fromTo(this.loadingBar.scale, 10, {x: 0}, {x: 1})
        .addPause('-=4')       

        this.loadingTween.eventCallback('onComplete', this.endLoading.bind(this))
    }

    /**
     * 外部呼叫，來告知東西都load好了
     */
    public static async finishLoading(){
        
        if(this.loadingTween.paused()){     // 如果已暫停，則繼續演出
            this.loadingTween.resume()
        }else{
            // 若還沒暫停，則創造新的tween來覆蓋掉pause事件
            killTween(this.loadingTween)
            this.loadingTween = new TimelineLite()
            .to(this.loadingBar.scale, 1, {x: 1})

            this.loadingTween.eventCallback('onComplete', this.endLoading.bind(this))
        }
    }

    /** 動畫跑完會做的事 */
    public static endLoading(){
        killTween(this.loadingTween)
        this.loadingSpine.destroy();
        this.loadingComplete();
    }
}