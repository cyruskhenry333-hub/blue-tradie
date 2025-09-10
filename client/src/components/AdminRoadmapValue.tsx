import React from "react";
import type { ReactNode } from "react";

function toNode(v: unknown): ReactNode {
  if (v == null) return null;
  if (React.isValidElement(v)) return v as ReactNode;
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x, i) => <span key={i}>{toNode(x)}</span>);
  if (typeof v === "object") return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>;
  return null;
}

export default function AdminRoadmapValue({ value }: { value: unknown }): JSX.Element {
  return <>{toNode(value)}</>;
}