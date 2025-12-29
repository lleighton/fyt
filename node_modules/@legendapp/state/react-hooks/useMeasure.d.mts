import { ObservableObject } from '@legendapp/state';
import { RefObject } from 'react';

declare function useMeasure(ref: RefObject<HTMLElement>): ObservableObject<{
    width: number | undefined;
    height: number | undefined;
}>;

export { useMeasure };
