# Cold Blood Module

This module contains the "Cold Blood" adventure content for Foundry VTT.

## Setup Instructions

1. **Install the Module:**
    * Place the `cold-blood-module` folder into your Foundry VTT `Data/modules/` directory.

2. **Add Assets:**
    * The `assets` folder is currently empty. You must populate it with the image files referenced by the JSON data.
    * Navigate to `cold-blood-module/assets/`.
    * Add the following files (ensure filenames match exactly):
        * `mira.webp` (Token/Portrait for Mira Vane)
        * `grimjaw.webp` (Token/Portrait for Grimjaw)
        * `water_weird.webp` (Token/Portrait for Water Weird)
        * `cryovain.webp` (Token/Portrait for Cryovain)
        * `troll.webp` (Token for the Troll in the scene)
        * `scene-background.jpg` (Map background image)
        * `scene-thumb.webp` (Scene thumbnail image)

3. **Activate Module:**
    * Launch your Foundry VTT World.
    * Go to **Game Settings > Manage Modules**.
    * Enable **Cold Blood**.

4. **Import Content:**
    * Open the Compendium Sidebar.
    * Click the **"Import Cold Blood Adventure"** button at the bottom.
    * Wait for the notification confirming "Import Complete!".

## Troubleshooting

* **Missing Images:** If tokens or scenes appear broken, verify that the files in the `assets` folder match the names listed above exactly.
* **Duplicate Data:** The importer will update existing documents if they share the same ID. If you want a fresh copy, delete the Actors/Scenes/Journals from your world before importing.
