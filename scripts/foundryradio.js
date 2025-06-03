const foundryRadioModuleName = 'foundry-radio'

class FoundryRadio extends Application {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: foundryRadioModuleName,
            title: 'Foundry Radio',
            resizable: false,
            width: 300,
            height: 400,
            template: "modules/foundry-radio/templates/foundryradio.html",
            classes: ["foundry-radio"]
        });
    }

    getData() {
        return {
            FoundryRadioTitle: game.settings.get(foundryRadioModuleName, 'title'),
            FoundryRadioSong: _getCurrentSound(_getPlaylist())?.name ?? 'No Song Playing'
        }
    }

    // activate not active, I am so dumb
    activateListeners(html) {
        super.activateListeners(html);

        // Bind buttons
        html.find('#stop-btn').click(() => {
            // ui.notifications.warn(`${foundryRadioModuleName} | Stop sound!`);
            _stopCurrentSound(_getPlaylist());
        });
        html.find('#next-btn').click(() => {
            // ui.notifications.warn(`${foundryRadioModuleName} | Next sound!`);
            _nextSound(_getPlaylist());
        });

        // Populate playlist dropdown
        const $select = html.find('#playlist-select');
        $select.empty();

        // Add playlists
        for (const playlist of game.playlists.contents) {
            const option = $(`<option value="${playlist.id}">${playlist.name}</option>`);
            $select.append(option);
        }

        // Select the first playlist by default (if any)
        const firstPlaylist = game.playlists.contents[0];
        if (firstPlaylist) {
            $select.val(firstPlaylist.id);
            this.selectedPlaylistId = firstPlaylist.id;
            this._renderSoundList(html);
        }

        // Listen for changes
        $select.on('change', ev => {
            this.selectedPlaylistId = ev.target.value;
            this._renderSoundList(html);
        });
    }


    _renderSoundList(html) {
        const playlist = game.playlists.get(this.selectedPlaylistId);
        const $sounds = html.find('#playlist-sounds');
        $sounds.empty();

        if (!playlist) return;

        for (const sound of playlist.sounds) {
            $sounds.append(`<div class="playlist-sound">${sound.name}</div>`);
        }
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

function _getCurrentSound(playlist) {
    // const playlist = _getPlaylist();
    if (!playlist) return null;

    const [currentSound] = playlist.sounds.filter(sound => sound.playing);
    return currentSound ?? null;
};

async function _nextSound(playlist) {
    // const playlist = _getPlaylist();
    if (!playlist) {
        ui.notifications.warn("No playlist is currently playing.");
        return;
    };

    playlist.playNext();

};

function _getAvailablePlaylists() {
    return game.playlists.map(p => p.name);
};

async function _stopCurrentSound(playlist) {

    const currentSound = _getCurrentSound(playlist)
    if (!currentSound) return null;

    playlist.stopSound(currentSound);

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

Hooks.on("updatePlaylist", () => {

    // when the playlist Sound is getting updated, fire here
    // ui.notifications.warn(`${foundryRadioModuleName} | Song updated to ${_getCurrentSound()}`)
    const radioSongText = document.querySelector('.radio-song');
    radioSongText.innerHTML = `<h3>${_getCurrentSound(_getPlaylist())?.name ?? 'No Song Playing'}</h3>`;

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
