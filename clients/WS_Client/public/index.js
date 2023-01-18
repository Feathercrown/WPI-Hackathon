window.addEventListener('load', (event) => {
    fetch('/api/games')
        .then((response) => response.json())
        .then((data) => updateGamesList(data));
        fetch('/api/announcements')
            .then((response) => response.json())
            .then((data) => updateAnnouncements(data));
});

function updateGamesList(data){
    var list = document.getElementById("games-list-items");
    var listItem = document.getElementById("games-list-item-template");
    list.removeChild(listItem);
    data.forEach(game => {
        var newListItem = listItem.cloneNode(true);
        newListItem.removeAttribute('id');
        newListItem.style.visibility = "visible";
        newListItem.querySelector('button[type="button"]').addEventListener('click',(e)=>{window.location = "./client.html?game="+game.uuid;});
        newListItem.querySelector('.game-name').innerHTML = game.name;
        newListItem.querySelector('.player-list').innerText = game.players.length == 0 ? 'None' : game.players.map(player=>player.name).join(', ');
        list.appendChild(newListItem);
    });
}

function updateAnnouncements(data){
    var list = document.getElementById("updates-items");
    var listItem = document.getElementById("updates-item-template");
    list.removeChild(listItem);
    data.forEach(update => {
        var newListItem = listItem.cloneNode(true);
        newListItem.removeAttribute('id');
        newListItem.style.visibility = "visible";
        newListItem.querySelector('.update-title').innerText = update.title;
        newListItem.querySelector('.update-body').innerText = update.body;
        list.appendChild(newListItem);
    });
}