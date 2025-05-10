const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB Connection URI
const uri = "mongodb+srv://srihasa54:srihasaedula@cluster0.0qu6shu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoDB client
const client = new MongoClient(uri);

async function getDataFromMongoDB() {
    try {
        // Connect to MongoDB
        await client.connect();
        
        // Get data from the collection
        const cursor = client.db("weather").collection("weathercollection").find({});
        const results = await cursor.toArray();
        
        return JSON.stringify(results);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return JSON.stringify([]);
    }
}

const server = http.createServer(async (req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    
    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*'); // Change to specific origin in production
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                return res.end('Internal Server Error');
            }
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    }
    else if (req.url === '/api') {
        try {
            const data = await getDataFromMongoDB();
            
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            
            res.end(data);
        } catch (error) {
            console.error('Error handling API request:', error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Failed to fetch data from MongoDB' }));
        }
    }
    else {
        // Try to serve a static file
        const filePath = path.join(__dirname, 'public', req.url);
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                fs.readFile(path.join(__dirname, 'public', '404.html'), 'utf-8', (err, data) => {
                    if (err) {
                        res.writeHead(404, {'Content-Type': 'text/plain'});
                        return res.end('404 Not Found');
                    }
                    res.writeHead(404, {'Content-Type': 'text/html'});
                    res.end(data);
                });
                return;
            }
            
            // Determine the content type based on file extension
            const ext = path.extname(filePath);
            let contentType = 'text/plain';
            
            switch (ext) {
                case '.html': contentType = 'text/html'; break;
                case '.css': contentType = 'text/css'; break;
                case '.js': contentType = 'application/javascript'; break;
                case '.json': contentType = 'application/json'; break;
                case '.png': contentType = 'image/png'; break;
                case '.jpg': contentType = 'image/jpeg'; break;
            }
            
            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    return res.end('Internal Server Error');
                }
                res.writeHead(200, {'Content-Type': contentType});
                res.end(content);
            });
        });
    }
});

async function startServer() {
    try {
        console.log('Starting server...');
        server.listen(7416, () => console.log("Server running on port 7416"));
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();