import AssetLoader from "../AssetLoader"
import { Point, BitmapText, Container } from "pixi.js-legacy";
import { appConfig } from "../../Config/GameConfig";

export interface IBMFontConfig{
    tint?: number,
    align?: string, 
}

export default class FontManager{

    private static fontList: Array<string> = [
        'font/BigWinNumeral.fnt',
        'font/FreeGameTimesNumeral.fnt',
        'font/GetTimesNumeral.fnt',
        'font/PlusTimesNumeral.fnt',
        'font/LineNumeral.fnt',
        'font/PaytableNumeral.fnt',
        'font/WinNumeral.fnt',
        'font/P3Numeral.fnt',
    ]

    public static async loadFonts(){
        let list: Array<string> = this.fontList.map(list => appConfig.assetPrefix + list)
        await AssetLoader.loadAsset(list);
    }

    public static drawFont(parent: Container, _text: string, _x: number, _y: number, _fontName: string, _fontSize: number, option?: IBMFontConfig): BitmapText{

        let _align: string, _tint: number;

        if(option){
            option.align && (_align = option.align);
            option.tint && (_tint = option.tint);
        }

        let bmText: BitmapText = new BitmapText(_text, {
            font: {
                name: _fontName,
                size: _fontSize
            },
            align: _align,
            tint: _tint
        })

        parent.addChild(bmText);
        bmText.position.set(_x, _y);
        (bmText.anchor as Point).set(0.5);

        return bmText;
    }

    
}