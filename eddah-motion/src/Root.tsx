import "./index.css";
import { Composition } from "remotion";
import { BrandLoop } from "./BrandLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrandLoop"
        component={BrandLoop}
        durationInFrames={150}
        fps={30}
        width={1600}
        height={900}
      />
    </>
  );
};
