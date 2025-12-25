import React from "react";

interface IdCardIconProps {
  className?: string;
  size?: number;
}

export default function IdCardIcon({ className = "", size = 24 }: IdCardIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -4.19 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(-385 -155.852)">
        <g>
          <path
            d="M414,164.466v-3.379a5.005,5.005,0,1,0-10,0v3.379H385v31h48v-31Zm-3,17h6v2h-6Zm-5-20.379a3,3,0,1,1,6,0v3.379h-6Zm-8.112,11.627a4.151,4.151,0,1,1-4.152,4.151A4.163,4.163,0,0,1,397.888,172.714ZM406,188.466H389v-1.222c0-2.8,5.7-4.152,8.5-4.152s8.5,1.349,8.5,4.152Zm14,0h-9v-2h9Zm6-5h-7v-2h7Zm2-6H411v-2h17Z"
            fill="currentColor"
            fillRule="evenodd"
          />
          <path
            d="M409,160.466a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0v-1A1,1,0,0,0,409,160.466Z"
            fill="currentColor"
            fillRule="evenodd"
          />
        </g>
      </g>
    </svg>
  );
}
