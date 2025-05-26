console.log('sublease fraud detector: content script loaded');

// listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeImages') {
        // use async/await pattern with sendResponse
        (async () => {
            const results = await analyzeCurrentImages();
            sendResponse(results);
        })();
        return true; // keep channel open for async response
    }
});

async function analyzeCurrentImages() {
    // filter for relevant images only
    const allImages = document.querySelectorAll('img');
    const relevantImages = [];

    allImages.forEach(img => {
        // filter out small images, profile pics, UI elements
        if (img.width > 100 && img.height > 100) {
            relevantImages.push({
                src: img.src,
                width: img.width,
                height: img.height,
                alt: img.alt || ''
            });
        }
    });

    console.log(`found ${relevantImages.length} relevant images`);

    // check cache first
    const uncachedImages = [];
    const cachedResults = [];

    for (const img of relevantImages) {
        const cached = await getCachedResult(img.src);
        if (cached) {
            cachedResults.push({ ...cached, fromCache: true });
        } else {
            uncachedImages.push(img);
        }
    }

    // if we have uncached images, analyze them
    let newResults = [];
    if (uncachedImages.length > 0) {
        try {
            const apiResults = await sendImagesForAnalysis(uncachedImages);
            if (apiResults && apiResults.results) {
                // cache new results
                for (const result of apiResults.results) {
                    await setCachedResult(result.url, result);
                }
                newResults = apiResults.results;
            }
        } catch (error) {
            console.error('analysis error:', error);
        }
    }

    // combine cached and new results
    return {
        results: [...cachedResults, ...newResults],
        totalProcessed: relevantImages.length,
        fromCache: cachedResults.length,
        newlyAnalyzed: newResults.length
    };
}

async function sendImagesForAnalysis(images) {
    try {
        const response = await fetch('http://localhost:3000/api/analyze-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrls: images.map(img => img.src)
            })
        });

        if (!response.ok) {
            throw new Error(`http error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('api error:', error);
        throw error;
    }
}

// caching functionality to avoid reanalysis of the same images
async function getCachedResult(imageUrl) {
    const result = await chrome.storage.local.get([imageUrl]);
    return result[imageUrl];
}

async function setCachedResult(imageUrl, analysisResult) {
    await chrome.storage.local.set({
        [imageUrl]: {
            ...analysisResult,
            cachedAt: new Date().toISOString()
        }
    });
}