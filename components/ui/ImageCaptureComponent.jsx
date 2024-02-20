"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { robo_flow_endpoint } from "@/lib/config";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const ImageCaptureComponent = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

  const [loading, setLoading] = useState(false);
  const [decodedImage, setDecodedImage] = useState(null);
  const [detections, setDetections] = useState(null);

  const videoRef = useRef(null);

  const rearCamera = true;

  useEffect(() => {
    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 3000 },
            height: { ideal: 3000 },
            facingMode: rearCamera ? "environment" : "user",
          },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        setMediaStream(stream);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    getVideo();

    return () => {
      if (videoRef.current && mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        videoRef.current = null;
      }
    };
  }, []);

  const handleCaptureImage = async () => {
    try {
      const captureCanvas = document.createElement("canvas");
      const ctx = captureCanvas.getContext("2d");
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const size = Math.min(videoWidth, videoHeight);
      captureCanvas.width = size;
      captureCanvas.height = size;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(
        videoRef.current,
        (size - videoWidth) / 2,
        (size - videoHeight) / 2,
        videoWidth,
        videoHeight
      );

      const capturedDataURL = captureCanvas.toDataURL("image/jpeg");
      setCapturedImage(capturedDataURL);

      setDecodedImage(null);
      setDetections(null);

      if (videoRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
        videoRef.current = null;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const handleRecapture = async () => {
    setCapturedImage(null);
    setDecodedImage(null);
    setDetections(null);

    // Restart the video stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 3000 },
        height: { ideal: 4000 },
        facingMode: rearCamera ? "environment" : "user",
      },
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    setMediaStream(stream);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const base64Data = capturedImage.split(",")[1];
      const arrayBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileBlob = new Blob([arrayBuffer], { type: "image/jpeg" });

      // Create a File object from the blob
      const capturedFile = new File([fileBlob], "captured_image.jpeg");
      console.log(capturedFile);

      const formData = new FormData();
      formData.append("file", capturedFile);
      formData.append("user_id", "boss");
      console.log(formData);

      const response = await fetch(`${robo_flow_endpoint}/process_and_predict`, {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();
      console.log(responseData);
      setDecodedImage(responseData.message);
      setDetections(responseData.count);

      // if (response.ok) {
      //   const blob = await response.blob();
      //   const objectUrl = URL.createObjectURL(blob);

      //   setDecodedImage(objectUrl);
      //   const detections = response.headers.get("Detections");
      //   setDetections(detections);
      // } else {
      //   console.error("API Error:", response.statusText);
      // }
    } catch (error) {
      console.error("Error getting final data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mx-4">
        {capturedImage && (
          <div>
            <img
              src={capturedImage}
              alt="Captured"
              className={`max-w-full h-auto transform ${
                !rearCamera ? "scale-x-[-1]" : ""
              } rounded-full my-4`}
            />
            <div className="flex justify-between items-center">
              <Button variant={"secondary"} onClick={handleRecapture}>
                Recapture
              </Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        )}
        {!capturedImage && (
          <div>
            <video
              ref={videoRef}
              className={` border border-gray-500
                my-4
                aspect-square
                transform ${!rearCamera ? "scale-x-[-1]" : ""} rounded-full object-cover`}
              style={{
                display: capturedImage ? "none" : "block",
              }}
            />
            <div className="flex justify-center items-center">
              <Button onClick={handleCaptureImage}>Capture</Button>
            </div>
          </div>
        )}
        {loading && <Loader2 className="animate-spin mx-auto w-10 h-10" />}

        {decodedImage && !loading && (
          <div className="mt-4">
            <img
              src={decodedImage}
              alt="Decoded"
              className={`max-w-full h-auto transform ${
                !rearCamera ? "scale-x-[-1]" : ""
              } rounded-full my-4`}
            />
            <p>Larvae Count: {detections}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCaptureComponent;
