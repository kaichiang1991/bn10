import EventHandler, { eEventName } from "../../Game/EventHandler";

/**
 * State 介面相關
 */
interface IState{

    type: string;
    context: StateContext;
    
    enter();
    change();
    update();
    exit();
}

/** constructor的格式設定 */
interface IStateConstructor{
    new (type: string, context: StateContext);
}

/**
 * 實作創造一個State
 * @param ctor 要實作的Class名稱
 * @param type 實作的state的名稱
 * @param context 存放這個state的context
 */
export function CreateState(ctor: IStateConstructor, type: string, context: StateContext): IState{
    return new ctor(type, context);
}

/**
 * 實作 IState 介面
 * 作為要繼承的父類別
 */
export class GameState implements IState{

    type: string; 
    context: StateContext;

    constructor(_type: string, _context: StateContext){
        this.type = _type;
        this.context = _context;
    }

    enter() {}
    change() {}
    update() {}
    exit() {}
}

/**
 * State容器類別
 * 作為 遊戲內用到的容器的父類別
 */
class StateContext{

    private stateArr: Array<IState>;
    private currentState: IState;

    constructor(){
        this.stateArr = new Array<IState>();
        this.currentState = null;
    }

    /**
     * 註冊一個狀態
     * @param state 要註冊的狀態
     */
    public regState(state: IState){
        this.stateArr[state.type] = state;
    }

    /**
     * 取消註冊一個狀態
     * @param state 要取消註冊的狀態
     */
    public unRegState(state: IState){
        if(this.stateArr[state.type] && this.currentState != state)
            delete this.stateArr[state.type];
        else
            console.log('unRegister state fail.', state);
    }

    /** 取消註冊所有狀態 */
    public unRegAll(){
        this.currentState = null;
        this.stateArr = new Array<IState>();
    }

    /**
     * 取得特定狀態
     * @param type 要取得的狀態名稱
     */
    public getState(type: string): IState{
        return this.stateArr[type];
    }

    public getCurrentState(): string{
        return this.currentState.type;
    }

    /**
     * 切換狀態
     * @param type 要切換的狀態名稱
     */
    public changeState(type: string){
        this.currentState && this.currentState.exit();
        this.currentState = this.stateArr[type];
        this.currentState.enter();
    }
}

/**
 * 遊戲內用到的容器類別
 */
export default class GameStateContext extends StateContext{

    public changeState(type: string){
        EventHandler.dispatchEvent({name: eEventName.gameStateChange, context: type})
        super.changeState(type)
    }
}