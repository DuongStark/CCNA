const baseProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

export function IconCheck(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 8.5l3.2 3.2L13 5" />
    </svg>
  );
}

export function IconX(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 5h10M3 8h10M3 11h10" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function IconCheckbox(props) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="M5.5 8.2l1.8 1.8L10.8 6.5" />
    </svg>
  );
}

export function IconArrowLeft(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 8H3M7 4L3 8l4 4" />
    </svg>
  );
}

export function IconStar(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.3 4.4 13.1l.7-4L2.2 6.3l4-.6z" />
    </svg>
  );
}

export function IconSun(props) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
    </svg>
  );
}

export function IconMoon(props) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M13 9.5A5.5 5.5 0 016.5 3 5.5 5.5 0 1013 9.5z" />
    </svg>
  );
}
