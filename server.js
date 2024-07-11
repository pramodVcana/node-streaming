const Stream = require("node-rtsp-stream-jsmpeg");

const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const cors = require("cors");
const httpProxy = require("express-http-proxy");
const NodeMediaServer = require("node-media-server");


const app = express();
app.use(bodyParser.json());
app.use(cors());

// app.use(
//   "/ws",
//   httpProxy("localhost:9999", {
//     proxyReqPathResolver: (req) => {
//       return "/ws" + req.url;
//     },
//     userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
//       headers["Access-Control-Allow-Origin"] = "*";
//       headers["Access-Control-Allow-Headers"] =
//         "Origin, X-Requested-With, Content-Type, Accept";
//       return headers;
//     },
//   })
// );

app.post("/api/convert/rmtp", (req, res) => {
  const { rtmpUrl, rtspUrl } = req.body;

  if (!rtmpUrl || !rtspUrl) {
    return res.status(400).json({ error: "Missing RTMP or RTSP URL" });
  } 

  const ffmpegCommand = `ffmpeg -i ${rtmpUrl} -c:v copy -c:a copy -f rtsp ${rtspUrl}`;

  const process = exec(ffmpegCommand);

  let errorData = "";

  process.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    errorData += data;
      // res.status(200).json({ message: "Conversion successful", data });
  });

  process.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    //  res.status(200).json({ message: "Conversion successful",data });
  });

  process.on("close", (code) => {
    if (code === 0) {
      res.status(200).json({ message: "Conversion successful" });
    } else {
      res.status(500).json({ error: "Conversion failed", details: errorData });
    }
  });




  const options = {
    name: "streamName",
    url: rtspUrl,
    wsPort: 9999,
  };
  
  const stream = new Stream(options);
  
  stream.start();
   res.status(200).json({ message: "Conversion successful",  });
});


// console.log("stream========", stream);


app.post("/api/convert/rstp", (req, res) => {
  const { rtmpUrl, rtspUrl } = req.body;

  if (!rtmpUrl || !rtspUrl) {
    return res.status(400).json({ error: "Missing RTMP or RTSP URL" });
  }

  const ffmpegCommand = `ffmpeg -loglevel debug -rtsp_transport tcp -i ${rtspUrl} -c:v copy -c:a copy -f flv ${rtmpUrl}`;


const config = {
  logType: 3,
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
    allow_origin: "*",
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    allow_origin: "*",
  },
  trans: {
    // ffmpeg: "C:/ffmpeg/bin/ffmpeg.exe", // Update this to the path where ffmpeg is installed on your system
    ffmpeg:"/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        mp4: true,
        mp4Flags: "[movflags=faststart]",
      },
    ],
  },
};

var nms = new NodeMediaServer(config);

nms.run();

// Execute the FFmpeg command
const process = exec(ffmpegCommand);

// Capture and print standard output from FFmpeg
process.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

// Capture and print error output from FFmpeg
process.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Capture and print the exit code when the FFmpeg process ends
process.on("close", (code) => {
  console.log(`FFmpeg process exited with code ${code}`);
});
    // if (error) throw error;
  process.on("close", (code) => {
    if (code === 0) {
      res.status(200).json({ message: "Conversion successful" });
    } else {
      res.status(500).json({ error: "Conversion failed", details: code });
    } 
  });

  res.status(200).json({ error: "Conversion Success", });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
