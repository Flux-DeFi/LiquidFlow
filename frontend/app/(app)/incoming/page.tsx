"use client";

import React from "react";
import IncomingStreams from "@/components/IncomingStreams";

export default function IncomingPage() {
  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Incoming Streams</h1>
      <IncomingStreams />
    </div>
  );
}
