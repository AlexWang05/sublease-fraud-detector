const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

// middleware setup
app.use(cors());
app.use(express.json());

// store analyzed urls to avoid duplicate processing
const analyzedUrls = new Set();

app.post('/api/analyze-images', async (req, res) => {
    try {
        const { imageUrls } = req.body;

        if (!imageUrls || !Array.isArray(imageUrls)) {
            return res.status(400).json({
                error: 'invalid request. expected array of image urls'
            });
        }

        // filter out previously analyzed urls
        const newUrls = imageUrls.filter(url => !analyzedUrls.has(url));

        // add new urls to analyzed set
        newUrls.forEach(url => analyzedUrls.add(url));

        // todo: implement actual image analysis
        // for now, return mock results with lower false positive rate
        const results = newUrls.map(url => {
            // decode url to check for common patterns
            const decodedUrl = decodeURIComponent(url);

            // mock analysis
            const suspicious = (
                (decodedUrl.match(/\d+x\d+/g) || []).length > 1 ||
                decodedUrl.includes('marketplace')
            );

            return {
                url,
                suspicious,
                matches: [],
                analyzedAt: new Date().toISOString()
            };
        });

        res.json({
            results,
            totalAnalyzed: results.length,
            skippedUrls: imageUrls.length - results.length
        });

    } catch (error) {
        console.error('error analyzing images:', error);
        res.status(500).json({
            error: 'internal server error',
            message: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
}); 