import { LoaderResource, Texture, Sprite } from "pixi.js-legacy";
import AssetLoader from "../../System/Assets/AssetLoader";

export enum CustomBtnState {
    idle = 0,
    press = 1,
    hover = 2,
    disable = 3,

    totalState
}

/** 自定義按鍵 */
export default class CustomButton extends PIXI.Container {

    private textureArr: Array<PIXI.Texture>;
    private btnSprite: Sprite;

    constructor(name: string) {
        super();
        this.name = name;
        this.interactive = true;
    }

    /**
     * 初始化按鍵
     * @param spriteName 圖片的名稱 (單圖/圖集)
     * @param spriteNames 如果是單圖，則按照customState讀入
     */
    public async init(spriteName: string, ...spriteNames: Array<string>) {
        this.textureArr = new Array<Texture>();
        let res: LoaderResource = await AssetLoader.getAsset(spriteName);
        if (res.spritesheet) {    // 假設按鈕圖片按照順序放在圖集內
            this.textureArr = Object.values(res.spritesheet.textures).slice(0, CustomBtnState.totalState) as Array<Texture>;
        } else {
            let nameArr: Array<string> = [spriteName].concat(spriteNames);
            nameArr.forEach(async (name, index) => {
                res = await AssetLoader.getAsset(name);
                this.textureArr[index] = res.texture;
            })
        }
    }

    /**
     * 用圖集初始化按鍵
     * @param sheetName 圖集名稱 
     * @param spriteAtlas 要使用的圖片別名
     */
    public async initWithSheet(sheetName: string, ...spriteAtlas: Array<string>){
        let res: LoaderResource = await AssetLoader.getAsset(sheetName);
        this.textureArr = spriteAtlas.map(atlas => res.textures[atlas]);
    }

    /**
     * 增加按鍵到畫面上
     * @param parent 父節點
     * @param x x座標
     * @param y y座標
     * @param pressFunc 按下去的函式
     * @param hoverFunc hover的函式
     */
    public addButtonTo(parent: PIXI.Container, x: number, y: number, pressFunc?: Function, hoverFunc?: Function) {

        parent.addChild(this);
        this.position.set(x, y);

        this.btnSprite = new Sprite(this.textureArr[CustomBtnState.idle]);
        this.btnSprite.anchor.set(0.5)
        this.addChild(this.btnSprite);

        this.removeAllListeners()
        
        this.on('pointerdown', () => {
            this.setSprite(CustomBtnState.press);
        })

        this.on('pointertap', ()=>{
            this.setSprite(CustomBtnState.idle);
            pressFunc && pressFunc();
        })

        if (this.textureArr[CustomBtnState.hover]) {

            this.on('pointerover', () => {
                this.setSprite(CustomBtnState.hover);
            })

            this.on('pointerout', () => {
                this.setSprite(CustomBtnState.idle);
            })
        }
    }
    
    /**
     * 設定按鍵是否可以互動
     * @param flag 
     */
    public setInterActive(flag: boolean){
        this.interactive = flag;
        this.setSprite(flag? CustomBtnState.idle: CustomBtnState.disable);
    }

    /** 設定按鍵的圖片 */
    public setSprite(index: CustomBtnState){
        this.btnSprite.texture = this.textureArr[index];
    }
}