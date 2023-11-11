document.addEventListener('DOMContentLoaded', function() {
    const listElement = document.getElementById('fullBlockedSitesList');
  
    chrome.storage.local.get('offTaskWebsites', function(result) {
      const sites = result.offTaskWebsites || [];
      sites.forEach(site => {
        const listItem = document.createElement('li');
        listItem.textContent = site;
        listElement.appendChild(listItem);
      });
    });
  });
  