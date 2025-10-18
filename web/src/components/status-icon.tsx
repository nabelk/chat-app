import { type ReactNode } from "react";

interface IconProp {
  title: "Online" | "Offline" | "Group";
  status?: "online" | "offline";
  className?: string;
  children?: ReactNode;
  size?: number;
}

const IconWrapper = ({ title, className = "", children }: IconProp) => {
  const ariaProps = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      {...ariaProps}
    >
      {children}
    </span>
  );
};

export const OnlineIcon = ({
  size = 20,
  title = "Online",
  className = "",
}: IconProp) => {
  return (
    <IconWrapper title={title} className={className}>
      <svg
        viewBox="0 0 24 24"
        className="rounded-full"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* face background */}
        <circle cx="12" cy="12" r="12" className="fill-yellow-400" />
        {/* eyes */}
        <circle cx="8.5" cy="10" r="1.2" className="fill-black" />
        <circle cx="15.5" cy="10" r="1.2" className="fill-black" />
        {/* smile */}
        <path
          d="M7.5 14c1.5 2 3.5 3 4.5 3s3-1 4.5-3"
          className="stroke-black"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </IconWrapper>
  );
};

export const OfflineIcon = ({
  size = 20,
  title = "Offline",
  className = "",
}: IconProp) => {
  return (
    <IconWrapper title={title} className={className}>
      <svg
        viewBox="0 0 24 24"
        className="rounded-full"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* face background */}
        <circle cx="12" cy="12" r="12" className="fill-gray-400" />
        {/* eyes */}
        <circle cx="8.5" cy="10" r="1.2" className="fill-black" />
        <circle cx="15.5" cy="10" r="1.2" className="fill-black" />
        {/* sad mouth */}
        <path
          d="M7.5 16c1.5-2 3.5-3 4.5-3s3 1 4.5 3"
          className="stroke-black"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </IconWrapper>
  );
};

export const GroupIcon = ({
  size = 20,
  title = "Group",
  className = "",
}: IconProp) => {
  return (
    <IconWrapper title={title} className={className}>
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Three user circles */}
        <circle cx="8" cy="10" r="3" className="fill-blue-400" />
        <circle cx="16" cy="10" r="3" className="fill-green-400" />
        <circle cx="12" cy="16" r="3" className="fill-purple-400" />
        {/* Overlapping effect */}
        <ellipse
          cx="12"
          cy="16"
          rx="5"
          ry="2"
          className="fill-gray-200 opacity-50"
        />
      </svg>
    </IconWrapper>
  );
};

const StatusIcon = ({
  status = "online",
  size = 20,
  title,
  className = "",
}: IconProp) => {
  if (status === "online")
    return (
      <OnlineIcon size={size} title={title ?? "Online"} className={className} />
    );
  return (
    <OfflineIcon size={size} title={title ?? "Offline"} className={className} />
  );
};

export default StatusIcon;
