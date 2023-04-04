// Display the list of off-task websites in the popup.
const offTaskWebsites = ['facebook.com', 'twitter.com', 'youtube.com'];
const offTaskWebsitesList = document.getElementById('offTaskWebsitesList');

offTaskWebsites.forEach(website => {
  const listItem = document.createElement('li');
  listItem.textContent = website;
  offTaskWebsitesList.appendChild(listItem);
});
