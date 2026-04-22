"use client";

import React from "react";
import { Button } from "./Button";

export function SaveButton({ children = "Save", ...props }) {
  return (
    <Button variant="gradientPrimary" {...props}>
      {children}
    </Button>
  );
}

export function ResetButton({ children = "Reset", type = "button", ...props }) {
  return (
    <Button type={type} variant="gradientSecondary" {...props}>
      {children}
    </Button>
  );
}
