import ModelTraits from "./ModelTraits";
import primitiveTrait from "./decorators/primitiveTrait";

export default class LatLonHeightTraits extends ModelTraits {
  @primitiveTrait({
    type: "number",
    name: "Latitude",
    description: "Latitude in degrees"
  })
  latitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Longitude",
    description: "Longitude in degrees"
  })
  longitude?: number;

  @primitiveTrait({
    type: "number",
    name: "Height",
    description: "Height above ellipsoid in metres"
  })
  height?: number;
}
