import { OptionElementData, OptGroupElementData, UniversalOptionData, DualMultiSelectModule } from '../types/types';

/**
 * Dynamic Data Handler
 * 
 * This class is responsible for handling dynamic data.
 * eg. When the original select element needs to be programmatically updated, either at runtime or during initialization.
 */
export default class DynamicDataHandler implements DualMultiSelectModule {

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

    public destroy(): void
    {
        // Nothing to destroy
    }
    
}