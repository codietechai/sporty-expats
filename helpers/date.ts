import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const timeAgo = (timestamp: any) => {
  const date = dayjs(timestamp);
  const timeAgo = date.fromNow();

  return timeAgo;
};


export const fixDate = (timestamp: any) => {
  // Parse and format the given timestamp to "DD/MM/YYYY"
  const formattedDate = dayjs(timestamp).format('DD/MM/YYYY');
  return formattedDate;
}