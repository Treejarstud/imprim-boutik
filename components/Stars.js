"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function Stars({ value, onChange, size = 16 }) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={interactive ? "cursor-pointer" : ""}
          fill={(hover || value) >= n ? "#FBBF24" : "none"}
          stroke={(hover || value) >= n ? "#FBBF24" : "#D1D5DB"}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange(n)}
        />
      ))}
    </div>
  );
}
