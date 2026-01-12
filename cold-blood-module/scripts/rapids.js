/**
 * Cold Blood Module - Rapids Logic
 * Handles the logic for the "River Deep Rapids" region behavior.
 */

window.ColdBlood = window.ColdBlood || {};

window.ColdBlood.handleRapids = async function (event) {
    // Get token and actor from the event data
    const tokenDoc = event.data.token;
    const actor = game.actors.get(tokenDoc.actorId);
    const movement = event.data.movement;

    if (!tokenDoc || !actor || !movement) {
        console.warn("Rapids: Could not get token, actor, or movement from event");
        return;
    }

    // Only run for the user who initiated the movement
    if (game.user.id !== event.user?.id) {
        // console.log("Rapids: Skipping - not the initiating user");
        return;
    }

    // Prevent re-triggering
    const flagKey = "rapidsCheckInProgress";
    if (tokenDoc.getFlag("world", flagKey)) {
        return;
    }

    await tokenDoc.setFlag("world", flagKey, true);

    // Store coordinates
    const originX = movement.origin.x;
    const originY = movement.origin.y;
    const regionEntryX = movement.destination.x;
    const regionEntryY = movement.destination.y;

    // Get TRUE destination from last pending waypoint
    const pendingWaypoints = movement.pending?.waypoints;
    let trueDestX = regionEntryX;
    let trueDestY = regionEntryY;
    if (pendingWaypoints && pendingWaypoints.length > 0) {
        const lastWaypoint = pendingWaypoints[pendingWaypoints.length - 1];
        trueDestX = lastWaypoint.x;
        trueDestY = lastWaypoint.y;
    }

    const gridSize = canvas.grid.size;
    const tokenId = tokenDoc.id;
    const actorId = actor.id;

    console.log("=== RAPIDS ===");
    console.log("Origin:", originX, originY);
    console.log("Region entry:", regionEntryX, regionEntryY);
    console.log("True destination:", trueDestX, trueDestY);

    // Schedule after Foundry's movement completes
    setTimeout(async () => {
        try {
            const token = canvas.scene.tokens.get(tokenId);
            const actorRef = game.actors.get(actorId);

            if (!token || !actorRef) return;

            // Move to region entry point (edge of rapids)
            await token.update({ x: regionEntryX, y: regionEntryY }, { animate: false });

            // Small delay to let the position settle
            await new Promise(resolve => setTimeout(resolve, 100));

            // Show dialog
            const proceed = await foundry.applications.api.DialogV2.confirm({
                window: { title: "Dangerous Waters Ahead" },
                content: `
        <p><strong>${actorRef.name}</strong>, as you approach the river's edge, you hear the violent roar of churning white water.</p>
        <p><em>The rapids ahead look treacherous. Foaming water crashes against jagged rocks, and the current pulls relentlessly downstream.</em></p>
        <hr>
        <p><strong>Athletics DC 12</strong> required to swim through safely.</p>
        <p>Do you wish to attempt the crossing?</p>
      `,
                yes: { label: "Brave the Rapids", icon: "fas fa-water" },
                no: { label: "Stay on Shore", icon: "fas fa-hand" }
            });

            if (!proceed) {
                // They chose not to enter - animate back to origin
                await token.update({ x: originX, y: originY }, { animate: true });

                ChatMessage.create({
                    content: `<p><strong>${actorRef.name}</strong> wisely decides not to risk the dangerous rapids.</p>`,
                    speaker: { alias: "Deep Rapids" }
                });
                await token.unsetFlag("world", flagKey);
                return;
            }

            // Roll Athletics
            // Check if system is dnd5e
            let roll;
            if (game.system.id === "dnd5e") {
                roll = await actorRef.rollSkill("ath", {
                    flavor: `You plunge into the rapids!`
                });
            } else {
                // Fallback for generic
                roll = await new Roll("1d20").evaluate();
                roll.toMessage({ flavor: "Rapids Check (Generic)" });
            }


            // Extract total - dnd5e rollSkill returns a specific object, but let's assume standard Roll structure or result
            // Actually dnd5e returns the Roll object in v10+, but let's be safe.
            const total = roll.total !== undefined ? roll.total : roll.result;

            if (total >= 12) {
                // Success - animate to TRUE destination
                console.log("SUCCESS: Animating to true destination:", trueDestX, trueDestY);
                await token.update({ x: trueDestX, y: trueDestY }, { animate: true });

                ChatMessage.create({
                    content: `<p><strong>${actorRef.name}</strong> fights through the current and makes progress!</p>`,
                    speaker: { alias: "Deep Rapids" }
                });

            } else {
                // Fail - animate downstream from region entry point
                const pushDistance = gridSize * 3;
                // Determine downstream direction? The script assumed X/Y changes. 
                // Original script: downstreamX = regionEntryX - pushDistance; downstreamY = regionEntryY + pushDistance;
                // This implies downstream is South-West?

                const downstreamX = regionEntryX - pushDistance;
                const downstreamY = regionEntryY + pushDistance;

                console.log("FAIL: Animating downstream to:", downstreamX, downstreamY);
                await token.update({ x: downstreamX, y: downstreamY }, { animate: true });

                // DND5e status effect
                /*
                await actorRef.toggleStatusEffect("prone", { active: true });
                */
                // Generic/Safe status toggle
                const proneEffect = CONFIG.statusEffects.find(e => e.id === "prone");
                if (proneEffect) {
                    await actorRef.toggleStatusEffect("prone", { active: true });
                }

                const damageRoll = await new Roll("1d4").evaluate();
                await damageRoll.toMessage({
                    flavor: `You are battered by the rapids!`,
                    speaker: { alias: "Deep Rapids" }
                });

                await actorRef.applyDamage(damageRoll.total, { type: "bludgeoning" });

                ChatMessage.create({
                    content: `
                <p><strong>${actorRef.name}</strong> is overwhelmed by the powerful current!</p>
           <p><em>The rapids slam them against the rocks, sweeping them downstream and leaving them gasping and prone.</em></p>
        `,
                    speaker: { alias: "Deep Rapids" }
                });
            }

            await token.unsetFlag("world", flagKey);

        } catch (error) {
            console.error("Rapids error:", error);
            try {
                const token = canvas.scene.tokens.get(tokenId);
                if (token) await token.unsetFlag("world", flagKey);
            } catch (e) { }
        }

    }, 700);
}
