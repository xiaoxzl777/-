import { theme, type ThemeConfig } from 'antd';

/** Ant Design 主题，数值和 styles/tokens.css 保持一致 */
const font = '"HarmonyOS Sans SC", "MiSans", "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0B7F6B',
    colorInfo: '#0B7F6B',
    colorBgLayout: '#F3F6F5',
    colorBgContainer: '#FBFCFC',
    colorBgElevated: '#FBFCFC',
    colorBorder: '#D9E2DF',
    colorBorderSecondary: '#E3EAE7',
    colorText: '#14201D',
    colorTextSecondary: '#45534F',
    colorTextTertiary: '#5E6D69',
    borderRadius: 10,
    borderRadiusLG: 16,
    fontSize: 15,
    fontFamily: font,
  },
  components: {
    Button: {
      borderRadius: 999, borderRadiusLG: 999, borderRadiusSM: 999, fontWeight: 600,
      primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none',
    },
    Tag: { borderRadiusSM: 999 },
    Segmented: { borderRadius: 999, borderRadiusSM: 999, borderRadiusLG: 999 },
    Menu: { itemSelectedBg: '#E0F0EB', itemSelectedColor: '#086354', itemBorderRadius: 999 },
  },
};

export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...lightTheme.token,
    colorPrimary: '#3FC2A5',
    colorInfo: '#3FC2A5',
    colorBgLayout: '#0C1412',
    colorBgContainer: '#121C1A',
    colorBgElevated: '#182421',
    colorBorder: '#25342F',
    colorBorderSecondary: '#1F2D29',
    colorText: '#E4ECE9',
    colorTextSecondary: '#B1BFBA',
    colorTextTertiary: '#92A19C',
  },
  components: {
    ...lightTheme.components,
    Menu: { itemSelectedBg: '#15302A', itemSelectedColor: '#7EDDC6', itemBorderRadius: 999 },
  },
};
