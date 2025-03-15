import { DualMultiSelectModule } from '../core/types';

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

    constructor(private readonly dualMultiSelectElement: HTMLElement, private readonly options: Options = {}){

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
        const self = this;
        const searchElement = this.createSearchHeaderElement();

        searchElement.addEventListener('input', function(){
            self.filterOptions(searchElement.value);
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

    private filterOptions(query: string): void
    {
        const optGroupElements = this.dualMultiSelectElement.querySelectorAll('.dms-optGroup') as NodeListOf<HTMLElement>;
        const optionElements = this.dualMultiSelectElement.querySelectorAll('.dms-option') as NodeListOf<HTMLElement>;

        optionElements.forEach((optionElement) => {

            const optionText = optionElement.textContent?.toLowerCase() || '';

            const match = this.searchFunction(query, optionText);

            if(match)
                optionElement.style.display = '';
            else
                optionElement.style.display = 'none';
            
        });

        optGroupElements.forEach((optGroupElement) => {

            const optGroupText = optGroupElement.querySelector('.dms-optGroupLabel')?.textContent?.toLowerCase() || '';
            const visibleChildren = optGroupElement.querySelectorAll('.dms-option:not([style="display: none;"])');

            const match = this.searchFunction(query, optGroupText);

            if(match || visibleChildren.length > 0)
                optGroupElement.style.display = '';
            else
                optGroupElement.style.display = 'none';

        });
    }

    private searchFunction(searchQuery: string, optionText: string): boolean
    {
        return optionText.toLowerCase().includes(searchQuery.toLowerCase());
    }

    public destroy(): void
    {
        this.abortController.abort();
    }

}