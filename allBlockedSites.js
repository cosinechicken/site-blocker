function populateOffTaskWebsites() {
  const listElement = document.getElementById('fullBlockedSitesList');

  chrome.storage.local.get('offTaskWebsites', function(result) {
    const sites = result.offTaskWebsites || [];
    sites.forEach(site => {
      const listItem = document.createElement('li');
      listItem.textContent = site;
      listElement.appendChild(listItem);
    });
  });
}

document.addEventListener('DOMContentLoaded', populateOffTaskWebsites());
  

const exportButton = document.getElementById('exportButton');

exportButton.addEventListener('click', () => {
  chrome.storage.local.get('offTaskWebsites', (data) => {
    const offTaskWebsites = data.offTaskWebsites || [];
    const blob = new Blob([JSON.stringify(offTaskWebsites, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'block_list.json';
    a.click();
    URL.revokeObjectURL(url);
  });
});

const importButton = document.getElementById('importButton');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';

importButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedWebsites = JSON.parse(e.target.result);
        if (Array.isArray(importedWebsites)) {
          chrome.storage.local.set({ offTaskWebsites: importedWebsites }, () => {
            populateOffTaskWebsites();
            alert('Block list imported successfully!');
          });
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        alert('Failed to import block list: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
});
