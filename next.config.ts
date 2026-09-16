import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next's default is 1MB, which silently truncates/rejects every image
      // upload here (logos, chat images, lineup/drill thumbnails) once a
      // phone photo or a hi-DPI canvas capture goes past a tiny thumbnail.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
