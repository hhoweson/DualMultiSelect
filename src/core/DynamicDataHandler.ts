import {
    OptionElementData,
    OptGroupElementData,
    UniversalOptionData,
    InternalOptionElementData,
    InternalOptGroupElementData,
    InternalUniversalOptionData,
    DualMultiSelectModule
} from '../types/types';
import { internalElementIdDataAttribute } from './utils';

/**
 * Dynamic Data Handler
 * 
 * This class is responsible for handling dynamic data.
 * eg. When the original select element needs to be programmatically updated, either at runtime or during initialization.
 */
export default class DynamicDataHandler implements DualMultiSelectModule {

    private internalElementIdIndex = 0;

    constructor(private readonly selectElement: HTMLSelectElement){}

    public setData(data: UniversalOptionData): void
    {
        this.selectElement.innerHTML = '';

        for(const optionData of data){

            let newElement: HTMLOptionElement|HTMLOptGroupElement;

            if(optionData.hasOwnProperty('children')){
                newElement = this.createOptGroupElement(optionData as OptGroupElementData);
            } else {
                newElement = this.createOptionElement(optionData as OptionElementData);
            }

            this.selectElement.appendChild(newElement);
        }

        // This event is necessary for the DualMultiSelect element to update
        // We bubble the event so that it behaves like a normal change event
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));

    }

    private createOptionElement(optionData: OptionElementData): HTMLOptionElement
    {
        const optionElement = document.createElement('option');
        optionElement.text = optionData.text;
        if(typeof optionData.value === 'string') optionElement.value = optionData.value;
        if(optionData.selected) optionElement.selected = true;
        if(optionData.disabled) optionElement.disabled = true;
        if(optionData.hidden) optionElement.hidden = true;
        return optionElement;
    }

    private createOptGroupElement(optGroupData: OptGroupElementData): HTMLOptGroupElement
    {
        const optGroupElement = document.createElement('optgroup');
        optGroupElement.label = optGroupData.label;

        for(const optionData of optGroupData.children){
            optGroupElement.appendChild(
                this.createOptionElement(optionData)
            );
        }
    
        return optGroupElement;
    }

    /**
     * Fetches the data from the original select element and formats it in a way that is easier to work with.
     */
    public getData(): InternalUniversalOptionData
    {
        const options = this.selectElement.options;
        const optionsData: InternalUniversalOptionData = {};

        for (let i = 0; i < options.length; i++) {

            const optionElement = options[i];
            const optionInternalElementId = this.getInternalElementId(optionElement, true);

            const option_data: InternalOptionElementData  = {
                text: optionElement.text,
                value: optionElement.value,
                selected: optionElement.selected,
                disabled: optionElement.disabled,
                hidden: optionElement.hidden
            };

            if(optionElement.parentNode instanceof HTMLOptGroupElement){

                // If the option is part of an optgroup, make it a child of the optgroup
                const optGroupElement = optionElement.parentNode;
                const optGroupInternalElementId = this.getInternalElementId(optGroupElement, true);

                // If the optgroup has not been registered yet, add it
                if(!optionsData.hasOwnProperty(optGroupInternalElementId)){
                    optionsData[optGroupInternalElementId] = {
                        label: optGroupElement.label,
                        children: {}
                    };
                }

                // Add the option to the optgroup
                (optionsData[optGroupInternalElementId] as InternalOptGroupElementData).children[optionInternalElementId] = option_data;

            } else {
                optionsData[optionInternalElementId] = option_data;
            }

        }

        return optionsData;
    }

    private getInternalElementId(htmlElement: HTMLElement, autoCreateInternalId: boolean = false): string
    {
        if (!htmlElement.hasAttribute(internalElementIdDataAttribute)) {
            if(!autoCreateInternalId) throw new Error('Element does not have an internal id!');
            htmlElement.setAttribute(internalElementIdDataAttribute, this.internalElementIdIndex.toString());
            this.internalElementIdIndex++;
        }

        return htmlElement.getAttribute(internalElementIdDataAttribute) as string;
    }

    public destroy(): void
    {
        // Nothing to destroy
    }
    
}