import { DualMultiSelectModule } from '../types/types';
import { internalElementIdDataAttribute } from './utils';

export interface Options {
    selectableOptionGroups?: boolean;
}

/**
 * Event Handler
 * 
 * Handles any click events on the DualMultiSelect element and
 * enacts the necessary changes to the original select element.
 */
export default class EventHandler implements DualMultiSelectModule {

    private readonly abortController = new AbortController();

    private readonly defaultOptions = {
        selectableOptionGroups: true
    }

    constructor(
        private readonly selectElement: HTMLSelectElement,
        private readonly dualMultiSelectElement: HTMLElement,
        private readonly options: Options = {}
    ){
        // Merge default options with user options
        this.options = {...this.defaultOptions, ...this.options};

        // Listen for any click events on the DualMultiSelect element
        this.dualMultiSelectElement.addEventListener('click', this.handleClickEvent.bind(this), {signal: this.abortController.signal});
    }
    
    private handleClickEvent(event: Event): void
    {
        const target = event.target as HTMLElement;
        const relevantList = target.closest('.dms-selectable, .dms-selected');
        const clickedOption = target.closest('.dms-option, .dms-optGroup');
        const closestList = target.closest('.dms-list');

        // Focus the relevant list
        if(closestList instanceof HTMLElement)
            closestList.focus();

        // Handle option/optGroup click
        if(relevantList instanceof HTMLElement && clickedOption instanceof HTMLElement){

            const elementIsSelected = relevantList.classList.contains('dms-selected');

            let changesMade = false;
            if(clickedOption.classList.contains('dms-option')){
                changesMade = this.handleOptionClick(clickedOption, elementIsSelected);
            } else if(clickedOption.classList.contains('dms-optGroup') && this.options.selectableOptionGroups){
                changesMade = this.handleOptGroupClick(clickedOption, elementIsSelected);
            }

            // This will trigger a change event on the select element if any changes were made
            // We bubble the event so that it behaves like a normal change event
            if(changesMade) this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));

        }
            
    }

    private handleOptionClick(optionElement: HTMLElement, elementIsSelected: boolean): boolean
    {
        const internalElementId = optionElement.getAttribute(internalElementIdDataAttribute);
        const originalOptionElement = this.selectElement.querySelector(`[${internalElementIdDataAttribute}="${internalElementId}"]`);

        if(originalOptionElement === null)
            throw new Error('The original option element could not be found.');

        if(!(originalOptionElement instanceof HTMLOptionElement))
            throw new Error('The original element is not an option element.');

        // Don't allow selecting disabled options
        if(originalOptionElement.disabled) return false;

        originalOptionElement.selected = !elementIsSelected

        return true;
    }

    private handleOptGroupClick(optGroupElement: HTMLElement, elementIsSelected: boolean): boolean
    {
        let changesMade = false;
        const childOptions = optGroupElement.querySelectorAll('ul > li.dms-option');
        
        for(const optionElement of childOptions){
            if(!(optionElement instanceof HTMLElement)) continue;

            // Hidden children should not be interacted with
            // Children may be hidden if they are filtered out by the search bar
            if(this.elementIsHidden(optionElement)) continue;

            // Simulate a click on each child element
            if(this.handleOptionClick(optionElement, elementIsSelected))
                changesMade = true;
        }

        return changesMade;
    }

    private elementIsHidden(element: HTMLElement): boolean
    {
        return (element.offsetParent === null)
    }

    public destroy(): void
    {
        this.abortController.abort();
    }

}