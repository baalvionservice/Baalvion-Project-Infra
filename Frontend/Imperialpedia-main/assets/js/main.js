
function openSlideMenu() {
document.getElementById("side-menu").style.width = '340px';
document.getElementById("main").style.marginLeft = '340px';
}

function closeSlideMenu() {
console.log('closeSlideMenu');
document.getElementById("side-menu").style.width = '0';
document.getElementById("main").style.marginLeft = '0';
}