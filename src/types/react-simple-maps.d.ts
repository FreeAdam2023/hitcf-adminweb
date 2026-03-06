declare module "react-simple-maps" {
  import { ComponentType, ReactNode } from "react";

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
  }

  interface ComposableMapProps {
    projectionConfig?: ProjectionConfig;
    className?: string;
    children?: ReactNode;
  }

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: GeographyData[] }) => ReactNode;
  }

  interface GeographyData {
    rsmKey: string;
    id: string;
    properties: Record<string, string>;
  }

  interface GeoStyleState {
    fill?: string;
    stroke?: string;
    outline?: string;
    cursor?: string;
  }

  interface GeographyProps {
    key: string;
    geography: GeographyData;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: GeoStyleState;
      hover?: GeoStyleState;
      pressed?: GeoStyleState;
    };
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}
