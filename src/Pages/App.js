import React, { useEffect, useRef, useState } from "react";
import styles from "./App.module.css";
import * as faceapi from "face-api.js";

function App() {
  const videoref = useRef(null);
  const frameref = useRef(null);
  const canvasRef = useRef(null);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isFaceTooClose, setIsFaceTooClose] = useState(false);

  const loadModels = async () => {
    await faceapi.loadTinyFaceDetectorModel("models");
    await faceapi.loadFaceLandmarkModel("models");
  };

  const startVideo = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoref.current) {
        videoref.current.srcObject = stream;
      }
    }
  };

  useEffect(() => {
    loadModels();
    startVideo();

    const interval = setInterval(async () => {
      const video = videoref.current;
      const frame = frameref.current;
      const canvas = canvasRef.current;
      if (video && frame && canvas) {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const frameRect = frame.getBoundingClientRect();
          const videoRect = video.getBoundingClientRect();
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const resizedDetections = faceapi.resizeResults(detections, {
            width: video.videoWidth,
            height: video.videoHeight,
          });

          if (resizedDetections.length > 0) {
            const faceInRoi = resizedDetections[0].detection.box;
            console.log("Face Detection Coordinates:", faceInRoi);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(
              faceInRoi.x,
              faceInRoi.y,
              faceInRoi.width,
              faceInRoi.height
            );
            ctx.stroke();
            const roi = {
              x: frameRect.left - videoRect.left,
              y: frameRect.top - videoRect.top,
              width: frameRect.width,
              height: frameRect.height,
            };
            setIsFaceDetected(true);

            if (
              faceInRoi.x >= roi.x &&
              faceInRoi.y >= roi.y &&
              faceInRoi.x + faceInRoi.width <= roi.x + roi.width &&
              faceInRoi.y + faceInRoi.height <= roi.y + roi.height
            ) {
              setIsFaceTooClose(true);
            } else {
              setIsFaceTooClose(false);
            }
          } else {
            setIsFaceDetected(false);
            setIsFaceTooClose(false);
          }
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.videocontainer}>
      <video
        crossOrigin="anonymous"
        ref={videoref}
        autoPlay
        className={styles.video}
      ></video>
      <div className={styles.frame} ref={frameref}></div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width="800"
        height="800"
      ></canvas>
      {isFaceDetected ? (
        <h3>
          {isFaceTooClose ? "verified" : "put your face in the gray frame"}
        </h3>
      ) : (
        <h3>look at the camera and put your face in the frame </h3>
      )}
    </div>
  );
}

export default App;
