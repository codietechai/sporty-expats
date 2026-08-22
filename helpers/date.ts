import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import i18n from "@/translations/i18n";
dayjs.extend(relativeTime);

export const timeAgo = (timestamp: any) => {
  const date = dayjs(timestamp);
  const locale = i18n.language?.startsWith("fr") ? "fr" : "en";
  const timeAgo = date.locale(locale).fromNow();

  return timeAgo;
};


export const fixDate = (timestamp: any) => {
  // Parse and format the given timestamp to "DD/MM/YYYY"
  const formattedDate = dayjs(timestamp).format('DD/MM/YYYY');
  return formattedDate;
}