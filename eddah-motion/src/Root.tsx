import "./index.css";
import { Composition } from "remotion";
import { BrandFilm } from "./BrandFilm";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrandFilm"
        component={BrandFilm}
        durationInFrames={360}
        fps={30}
        width={1600}
        height={900}
      />
    </>
  );
};
