import {
    UniversalOptionData,
    InternalUniversalOptionData,
    InternalOptGroupElementData,
    InternalOptionElementData,
    OptionElementData,
    OptGroupElementData
} from '../types/types';

// We use these ids to link the internal elements to the
// original select options so that we can keep them in sync and handles events
export const internalElementIdDataAttribute = 'data-dms-internal-id';

export function convertInternalUniversalOptionDataToUniversalOptionData(internalUniversalOptionData: InternalUniversalOptionData): UniversalOptionData
{
    const universalOptionData: UniversalOptionData = [];

    for(const internalOptionOrOptGroupElementData of Object.values(internalUniversalOptionData)){
        if(internalOptionOrOptGroupElementData.hasOwnProperty('children')){
            // Is optGroup
            const internalOptGroupData = internalOptionOrOptGroupElementData as InternalOptGroupElementData;

            const optGroupData = {
                ...internalOptGroupData,
                children: convertInternalUniversalOptionDataToUniversalOptionData(internalOptGroupData.children)
            } as OptGroupElementData;

            universalOptionData.push(optGroupData);
        } else {
            // Is option
            const internalOptionData = internalOptionOrOptGroupElementData as InternalOptionElementData;

            // No changes required
            const optionData = internalOptionData as OptionElementData;

            universalOptionData.push(optionData);
        }
    }

    return universalOptionData;
}