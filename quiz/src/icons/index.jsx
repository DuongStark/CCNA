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
