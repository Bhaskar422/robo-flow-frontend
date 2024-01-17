import ImageCaptureComponent from "@/components/ui/ImageCaptureComponent";
import Image from "next/image";

export default function Home() {
  return (
    <main>
      <div>
        <Image alt="logo" src={"/AIQUA.svg"} width={64} height={64} />
      </div>
      <ImageCaptureComponent />
    </main>
  );
}
