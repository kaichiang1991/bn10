export default async function Sleep(time: number): Promise<void>{
    return new Promise<void>((res, rej) => setTimeout(res, time));
}