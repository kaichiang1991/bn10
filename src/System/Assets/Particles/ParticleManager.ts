import * as particles from "pixi-particles";
import AssetLoader from "../AssetLoader";
import { LoaderResource, IPoint, Texture, Container } from "pixi.js-legacy";
import { App } from "../../../main";
import { appConfig } from "../../Config/GameConfig";
import Debug from "../../../Lib/Debug";
import { AnimatedParticleArt } from "pixi-particles";

export interface IParticleConfig{
    pos?: IPoint,
    lifeTimes?: number,         // -1 為 loop， 其他表示粒子撥放到結束的時間 (秒)
    completeCallback?: Function,
}

export default class ParticleManager{

    private static readonly particleLists: Array<string> = [
        'img/particle/BigWin_Emitter.json',
        'img/particle/BigWinCoin.json',

    ]

    /** 讀取所有粒子效果 */
    public static async loadParticles(){
        let list: Array<string> = this.particleLists.map(list => appConfig.assetPrefix + list)
        await AssetLoader.loadAsset(list);
    }

        /**
     * 取得可以撥放序列圖的美術參數
     * @param nameArr 序列圖的名稱
     * @param _frameRate 幀數
     * @param _loop 
     */
    public static getAnimatedParticleArt(nameArr: Array<string>, _frameRate: number | 'matchLife' = 60, _loop: boolean = true): AnimatedParticleArt{
        let art: AnimatedParticleArt = {
            framerate: _frameRate,
            loop: _loop,
            textures: nameArr
        }
        return art;
    }

    /**
     * 取得可以撥放序列圖的美術參數陣列
     * @param nameArr 序列圖的名稱
     * @param count 總共幾種序列圖順序
     * @param _frameRate 幀數
     * @param _loop 
     */
    public static getMultAnimatedParticleArt(nameArr: Array<string>, count: number, _frameRate: number | 'matchLife' = 60, _loop: boolean = true): Array<AnimatedParticleArt>{
        let copyArr: Array<string>, splice: Array<string>, shuffleArr: Array<string>, art: AnimatedParticleArt;
        let resultArr: Array<AnimatedParticleArt> = new Array<AnimatedParticleArt>()
        for(let i = 0; i < count; i++){
            // 排序序列圖的順序  
            copyArr = nameArr.slice(0)
            splice = copyArr.splice(Math.floor(Math.random() * copyArr.length))
            shuffleArr = splice.concat(copyArr)

            resultArr.push(this.getAnimatedParticleArt(shuffleArr, _frameRate, _loop))
        }
        return resultArr;
    }

    /**
     * 播放粒子效果
     * @param emitterName 粒子效果的路徑
     * @param spriteName 要引用的圖片路徑 圖集或者圖片都可以
     * @param zIndex 存放粒子的父節點的zIndex
     * @param _config 自定義的相關參數
     * @returns 回傳播放的粒子
     */
    public static async playParticle(emitterName: string, spriteName: string, zIndex: number, _config?: IParticleConfig): Promise<particles.Emitter>{

        let textureArr: Array<PIXI.Texture> = new Array<PIXI.Texture>();
        let spriteTexture: LoaderResource = await AssetLoader.getAsset(spriteName);
        if(spriteTexture.spritesheet){  // 是圖集的話，讀取裡面的圖作為粒子的貼圖使用
            for(let key in spriteTexture.textures){
                let texture: PIXI.Texture = spriteTexture.textures[key];
                textureArr.push(texture)
            }
        }else{
            textureArr = [spriteTexture.texture];
        }
         
        let emitterAsset = await AssetLoader.getAsset(emitterName);
        let emitterConfig = emitterAsset.data;

        let container: PIXI.ParticleContainer = new PIXI.ParticleContainer();
        container.zIndex = zIndex;
        container.blendMode = particles.ParticleUtils.getBlendMode(emitterConfig.blendMode)
        App.stage.addChild(container)
        let emitter: particles.Emitter = new particles.Emitter(container, textureArr, emitterConfig)

        let config: IParticleConfig = _config || null;
        let completeFunction: Function;
        if(config){
            config.pos && emitter.updateSpawnPos(config.pos.x, config.pos.y);    // 更新起始座標
            emitter.emitterLifetime = config.lifeTimes? config.lifeTimes : -1;
            completeFunction = config.completeCallback || null;
        }

        emitter.autoUpdate = true;
        emitter.playOnce( completeFunction && completeFunction.bind(this));
        
        return Promise.resolve<particles.Emitter>(emitter);
    }

    public static async playAnimatedParticle(emitterName: string, spriteSheetName: string, parent: Container, zIndex: number, _config?: IParticleConfig){

        let textureNameArr: Array<string> = new Array<string>();
        let spriteTexture: LoaderResource = await AssetLoader.getAsset(spriteSheetName);
        if(spriteTexture.spritesheet){  // 是圖集的話，讀取裡面的圖作為粒子的貼圖使用
            textureNameArr = Object.keys(spriteTexture.textures)
        }else{
            Debug.Error('playAnimatedParticle:','no sprite sheet')
            return null
        }
            
        let emitterAsset = await AssetLoader.getAsset(emitterName);
        let emitterConfig = emitterAsset.data;

        let container: PIXI.ParticleContainer = new PIXI.ParticleContainer();
        container.zIndex = zIndex;
        container.blendMode = particles.ParticleUtils.getBlendMode(emitterConfig.blendMode)
        parent.addChild(container)

        let emitter: particles.Emitter = new particles.Emitter(container, this.getMultAnimatedParticleArt(textureNameArr, 3, 20), emitterConfig)
        emitter.particleConstructor = particles.AnimatedParticle
        emitter.orderedArt = true

        let config: IParticleConfig = _config || null;
        let completeFunction: Function;
        if(config){
            config.pos && emitter.updateSpawnPos(config.pos.x, config.pos.y);    // 更新起始座標
            emitter.emitterLifetime = config.lifeTimes? config.lifeTimes : -1;
            completeFunction = config.completeCallback || null;
        }

        emitter.autoUpdate = true;
        emitter.playOnce( completeFunction && completeFunction.bind(this));

        return Promise.resolve<particles.Emitter>(emitter);
	}
}

