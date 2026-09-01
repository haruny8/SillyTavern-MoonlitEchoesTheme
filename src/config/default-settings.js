import { themeCustomSettings } from './theme-settings.js';
import { activePresetKeys, activeThemeKeys } from '../services/settings-service.js';

/**
 * Generate default settings snapshot used for initial bootstrapping.
 * This mirrors the original inline logic so existing behaviour stays the same.
 */
function generateDefaultSettings() {
    const settings = {
        enabled: true,
        useOriginalAvatarImages: false,
        presets: {
            "Moonlit Echoes - by Rivelle": {}
        },
        activePreset: "Moonlit Echoes - by Rivelle",
        [activePresetKeys.desktop]: "Moonlit Echoes - by Rivelle",
        [activePresetKeys.mobile]: "Moonlit Echoes - by Rivelle",
        [activeThemeKeys.desktop]: '',
        [activeThemeKeys.mobile]: ''
    };

    themeCustomSettings.forEach((setting) => {
        settings[setting.varId] = setting.default;
        settings.presets["Moonlit Echoes - by Rivelle"][setting.varId] = setting.default;
    });

    return Object.freeze(settings);
}

export const defaultSettings = generateDefaultSettings();

function normalizePresetNames(settings) {
    const presets = settings.presets || {};
    const normalizedPresets = {};
    const renamedPresets = new Map();

    for (const [presetName, presetSettings] of Object.entries(presets)) {
        const normalizedName = presetName.trim();
        if (normalizedName !== presetName && !Object.hasOwn(presets, normalizedName)) {
            renamedPresets.set(presetName, normalizedName);
            normalizedPresets[normalizedName] = presetSettings;
        } else {
            normalizedPresets[presetName] = presetSettings;
        }
    }

    if (renamedPresets.size === 0) {
        return;
    }

    settings.presets = normalizedPresets;

    for (const key of ['activePreset', ...Object.values(activePresetKeys)]) {
        const normalizedName = renamedPresets.get(settings[key]);
        if (normalizedName) {
            settings[key] = normalizedName;
        }
    }
}

/**
 * Ensure the settings structure is up-to-date.
 * @param {Object} settings - Settings object
 */
export function ensureSettingsStructure(settings) {
    if (!settings.presets) {
        settings.presets = {};
    }

    normalizePresetNames(settings);

    if (Object.keys(settings.presets).length === 0) {
        settings.presets["Moonlit Echoes - by Rivelle"] = {};

        themeCustomSettings.forEach((setting) => {
            const { varId } = setting;
            if (settings[varId] !== undefined) {
                settings.presets["Moonlit Echoes - by Rivelle"][varId] = settings[varId];
            } else {
                settings.presets["Moonlit Echoes - by Rivelle"][varId] = setting.default;
            }
        });
    }

    if (!settings.activePreset || !settings.presets[settings.activePreset]) {
        const firstPreset = Object.keys(settings.presets)[0] || "Moonlit Echoes - by Rivelle";
        settings.activePreset = firstPreset;
    }

    if (settings.presets["Moonlit Echoes"]) {
        if (!settings.presets["Moonlit Echoes - by Rivelle"]) {
            settings.presets["Moonlit Echoes - by Rivelle"] = settings.presets["Moonlit Echoes"];
        }

        delete settings.presets["Moonlit Echoes"];

        if (settings.activePreset === "Moonlit Echoes") {
            settings.activePreset = "Moonlit Echoes - by Rivelle";
        }
    }

    const presetNames = Object.keys(settings.presets);
    const fallbackPreset = settings.presets[settings.activePreset]
        ? settings.activePreset
        : presetNames[0] || "Moonlit Echoes - by Rivelle";

    for (const [platform, key] of Object.entries(activePresetKeys)) {
        if (settings[key] && settings.presets[settings[key]]) {
            continue;
        }

        const platformSuffix = platform === 'mobile' ? ' - MOBILE' : ' - PC';
        const platformPreset = presetNames.find((presetName) =>
            presetName.toUpperCase().endsWith(platformSuffix)
        );
        settings[key] = platformPreset || fallbackPreset;
    }

    const currentKey = Object.values(activePresetKeys).find((key) => settings[key] === settings.activePreset);
    if (!currentKey) {
        settings.activePreset = settings[activePresetKeys.desktop] || fallbackPreset;
    }
}
