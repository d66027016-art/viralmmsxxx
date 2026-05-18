import { NextRequest } from "next/server";
import { statSync, createReadStream, existsSync } from "fs";
import path from "path";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Prevent directory traversal attacks (e.g. filename = "../../../etc/passwd")
    const sanitizedFilename = path.basename(filename);
    
    // Resolve absolute path in the server environment
    const filePath = path.join(process.cwd(), "public", "uploads", sanitizedFilename);

    // 404 response if the file does not exist
    if (!existsSync(filePath)) {
      return new Response("File Not Found", { status: 404 });
    }

    // Retrieve file metadata
    const stat = statSync(filePath);
    const fileSize = stat.size;

    // Detect MIME type based on file extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = "application/octet-stream";
    
    switch (ext) {
      case ".mp4":
        contentType = "video/mp4";
        break;
      case ".webm":
        contentType = "video/webm";
        break;
      case ".ogg":
        contentType = "video/ogg";
        break;
      case ".mov":
        contentType = "video/quicktime";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
    }

    const range = request.headers.get("range");

    // Handle Range Requests (HTTP 206 Partial Content) for smooth seekable video streaming
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range numbers
      if (start >= fileSize || end >= fileSize || start > end) {
        return new Response("Requested Range Not Satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = createReadStream(filePath, { start, end });
      
      // Convert Node.js Readable stream to Web ReadableStream
      const webStream = Readable.toWeb(fileStream);

      return new Response(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      // Handle Full File Requests (HTTP 200 OK) for images/simple assets
      const fileStream = createReadStream(filePath);
      const webStream = Readable.toWeb(fileStream);

      return new Response(webStream as any, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (error: any) {
    console.error("Dynamic file streaming route error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
