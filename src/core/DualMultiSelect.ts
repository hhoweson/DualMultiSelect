import SkeletonBuilder, { Options as SkeletonBuilderOptions } from "./SkeletonBuilder";
import EventHandler, { Options as EventHandlerOptions } from "./EventHandler";
import SyncManager from "./SyncManager";
import DynamicDataHandler from "../modules/DynamicDataHandler";
import CustomHeaders, {Options as CustomHeadersOptions} from "../modules/CustomHeaders";
import { UniversalOptionData } from "../types/types";

type DualMultiSelectOptions =  {
    data?: UniversalOptionData;
} & SkeletonBuilderOptions & CustomHeadersOptions & EventHandlerOptions;

type ModuleInstances = {
    'dynamicDataHandler': InstanceType<typeof DynamicDataHandler>;
    'customHeaders': InstanceType<typeof CustomHeaders>;
}
type ModuleInitializers = {
    [K in keyof ModuleInstances]: () => ModuleInstances[K]
};

/**
 * Dual Multi Select
 * 
 * This class is the main class for the Dual Multi Select library.
 * It initializes and manages various modules that handle various responsibilities.
 * 
 * Additional documentation on the modules can be found in their respective files, however here is an overview of the core modules:
 *  - SkeletonBuilder: Creates the skeleton html of the DualMultiSelect element.
 *  - EventHandler: Handles any click events on the DualMultiSelect element and enacts the necessary changes to the original select element.
 *  - SyncManager: Keeps the DualMultiSelect element in sync with the original select element.
 */
export default class DualMultiSelect {

    // Core modules
    private skeletonBuilder!: SkeletonBuilder;
    private eventHandler!: EventHandler;
    private syncManager!: SyncManager;
    
    // Optional modules
    private modules: Partial<ModuleInstances> = {};
    private moduleInitializers: ModuleInitializers = {
        'dynamicDataHandler': () => new DynamicDataHandler(
            this.selectElement
        ),
        'customHeaders': () => new CustomHeaders(
            this.dualMultiSelectElement,
            this.getFilteredOptions(['selectableHeader', 'selectedHeader', 'searchBar'])
        )
    };

    public dualMultiSelectElement!: HTMLElement;

    constructor(private readonly selectElement: HTMLSelectElement, private readonly options: DualMultiSelectOptions = {})
    {
        this.validateSelectElement(selectElement);

        this.initializeCoreModules();
        this.initializeRelevantOptionalModules();

    }

    private validateSelectElement(selectElement: HTMLSelectElement): void
    {
        if(!(selectElement instanceof Element))
            throw new Error('The provided select element is not an element.');

        if (selectElement.tagName !== 'SELECT')
            throw new Error('The provided element is not a select element.');

        if (!selectElement.multiple)
            throw new Error('The select element does not support multiple selections.');
    }

    private initializeCoreModules(){

        // Create the DualMultiSelect element skeleton
        this.skeletonBuilder = new SkeletonBuilder(
            this.selectElement,
            this.getFilteredOptions(['stackLists', 'stickyHeaders'])
        );
        this.dualMultiSelectElement = this.skeletonBuilder.dualMultiSelectElement;

        // Make sure the new element syncs with the original select element
        this.syncManager = new SyncManager(
            this.selectElement,
            this.dualMultiSelectElement
        );

        // Make clicks on the new element change the original select element
        this.eventHandler = new EventHandler(
            this.selectElement,
            this.dualMultiSelectElement
        );

    }

    /**
     * Initializes any additional modules that are required to support the provided options.
     */
    private initializeRelevantOptionalModules(){

        if(this.options.data)
            this.getModule('dynamicDataHandler').setData(this.options.data);

        if(this.options.selectableHeader || this.options.selectedHeader || this.options.searchBar)
            this.getModule('customHeaders');

    }

    /**
     * Fetches a module by name.
     * If the module has not been initialized yet, it will be initialized.
     */
    private getModule<K extends keyof ModuleInitializers>(moduleName: K): ModuleInstances[K]
    {
        if(!this.moduleInitializers.hasOwnProperty(moduleName))
            throw new Error(`The module "${moduleName}" does not exist.`);

        if(!this.modules.hasOwnProperty(moduleName))
            this.modules[moduleName] = this.moduleInitializers[moduleName]();

        return this.modules[moduleName] as ModuleInstances[K];
    }

    /**
     * Fetches a subset of the options object based on the provided keys.
     * Will not return any options that are not present in the original options object.
     */
    private getFilteredOptions(optionKeys: (keyof DualMultiSelectOptions)[]): Record<string, any>
    {
        const filteredOptions: Record<string, any> = {};
        for(let optionKey of optionKeys){
            if(this.options.hasOwnProperty(optionKey))
                filteredOptions[optionKey] = this.options[optionKey];
        }
        return filteredOptions;
    }

    public setData(data: UniversalOptionData): void
    {
        this.getModule('dynamicDataHandler').setData(data);
    }

    public destroy(): void
    {
        // Destroy core modules
        this.syncManager.destroy();
        this.eventHandler.destroy();
        this.skeletonBuilder.destroy();

        // Destroy any additional modules
        Object.values(this.modules).forEach(module => module.destroy());

        // Clear all properties/methods
        Object.keys(this).forEach(key => {
            (this as any)[key] = null;
        });
    }

}