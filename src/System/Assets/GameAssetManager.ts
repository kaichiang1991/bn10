import AssetLoader from "./AssetLoader"
import SpineManager from "./Spine/SpineManager";
import FontManager from "./Font/FontManager";
import { eLanguageMap } from "../LocalizationManager";
import AudioManager from "./Audio/AudioManager";
import { appConfig } from "../Config/GameConfig";
import ParticleManager from "./Particles/ParticleManager";
import CustomContainerManager from "../Tool/CustomContainerManager";
import WheelController from "../../Game/Symbol/WheelController";
import BigWinManager from "../../Game/Win/BigWin/BigWinManager";
import BetModel from "../../Game/BetModel/BetModel";
import GameSlotData from "../../Game/GameSlotData/GameSlotData";
import SettingUIManager from "../../Game/UI/SettingUIManager";
import GameInfoManager from "../../Game/UI/GameInfoManager";
import BetListManager from "../../Game/UI/BetListManager";
import LineNumeralManager from "../../Game/Numeral/LineNumeralManager";
import FreeGameNumeralManager from "../../Game/Numeral/FreeGameNumeralManager";

/** 管理所有遊戲資源 */
export default class GameAssetManager{

    // 要讀取的圖檔、json檔
    private static readonly fileLists: Array<string> = [
        'img/Button.json',
        'img/InsufficientBalance_BG.png',
        'img/InsufficientBalanceConfirm.png'
    ]

    /**
     * 設定讀檔的語系
     * @param _language 
     */
    public static setLangauge(_language: string){
        this.fileLists.push(`img/panda/${eLanguageMap[_language]}/CloseButton.png`)
    }

    /** 讀取遊戲資源 */
    public static async loadGameAssets(){
        let list: Array<string> = this.fileLists.map(list => appConfig.assetPrefix + list)
        await AssetLoader.loadAsset(list);
        // await AnimationManager.loadAnimations();
        await ParticleManager.loadParticles();
        await SpineManager.loadSpines();
        await AudioManager.loadAudios();
        await FontManager.loadFonts();
        
        await this.loadDone()
    }

    public static async loadDone(){

        // 初始化 BetModel
        BetModel.getInstance().setBetUnit(GameSlotData.SlotInitData.BetUnit);
        BetModel.getInstance().setCredit(GameSlotData.JoinGameData.Balance);
        BetModel.getInstance().setWin(0);
        BetModel.getInstance().setBetInterval(GameSlotData.SlotInitData.BetMultiples)
        
        BigWinManager.init()

        await SpineManager.init()
        await GameInfoManager.getInstance().init();
        await BetListManager.init()     
        await SettingUIManager.getInstance().init();

        // 數字初始化
        LineNumeralManager.init()
        FreeGameNumeralManager.init()
        
        // 滾輪初始化
        await WheelController.getInstance().init()

    }
}