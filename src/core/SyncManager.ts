import { internalElementIdDataAttribute } from './utils';
import { InternalOptionElementData, InternalOptGroupElementData, InternalUniversalOptionData, DualMultiSelectModule, FilterFunction } from '../types/types';

/**
 * SyncManager
 * 
 * This class is responsible for keeping the dual multi select lists in sync with the select element.
 * It listens for changes on the select element and updates the lists accordingly.
 */
export default class SyncManager implements DualMultiSelectModule {

    private internalElementIdIndex = 0;
    private readonly abortController = new AbortController();

    constructor(
        private readonly selectElement: HTMLSelectElement,
        private readonly dualMultiSelectElement: HTMLElement
    ){
        // Make sure the lists are always in sync with the select element

        this.syncListsWithSelectElement();
        
        this.selectElement.addEventListener('change', this.syncListsWithSelectElement.bind(this), {signal: this.abortController.signal});
    }

    private syncListsWithSelectElement()
    {
        const selectableList = this.dualMultiSelectElement.querySelector('.dms-selectable .dms-list') as HTMLUListElement;
        const selectedList = this.dualMultiSelectElement.querySelector('.dms-selected .dms-list') as HTMLUListElement;

        // Store the scroll positions before replacing the lists
        const selectableScrollTop = selectableList.scrollTop;
        const selectedScrollTop = selectedList.scrollTop;
        
        // Operate on shallow copies of the lists outside of the DOM
        // This reduces the number of DOM operations and increases performance
        const selectableListCopy = selectableList.cloneNode(false) as HTMLUListElement;
        const selectedListCopy = selectedList.cloneNode(false) as HTMLUListElement;

        const selectElementData = this.getSelectElementData();

        for(const [internalElementId, internalOptionOrOptGroupElementData] of Object.entries(selectElementData)){
            if(internalOptionOrOptGroupElementData.hasOwnProperty('children')){
            
                // Is optGroup
                const optGroupData = internalOptionOrOptGroupElementData as InternalOptGroupElementData;

                // Depending on which options are selected, the optGroup will be append to either 1 or both of the lists
                let selectableOptGroupElement: HTMLElement|null = null;
                let selectedOptGroupElement: HTMLElement|null = null;

                for(const [childInternalElementId, optionData] of Object.entries(optGroupData.children)){

                    const relevantList = optionData.selected ? selectedListCopy : selectableListCopy;

                    // Make sure the option group exists in the relevant list
                    if(selectedOptGroupElement === null)
                        selectedOptGroupElement = this.createOptGroupElement(optGroupData.label, internalElementId, relevantList);

                    const optGroupElement = (optionData.selected ? selectedOptGroupElement : selectableOptGroupElement) as HTMLElement;
                    const optGroupListElement = optGroupElement.querySelector('ul') as HTMLElement;

                    this.createOptionElement(
                        optionData.text,
                        optionData.value,
                        optionData.disabled,
                        childInternalElementId,
                        optGroupListElement
                    );

                }

            } else {
                
                // Is option
                const optionData = internalOptionOrOptGroupElementData as InternalOptionElementData;
                const relevantList = optionData.selected ? selectedListCopy : selectableListCopy;

                this.createOptionElement(
                    optionData.text,
                    optionData.value,
                    optionData.disabled,
                    internalElementId,
                    relevantList
                );

            }
        }

        // Replace the original lists with the copied nodes
        selectableList.replaceWith(selectableListCopy);
        selectedList.replaceWith(selectedListCopy);

        // Restore initial scroll positions
        selectableListCopy.scrollTop = selectableScrollTop;
        selectedListCopy.scrollTop = selectedScrollTop;
    }

    /**
     * Create the equivalent of an option element in the dual multi select lists.
     */
    private createOptionElement(
        text: string,
        value: string,
        disabled: boolean,
        internalElementId: string,
        appendTarget: HTMLElement
    ): HTMLElement
    {
        const optionElement = document.createElement('li');
        optionElement.setAttribute(internalElementIdDataAttribute, internalElementId);
        optionElement.classList.add('dms-option');
        optionElement.textContent = text;
        if(disabled) optionElement.classList.add('dms-disabled');
        appendTarget.append(optionElement);

        return optionElement;
    }

    /**
     * Creates the equivalent of an optgroup element in the dual multi select lists.
     */
    private createOptGroupElement(
        label: string,
        internalElementId: string,
        appendTarget: HTMLElement
    ): HTMLElement
    {
        const optGroupElement = document.createElement('li');
        optGroupElement.classList.add('dms-optGroup');
        optGroupElement.setAttribute(internalElementIdDataAttribute, internalElementId);
        appendTarget.append(optGroupElement);

        const optGroupLabelElement = document.createElement('div');
        optGroupLabelElement.classList.add('dms-optGroupLabel');
        optGroupLabelElement.textContent = label;
        optGroupElement.append(optGroupLabelElement);

        const optGroupListElement = document.createElement('ul');
        optGroupElement.append(optGroupListElement);

        return optGroupElement;
    }

    /**
     * Fetches the data from the original select element and formats it in a way that is easier to work with.
     */
    private getSelectElementData(): InternalUniversalOptionData
    {
        const options = this.selectElement.options;
        const fullData: InternalUniversalOptionData = {};

        for (let i = 0; i < options.length; i++) {

            const option_element = options[i];
            const option_internalElementId = this.getInternalElementId(option_element, true);

            const option_data: InternalOptionElementData  = {
                text: option_element.text,
                value: option_element.value,
                selected: option_element.selected,
                disabled: option_element.disabled,
            };

            if(option_element.parentNode instanceof HTMLOptGroupElement){

                // If the option is part of an optgroup, make it a child of the optgroup
                const optGroupElement = option_element.parentNode;
                const optGroup_internalElementId = this.getInternalElementId(optGroupElement, true);

                // If the optgroup has not been registered yet, add it
                if(!fullData.hasOwnProperty(optGroup_internalElementId)){
                    fullData[optGroup_internalElementId] = {
                        label: optGroupElement.label,
                        children: {}
                    };
                }

                // Add the option to the optgroup
                (fullData[optGroup_internalElementId] as InternalOptGroupElementData).children[option_internalElementId] = option_data;

            } else {
                fullData[option_internalElementId] = option_data;
            }

        }

        return fullData;
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
        this.abortController.abort();
    }

}