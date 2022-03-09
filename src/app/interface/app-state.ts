import { DataState } from "../enum/data_state_enum";

export interface AppState<T> {//T is the type of the data passed (T can be whatever letter/word)
    dataState: DataState;
    appData?: T;  // ezaga pass yaregnew T data type
    error?: string;//we can't get data and error at same time so we make them optional by adding "?"
} 