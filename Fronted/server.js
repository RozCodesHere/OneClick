const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5500;
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp"
};

const server = http.createServer((req, res) => {

    let requestedPath = decodeURIComponent(
        req.url.split("?")[0]
    );

    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }

    const filePath = path.join(ROOT, requestedPath);

    fs.stat(filePath, (error, stats) => {

        if (!error && stats.isFile()) {

            const extension =
                path.extname(filePath).toLowerCase();

            const contentType =
                MIME_TYPES[extension] ||
                "application/octet-stream";

            res.writeHead(200, {
                "Content-Type": contentType
            });

            fs.createReadStream(filePath).pipe(res);

            return;
        }

        // -------------------------------------------------
        // PAGE NOT FOUND
        // Show OneClick custom 404 page
        // -------------------------------------------------

        const notFoundPage =
            path.join(ROOT, "404.html");

        fs.readFile(notFoundPage, (error, data) => {

            if (error) {

                res.writeHead(500, {
                    "Content-Type": "text/plain"
                });

                res.end(
                    "404 page could not be loaded."
                );

                return;
            }

            res.writeHead(404, {
                "Content-Type": "text/html"
            });

            res.end(data);
        });
    });
});

server.listen(PORT, () => {

    console.log("----------------------------------------");
    console.log("OneClick Frontend Server");
    console.log("----------------------------------------");
    console.log(
        `Server running at: http://127.0.0.1:${PORT}`
    );
    console.log("Custom 404 page is enabled.");
    console.log("----------------------------------------");

});