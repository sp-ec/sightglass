import React, { SVGProps } from 'react';

export const StreamgraphIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="white"
    {...props}
  >
    <path
      d="M 2 12 C 5.5 12 5.5 3 9 3 C 12.5 3 12.5 6 16 6 C 19 6 19 3 22 3 L 22 8 C 19 8 19 11 16 11 C 12.5 11 12.5 7 9 7 C 5.5 7 5.5 12 2 12 Z"
      opacity="0.7"
    />
    <path
      d="M 2 12 C 5.5 12 5.5 7 9 7 C 12.5 7 12.5 11 16 11 C 19 11 19 8 22 8 L 22 14 C 19 14 19 16 16 16 C 12.5 16 12.5 13 9 13 C 5.5 13 5.5 12 2 12 Z"
      opacity="0.3"
    />
    <path
      d="M 2 12 C 5.5 12 5.5 13 9 13 C 12.5 13 12.5 16 16 16 C 19 16 19 14 22 14 L 22 19 C 19 19 19 21 16 21 C 12.5 21 12.5 19 9 19 C 5.5 19 5.5 12 2 12 Z"
      opacity="1.0"
    />
  </svg>
);

export default StreamgraphIcon;