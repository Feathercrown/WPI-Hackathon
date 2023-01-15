window.addEventListener('load', (event) => {
    var games = document.getElementById("games-list-items");
    fetch('/api/games')
        .then((response) => response.json())
        .then((data) => updateGamesList(data));
});

function updateGamesList(data){
    var list = document.getElementById("games-list-items");
    var listItem = document.getElementById("list-item-template");
    data.forEach(game => {
        var newListItem = listItem.cloneNode(true);
        newListItem.style.visibility = "visible";
        newListItem.querySelector('button[type="button"]').addEventListener('click',(e)=>{window.location = "./client?game="+game.uuid;});
        newListItem.querySelector('.game-name').innerHTML = game.name;
        newListItem.querySelector('.player-list').innerHTML = game.players.map(player=>player.name).join(', ') || 'None';
        list.appendChild(newListItem);
    });
}