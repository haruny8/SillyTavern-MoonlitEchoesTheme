export const settingsKey = 'SillyTavernMoonlitEchoesTheme';

export const activePresetKeys = Object.freeze({
    desktop: 'activePresetDesktop',
    mobile: 'activePresetMobile',
});

export const activeThemeKeys = Object.freeze({
    desktop: 'activeThemeDesktop',
    mobile: 'activeThemeMobile',
});

export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function getActivePresetKey() {
    return isMobileDevice() ? activePresetKeys.mobile : activePresetKeys.desktop;
}

export function resolvePresetName(settings, presetName) {
    if (!settings?.presets || !presetName) {
        return presetName;
    }

    if (settings.presets[presetName]) {
        return presetName;
    }

    const trimmedPresetName = presetName.trim();
    return Object.keys(settings.presets).find((name) => name.trim() === trimmedPresetName) || presetName;
}

export function getActivePresetName(settings) {
    if (!settings) return undefined;
    const activePreset = settings[getActivePresetKey()] || settings.activePreset;
    return resolvePresetName(settings, activePreset);
}

export function setActivePresetName(settings, presetName) {
    if (!settings) return;
    const resolvedPresetName = resolvePresetName(settings, presetName);
    settings[getActivePresetKey()] = resolvedPresetName;
    settings.activePreset = resolvedPresetName;
}

export function getActiveThemeName(settings) {
    if (!settings) return undefined;
    const key = isMobileDevice() ? activeThemeKeys.mobile : activeThemeKeys.desktop;
    return settings[key];
}

export function setActiveThemeName(settings, themeName) {
    if (!settings) return;
    const key = isMobileDevice() ? activeThemeKeys.mobile : activeThemeKeys.desktop;
    settings[key] = themeName;
}

/**
 * Retrieve the Moonlit Echoes settings object from the current context.
 * @param {object} [context=SillyTavern.getContext()] - Optional SillyTavern context.
 * @returns {object} Settings object for this extension.
 */
export function getSettings(context = SillyTavern.getContext()) {
    return context.extensionSettings[settingsKey];
}

/**
 * Persist the current settings via SillyTavern's debounced saver.
 * @param {object} [context=SillyTavern.getContext()] - Optional SillyTavern context.
 */
export function saveSettings(context = SillyTavern.getContext()) {
    context.saveSettingsDebounced();
}
