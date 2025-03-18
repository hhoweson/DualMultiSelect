import {
    DualMultiSelectModule,
    UniversalOptionData,
    OptionElementData,
    OptGroupElementData
} from '../types/types';

export interface Options {
    searchBar?: boolean;
    selectableHeader?: HTMLElement | string | null;
    selectedHeader?: HTMLElement | string | null;
}

export default class CustomHeaders implements DualMultiSelectModule {

    private readonly abortController = new AbortController();

    private readonly defaultOptions = {
        searchBar: false,
        selectableHeader: null,
        selectedHeader: null
    }

    constructor(
        private readonly dualMultiSelectElement: HTMLElement,
        private readonly getSelectElementData: () => UniversalOptionData,
        private readonly setSelectElementData: (data: UniversalOptionData) => void,
        private readonly options: Options = {}
    ){

        // Merge default options with user options
        this.options = {...this.defaultOptions, ...this.options};

        const selectableListContainer = this.dualMultiSelectElement.querySelector('.dms-selectable') as HTMLElement;
        const selectedListContainer = this.dualMultiSelectElement.querySelector('.dms-selected') as HTMLElement;

        if(this.options.selectableHeader && this.options.searchBar)
            throw new Error('The selectableHeader and searchBar options cannot be used together.');
        else if(this.options.searchBar)
            this.createSearchBar(selectableListContainer);
        else if(this.options.selectableHeader)
            this.createHeader(this.options.selectableHeader, selectableListContainer);

        if(this.options.selectedHeader)
            this.createHeader(this.options.selectedHeader, selectedListContainer);

    }

    private createHeader(header: Options['selectableHeader'] | Options['selectedHeader'], listContainer: HTMLElement): void
    {
        let headerElement: HTMLElement;

        if(typeof header === 'string'){
            headerElement = this.createDefaultHeaderElement(header);
        } else if(header instanceof HTMLElement){
            headerElement = header;
        } else {
            throw new Error('The provided header is not a valid HTMLElement or string');
        }

        // Insert the header at the top of the listContainer
        listContainer.insertAdjacentElement('afterbegin', headerElement);

    }

    private createDefaultHeaderElement(text: string): HTMLElement{
        const headerElement = document.createElement('div');
        headerElement.classList.add('dms-header');
        headerElement.textContent = text;
        return headerElement
    }

    private createSearchBar(listContainer: HTMLElement): void
    {
        const searchElement = this.createSearchHeaderElement();

        let debouncer: ReturnType<typeof setTimeout>|null = null;

        searchElement.addEventListener('input', () => {

            // Sometimes the input event is triggered more quickly than the previous event can be handled
            // This causes searches to queue up, which is slow
            // The debouncer avoids this by skipping the search if another input event is triggered within 1ms (queued up)
            if(debouncer) clearTimeout(debouncer);

            debouncer = setTimeout(() => {
        
                const searchQuery = searchElement.value;

                let universalOptionData = this.getSelectElementData();
                universalOptionData = this.hideOptionsThatDoNotMatchSearchQuery(universalOptionData, searchQuery);
                this.setSelectElementData(universalOptionData);

            }, 1);
            
        }, { signal: this.abortController.signal });

        this.createHeader(searchElement, listContainer);
    }

    private createSearchHeaderElement(): HTMLInputElement
    {
        const searchInput = document.createElement('input');
        searchInput.classList.add('dms-search');
        searchInput.setAttribute('type', 'search');
        searchInput.setAttribute('placeholder', 'Search');
        return searchInput;
    }

    private hideOptionsThatDoNotMatchSearchQuery(universalOptionData: UniversalOptionData, searchQuery: string): UniversalOptionData
    {
        return universalOptionData.map(internalOptionOrOptGroupElementData => {
            if(internalOptionOrOptGroupElementData.hasOwnProperty('children')){

                // Is optGroup
                const optGroupData = internalOptionOrOptGroupElementData as OptGroupElementData;

                optGroupData.children = optGroupData.children.map(optionData => {
                    optionData.hidden = !this.searchFunction(searchQuery, optionData, optGroupData);
                    return optionData;
                });

                return optGroupData;

            } else {

                // Is option
                const optionData = internalOptionOrOptGroupElementData as OptionElementData;
                optionData.hidden = !this.searchFunction(searchQuery, optionData, null);
                return optionData;

            }
        });
    }

    private searchFunction(searchQuery: string, optionData: OptionElementData, optGroupData: OptGroupElementData|null): boolean
    {
        if(optGroupData !== null && this.stringContainsSubstring(optGroupData.label, searchQuery))
            return true;

        if(this.stringContainsSubstring(optionData.text, searchQuery))
            return true;

        return false;
    }

    private stringContainsSubstring(string: string, substring: string): boolean
    {
        return string.toLowerCase().includes(substring.toLowerCase());
    }

    public destroy(): void
    {
        this.abortController.abort();
    }

}