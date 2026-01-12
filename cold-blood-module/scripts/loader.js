/**
 * Import Script for Cold Blood Module
 * Handles loading JSON content from the module directory and creating/updating documents.
 */

Hooks.on("renderCompendiumDirectory", (app, html, data) => {
    // Check if User is GM
    if (!game.user.isGM) return;

    // Add Import Button to Compendium Sidebar
    const button = $(`<button style="min-width: 96%; margin: 10px 2%;" type="button"><i class="fas fa-dungeon"></i> Import Cold Blood Adventure</button>`);

    button.click(async () => {
        new Dialog({
            title: "Import Cold Blood Adventure",
            content: `
                <p>This will import the following content into your World:</p>
                <ul>
                    <li>Actor: Cryovain</li>
                    <li>Actor: Grimjaw</li>
                    <li>Actor: Water Weird</li>
                    <li>Actor: Mira Vane</li>
                    <li>Actor: Aldric Vane</li>
                    <li>Journal: Cold Blood</li>
                    <li>Scene: Cold Blood</li>
                </ul>
                <p>Existing documents with the same ID will be updated.</p>
            `,
            buttons: {
                import: {
                    label: "Import Content",
                    icon: '<i class="fas fa-check"></i>',
                    callback: () => importColdBloodContent()
                },
                cancel: {
                    label: "Cancel",
                    icon: '<i class="fas fa-times"></i>'
                }
            },
            default: "import"
        }).render(true);
    });

    // Append to footer
    html.find(".directory-footer").append(button);
});


async function importColdBloodContent() {
    ui.notifications.info("Cold Blood: Starting Import...");

    const contentFiles = [
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

            // Check existence
            const existing = game.collections.get(file.type).get(data._id);

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
