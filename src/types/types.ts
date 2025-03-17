/*
    Used when setting options dynamically from external sources
    - Elements are not keyed, they are in array form
    - OptionElementData has optional properties
*/
export interface OptionElementData {
    text: string;
    value?: string;
    selected?: boolean;
    disabled?: boolean;
}

export interface OptGroupElementData {
    label: string;
    children: OptionElementData[];
}

export type UniversalOptionData = (OptGroupElementData|OptionElementData)[];

/*
    Used for internal tracking of option data
    - Elements are keyed by internalElementId
    - No optional properties
*/
export interface InternalOptionElementData {
    text: string;
    value: string;
    selected: boolean;
    disabled: boolean;
}

export interface InternalOptGroupElementData {
    label: string;
    children: Record<string, InternalOptionElementData>;
}

export type InternalUniversalOptionData = Record<string, InternalOptGroupElementData|InternalOptionElementData>;

export interface DualMultiSelectModule {
    destroy(): void; // All modules should have a destroy method
}

export type FilterFunction = () => Boolean;