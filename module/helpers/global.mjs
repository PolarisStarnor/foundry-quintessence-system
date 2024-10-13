export function getViewedActors() {
    //Get all Actors within the currently open scene
    const tokens = Object.entries(game.actors.tokens);
    let ids = [];
    let viewed_actors = [];
    for (let key in tokens) {
        const actor = tokens[key][1];
        if (!ids.includes(actor.id)) {
            viewed_actors.push(actor);
            ids.push(actor.id);
        }
    }
    return viewed_actors;
}
