declare module './platforms' {
  export const platforms: {
    telegram: { name: string; userFields: string[]; badgeColor: string };
    facebook: { name: string; userFields: string[]; badgeColor: string };
    tiktok: { name: string; userFields: string[]; badgeColor: string };
    [key: string]: { name: string; userFields: string[]; badgeColor: string } | undefined;
  };
}
