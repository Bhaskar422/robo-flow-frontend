"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { robo_flow_endpoint } from "@/lib/config";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const ImageCaptureComponent = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [rearCamera, setRearCamera] = useState(true);

  const [loading, setLoading] = useState(false);
  const [decodedImage, setDecodedImage] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: rearCamera ? "environment" : "user" },
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
      // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // const video = document.createElement("video");
      const captureCanvas = document.createElement("canvas");

      // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // videoRef.current.srcObject = stream;
      // videoRef.current.play();

      // const captureCanvas = document.createElement('canvas');
      captureCanvas.width = videoRef.current.videoWidth;
      captureCanvas.height = videoRef.current.videoHeight;
      const ctx = captureCanvas.getContext("2d");
      ctx.drawImage(
        videoRef.current,
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );

      const capturedDataURL = captureCanvas.toDataURL("image/png");
      setCapturedImage(capturedDataURL);

      setDecodedImage(null);

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

    // Restart the video stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: rearCamera ? "environment" : "user" },
    });
    videoRef.current.srcObject = stream;
    videoRef.current.play();

    setMediaStream(stream);
  };

  const handleSubmit = async () => {
    setLoading(true);
    console.log("Clicked Submit");
    try {
      const base64Data = capturedImage.split(",")[1];
      const arrayBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileBlob = new Blob([arrayBuffer], { type: "image/png" });

      // Create a File object from the blob
      const capturedFile = new File([fileBlob], "captured_image.png");

      const formData = new FormData();
      formData.append("file", capturedFile);

      const response = await fetch(`${robo_flow_endpoint}/process_and_predict`, {
        method: "POST",
        body: formData,
      });
      console.log("received response");

      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        setDecodedImage(objectUrl);
        // const responseData = await response.json();

        // Assuming the API response has an 'image' field
        // const decodedImageData = atob(responseData.image);
        // setDecodedImage(`data:image/png;base64,${decodedImageData}`);
      } else {
        console.error("API Error:", response.statusText);
      }
    } catch (error) {
      console.error("Error getting final data:", error);
    } finally {
      console.log("Finished Submit");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mt-4 mx-4">
        {capturedImage && (
          <div>
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full h-auto transform scale-x-[-1] rounded-md my-4"
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
              className="max-w-full h-auto border border-gray-500 transform scale-x-[-1] rounded-md my-4"
              style={{ display: capturedImage ? "none" : "block" }}
            />
            <div className="flex justify-between items-center">
              <Button
                variant={"secondary"}
                onClick={() => setRearCamera((rearCamera) => !rearCamera)}
              >
                Flip Camera
              </Button>
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
              className="max-w-full h-auto transform scale-x-[-1] rounded-md my-4"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCaptureComponent;
