import { getActivityList } from "./googleSheetAPI";

export const formatActivityList = async (url) => {
  if (url.length <= 0) {
    return [[], 0];
  }

  const data = await getActivityList(url);
  const activities = Object.values(data)
    .filter((item) => item.Name && item.Name.trim() !== "")
    .map((item) => ({
      value: item.Id,
      label: item.Name,
    }));
  return activities;
};
