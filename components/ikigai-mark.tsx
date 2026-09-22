type IkigaiMarkProps = {
  size?: number;
  className?: string;
};

export function IkigaiMark({ size = 280, className = "" }: IkigaiMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={className}
    >
      <circle cx="78" cy="78" r="58" fill="#E97A5F" fillOpacity="0.42" />
      <circle cx="122" cy="78" r="58" fill="#A7B9A7" fillOpacity="0.5" />
      <circle cx="78" cy="122" r="58" fill="#7B9DB8" fillOpacity="0.42" />
      <circle cx="122" cy="122" r="58" fill="#D7AB4C" fillOpacity="0.46" />
    </svg>
  );
}
