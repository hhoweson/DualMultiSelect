import { DualMultiSelectModule } from '../types/types';

export interface Options {
    stackLists?: boolean;
    stickyHeaders?: boolean;
}

/**
 * SkeletonBuilder
 * 
 * This class is responsible for creating the skeleton of the dual multi select element.
 * It hides the original select element and inserts the new dual multi select element after it.
 * It does this on instantiation and should not be used after that.
 */
export default class SkeletonBuilder implements DualMultiSelectModule {

    public dualMultiSelectElement: HTMLElement;

    private initialSelectElementStyling: Record<string, string> = {};

    private readonly defaultOptions = {
        stackLists: false,
        stickyHeaders: false
    }

    constructor(
        private readonly selectElement: HTMLSelectElement,
        private readonly options: Options = {})
    {
        // Merge default options with user options
        this.options = {...this.defaultOptions, ...this.options};

        // Create html structure
        this.dualMultiSelectElement = this.createDualMultiSelectElement();

        // Hide the original select element and insert the new dualMultiSelectElement after it
        this.hideSelectElement();
        this.selectElement.insertAdjacentElement('afterend', this.dualMultiSelectElement);
    }

    private createDualMultiSelectElement(): HTMLElement
    {
        const container = this.createPrimaryContainer();

        const selectableContainer = this.createSelectableContainer();
        selectableContainer.appendChild(this.createListElement());
        container.appendChild(selectableContainer);

        const arrows = this.createArrowsElement();
        container.appendChild(arrows);

        const selectedContainer = this.createSelectedContainer();
        selectedContainer.appendChild(this.createListElement());
        container.appendChild(selectedContainer);

        return container;
    }

    private createPrimaryContainer(): HTMLElement
    {
        const container = document.createElement('div');
        container.classList.add('dms-container');

        // Apply optional classes
        if(!!this.options.stackLists) container.classList.add('dms-stackLists');
        if(!!this.options.stickyHeaders) container.classList.add('dms-stickyHeaders');

        return container;   
    }

    private createSelectableContainer(): HTMLElement
    {
        const selectableContainer = document.createElement('div');
        selectableContainer.classList.add('dms-selectable');
        return selectableContainer;
    }

    private createSelectedContainer(): HTMLElement
    {
        const selectedContainer = document.createElement('div');
        selectedContainer.classList.add('dms-selected');
        return selectedContainer;
    }

    private createListElement(): HTMLElement
    {
        const listElement = document.createElement('ul');
        listElement.classList.add('dms-list');
        listElement.setAttribute('tabindex', '0'); // Make the list focusable
        return listElement;
    }

    private createArrowsElement(): HTMLElement
    {
        const arrowsElement = document.createElement('div');
        arrowsElement.classList.add('dms-arrows');
        return arrowsElement
    }

    private hideSelectElement(): void
    {
        const stylingOverrides = {
            'position': 'absolute', // Make sure the select element does not affect the layout
            'pointer-events': 'none', // Make sure the select element is not clickable
            // Hide the select element off screen
            'left': '-9999px',
            'opacity': '0',
            'width': '1px',
            'height': '1px',
        };

        for(const [styleName, styleDeclaration] of Object.entries(stylingOverrides)){

            // Save old styles
            this.initialSelectElementStyling[styleName] = this.selectElement.style.getPropertyValue(styleName);

            // Apply new styles
            // We use !important to make sure the styles aren't overwritten by bootstrap or other css frameworks
            this.selectElement.style.setProperty(styleName, styleDeclaration, 'important');

        }
    }

    public destroy(): void
    {
        // Reset the original select element styling
        for(const [styleName, styleDeclaration] of Object.entries(this.initialSelectElementStyling)){
            this.selectElement.style.setProperty(styleName, styleDeclaration);
        }
        // Remove the dual multi select element
        this.dualMultiSelectElement.remove();
    }

}