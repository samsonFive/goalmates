import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GoalMates",
    short_name: "GoalMates",
    description: "Household planning from paper to shared action.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f3eee4",
    theme_color: "#1b4332",
    icons: [
      { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
