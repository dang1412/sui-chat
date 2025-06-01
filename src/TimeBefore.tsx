import React, { useEffect, useState } from 'react';

interface TimeBeforeProps {
  timestamp: number | string | Date;
}

function getElapsedTimeString(timestamp: number | string | Date): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const TimeBefore: React.FC<TimeBeforeProps> = ({ timestamp }) => {
  const [elapsed, setElapsed] = useState(() => getElapsedTimeString(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTimeString(timestamp));
    }, 60000);

    // Update immediately in case the timestamp just changed
    setElapsed(getElapsedTimeString(timestamp));

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span>{elapsed}</span>;
};

export default TimeBefore;