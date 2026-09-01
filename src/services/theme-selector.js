import { addThemeButtonsHint } from './hints.js';
import {
    activeThemeKeys,
    getActivePresetName,
    getActiveThemeName,
    getSettings as getExtensionSettings,
    resolvePresetName,
    setActiveThemeName,
} from './settings-service.js';
import {
    importPreset,
    exportActivePreset,
    updateCurrentPreset,
    saveAsNewPreset,
    deleteCurrentPreset,
    loadPreset,
    handleMoonlitPresetImport,
} from '../ui/preset-manager.js';

const MOONLIT_LISTENER_KEY = '__moonlitEchoesListeners';
let restoringActiveTheme = false;

export function integrateWithThemeSelector() {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) {
        return;
    }

    const importButton = document.getElementById('ui_preset_import_button');
    const exportButton = document.getElementById('ui_preset_export_button');
    const deleteButton = document.getElementById('ui-preset-delete-button');
    const updateButton = document.getElementById('ui-preset-update-button');
    const saveButton = document.getElementById('ui-preset-save-button');
    const importFileInput = document.getElementById('ui_preset_import_file');

    attachMoonlitListener(themeSelector, 'change', handleMoonlitThemeChange);

    syncThemeSelectorToActiveSelections(themeSelector);

    if (importButton && importFileInput) {
        attachMoonlitListener(importButton, 'click', handleMoonlitImportButtonClick);
    }

    attachMoonlitListener(exportButton, 'click', handleMoonlitExportButtonClick);
    attachMoonlitListener(updateButton, 'click', handleMoonlitUpdateButtonClick);
    attachMoonlitListener(saveButton, 'click', handleMoonlitSaveButtonClick);
    attachMoonlitListener(deleteButton, 'click', handleMoonlitDeleteButtonClick);
    attachMoonlitListener(importFileInput, 'change', handleMoonlitPresetFileImport);

    addThemeButtonsHint();
}

function attachMoonlitListener(element, eventType, handler) {
    if (!element || typeof element.addEventListener !== 'function') return;

    if (!element[MOONLIT_LISTENER_KEY]) {
        element[MOONLIT_LISTENER_KEY] = {};
    }

    const attachedHandlers = element[MOONLIT_LISTENER_KEY];
    if (attachedHandlers[eventType] === handler) {
        return;
    }

    if (attachedHandlers[eventType]) {
        element.removeEventListener(eventType, attachedHandlers[eventType]);
    }

    element.addEventListener(eventType, handler);
    attachedHandlers[eventType] = handler;
}

function getMoonlitSettings() {
    const context = SillyTavern.getContext();
    return getExtensionSettings(context) || {};
}

function getMoonlitPresetName(presetName) {
    if (!presetName) return undefined;
    const settings = getMoonlitSettings();
    const presets = settings.presets || {};
    const resolvedPresetName = resolvePresetName(settings, presetName);
    return Object.prototype.hasOwnProperty.call(presets, resolvedPresetName) ? resolvedPresetName : undefined;
}

function isMoonlitPresetSelected() {
    const themeSelector = document.getElementById('themes');
    if (!themeSelector) return false;
    return !!getMoonlitPresetName(themeSelector.value);
}

function handleMoonlitThemeChange(event) {
    const themeSelector = event?.currentTarget ?? document.getElementById('themes');
    if (!themeSelector) return;

    const selectedTheme = themeSelector.value;
    const settings = getMoonlitSettings();
    const selectedPreset = getMoonlitPresetName(selectedTheme);
    setActiveThemeName(settings, selectedTheme);

    if (restoringActiveTheme || !selectedPreset) {
        SillyTavern.getContext().saveSettingsDebounced();
        return;
    }

    if (getActivePresetName(settings) === selectedPreset) {
        SillyTavern.getContext().saveSettingsDebounced();
        return;
    }

    try {
        loadPreset(selectedPreset);
    } catch (error) {
        // Error handled silently
    }
    SillyTavern.getContext().saveSettingsDebounced();
}

function syncThemeSelectorToActiveSelections(themeSelector) {
    const settings = getMoonlitSettings();
    const activePreset = getActivePresetName(settings);
    const currentTheme = themeSelector.value;
    const themesInitialized = initializeActiveThemeSelections(settings, currentTheme, themeSelector);

    if (themesInitialized) {
        SillyTavern.getContext().saveSettingsDebounced();
    }

    const activeTheme = getActiveThemeName(settings) || activePreset;
    if (!activeTheme) return;

    const matchingOption = Array.from(themeSelector.options).find((option) => option.value === activeTheme);
    if (!matchingOption) return;

    themeSelector.value = activeTheme;
    restoringActiveTheme = true;
    try {
        themeSelector.dispatchEvent(new Event('change'));
    } finally {
        restoringActiveTheme = false;
    }
}

function initializeActiveThemeSelections(settings, currentTheme, themeSelector) {
    if (!settings || !currentTheme) return false;

    const availableThemes = new Set(Array.from(themeSelector.options, (option) => option.value));
    const desktopTheme = settings[activeThemeKeys.desktop];
    const mobileTheme = settings[activeThemeKeys.mobile];
    let changed = false;

    if (!availableThemes.has(desktopTheme)) {
        const platformTheme = getPlatformThemeName(currentTheme, 'MOBILE', 'PC');
        settings[activeThemeKeys.desktop] = availableThemes.has(platformTheme) ? platformTheme : currentTheme;
        changed = true;
    }

    if (!availableThemes.has(mobileTheme)) {
        const platformTheme = getPlatformThemeName(currentTheme, 'PC', 'MOBILE');
        settings[activeThemeKeys.mobile] = availableThemes.has(platformTheme) ? platformTheme : currentTheme;
        changed = true;
    }

    if (!settings[activeThemeKeys.desktop]) {
        settings[activeThemeKeys.desktop] = currentTheme;
        changed = true;
    }

    if (!settings[activeThemeKeys.mobile]) {
        settings[activeThemeKeys.mobile] = currentTheme;
        changed = true;
    }

    return changed;
}

function getPlatformThemeName(themeName, fromPlatform, toPlatform) {
    const suffix = ` - ${fromPlatform}`;
    if (!themeName.toUpperCase().endsWith(suffix)) {
        return themeName;
    }

    return `${themeName.slice(0, -suffix.length)} - ${toPlatform}`;
}

function handleMoonlitImportButtonClick() {
    if (isMoonlitPresetSelected()) {
        importPreset();
    }
}

function handleMoonlitExportButtonClick() {
    if (isMoonlitPresetSelected()) {
        exportActivePreset();
    }
}

function handleMoonlitUpdateButtonClick() {
    if (isMoonlitPresetSelected()) {
        updateCurrentPreset();
    }
}

function handleMoonlitSaveButtonClick() {
    if (isMoonlitPresetSelected()) {
        saveAsNewPreset();
    }
}

function handleMoonlitDeleteButtonClick() {
    if (isMoonlitPresetSelected()) {
        deleteCurrentPreset();
    }
}

function handleMoonlitPresetFileImport(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);
            if (jsonData.moonlitEchoesPreset) {
                handleMoonlitPresetImport(jsonData);
            }
        } catch (error) {
            // Error handled silently
        }
    };
    reader.readAsText(file);
}
