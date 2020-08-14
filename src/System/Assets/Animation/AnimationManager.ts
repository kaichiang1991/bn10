import AssetLoader from "../AssetLoader"
import { LoaderResource } from "pixi.js-legacy";

export interface IAnimationConfig{
    pos?: PIXI.Point,
    loop?: boolean,
    animSpeed?: number,
    completeCallback?: Function
}

export default class AnimationManager{

    private static readonly animationLists: Array<string> = [
        // 'assets/img/BIBO/BIBO.json',
    ]

    /** 讀取所有動畫的資源 */
    public static async loadAnimations(){
        await AssetLoader.loadAsset(this.animationLists);
    }

    /**
     * 撥放指定動畫
     * @param parent 父容器
     * @param spriteName 圖集名稱
     * @param animName 動畫名稱
     * @param _config 自訂的動畫參數
     * @returns 撥放的動畫組件
     */
    public static async playAnimation(parent: PIXI.Container, spriteName: string, animName: string, _config?: IAnimationConfig): Promise<PIXI.AnimatedSprite>{

        let asset: LoaderResource = await AssetLoader.getAsset(spriteName);
        let anim: PIXI.AnimatedSprite = new PIXI.AnimatedSprite(asset.spritesheet.animations[animName])
        parent.addChild(anim);

        let config: IAnimationConfig = _config || null;
        if(config){
            anim.position.set(config.pos.x, config.pos.y);
            anim.loop = config.loop;
            anim.animationSpeed = config.animSpeed;
            anim.onComplete = () => config.completeCallback && config.completeCallback();
        }

        anim.play();
        return Promise.resolve<PIXI.AnimatedSprite>(anim);
    }
}