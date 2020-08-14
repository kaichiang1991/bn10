import { BitmapText } from "pixi.js-legacy";
import FontManager from "./FontManager";
import { App } from "../../../main";
import { eLayer } from "../../Config/GameConfig";

enum eFontName{
    BigWin = 'BigWinNumeral',
    FreeGameTimes = 'FreeGameTimesNumeral',
    GetTimesNumeral = 'GetTimesNumeral',
    PlusTimesNumeral = 'PlusTimesNumeral',
    LineNumeral = 'LineNumeral',
    PaytableNumeral = 'PaytableNumeral',
    WinNumeral = 'WinNumeral',
    P3Numeral = 'P3Numeral',
}

export default class GameFontManager{
    
    public static drawBigWinNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.BigWin, _size? _size: 32);
    
        bmText.zIndex = eLayer.bigWinNumber
        return bmText;
    }

    public static drawFreeGameTitleNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.GetTimesNumeral, _size? _size: 32);
    
        bmText.zIndex = eLayer.FreeGameHintNumber
        return bmText;
    }

    public static drawFreeGameTimesNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.FreeGameTimes, _size? _size: 32);
    
        bmText.zIndex = eLayer.FreeGameTimesNumber;
        return bmText;
    }

    public static drawPlusTimesNumber(text: string, x: number, y: number, _size?: number){
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.PlusTimesNumeral, _size? _size: 32);
    
        bmText.zIndex = eLayer.freeGamePlus;
        return bmText;
    }

    public static drawLineNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.LineNumeral, _size? _size: 32);
    
        bmText.zIndex = eLayer.lineNumber;
        return bmText;
    }

    public static drawLineWinNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.WinNumeral, _size? _size: 32);
        bmText.zIndex = eLayer.LineWinNumber

        return bmText;
    }

    public static drawPayTableNumber(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.PaytableNumeral, _size? _size: 32);
        bmText.zIndex = eLayer.payTableNumber
        return bmText;
    }

    public static drawPayTableP3Number(text: string, x: number, y: number, _size?: number): BitmapText{
        let parent = App.stage;
        let bmText: BitmapText = FontManager.drawFont(parent, text, x, y, eFontName.P3Numeral, _size? _size: 32);
        bmText.zIndex = eLayer.payTableNumber
        return bmText;
    }
}