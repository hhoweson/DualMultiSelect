import { internalElementIdDataAttribute } from './utils';
import { InternalOptionElementData, InternalOptGroupElementData, DualMultiSelectModule } from '../types/types';
import DynamicDataHandler from './DynamicDataHandler';

/**
 * SyncManager
 * 
 * This class is responsible for keeping the dual multi select lists in sync with the select element.
 * It listens for changes on the select element and updates the lists accordingly.
 */
export default class SyncManager implements DualMultiSelectModule {

    private readonly abortController = new AbortController();

    constructor(
        private readonly selectElement: HTMLSelectElement,
        private readonly dualMultiSelectElement: HTMLElement,
        private readonly dynamicDataHandler: DynamicDataHandler
    ){
        // Make sure the lists are always in sync with the select element

        this.syncListsWithSelectElement();
        
        this.selectElement.addEventListener('change', this.syncListsWithSelectElement.bind(this), {signal: this.abortController.signal});
    }

    private syncListsWithSelectElement()
    {
        type listData = {
            originalElement: HTMLUListElement,
            copiedElement: HTMLUListElement,
        };

        const lists = {
            selected: {} as listData,
            selectable: {} as listData
        }

        for(const [listName, list] of Object.entries(lists)){

            list.originalElement = this.dualMultiSelectElement.querySelector(`.dms-${listName} .dms-list`) as HTMLUListElement;

            // We operate on shallow copies of the lists outside of the DOM
            // This reduces the number of DOM operations and increases performance
            list.copiedElement = list.originalElement.cloneNode(false) as HTMLUListElement;
        }

        const selectElementData = this.dynamicDataHandler.getData();

        for(const [internalElementId, internalOptionOrOptGroupElementData] of Object.entries(selectElementData)){
            if(internalOptionOrOptGroupElementData.hasOwnProperty('children')){
            
                // Is optGroup
                const optGroupData = internalOptionOrOptGroupElementData as InternalOptGroupElementData;

                // Depending on which options are selected, the optGroup will be append to either 1 or both of the lists
                const optGroupElements = {
                    selectable: null as HTMLElement|null,
                    selected: null as HTMLElement|null
                }

                for(const [childInternalElementId, optionData] of Object.entries(optGroupData.children)){

                    // Don't create hidden options
                    if(optionData.hidden) continue;

                    const relevantListName = optionData.selected ? 'selected' : 'selectable';
                    const relevantList = lists[relevantListName].copiedElement;

                    // Make sure the option group exists in the relevant list
                    if(optGroupElements[relevantListName] === null)
                        optGroupElements[relevantListName] = this.createOptGroupElement(optGroupData.label, internalElementId, relevantList);

                    const optGroupListElement = optGroupElements[relevantListName].querySelector('ul') as HTMLElement;

                    this.createOptionElement(
                        optionData.text,
                        optionData.disabled,
                        childInternalElementId,
                        optGroupListElement
                    );

                }

            } else {
                
                // Is option
                const optionData = internalOptionOrOptGroupElementData as InternalOptionElementData;

                // Don't create hidden options
                if(optionData.hidden) continue;

                const relevantListName = optionData.selected ? 'selected' : 'selectable';
                const relevantList = lists[relevantListName].copiedElement;

                this.createOptionElement(
                    optionData.text,
                    optionData.disabled,
                    internalElementId,
                    relevantList
                );

            }
        }

        // Replace the original lists with the copied lists
        // And make sure the scroll position is maintained
        for(const list of Object.values(lists)){
            const originalScrollTop = list.originalElement.scrollTop;
            list.originalElement.replaceWith(list.copiedElement);
            list.copiedElement.scrollTop = originalScrollTop;
        }

    }

    /**
     * Create the equivalent of an option element in the dual multi select lists.
     */
    private createOptionElement(
        text: string,
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
    
    public destroy(): void
    {
        this.abortController.abort();
    }

}