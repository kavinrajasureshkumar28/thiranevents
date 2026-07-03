import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eventide — Event Management & Registration System" },
      {
        name: "description",
        content:
          "Premium event management and registration platform for administrators and participants.",
      },
      { property: "og:title", content: "Eventide — Event Management System" },
      {
        property: "og:description",
        content:
          "Premium event management and registration platform for administrators and participants.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/ems/index.html");
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
      Loading Eventide…
    </div>
  );
}
