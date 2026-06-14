import React from "react";
import { initials, avatarGradient } from "./inboxConfig";

export default function Avatar({ name, email, size = "md", photoUrl }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };
  const seed = email || name || "";
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || email || ""}
        className={`${sizes[size]} rounded-full object-cover shrink-0 shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${sizes[size]} rounded-full bg-gradient-to-br ${avatarGradient(seed)} flex items-center justify-center font-semibold text-white shrink-0 shadow-sm`}
    >
      {initials(name || email)}
    </div>
  );
}