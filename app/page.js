import ImageCaptureComponent from "@/components/ui/ImageCaptureComponent";
import Image from "next/image";

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <div className="flex bg-[#007be5]">
        <Image alt="logo" src={"/AIQUA.svg"} width={64} height={64} />
      </div>
      <div className="flex-1 bg-[#007be5]">
        <ImageCaptureComponent />
      </div>
    </main>
  );
}
