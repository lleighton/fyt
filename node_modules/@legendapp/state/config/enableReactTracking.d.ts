interface ReactTrackingOptions {
    auto?: boolean;
    warnUnobserved?: boolean;
    warnMissingUse?: boolean;
}
declare function enableReactTracking({ auto, warnUnobserved, warnMissingUse }: ReactTrackingOptions): void;

export { enableReactTracking };
