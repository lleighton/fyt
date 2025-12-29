import { Observable } from '@legendapp/state';

declare function useHover<T extends HTMLElement>(ref: React.MutableRefObject<T>): Observable<boolean>;

export { useHover };
