const foundryRadioModuleName = 'foundry-radio'

class FoundryRadio extends Application {

    // Please help, I don't know how to get some default stuff to stick. I have it down in the ready hook since I can't figure it :D
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: foundryRadioModuleName,
            title: 'Foundry Radio',
            resizable: false,
            width: 400,
            height: 800,
            template: "modules/foundry-radio/templates/foundryradio.html",
            classes: ["foundry-radio"]
        });
    }

    activeListeners(html) {
        super.activeListeners(html);
    }
};

// open/close the Foundry Radio window
function toggleFoundryRadio() {
    // Ensure an instance exists
    // courtesy of @mxzf from FoundryVTT Discord 
    // JS has a fun little ??= operator, nullish coalescing assignment, which says "if this thing exists, cool; if it doesn't, assign this to it"
    ui['FoundryRadio'] ??= new FoundryRadio();
    // If it's already rendered, close it (this doesn't delete it, it simply closes the app)
    if (ui.FoundryRadio.rendered) ui.FoundryRadio.close();
    // Otherwise, if it's not rendered, render it
    else ui.FoundryRadio.render(true);
};

// Most of these functions are self explanitory by their name
function applyRadioSkin(theme) {
    game.settings.set(foundryRadioModuleName, 'radioSkin', theme);
    document.documentElement.setAttribute('data-radio-theme', theme);
};
function updateRadioFont(selectedFont) {
    document.documentElement?.style.setProperty("--radio-font-family", `"${selectedFont}"`);
};

function _getPlaylist() {
    const [playlist] = game.playlists.playing
    return playlist ?? null;
};

function _getCurrentSong() {
    const playlist = _getPlaylist();
    if (!playlist) return null;

    const [currentSong] = playlist.sounds.filter(sound => sound.playing);
    return currentSong ?? null;
};

async function _nextSong() {
    const playlist = _getPlaylist();
    if (!playlist) {
        ui.notifications.warn("No playlist is currently playing.");
        return;
    };

    playlist.playNext();

};

Hooks.once("init", () => {

    // Set up all the module settings
    game.settings.register(foundryRadioModuleName, 'radioSkin', {
        name: 'Foundry Radio Skin',
        hint: 'Collection of pre-made themes for the Foundry Radio to have a unique style.',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            "cyberpunk-red": "CyberpunkRED",
            "cyberpunk-edgerunners": "Cyberpunk Edgerunner",
            "deep-blue": "Deep Blue",
            "fallout-nuclear": "Fallout Terminal Green",
            "mgs-codec": "MGS Codec"
        },
        default: 'cyberpunk-red',
        onChange: (value) => {
            applyRadioSkin(value)
        },
        requiresReload: false
    });
    game.settings.register(foundryRadioModuleName, 'title', {
        name: 'Foundry Radio Title',
        hint: 'The title of the Foundry Radio window that will show to the players.',
        scope: 'world',
        config: true,
        type: String,
        default: 'Foundry Radio',
        onChange: (value) => {
            let root = document.querySelector(':root');
            root.style.setProperty('--radio-title', `${value}`);
        },
        requiresReload: true
    });

});

// Initialize the scroller when Foundry is ready
Hooks.once("ready", () => {

    // This has to load later since Foundry loads fonts at a different time that is past `init` :(
    game.settings.register(foundryRadioModuleName, 'RadioFont', {
        name: "Radio Font",
        hint: "Select the font for the Foundry Radio. Supports Custom Fonts if uploaded to Foundry Font Settings.",
        scope: "client",
        config: true,
        type: String,
        choices: Object.fromEntries(Object.keys(FontConfig.getAvailableFontChoices()).map(f => [f, f])), // Get all fonts that are available for edit in Foundry, including custom upload
        default: "Orbitron",
        onChange: (value) => {
            updateRadioFont(value);
            game.settings.set(foundryRadioModuleName, 'RadioFont', value);
        },
        requiresReload: false
    });


    // Added these all down here since this is how I could get the settings to be 'retained' upon reloading. I still do not understand it.
    applyRadioSkin(game.settings.get(foundryRadioModuleName, 'radioSkin'));
    updateRadioFont(game.settings.get(foundryRadioModuleName, 'RadioFont'));

});
