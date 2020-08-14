import * as PIXI from 'pixi.js-legacy'
window.PIXI = PIXI;
import 'pixi-sound'
import 'pixi-spine'
import 'pixi-particles'
import { appConfig, eLayer } from './System/Config/GameConfig';

export let App: PIXI.Application = new PIXI.Application({
    antialias: true,
    backgroundColor: 0x000000
});

import GameAssetManager from './System/Assets/GameAssetManager';
import GameStateController, { eGameScene } from './Game/GameStateController';
import Loading from './Game/Loading';
import NetworkManager from './System/Network/NetworkManager';
import GameDataRequest, { eCommand } from './System/Network/GameDataRequest';
import GameSlotData from './Game/GameSlotData/GameSlotData';
import urlParser, { gameUrlParameter } from './System/Network/urlParser';
import LocalizationManager, { eLanguage } from './System/LocalizationManager';
import AppDebug from "./Lib/appDebug";
import CustomInteractionManager from "./System/Tool/CustomInteractionManager";
import GameAudioManager from "./System/Assets/Audio/GameAudioManager";
import GameConfigManager from "./System/Config/GameConfigManager";
import { enableBoundaryChecking } from 'number-precision';
import EventHandler, { eEventName } from './Game/EventHandler';
import SettingUIManager from './Game/UI/SettingUIManager';
import CustomContainerManager from './System/Tool/CustomContainerManager';
import CurrencyManager from './System/CurrencyManager';

export default class Main {

    /** 初始化整個遊戲  ( 遊戲入口 ) */
    public async init() {

        EventHandler.init();
        enableBoundaryChecking(false)        // 關閉number-precision的提示
        urlParser.parseUrl()                 // 根據外部檔來設定遊戲參數
        await appConfig.readJson();
        await LocalizationManager.init(gameUrlParameter.language)        // 初始化多語系

        this.setHtmlTitle()
        this.setFocus();
        this.initPixi();
        this.createVersion();
        GameAudioManager.init();
        CustomContainerManager.init()

        await GameStateController.swtichGameScene(eGameScene.loading);
        await NetworkManager.getInstance().init();
        await this.loading();
        await GameStateController.swtichGameScene(eGameScene.game);

        CustomInteractionManager.init(App.stage);

        window.burnTest = window.speed = false

        if(process.env.NODE_ENV != 'production')
            AppDebug.setDebug();
    }

    /** 初始化 pixi 設定 */
    private initPixi() {

        App.view.width = appConfig.size.width;
        App.view.height = appConfig.size.height;

        // 讓畫面可以跟著zIndex呈現
        App.stage.sortableChildren = true;
        App.stage.interactive = true;

        // 設定遊戲畫面大小
        let dom = document.body.querySelector('#div_pixi');
        dom.appendChild(App.view);

        // 設定調整螢幕適配性
        window.addEventListener('resize', ()=> GameConfigManager.fitScreen())
        window.onorientationchange = ()=> GameConfigManager.fitScreen()
        GameConfigManager.fitScreen();
    }

    /** 跑loading條，並等待全部loading完成 */
    private async loading(): Promise<void>{
        return new Promise<void>(async (res, rej) =>{
            Loading.startLoading(res);
            await new Promise<void>((res, rej) => {
                GameDataRequest.requestJoinGame(gameUrlParameter.token, appConfig.GameID, (data)=>{
                    GameSlotData.JoinGameData = data;
                    CurrencyManager.setCurrency(GameSlotData.JoinGameData.CurrencyID)
                    res();
                })
            })
            await GameAssetManager.loadGameAssets();
            // 通知loading完成，以演完loading條
            Loading.finishLoading();
        })
    }

    /**
     * 設定畫面focus時的功能
     *  (為了音效)
     */
    private setFocus(){
        window.addEventListener('focus', ()=>{
            EventHandler.dispatchEvent({name: eEventName.setMusicVolume, context: {value: 1, musicOn: SettingUIManager.getInstance().MusicOn}})
            EventHandler.dispatchEvent({name: eEventName.setEffectVolume, context: {value: 1, musicOn: SettingUIManager.getInstance().MusicOn}})
        })
        
        window.addEventListener('blur', ()=>{
            EventHandler.dispatchEvent({name: eEventName.setMusicVolume, context: {value: 0, musicOn: SettingUIManager.getInstance().MusicOn}})
            EventHandler.dispatchEvent({name: eEventName.setEffectVolume, context: {value: 0, musicOn: SettingUIManager.getInstance().MusicOn}})
        })
    }

    /** 設定網頁的title */
    private setHtmlTitle(){
        let title = appConfig.configJson.gameTitle
        document.title = title[LocalizationManager.getLanguage()]
    }    
    
    /** 遊戲版本號 */
    private async createVersion(){
        let version: PIXI.Text = new PIXI.Text(appConfig.version, new PIXI.TextStyle({
            fill: 'white',
            fontSize: 12,
            fontFamily: 'Arial'
        }))
        version.name = 'version'
        version.anchor.set(1.1, 0)
        version.position.set(appConfig.size.width, 0)
        version.zIndex = eLayer.version
        App.stage.addChild(version)
    }
}

new Main().init();