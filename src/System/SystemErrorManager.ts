import GameStateController, { eGameScene } from "../Game/GameStateController";
import { Graphics, Text, TextStyle, Sprite, Container } from "pixi.js-legacy";
import { appConfig, eLayer } from "./Config/GameConfig";
import { App } from "../main";
import AssetLoader from "./Assets/AssetLoader";
import LocalizationManager, { eLanguage, eLanguageMap } from "./LocalizationManager";
import { gameUrlParameter } from "./Network/urlParser";
import CustomInteractionManager from "./Tool/CustomInteractionManager";
import SettingUIManager from "../Game/UI/SettingUIManager";
import { gsap } from "gsap/all";

/** 負責處理系統錯誤訊息 */
export default class SystemErrorManager{

    private static isShowingError: boolean = false

    /**
     * 顯示全屏的錯誤訊息
     * @param msg 要顯示的訊息
     */
    public static async showError(msg: string){        
        
        console.log('show error', msg, this.isShowingError)
        if(this.isShowingError)
            return
        
        this.isShowingError = true
            
        this.clearAllTimeout()
        this.clearAllEvent()
        this.closeAllProcess()
        this.closeAllAudio()
        await GameStateController.swtichGameScene(eGameScene.error)
             
        let black: Graphics = new Graphics()
	        .beginFill(0xFFFFFF, 0.1)
	        .drawRect(0, 0, appConfig.size.width, appConfig.size.height)
	        .endFill();

        let style: TextStyle = new TextStyle({
            fontFamily: LocalizationManager.getLanguage() == eLanguage.CHS? '微軟正黑體': 'Arial',
            fontSize: LocalizationManager.getLanguage() == eLanguage.CHS? 56: 58,
            fontWeight: 'bold',
            letterSpacing: 1,
            fill: 'white',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 1200          // Wrap模式的判斷根據空格
        })
        let text: Text = new Text(msg, style)
        text.anchor.set(0.5)
        text.position.set(appConfig.size.width /2, appConfig.size.height /2)
        
        // 關閉按鈕
        let res = await AssetLoader.getAsset(appConfig.assetPrefix + `img/panda/${eLanguageMap[LocalizationManager.getLanguage()]}/CloseButton.png`)
        let sprite: Sprite = new Sprite(res.texture)
        sprite.anchor.set(0.5)
        sprite.position.set(640, 620)
        sprite.interactive = true;
        
        let colorOri = sprite.tint, hoverColor = 0xdedede, tapColor = 0x949494
        
        sprite.on('pointerover', () => {
            sprite.tint = hoverColor
        })
        sprite.on('pointerout', () => {
            sprite.tint = colorOri
        })
        sprite.on('pointerdown', () => {
            sprite.tint = tapColor
            sprite.scale.set(0.9)
        })
        sprite.on('pointertap', () => {
            sprite.tint = colorOri
            sprite.scale.set(1)
            window.dispatchEvent(new CustomEvent('exitGame', {
                detail:{
                    url: gameUrlParameter.exitUrl
                }
            }))
        })
        
        App.stage.addChild(black, text, sprite)
    }

    /**
     * 顯示彈出視窗
     * @param msg 要顯示的訊息
     * @param callback 點確認後執行的function
     * @param reload 是否要reload
     */
    public static async showPromptOut(msg: string, callback?: Function, reload: boolean = false){
        return new Promise<void>(async (res, rej) =>{

            let black: Graphics = new Graphics()
	            .beginFill(0x000000, 0.7)
	            .drawRect(0, 0, appConfig.size.width, appConfig.size.height)
	            .endFill();
            black.zIndex = eLayer.promptOut

            let resource = await AssetLoader.getAsset(appConfig.assetPrefix + 'img/InsufficientBalance_BG.png')
            let box: Sprite = new Sprite(resource.texture)
            box.anchor.set(0.5)
            box.scale.set(0.85)
            box.position.set(640, 336)
            box.zIndex = eLayer.promptOut
            
            App.stage.addChild(black, box);
                    
            resource = await AssetLoader.getAsset(appConfig.assetPrefix + 'img/InsufficientBalanceConfirm.png')
            let confirmBtn: Container = new Container()
            let sprite: Sprite = new Sprite(resource.texture)
            sprite.anchor.set(0.5)
            confirmBtn.interactive = true;
            confirmBtn.position.set(0, 80)
            confirmBtn.addChild(sprite)
            
            let style: TextStyle = new TextStyle({
                fontWeight: 'bold',
                fontSize: 48,
                fill: 'white',
                fontFamily: (LocalizationManager.getLanguage() == eLanguage.ENG)? 'Arial' : '微軟正黑體'
            })
            let text: Text = new Text(msg, style)
            text.anchor.set(0.5)
            text.position.set(0, -44)
            box.addChild(text, confirmBtn)

            // 設定按鍵
            let colorOri = sprite.tint
            let colorChange = 0x949494;
            let confirmFunc: Function = ()=>{
                callback && callback()

                if(reload){
                    location.reload()
                    return;
                }

                // 預設行為: 關閉視窗
                [box, black].forEach(element => element.destroy())
                res();
            }

            confirmBtn.on('pointerover', ()=>{
                sprite.tint = colorChange
            })
            confirmBtn.on('pointerout', ()=>{
                sprite.tint = colorOri
            })
            confirmBtn.on('pointerdown', ()=>{
                sprite.tint = colorChange
                confirmBtn.scale.set(0.9)
            })
            confirmBtn.on('pointertap', ()=>{
                sprite.tint = colorOri
                confirmBtn.scale.set(1)
                confirmFunc();
            })
        })
    }

    /** 關閉所有進行中 timeout，確保 await Sleep 的流程不會跑下去 */
    private static clearAllTimeout(){
        let higestTimeout: number = setTimeout(()=> {});
        for(let i = 0; i < higestTimeout; i++){
            clearTimeout(i)
        }
    }

    /** 清除所有鍵盤事件 */
    private static clearAllEvent(){
        CustomInteractionManager.removeAllKeyDownEvent()
        App.stage.removeAllListeners()
    }
    
    /** 取消所有可能演出的流程 */
    private static closeAllProcess() {
        gsap.exportRoot().kill()
    }

    /** 關閉所有音效，並確保再次 focus時不會重啟音量 */
    private static closeAllAudio(){
        SettingUIManager.getInstance().activeAudio(false)
    }}