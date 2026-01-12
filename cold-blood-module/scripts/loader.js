/**
 * Import Script for Cold Blood Module
 * Handles loading JSON content from the module directory and creating/updating documents.
 */

Hooks.on("ready", () => {
    // Check if User is GM
    if (!game.user.isGM) return;

    // 1. Register a dummy setting so the module appears in the Settings List
    game.settings.register("cold-blood-module", "show-config", {
        name: "Enable Import Menu",
        hint: "Keeps the module visible in settings.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    // 2. Register the Menu
    game.settings.registerMenu("cold-blood-module", "importConfig", {
        name: "Import Adventure Content",
        label: "Launch Importer",
        hint: "Import Actors, Journals, and Scenes for the Cold Blood adventure.",
        icon: "fas fa-file-import",
        type: ColdBloodImporter,
        restricted: true
    });
});

class ColdBloodImporter extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "cold-blood-importer",
            title: "Cold Blood Adventure Importer",
            template: "modules/cold-blood-module/scripts/importer-template.html",
            width: 400,
            height: "auto",
            closeOnSubmit: true
        });
    }

    getData() {
        return {};
    }

    async _updateObject(event, formData) {
        // This is called on Submit
        await importColdBloodContent();
    }
}

async function importColdBloodContent() {
    ui.notifications.info("Cold Blood: Starting Import...");

    const contentFiles = [
        { path: "modules/cold-blood-module/content/item_sapphire_necklace.json", type: "Item" },
        { path: "modules/cold-blood-module/content/item_cloak_of_elvenkind.json", type: "Item" },
        { path: "modules/cold-blood-module/content/cryovain.json", type: "Actor" },
        { path: "modules/cold-blood-module/content/grimjaw.json", type: "Actor" },
        { path: "modules/cold-blood-module/content/water_weird.json", type: "Actor" },
        { path: "modules/cold-blood-module/content/mira_vane.json", type: "Actor" },
        { path: "modules/cold-blood-module/content/aldric_vane.json", type: "Actor" },
        { path: "modules/cold-blood-module/content/journal_cold_blood.json", type: "JournalEntry" },
        { path: "modules/cold-blood-module/content/scene_cold_blood.json", type: "Scene" }
    ];

    for (const file of contentFiles) {
        try {
            // Fetch JSON
            const response = await fetch(file.path);
            if (!response.ok) throw new Error(`File not found: ${file.path}`);
            const data = await response.json();

            // Get Document Class
            const cls = getDocumentClass(file.type);
            if (!cls) throw new Error(`Unknown Document Type: ${file.type}`);

            // Get Collection (Robust Lookup)
            const collectionName = cls.metadata?.collection || cls.collectionName;
            let collection = game.collections.get(collectionName);
            
            // Fallbacks
            if (!collection) {
                if (file.type === "Actor") collection = game.actors;
                else if (file.type === "Item") collection = game.items;
                else if (file.type === "Scene") collection = game.scenes;
                else if (file.type === "JournalEntry") collection = game.journal;
            }

            if (!collection) throw new Error(`Collection not found for ${file.type} (looked for: ${collectionName})`);

            // Check existence
            const existing = collection.get(data._id);

            if (existing) {
                await existing.update(data);
                console.log(`[Cold Blood] Updated ${file.type}: ${data.name}`);
            } else {
                await cls.create(data, { keepId: true });
                console.log(`[Cold Blood] Created ${file.type}: ${data.name}`);
            }

        } catch (err) {
            console.error(`[Cold Blood] Import Failed for ${file.path}:`, err);
            ui.notifications.error(`Import Error: ${err.message}`);
        }
    }

    ui.notifications.info("Cold Blood: Import Complete!");
}
