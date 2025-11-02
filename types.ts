export enum LoadingState {
    IDLE,
    GENERATING_TEXT,
    SUCCESS,
    ERROR
}

export interface GroundingChunk {
    web?: {
        uri?: string;
        title?: string;
    };
}
