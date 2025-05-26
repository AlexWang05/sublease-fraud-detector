document.addEventListener('DOMContentLoaded', function () {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsDiv = document.getElementById('results');

    analyzeBtn.addEventListener('click', async () => {
        try {
            // show loading state
            analyzeBtn.disabled = true;
            resultsDiv.innerHTML = '<p>analyzing images...</p>';

            // get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // check if we're on facebook
            if (!tab.url.includes('facebook.com')) {
                resultsDiv.innerHTML = '<p>please navigate to a facebook page first</p>';
                analyzeBtn.disabled = false;
                return;
            }

            // send message to content script
            chrome.tabs.sendMessage(tab.id, { action: 'analyzeImages' }, (response) => {
                analyzeBtn.disabled = false;

                if (chrome.runtime.lastError) {
                    resultsDiv.innerHTML = '<p>error: content script not ready. try refreshing the page.</p>';
                    return;
                }

                if (response) {
                    displayResults(response);
                }
            });
        } catch (error) {
            resultsDiv.innerHTML = '<p>error occurred. check console.</p>';
            analyzeBtn.disabled = false;
            console.error(error);
        }
    });

    function displayResults(data) {
        const { results, totalProcessed, fromCache, newlyAnalyzed } = data;

        // count suspicious images
        const suspiciousCount = results.filter(r => r.suspicious).length;

        resultsDiv.innerHTML = `
      <div class="summary">
        <p>analyzed ${totalProcessed} images (${fromCache} from cache, ${newlyAnalyzed} new)</p>
        <p class="alert ${suspiciousCount > 0 ? 'alert-warning' : 'alert-success'}">
          found ${suspiciousCount} suspicious images
        </p>
      </div>
      <div class="results-list">
        ${results.map(result => `
          <div class="image-result ${result.suspicious ? 'suspicious' : ''}">
            <div class="status">
              ${result.suspicious ? '[!] SUSPICIOUS' : '[OK]'}
              ${result.fromCache ? ' (cached)' : ''}
            </div>
            <div class="details">
              <small>${formatUrl(decodeURIComponent(result.url))}</small>
              <small>analyzed: ${new Date(result.analyzedAt).toLocaleString()}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    }

    // helper to format urls nicely
    function formatUrl(url) {
        try {
            // extract filename from url
            const filename = url.split('/').pop().split('?')[0];
            // truncate middle of filename if too long
            if (filename.length > 40) {
                return filename.substring(0, 20) + '...' + filename.substring(filename.length - 20);
            }
            return filename;
        } catch (e) {
            // fallback to simple truncation
            const shortened = url.split('?')[0];
            return shortened.length > 50 ? shortened.substring(0, 47) + '...' : shortened;
        }
    }
});
