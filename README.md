# sublease fraud detector (work in progress)

distributed image analysis system for detecting rental scams. chrome extension captures property images from facebook groups, backend processes them for fraud patterns.


## structure
```
extension/           # chrome extension
├── src/
│   ├── content/    # image extraction
│   ├── popup/      # ui
│   └── background/ # service worker
└── manifest.json

backend/            # local node server
└── src/server.js   # mock analysis
```

