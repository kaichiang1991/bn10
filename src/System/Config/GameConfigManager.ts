import { appConfig } from "./GameConfig";
import { App } from "../../main";
import isMobile from "ismobilejs"

/** 遊戲config管理 ( 適配性 ) */
export default class GameConfigManager {

    private static dom: HTMLElement = document.querySelector('#div_pixi');
    private static game: HTMLElement = document.querySelector('#game');
    private static ratioApply: number;
    
    /** 適配螢幕畫面 */
    public static fitScreen() {

        let _isPad = window.innerWidth >= 1024 || window.innerHeight >= 1024
        let ratioWidth = window.innerWidth / appConfig.size.width;
        let ratioHeight = window.innerHeight / appConfig.size.height;
        this.ratioApply = (ratioWidth > ratioHeight) ? ratioHeight : ratioWidth;

        if (!isMobile().any || _isPad) {
            this.fitScreenDesktop();
        } else {
            this.fitScreenMobile();
        }
    }

    /** 適配電腦版大小 */
    private static async fitScreenDesktop() {

        this.game.className = 'pc'
        App.stage.rotation = this.numRotDef(0)
        App.stage.position.set(0, 0)
        this.dom.style.width = this.ratioApply * appConfig.size.width + 'px'
        this.dom.style.height = this.ratioApply * appConfig.size.height + 'px'
        App.renderer.resize(appConfig.size.width, appConfig.size.height);
    }

    /**
     * 適配手機板大小
     * html外層會強制橫向
     */
    private static async fitScreenMobile() {

        let isLandscape: boolean = (document.documentElement.clientWidth > document.documentElement.clientHeight)
        this.game.className = 'mobile';
        
        if (isLandscape) {
            // 水平
            this.dom.style.width = document.documentElement.clientWidth + 'px'
            this.dom.style.height = (this.isIOSSafari()? window.innerHeight: document.documentElement.clientHeight) + 'px'

            App.stage.rotation = this.numRotDef(0);
            App.stage.position.set(0, 0)
            App.renderer.resize(appConfig.size.width, appConfig.size.height);
        }else{
            // 垂直
            this.dom.style.width = document.documentElement.clientWidth + 'px'
            this.dom.style.height = document.documentElement.clientHeight + 'px'
            App.stage.rotation = this.numRotDef(90);
            App.stage.position.set(appConfig.size.height, 0)
            App.renderer.resize(appConfig.size.height, appConfig.size.width);
        }
    }

    // 計算旋轉
    public static numRotDef(numDeg: number): number{
        return numDeg * PIXI.DEG_TO_RAD
    }

    private static isIOSSafari(): boolean{
        // 只有 isMobile() 可以判斷pc上面的 手機模擬    mobile-detect的userAgents()最後一個才是對的瀏覽器
        return isMobile().apple.phone && window.md.userAgents()[window.md.userAgents().length - 1] == 'Safari'
        // return /Safari/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent)
    }
}

