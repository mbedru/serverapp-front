import { Status } from "src/app/enum/status.enum";

export interface Server {
    id: number;
    ipAddress: string;
    name: string;
    memory: string;
    type: string;
    imageUrl:string
    status: Status;
}