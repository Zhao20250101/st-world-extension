// SillyTavern 内部模块的类型声明（仅用于本项目 TypeScript 检查；运行时这些模块由酒馆提供）。
// 命名导出与 SillyTavern >=1.12 保持一致。

declare module '@sillytavern/script' {
  export const chat: any[];
  export const characters: any[];
  export const chat_metadata: Record<string, any>;
  export const name1: string;
  export const name2: string;
  export const this_chid: string | undefined;
  export const event_types: Record<string, string>;
  export const eventSource: {
    on(name: string | symbol, cb: (...args: any[]) => void): void;
    emit(name: string | symbol, ...args: any[]): boolean;
  };
  export function getCurrentChatId(): string | undefined;
  export function saveMetadata(...args: any[]): Promise<void>;
  export function saveSettingsDebounced(...args: any[]): void;
  export function saveCharacterDebounced(...args: any[]): void;
  export function getRequestHeaders(options?: { omitContentType?: boolean }): Record<string, string>;
  export function generateQuietPrompt(
    quiet_prompt: string,
    quiet_to_loud?: boolean,
    skip_wian?: boolean,
    quiet_image?: string | null,
    quiet_name?: string,
    response_length?: number,
    force_chid?: number,
  ): Promise<string>;
}

declare module '@sillytavern/scripts/world-info' {
  export const world_info: Record<string, any>;
  export const selected_world_info: string[];
  export const world_names: string[];
  export const METADATA_KEY: 'world_info';
  export function getWorldInfoSettings(): { world_info: { globalSelect?: string[] } } & Record<string, any>;
  export function createNewWorldInfo(name: string, options?: { interactive?: boolean }): Promise<boolean>;
  export function saveWorldInfo(name: string, data: unknown): Promise<any>;
  export function loadWorldInfo(name: string): Promise<unknown>;
  export function deleteWorldInfo(name: string): Promise<boolean>;
  export function setWorldInfoButtonClass(...args: any[]): void;
  export function setWorldInfoSettings(settings: object): void;
}

declare module '@sillytavern/scripts/utils' {
  export function getCharaFilename(characterId?: string | number): string | null;
  export function uuidv4(): string;
  export function getStringHash(input: unknown): string;
}
